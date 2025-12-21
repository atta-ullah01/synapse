const mongoose = require("mongoose");

const fileSchema = new mongoose.Schema({
    name: { type: String, required: true },
    content: { type: String, default: "" },
    language: { type: String, required: true }
});

const roomSchema = new mongoose.Schema({
  roomId: { type: String, required: true, unique: true },
  ownerId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name: { type: String, required: true },
  files: [fileSchema],
  createdAt: { type: Date, default: Date.now}
});

module.exports = mongoose.model('Room', roomSchema);
