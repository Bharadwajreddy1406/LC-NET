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

app.use(express.static('public'));
app.use(bodyParser.json());

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

app.get('/friends/:userId', async (req, res) => {
  const user = await User.findById(req.params.userId).populate('friends');
  res.send(user.friends);
});

app.post('/friends/add', async (req, res) => {
  const { userId, friendName } = req.body;
  const friend = await User.findOne({ username: friendName });
  if (friend) {
    await User.findByIdAndUpdate(userId, { $push: { friends: friend._id } });
    res.send(friend);
  } else {
    res.status(404).send('User not found');
  }
});

app.get('/channels', async (req, res) => {
  const channels = await Channel.find();
  res.send(channels);
});

app.post('/channels', async (req, res) => {
  const { name, createdBy } = req.body;
  const channel = new Channel({ name, createdBy });
  await channel.save();
  res.send(channel);
});

app.get('/messages', async (req, res) => {
  const { type, id } = req.query;

  let chats;
  if (type === 'dm') {
    chats = await Chat.find({
      $or: [{ sender: id, receiver: id }, { receiver: id, sender: id }],
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

// Send a Friend Request
app.post('/friends/request', async (req, res) => {
  const { senderId, receiverName } = req.body;
  const receiver = await User.findOne({ username: receiverName });
  if (!receiver) return res.status(404).send('User not found');

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

  user.friends.push(requester._id);
  requester.friends.push(user._id);

  user.friendRequests = user.friendRequests.filter(
    (req) => req.toString() !== requesterId
  );

  await user.save();
  await requester.save();

  res.send('Friend request accepted');
});

// Socket.IO for Chat
io.on('connection', (socket) => {
  let userId;

  socket.on('setUser', (id) => {
    userId = id;
  });

  socket.on('chatMessage', async ({ message, fileHash, fileLink, channelId, receiverId }) => {
    const chat = new Chat({
      sender: userId,
      receiver: receiverId || null,
      channel: channelId || null,
      message: message || '',
      fileHash: fileHash || null,
      fileLink: fileLink || null,
    });
    await chat.save();

    if (receiverId) {
      io.to(receiverId).emit('chatMessage', { message, fileLink });
    } else if (channelId) {
      io.emit('chatMessage', { message, fileLink });
    }
  });

  socket.on('disconnect', () => {
    console.log('User disconnected');
  });
});

server.listen(3000, () => console.log('Server running on http://localhost:3000'));
