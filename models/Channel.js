const mongoose = require('mongoose');

const ChannelSchema = new mongoose.Schema({
  name: { type: String, unique: true },
  createdBy: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
});

module.exports = mongoose.model('Channel', ChannelSchema);
