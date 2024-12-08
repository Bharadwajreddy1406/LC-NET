const mongoose = require('mongoose');

const ChatSchema = new mongoose.Schema({
  sender: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  senderName: String,
  receiver: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
  channel: { type: mongoose.Schema.Types.ObjectId, ref: 'Channel' },
  message: String, // Plain text messages
  fileHash: String, // Hash of the uploaded file (for verification)
  fileLink: String, // Link to the uploaded file
  createdAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('Chat', ChatSchema);
