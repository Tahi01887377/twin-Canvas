import type { User, CanvasState, BackgroundState, LockInfo, CanvasObject } from '@shared/types.js';
import {
  CANVAS_DEFAULT_WIDTH,
  CANVAS_DEFAULT_HEIGHT,
  MAX_USERS_PER_ROOM,
  OBJECT_LOCK_TIMEOUT_MS,
} from '@shared/constants.js';
import { nanoid } from 'nanoid';

const DEFAULT_BACKGROUND: BackgroundState = {
  type: 'solid',
  color: '#ffffff',
};

function createInitialCanvas(): CanvasState {
  const now = Date.now();
  return {
    version: 1,
    width: CANVAS_DEFAULT_WIDTH,
    height: CANVAS_DEFAULT_HEIGHT,
    background: DEFAULT_BACKGROUND,
    objects: {},
    objectOrder: [],
    createdAt: now,
    updatedAt: now,
  };
}

interface StoredUser {
  user: User;
  socketId: string;
  connected: boolean;
  lastSeen: number;
}

export class Room {
  readonly roomId: string;
  readonly ownerId: string;
  private users: Map<string, StoredUser> = new Map();
  private canvas: CanvasState;
  private locks: Map<string, LockInfo> = new Map();
  private maxUsers: number;

  constructor(roomId: string, ownerId: string, maxUsers: number = MAX_USERS_PER_ROOM) {
    this.roomId = roomId;
    this.ownerId = ownerId;
    this.maxUsers = maxUsers;
    this.canvas = createInitialCanvas();
  }

  canJoin(): { can: boolean; reason: string } {
    const activeCount = Array.from(this.users.values()).filter((u) => u.connected).length;
    if (activeCount >= this.maxUsers) {
      const reason = 'This canvas already has ' + this.maxUsers + ' active collaborators. Please try again later.';
      return { can: false, reason };
    }
    return { can: true, reason: '' };
  }

  addUser(user: User, socketId: string): { user: User; isNew: boolean } | null {
    const existing = this.users.get(user.id);
    if (existing) {
      existing.connected = socketId !== '';
      existing.socketId = socketId;
      existing.lastSeen = Date.now();
      return { user: existing.user, isNew: false };
    }

    if (!this.canJoin().can) {
      return null;
    }

    const storedUser: StoredUser = {
      user,
      socketId,
      connected: socketId !== '',
      lastSeen: Date.now(),
    };
    this.users.set(user.id, storedUser);

    return { user, isNew: true };
  }

  removeUser(userId: string): User | null {
    const stored = this.users.get(userId);
    if (!stored) return null;
    const user = stored.user;
    this.users.delete(userId);
    this.releaseUserLocks(userId);
    return user;
  }

  markDisconnected(userId: string): User | null {
    const stored = this.users.get(userId);
    if (!stored) return null;
    stored.connected = false;
    stored.lastSeen = Date.now();
    return stored.user;
  }

  reconnect(userId: string, socketId: string): User | null {
    const stored = this.users.get(userId);
    if (!stored) return null;
    stored.connected = true;
    stored.socketId = socketId;
    stored.lastSeen = Date.now();
    return stored.user;
  }

  getUserCount(): number {
    return this.users.size;
  }

  getActiveUserCount(): number {
    return Array.from(this.users.values()).filter((u) => u.connected).length;
  }

  getUsers(): User[] {
    return Array.from(this.users.values()).map((s) => s.user);
  }

  hasUser(userId: string): boolean {
    return this.users.has(userId);
  }

  getSocketId(userId: string): string | null {
    return this.users.get(userId)?.socketId ?? null;
  }

  getCanvasSnapshot(): CanvasState {
    return {
      ...this.canvas,
      objects: { ...this.canvas.objects },
      objectOrder: [...this.canvas.objectOrder],
    };
  }

  incrementVersion(): number {
    this.canvas.version++;
    this.canvas.updatedAt = Date.now();
    return this.canvas.version;
  }

  resizeCanvas(width: number, height: number): void {
    this.canvas.width = width;
    this.canvas.height = height;
    this.incrementVersion();
  }

  restoreFromSnapshot(snapshot: CanvasState): void {
    this.canvas = {
      ...this.canvas,
      width: snapshot.width,
      height: snapshot.height,
      background: snapshot.background,
      objects: { ...snapshot.objects },
      objectOrder: [...snapshot.objectOrder],
      version: snapshot.version || this.canvas.version,
    };
  }

  getVersion(): number {
    return this.canvas.version;
  }

  applyOperation(op: string, userId: string, data: any): void {
    switch (op) {
      case 'create': {
        const object = data as CanvasObject;
        if (this.canvas.objects[object.id]) return;
        this.canvas.objects[object.id] = {
          ...object,
          createdAt: Date.now(),
          updatedAt: Date.now(),
        };
        this.canvas.objectOrder.push(object.id);
        break;
      }
      case 'update': {
        const update = data as { id: string; changes: Record<string, any> };
        const existing = this.canvas.objects[update.id];
        if (!existing) return;
        this.canvas.objects[update.id] = {
          ...existing,
          ...update.changes,
          updatedAt: Date.now(),
        };
        break;
      }
      case 'delete': {
        const objectId = data as string;
        delete this.canvas.objects[objectId];
        this.canvas.objectOrder = this.canvas.objectOrder.filter((id) => id !== objectId);
        break;
      }
      case 'reorder': {
        const order = data as string[];
        this.canvas.objectOrder = order;
        break;
      }
      case 'background': {
        this.canvas.background = data as BackgroundState;
        break;
      }
      case 'stroke_end': {
        const pathObj = data.path as CanvasObject;
        if (pathObj && pathObj.id) {
          this.canvas.objects[pathObj.id] = {
            ...pathObj,
            createdAt: Date.now(),
            updatedAt: Date.now(),
          };
          this.canvas.objectOrder.push(pathObj.id);
        }
        break;
      }
    }
    this.incrementVersion();
  }

  lockObject(objectId: string, userId: string): LockInfo | null {
    const existing = this.locks.get(objectId);
    if (existing && existing.expiresAt > Date.now() && existing.userId !== userId) {
      return null;
    }
    const lock: LockInfo = {
      objectId,
      userId,
      timestamp: Date.now(),
      expiresAt: Date.now() + OBJECT_LOCK_TIMEOUT_MS,
    };
    this.locks.set(objectId, lock);
    return lock;
  }

  unlockObject(objectId: string, userId: string): void {
    const lock = this.locks.get(objectId);
    if (lock && lock.userId === userId) {
      this.locks.delete(objectId);
    }
  }

  releaseUserLocks(userId: string): void {
    for (const [id, lock] of this.locks) {
      if (lock.userId === userId) {
        this.locks.delete(id);
      }
    }
  }

  getActiveLocks(): Record<string, LockInfo> {
    const now = Date.now();
    const active: Record<string, LockInfo> = {};
    for (const [id, lock] of this.locks) {
      if (lock.expiresAt > now) {
        active[id] = lock;
      }
    }
    return active;
  }

  cleanupExpiredLocks(): void {
    const now = Date.now();
    for (const [id, lock] of this.locks) {
      if (lock.expiresAt <= now) {
        this.locks.delete(id);
      }
    }
  }

  destroy(): void {
    this.users.clear();
    this.locks.clear();
    this.canvas = createInitialCanvas();
  }
}

export class RoomManager {
  private rooms: Map<string, Room> = new Map();
  private static instance: RoomManager;

  private constructor() {
    setInterval(() => this.cleanupRooms(), 60000);
  }

  static getInstance(): RoomManager {
    if (!RoomManager.instance) {
      RoomManager.instance = new RoomManager();
    }
    return RoomManager.instance;
  }

  createRoom(ownerName: string = 'Host'): { roomId: string; ownerId: string; room: Room } {
    const roomId = nanoid(6);
    const ownerId = nanoid(8);
    const owner: User = {
      id: ownerId,
      name: ownerName,
      color: '#3b82f6',
      joinedAt: Date.now(),
      isOwner: true,
    };
    const room = new Room(roomId, ownerId);
    room.addUser(owner, '');
    this.rooms.set(roomId, room);
    return { roomId, ownerId, room };
  }

  getRoom(roomId: string): Room | undefined {
    return this.rooms.get(roomId);
  }

  recreateRoom(roomId: string, ownerId: string, snapshot: CanvasState): Room {
    const room = new Room(roomId, ownerId);
    room.restoreFromSnapshot(snapshot);
    this.rooms.set(roomId, room);
    return room;
  }

  hasRoom(roomId: string): boolean {
    return this.rooms.has(roomId);
  }

  getActiveRoomCount(): number {
    return this.rooms.size;
  }

  removeRoom(roomId: string): boolean {
    const room = this.rooms.get(roomId);
    if (!room) return false;
    room.destroy();
    this.rooms.delete(roomId);
    return true;
  }

  private cleanupRooms(): void {
    const now = Date.now();
    for (const [roomId, room] of this.rooms) {
      room.cleanupExpiredLocks();
      const users = Array.from((room as any).users.values());
      const allDisconnected = users.length > 0 && users.every((u: any) => !u.connected && now - u.lastSeen > 30 * 60 * 1000);
      if (allDisconnected) {
        this.removeRoom(roomId);
      }
    }
  }
}

export const roomManager = RoomManager.getInstance();
