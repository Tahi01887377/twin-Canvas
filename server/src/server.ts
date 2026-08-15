import express from 'express';
import http from 'http';
import cors from 'cors';
import dotenv from 'dotenv';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './websocket/sockets.js';
import { roomManager } from './rooms/RoomManager.js';
import { loadCanvas, saveCanvas } from './db/persistence.js';
import path from 'path';

dotenv.config();

const app = express();
const server = http.createServer(app);

app.use(
  cors({
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.use('/uploads', express.static(path.resolve(process.env.UPLOAD_DIR || './uploads')));

app.get('/api/health', (_req, res) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    rooms: roomManager.getActiveRoomCount(),
  });
});

app.post('/api/rooms', async (req, res) => {
  const { ownerName, width, height } = req.body || {};
  const created = roomManager.createRoom(ownerName || 'Host');
  try {
    const saved = await loadCanvas(created.roomId);
    if (saved) {
      created.room.restoreFromSnapshot(saved);
    } else if (width && height) {
      created.room.resizeCanvas(Number(width), Number(height));
    }
  } catch (err) {
    console.error('Failed to load canvas:', err);
    if (width && height) created.room.resizeCanvas(Number(width), Number(height));
  }
  const baseUrl = process.env.CLIENT_URL || 'http://localhost:3000';
  res.json({
    roomId: created.roomId,
    joinUrl: `${baseUrl}/twin/${created.roomId}`,
    ownerId: created.ownerId,
  });
});

app.get('/api/rooms/:roomId', (req, res) => {
  const room = roomManager.getRoom(req.params.roomId);
  if (!room) {
    return res.status(404).json({ error: 'Room not found' });
  }
  res.json({
    roomId: room.roomId,
    userCount: room.getUserCount(),
    canvas: room.getCanvasSnapshot(),
  });
});

const io = new SocketIOServer(server, {
  cors: {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

registerSocketHandlers(io, { saveCanvas, loadCanvas });

const PORT = process.env.PORT || 3001;
server.listen(PORT, () => {
  console.log(`TwinCanvas server running on http://localhost:${PORT}`);
  console.log(`  • Health:  http://localhost:${PORT}/api/health`);
  console.log(`  • Rooms:   http://localhost:${PORT}/api/rooms`);
});
