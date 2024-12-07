const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  maxHttpBufferSize: 20 * 1024 * 1024 // 20 MB
});

// Serve static files from the "public" directory
app.use(express.static('public'));

const users = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Handle username setting
  socket.on('setUsername', (username) => {
    users[socket.id] = { username: username, id: socket.id };
    // Send updated user list to all clients
    io.emit('usersList', Object.values(users));
  });

  // Handle chat messages
  socket.on('chatMessage', (data) => {
    const messageData = {
      text: data.text,
      id: socket.id,
      username: users[socket.id].username,
      recipientId: data.recipientId
    };
    if (data.recipientId) {
      // Send DM to specific user and the sender
      io.to(data.recipientId).emit('chatMessage', messageData);
      socket.emit('chatMessage', messageData);
    } else {
      // Broadcast to all users
      io.emit('chatMessage', messageData);
    }
  });

  socket.on('fileMessage', (fileData) => {
    fileData.username = users[socket.id].username;
    if (fileData.recipientId) {
      // Send file to specific user and the sender
      io.to(fileData.recipientId).emit('fileMessage', fileData);
      socket.emit('fileMessage', fileData);
    } else {
      // Broadcast to all users
      io.emit('fileMessage', fileData);
    }
  });

  // When the user disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    delete users[socket.id];
    // Update user list
    io.emit('usersList', Object.values(users));
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
