const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const multer = require('multer');
const crypto = require('crypto');
const path = require('path');
const fs = require('fs');
const User = require('./models/User');
const Channel = require('./models/Channel');
const Chat = require('./models/chat');

const app = express();
const server = http.createServer(app);
const io = new Server(server);
const cors = require('cors');
const { send } = require('process');
app.use(cors());

// app.use(express.static('public'));
app.use(express.json());

mongoose.connect('mongodb://127.0.0.1:27017/discordClone', { useNewUrlParser: true, useUnifiedTopology: true });

// Multer Storage for Files
const storage = multer.diskStorage({
  destination: 'uploads/',
  filename: (req, file, cb) => {
    const fileHash = crypto.createHash('sha256').update(file.originalname + Date.now()).digest('hex');
    cb(null, `${fileHash}${path.extname(file.originalname)}`);
  },
});
const upload = multer({ storage });

// Routes
app.post('/login', async (req, res) => {
  const { username, password } = req.body;
  let user = await User.findOne({ username });
  if (!user) {
    user = new User({ username, password });
    await user.save();
  } else if (user.password !== password) {
    return res.status(401).send('Invalid credentials');
  }
  res.send({ userId: user._id });
});



app.get('/channels', async (req, res) => {
  try {
    const channels = await Channel.find();
    res.json(channels); // Return the channels as JSON
  } catch (error) {
    res.status(500).json({ message: 'Error retrieving channels' });
  }
});

// POST a new channel
app.post('/channels', async (req, res) => {
  const { name, createdBy } = req.body;
  

  // Basic validation
  if (!name || !createdBy) {
    return res.status(400).json({ message: 'Name and createdBy are required' });
  }

  try {
    // Create a new channel
    const channel = new Channel({ name, createdBy });
    await channel.save();
    res.status(201).json(channel); // Send the created channel as the response
  } catch (error) {
    console.error('Error creating channel:', error);
    res.status(500).json({ message: 'Error creating channel', error: error.message });
  }
});

app.get('/friends/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).populate('friends');
  res.send(user.friends);
});

app.post('/friends/add', async (req, res) => {
  const { userId, friendName } = req.body;

  if (!userId || !friendName) {
    return res.status(400).send('Missing userId or friendName');
  }

  try {
    const friend = await User.findOne({ username: friendName });
    if (!friend) {
      return res.status(404).send('Friend not found');
    }

    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).send('User not found');
    }

    user.friends.push(friend._id);
    await user.save();

    res.send(friend);
  } catch (error) {
    console.error(error);
    res.status(500).send('Internal server error');
  }
});
// Fetch Pending Requests for Receiver
app.get('/friends/requests/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).populate('friendRequests');
  if (!user) return res.status(404).send('User not found');
  res.send(user.friendRequests);
});

// Send Friend Request
app.post('/friends/request', async (req, res) => {
  const { senderId, receiverName } = req.body;
  const receiver = await User.findOne({ username: receiverName });
  if (!receiver) return res.status(404).send('User not found');

  // Check if already requested
  if (receiver.friendRequests.includes(senderId)) {
    return res.status(400).send('Friend request already sent');
  }

  receiver.friendRequests.push(senderId);
  await receiver.save();
  res.send('Friend request sent');
});

// Accept Friend Request
app.post('/friends/accept', async (req, res) => {
  const { userId, requesterId } = req.body;

  const user = await User.findById(userId);
  const requester = await User.findById(requesterId);

  if (!user || !requester) return res.status(404).send('User not found');

  // Add each other as friends
  user.friends.push(requester._id);
  requester.friends.push(user._id);

  // Remove from pending requests
  user.friendRequests = user.friendRequests.filter(
    (req) => req.toString() !== requesterId
  );

  await user.save();
  await requester.save();

  res.send('Friend request accepted');
});

// Reject Friend Request
app.post('/friends/reject', async (req, res) => {
  const { userId, requesterId } = req.body;

  const user = await User.findById(userId);

  if (!user) return res.status(404).send('User not found');

  // Remove from pending requests
  user.friendRequests = user.friendRequests.filter(
    (req) => req.toString() !== requesterId
  );

  await user.save();

  res.send('Friend request rejected');
});

app.get('/messages', async (req, res) => {
  const { type, id, receiverId } = req.query;
  console.log(type, id, receiverId);
  let chats;
  if (type === 'dm') {
    chats = await Chat.find({
      $or: [{ sender: id, receiver: receiverId }, { receiver: id, sender: receiverId }],
    }).sort('createdAt');
  } else if (type === 'channel') {
    chats = await Chat.find({ channel: id }).sort('createdAt');
  }

  res.send(chats);
});

// File Upload Endpoint
app.post('/upload', upload.single('file'), async (req, res) => {
  const file = req.file;
  const fileHash = crypto.createHash('sha256').update(fs.readFileSync(file.path)).digest('hex');

  res.send({
    fileLink: `/uploads/${file.filename}`,
    fileHash,
  });
});


const userSocketMap = new Map(); // Map userId to socketId

io.on('connection', (socket) => {
  let userId;

  // Set user ID when the user is authenticated
  socket.on('setUser', (id) => {
    userId = id;
    userSocketMap.set(userId, socket.id); // Map userId to socketId
  });

  // Join a channel (room)
  socket.on('joinChannel', (channelId) => {
    console.log(`${userId} joined channel ${channelId}`);
    socket.join(channelId); // Adds the socket to the specified channel (room)
  });

  // Leave a channel (room)
  socket.on('leaveChannel', (channelId) => {
    console.log(`${userId} left channel ${channelId}`);
    socket.leave(channelId); // Removes the socket from the specified channel
  });

  // Handle chat messages
  socket.on('chatMessage', async ({ message, fileHash, fileLink, channelId, receiverId }) => {
    console.log('Received message:', message, 'from', userId, 'in', channelId, 'to', receiverId);

    // Save the chat message to your DB (not changed from your original code)
    senderName = await User.findById(userId).then((user) => user.username);
    const chat = new Chat({
      sender: userId,
      senderName: senderName,
      receiver: receiverId || null,
      channel: channelId || null,
      message: message || '',
      fileHash: fileHash || null,
      fileLink: fileLink || null,
    });
    await chat.save();

    // Private message handling
    if (receiverId) {
      // const receiverSocketId = userSocketMap.get(receiverId); // Get receiver's socketId
      // if (receiverSocketId) {
      //   io.to(receiverSocketId).emit('chatMessage', { message, fileLink });
      // }
      // // Send message back to the sender as well
      // io.to(socket.id).emit('chatMessage', { message, fileLink });
      io.to([receiverId, userId].sort().join('-')).emit('chatMessage', { message, fileLink, senderName, sender: userId });

    } 
    // Channel message handling
    else if (channelId) {
      io.to(channelId).emit('chatMessage', { message, fileLink, senderName, sender: userId }); // Emit only to the room
    }
  });

  // Handle disconnection
  socket.on('disconnect', () => {
    console.log('User disconnected');
    if (userId) {
      userSocketMap.delete(userId); // Remove the mapping when the user disconnects
    }
  });
});


server.listen(3001, () => console.log('Server running on http://localhost:3001'));
