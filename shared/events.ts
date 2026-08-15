import type { CanvasObject, CanvasState, CursorPosition, PartialObjectUpdate, User, LockInfo, RemoteCursor, RemoteSelection, BackgroundState, GradientConfig } from './types.js';

export interface StrokePoint {
  x: number;
  y: number;
  pressure?: number;
  timestamp: number;
}

export interface StrokeData {
  id: string;
  userId: string;
  points: StrokePoint[];
  color: string;
  width: number;
  opacity: number;
  smoothness: number;
  background?: string;
  isEraser?: boolean;
}

export interface ClientToServerEvents {
  join_room: (payload: { roomId: string; user: Omit<User, 'joinedAt'> }) => void;
  leave_room: (payload: { roomId: string }) => void;
  cursor_move: (payload: { roomId: string; position: CursorPosition }) => void;
  selection_change: (payload: { roomId: string; objectId: string | null; boundingBox: { x: number; y: number; width: number; height: number } | null }) => void;
  create_object: (payload: { roomId: string; object: Omit<CanvasObject, 'createdAt' | 'updatedAt'> }) => void;
  update_object: (payload: { roomId: string; update: PartialObjectUpdate }) => void;
  delete_object: (payload: { roomId: string; objectId: string }) => void;
  reorder_objects: (payload: { roomId: string; order: string[] }) => void;
  lock_object: (payload: { roomId: string; objectId: string }) => void;
  unlock_object: (payload: { roomId: string; objectId: string }) => void;
  stroke_start: (payload: { roomId: string; strokeId: string; color: string; width: number; opacity: number; smoothness: number; background?: string; isEraser?: boolean }) => void;
  stroke_points: (payload: { roomId: string; strokeId: string; points: StrokePoint[] }) => void;
  stroke_end: (payload: { roomId: string; strokeId: string; points: StrokePoint[] }) => void;
  background_change: (payload: { roomId: string; background: BackgroundState }) => void;
  undo: (payload: { roomId: string }) => void;
  redo: (payload: { roomId: string }) => void;
  save_canvas: (payload: { roomId: string }) => void;
  copy_objects: (payload: { roomId: string; objectIds: string[] }) => void;
  paste_objects: (payload: { roomId: string; objects: CanvasObject[] }) => void;
  zoom_viewport: (payload: { roomId: string; zoom: number; panX?: number; panY?: number }) => void;
}

export interface ServerToClientEvents {
  room_joined: (payload: { roomId: string; canvas: CanvasState; users: User[]; locks: Record<string, LockInfo>; currentUser: User }) => void;
  room_error: (payload: { code: string; message: string }) => void;
  user_joined: (payload: { user: User }) => void;
  user_left: (payload: { userId: string; name: string }) => void;
  user_reconnected: (payload: { user: User }) => void;
  presence_update: (payload: { users: User[] }) => void;
  cursor_updated: (payload: RemoteCursor) => void;
  selection_updated: (payload: RemoteSelection) => void;
  object_created: (payload: { object: CanvasObject }) => void;
  object_updated: (payload: { objectId: string; changes: Record<string, unknown> }) => void;
  object_deleted: (payload: { objectId: string }) => void;
  objects_reordered: (payload: { order: string[] }) => void;
  object_locked: (payload: LockInfo) => void;
  object_unlocked: (payload: { objectId: string }) => void;
  stroke_created: (payload: { stroke: StrokeData }) => void;
  stroke_updated: (payload: { strokeId: string; points: StrokePoint[] }) => void;
  background_changed: (payload: { background: BackgroundState }) => void;
  canvas_saved: (payload: { version: number }) => void;
  viewport_synced: (payload: { zoom: number; panX: number; panY: number; userId: string }) => void;
  cursor_sync: (payload: { cursors: Record<string, RemoteCursor> }) => void;
}

export interface InterServerEvents {
  sync_canvas: (payload: { roomId: string }) => void;
}

export interface SocketData {
  userId: string;
  roomId: string | null;
  user: User | null;
  lastPing: number;
}

export type EventName = keyof ClientToServerEvents | keyof ServerToClientEvents;
