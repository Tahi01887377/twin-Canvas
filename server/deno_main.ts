import express from 'express';
import type { Request, Response } from 'express';
import { createServer } from 'node:http';
import cors from 'cors';
import { Server as SocketIOServer } from 'socket.io';
import { registerSocketHandlers } from './src/websocket/sockets.ts';
import { roomManager } from './src/rooms/RoomManager.ts';
import { loadCanvas, saveCanvas } from './src/db/persistence_kv.ts';

const app = express();
const server = createServer(app);

const corsOrigin = Deno.env.get('CORS_ORIGIN') || 'https://twin-canvas-five.vercel.app';

app.use(
  cors({
    origin: corsOrigin,
    credentials: true,
  })
);
app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

app.get('/api/health', (_req: Request, res: Response) => {
  res.json({
    status: 'ok',
    version: '0.1.0',
    timestamp: new Date().toISOString(),
    uptime: process.uptime(),
    rooms: roomManager.getActiveRoomCount(),
  });
});

app.post('/api/rooms', async (req: Request, res: Response) => {
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
  const baseUrl = Deno.env.get('CLIENT_URL') || 'https://twin-canvas-five.vercel.app';
  res.json({
    roomId: created.roomId,
    joinUrl: `${baseUrl}/twin/${created.roomId}`,
    ownerId: created.ownerId,
  });
});

app.get('/api/rooms/:roomId', (req: Request, res: Response) => {
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
    origin: corsOrigin,
    credentials: true,
  },
  pingInterval: 10000,
  pingTimeout: 5000,
});

registerSocketHandlers(io, { saveCanvas, loadCanvas });

const PORT = Number(Deno.env.get('PORT')) || 3001;
server.listen(PORT, () => {
  console.log(`TwinCanvas server running on http://localhost:${PORT}`);
  console.log(`  • Health:  http://localhost:${PORT}/api/health`);
  console.log(`  • Rooms:   http://localhost:${PORT}/api/rooms`);
});
