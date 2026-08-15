import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { Room, RoomManager } from '../server/src/rooms/RoomManager.js';
import type { CanvasState, CanvasObject } from '../shared/types.js';

function makeRect(id: string): CanvasObject {
  return {
    id,
    type: 'rect',
    x: 0,
    y: 0,
    width: 100,
    height: 100,
    fill: '#000000',
    stroke: '#000000',
    strokeWidth: 1,
    rx: 0,
    ry: 0,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 'left',
    originY: 'top',
    opacity: 1,
    visible: true,
    selectable: true,
    evented: true,
    zIndex: 0,
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
}

describe('Room', () => {
  let room: Room;

  beforeEach(() => {
    room = new Room('test-room', 'owner-1');
  });

  it('enforces the 2-user limit', () => {
    room.addUser({ id: 'u1', name: 'A', color: '#000', joinedAt: Date.now(), isOwner: false }, 's1');
    room.addUser({ id: 'u2', name: 'B', color: '#111', joinedAt: Date.now(), isOwner: false }, 's2');
    const third = room.addUser({ id: 'u3', name: 'C', color: '#222', joinedAt: Date.now(), isOwner: false }, 's3');
    expect(third).toBeNull();
    expect(room.canJoin().can).toBe(false);
  });

  it('allows a disconnected user to be replaced', () => {
    room.addUser({ id: 'u1', name: 'A', color: '#000', joinedAt: Date.now(), isOwner: false }, 's1');
    room.markDisconnected('u1');
    expect(room.canJoin().can).toBe(true);
  });

  it('reconnects an existing user without doubling count', () => {
    room.addUser({ id: 'u1', name: 'A', color: '#000', joinedAt: Date.now(), isOwner: false }, 's1');
    room.markDisconnected('u1');
    room.addUser({ id: 'u1', name: 'A', color: '#000', joinedAt: Date.now(), isOwner: false }, 's2');
    expect(room.getUserCount()).toBe(1);
    expect(room.getActiveUserCount()).toBe(1);
  });

  it('applies create operation and adds to object order', () => {
    room.applyOperation('create', 'owner-1', makeRect('rect-1'));
    const snap = room.getCanvasSnapshot();
    expect(Object.keys(snap.objects)).toContain('rect-1');
    expect(snap.objectOrder).toEqual(['rect-1']);
  });

  it('does not overwrite an existing object on create', () => {
    room.applyOperation('create', 'owner-1', makeRect('rect-1'));
    const dup = { ...makeRect('rect-1'), fill: '#ff0000' };
    room.applyOperation('create', 'owner-1', dup);
    const snap = room.getCanvasSnapshot();
    expect(snap.objects['rect-1'].fill).toBe('#000000');
    expect(snap.objectOrder.length).toBe(1);
  });

  it('applies update operation by object id', () => {
    room.applyOperation('create', 'owner-1', makeRect('rect-1'));
    room.applyOperation('update', 'owner-1', { id: 'rect-1', changes: { x: 500, fill: '#00ff00' } });
    const snap = room.getCanvasSnapshot();
    expect(snap.objects['rect-1'].x).toBe(500);
    expect(snap.objects['rect-1'].fill).toBe('#00ff00');
  });

  it('applies delete operation and updates order', () => {
    room.applyOperation('create', 'owner-1', makeRect('rect-1'));
    room.applyOperation('create', 'owner-1', makeRect('rect-2'));
    room.applyOperation('delete', 'owner-1', 'rect-1');
    const snap = room.getCanvasSnapshot();
    expect(snap.objects['rect-1']).toBeUndefined();
    expect(snap.objectOrder).toEqual(['rect-2']);
  });

  it('increments version on each operation', () => {
    const v0 = room.getVersion();
    room.applyOperation('create', 'owner-1', makeRect('rect-1'));
    expect(room.getVersion()).toBe(v0 + 1);
    room.applyOperation('create', 'owner-1', makeRect('rect-2'));
    expect(room.getVersion()).toBe(v0 + 2);
  });

  it('tracks and releases object locks', () => {
    room.lockObject('rect-1', 'u1');
    expect(room.getActiveLocks()['rect-1']?.userId).toBe('u1');
    room.unlockObject('rect-1', 'u2');
    expect(room.getActiveLocks()['rect-1']?.userId).toBe('u1');
    room.unlockObject('rect-1', 'u1');
    expect(room.getActiveLocks()['rect-1']).toBeUndefined();
  });

  it('restores from a snapshot', () => {
    const snapshot: CanvasState = {
      version: 5,
      width: 800,
      height: 600,
      background: { type: 'solid', color: '#ffffff' },
      objects: { 'rect-1': makeRect('rect-1') },
      objectOrder: ['rect-1'],
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };
    room.restoreFromSnapshot(snapshot);
    const snap = room.getCanvasSnapshot();
    expect(snap.width).toBe(800);
    expect(snap.version).toBe(5);
    expect(Object.keys(snap.objects)).toEqual(['rect-1']);
  });

  it('resizes the canvas', () => {
    room.resizeCanvas(1920, 1080);
    expect(room.getCanvasSnapshot().width).toBe(1920);
  });
});

describe('RoomManager', () => {
  let manager: RoomManager;

  beforeEach(() => {
    manager = RoomManager.getInstance();
  });

  afterEach(() => {
    // Clean up any rooms created during the test
    for (const id of ['cleanup-room']) {
      manager.removeRoom(id);
    }
  });

  it('is a singleton', () => {
    expect(RoomManager.getInstance()).toBe(manager);
  });

  it('creates a room with an owner', () => {
    const { roomId, ownerId, room } = manager.createRoom('TestOwner');
    expect(roomId).toBeTruthy();
    expect(ownerId).toBeTruthy();
    expect(room.getUsers().map((u) => u.name)).toContain('TestOwner');
    expect(manager.getRoom(roomId)).toBe(room);
    manager.removeRoom(roomId);
  });

  it('recreates a room from a snapshot', () => {
    const { roomId, room: original } = manager.createRoom('TestOwner');
    const rect = makeRect('rect-1');
    original.applyOperation('create', original.ownerId, rect);
    const snapshot = original.getCanvasSnapshot();
    manager.removeRoom(roomId);
    expect(manager.getRoom(roomId)).toBeUndefined();

    const recreated = manager.recreateRoom(roomId, 'new-owner', snapshot);
    expect(recreated).toBeTruthy();
    expect(Object.keys(recreated.getCanvasSnapshot().objects)).toContain('rect-1');
    manager.removeRoom(roomId);
  });
});
