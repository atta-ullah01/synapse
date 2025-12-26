const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
const http = require("http");
const { WebSocketServer } = require("ws");
const { setupWSConnection } = require("y-websocket/bin/utils");

require("dotenv").config();

const authRoutes = require("./routes/auth");
const roomRoutes = require("./routes/rooms.js");
const executeRoutes = require("./routes/execute.js");

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/rooms/', roomRoutes);
app.use('/api/execute', executeRoutes)

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("MongoDB Connected Successfully");
  } catch (err) {
    console.error("MongoDB Connection Error:", err);
    process.exit(1);
  }
};

const server = http.createServer(app);

const wss = new WebSocketServer({ noServer: true });

wss.on('connection', (ws, req) => {
  const docName = req.url.slice(5); 
  setupWSConnection(ws, req, { docName });
});

server.on('upgrade', (request, socket, head) => {
  if (request.url.startsWith('/doc/')) {
    wss.handleUpgrade(request, socket, head, (ws) => {
      wss.emit('connection', ws, request);
    });
  } else {
    socket.destroy();
  }
});

connectDB().then(() => {
  server.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${PORT}`);
  });
});
