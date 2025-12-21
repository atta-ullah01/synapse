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
        { name: 'main', content: '// Write your code here', language: 'c++' }
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

module.exports = router;
