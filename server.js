const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Serve static files from the "public" directory
app.use(express.static('public'));

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Listen for incoming messages from this client
  socket.on('chatMessage', (msg) => {
    // Broadcast the message to all connected clients, including the sender
    io.emit('chatMessage', { text: msg, id: socket.id });
  });

  socket.on('fileMessage', (fileData) => {
    io.emit('fileMessage', fileData);
  });

  // When the user disconnects
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
  });
});

const PORT = 3000;
server.listen(PORT, () => {
  console.log(`Server is running on http://localhost:${PORT}`);
});
