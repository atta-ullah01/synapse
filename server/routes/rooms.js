const express = require('express');
const Room = require('../models/Room');
const { v4: uuidv4 } = require('uuid');

const router = express.Router();

router.post('/create', async (req, res) => {
  const { name, userId } = req.body;

  try {
    const roomId = uuidv4();

    const newRoom = new Room({
      roomId,
      ownerId: userId,
      name,
      files: [
        { name: 'main.cpp', content: '// Write your code here', language: 'cpp' }
      ]
    });

    await newRoom.save();
    res.status(201).json(newRoom);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/user/:userId', async (req, res) => {
  try {
    const rooms = await Room.find({ ownerId: req.params.userId }).sort({ createdAt: -1 });
    res.json(rooms);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

router.get('/:roomId', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});


//Save file content
router.put('/:roomId/save', async (req, res) => {
  const { fileName, content } = req.body;
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    const fileIndex = room.files.findIndex(f => f.name === fileName);
    if (fileIndex === -1) return res.status(404).json({ message: "File not found" });

    room.files[fileIndex].content = content;
    await room.save();
    res.json(room);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

//Create a new file
router.post('/:roomId/files', async (req, res) => {
  const { fileName, language } = req.body;
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    // Check duplicate
    if (room.files.some(f => f.name === fileName)) {
      return res.status(400).json({ message: "File already exists" });
    }

    room.files.push({ name: fileName, content: "", language });
    await room.save();
    res.json(room.files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

// Delete a file
router.delete('/:roomId/files/:fileName', async (req, res) => {
  try {
    const room = await Room.findOne({ roomId: req.params.roomId });
    if (!room) return res.status(404).json({ message: "Room not found" });

    room.files = room.files.filter(f => f.name !== req.params.fileName);
    await room.save();
    res.json(room.files);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
});

module.exports = router;
