const mongoose = require('mongoose');

const RoomSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  description: String,
});

module.exports = mongoose.model('Room', RoomSchema);
