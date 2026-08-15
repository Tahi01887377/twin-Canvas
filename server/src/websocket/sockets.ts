import type { Server, Socket } from 'socket.io';
import type { ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData } from '@shared/events.js';
import type { CanvasState } from '@shared/types.js';
import { roomManager } from '../rooms/RoomManager.js';

export type TypedSocket = Socket<ClientToServerEvents, ServerToClientEvents, InterServerEvents, SocketData>;

export interface CanvasPersistence {
  saveCanvas(roomId: string, canvas: CanvasState, ownerId: string, name?: string): Promise<void>;
  loadCanvas(roomId: string): Promise<CanvasState | null>;
}

let activePersistence: CanvasPersistence;

export function registerSocketHandlers(io: Server, persistence: CanvasPersistence) {
  activePersistence = persistence;
  console.log('TwinCanvas WebSocket handlers registered');

  io.on('connection', (socket: TypedSocket) => {
    console.log(`Socket connected: ${socket.id}`);

    socket.data.userId = '';
    socket.data.roomId = null;
    socket.data.user = null;
    socket.data.lastPing = Date.now();

    const safeHandler = (handler: (socket: TypedSocket, ...args: any[]) => any) =>
      (payload: any) => {
        try {
          const result = handler(socket, payload);
          if (result && typeof result.then === 'function') {
            result.catch((err: any) => {
              console.error('Socket handler error:', err);
              socket.emit('room_error', {
                code: 'HANDLER_ERROR',
                message: 'An internal error occurred',
              });
            });
          }
        } catch (err) {
          console.error('Socket handler error:', err);
          socket.emit('room_error', {
            code: 'HANDLER_ERROR',
            message: 'An internal error occurred',
          });
        }
      };

    socket.on('join_room', safeHandler(handleJoinRoom));
    socket.on('leave_room', safeHandler(handleLeaveRoom));
    socket.on('cursor_move', safeHandler(handleCursorMove));
    socket.on('selection_change', safeHandler(handleSelectionChange));
    socket.on('create_object', safeHandler(handleCreateObject));
    socket.on('update_object', safeHandler(handleUpdateObject));
    socket.on('delete_object', safeHandler(handleDeleteObject));
    socket.on('reorder_objects', safeHandler(handleReorderObjects));
    socket.on('lock_object', safeHandler(handleLockObject));
    socket.on('unlock_object', safeHandler(handleUnlockObject));
    socket.on('stroke_start', safeHandler(handleStrokeStart));
    socket.on('stroke_points', safeHandler(handleStrokePoints));
    socket.on('stroke_end', safeHandler(handleStrokeEnd));
    socket.on('background_change', safeHandler(handleBackgroundChange));
    socket.on('undo', safeHandler(handleUndo));
    socket.on('redo', safeHandler(handleRedo));
    socket.on('save_canvas', safeHandler(handleSaveCanvas));
    socket.on('copy_objects', safeHandler(handleCopyObjects));
    socket.on('paste_objects', safeHandler(handlePasteObjects));
    socket.on('zoom_viewport', safeHandler(handleZoomViewport));

    socket.on('disconnect', (reason) => {
      console.log(`Socket disconnected: ${socket.id} (${reason})`);
      handleDisconnect(socket);
    });
  });
}

async function handleJoinRoom(socket: TypedSocket, payload: { roomId: string; user: any }) {
  const { roomId, user } = payload;

  let room = roomManager.getRoom(roomId);

  if (!room) {
    const saved = await activePersistence.loadCanvas(roomId).catch(() => null);
    if (saved) {
      room = roomManager.recreateRoom(roomId, user.id, saved);
    }
  }

  if (!room) {
    socket.emit('room_error', { code: 'ROOM_NOT_FOUND', message: 'Room not found' });
    return;
  }

  const canJoin = room.canJoin();
  if (!canJoin.can) {
    socket.emit('room_error', { code: 'ROOM_FULL', message: canJoin.reason });
    return;
  }

  socket.data.userId = user.id;
  socket.data.roomId = roomId;
  socket.data.user = user;
  socket.join(roomId);

  const joined = room.addUser(user, socket.id);
  if (!joined) {
    socket.emit('room_error', { code: 'ROOM_FULL', message: 'Could not join room' });
    return;
  }

  socket.to(roomId).emit('user_joined', { user: joined.user || user });
  socket.to(roomId).emit('presence_update', { users: room.getUsers() });

  socket.emit('room_joined', {
    roomId,
    canvas: room.getCanvasSnapshot(),
    users: room.getUsers(),
    locks: room.getActiveLocks(),
    currentUser: user,
  });
}

function handleLeaveRoom(socket: TypedSocket, payload: { roomId: string }) {
  const room = roomManager.getRoom(payload.roomId);
  if (!room) return;

  const user = room.removeUser(socket.data.userId);
  if (user) {
    socket.to(payload.roomId).emit('user_left', { userId: socket.data.userId, name: user.name });
    socket.to(payload.roomId).emit('presence_update', { users: room.getUsers() });
    room.releaseUserLocks(socket.data.userId);
  }

  socket.leave(payload.roomId);
  socket.data.roomId = null;
  socket.data.userId = '';
  socket.data.user = null;
}

function handleDisconnect(socket: TypedSocket) {
  if (!socket.data.roomId || !socket.data.userId) return;

  const room = roomManager.getRoom(socket.data.roomId);
  if (!room) return;

  const user = room.markDisconnected(socket.data.userId);
  if (user) {
    socket.to(socket.data.roomId).emit('user_left', { userId: socket.data.userId, name: user.name });
    socket.to(socket.data.roomId).emit('presence_update', { users: room.getUsers() });
  }
}

function handleCursorMove(socket: TypedSocket, payload: { roomId: string; position: any }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  socket.to(payload.roomId).emit('cursor_updated', {
    userId: socket.data.userId,
    position: payload.position,
    timestamp: Date.now(),
    lastSeen: Date.now(),
  });
}

function handleSelectionChange(socket: TypedSocket, payload: { roomId: string; objectId: string | null; boundingBox: any }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  socket.to(payload.roomId).emit('selection_updated', {
    userId: socket.data.userId,
    objectId: payload.objectId,
    boundingBox: payload.boundingBox,
    timestamp: Date.now(),
  });
}

function handleCreateObject(socket: TypedSocket, payload: { roomId: string; object: any }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.applyOperation('create', socket.data.userId, payload.object);
  socket.to(payload.roomId).emit('object_created', { object: payload.object });
}

function handleUpdateObject(socket: TypedSocket, payload: { roomId: string; update: any }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.applyOperation('update', socket.data.userId, payload.update);
  socket.to(payload.roomId).emit('object_updated', {
    objectId: payload.update.id,
    changes: payload.update.changes,
  });
}

function handleDeleteObject(socket: TypedSocket, payload: { roomId: string; objectId: string }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.applyOperation('delete', socket.data.userId, payload.objectId);
  socket.to(payload.roomId).emit('object_deleted', { objectId: payload.objectId });
}

function handleReorderObjects(socket: TypedSocket, payload: { roomId: string; order: string[] }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.applyOperation('reorder', socket.data.userId, payload.order);
  socket.to(payload.roomId).emit('objects_reordered', { order: payload.order });
}

function handleLockObject(socket: TypedSocket, payload: { roomId: string; objectId: string }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  const lock = room.lockObject(payload.objectId, socket.data.userId);
  if (lock) {
    socket.to(payload.roomId).emit('object_locked', lock);
  }
}

function handleUnlockObject(socket: TypedSocket, payload: { roomId: string; objectId: string }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.unlockObject(payload.objectId, socket.data.userId);
  socket.to(payload.roomId).emit('object_unlocked', { objectId: payload.objectId });
}

function handleStrokeStart(socket: TypedSocket, payload: any) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.applyOperation('stroke_start', socket.data.userId, payload);
  socket.to(payload.roomId).emit('stroke_created', {
    stroke: {
      id: payload.strokeId,
      userId: socket.data.userId,
      points: [],
      color: payload.color,
      width: payload.width,
      opacity: payload.opacity,
      smoothness: payload.smoothness,
      isEraser: payload.isEraser,
    },
  });
}

function handleStrokePoints(socket: TypedSocket, payload: any) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  socket.to(payload.roomId).emit('stroke_updated', {
    strokeId: payload.strokeId,
    points: payload.points,
  });
}

function handleStrokeEnd(socket: TypedSocket, payload: any) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.applyOperation('stroke_end', socket.data.userId, payload);
}

function handleBackgroundChange(socket: TypedSocket, payload: { roomId: string; background: any }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  room.applyOperation('background', socket.data.userId, payload.background);
  socket.to(payload.roomId).emit('background_changed', { background: payload.background });
}

function handleUndo(socket: TypedSocket, payload: { roomId: string }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
}

function handleRedo(socket: TypedSocket, payload: { roomId: string }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
}

async function handleSaveCanvas(socket: TypedSocket, payload: { roomId: string }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  const version = room.incrementVersion();
  try {
    const owner = room.getUsers().find((u) => u.id === room.ownerId) || room.getUsers()[0];
    await activePersistence.saveCanvas(payload.roomId, room.getCanvasSnapshot(), room.ownerId, `Canvas ${room.roomId}`);
    socket.emit('canvas_saved', { version });
  } catch (err) {
    console.error('Failed to save canvas:', err);
    socket.emit('room_error', { code: 'SAVE_FAILED', message: 'Failed to save canvas' });
  }
}

function handleCopyObjects(socket: TypedSocket, payload: { roomId: string; objectIds: string[] }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
}

function handlePasteObjects(socket: TypedSocket, payload: { roomId: string; objects: any[] }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  const room = roomManager.getRoom(payload.roomId)!;
  for (const obj of payload.objects) {
    room.applyOperation('create', socket.data.userId, obj);
    socket.to(payload.roomId).emit('object_created', { object: obj });
  }
}

function handleZoomViewport(socket: TypedSocket, payload: { roomId: string; zoom: number; panX?: number; panY?: number }) {
  if (!validateRoomAccess(socket, payload.roomId)) return;
  socket.to(payload.roomId).emit('viewport_synced', {
    zoom: payload.zoom,
    panX: payload.panX || 0,
    panY: payload.panY || 0,
    userId: socket.data.userId,
  });
}

function validateRoomAccess(socket: TypedSocket, roomId: string): boolean {
  if (socket.data.roomId !== roomId || !roomId) {
    socket.emit('room_error', { code: 'UNAUTHORIZED', message: 'Not in this room' });
    return false;
  }
  const room = roomManager.getRoom(roomId);
  if (!room || !room.hasUser(socket.data.userId)) {
    socket.emit('room_error', { code: 'UNAUTHORIZED', message: 'Not authorized for this room' });
    return false;
  }
  return true;
}
