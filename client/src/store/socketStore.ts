import { create } from 'zustand';
import { io, type Socket } from 'socket.io-client';
import type {
  ClientToServerEvents,
  ServerToClientEvents,
  StrokePoint,
  StrokeData,
} from '@shared/events';
import type {
  User,
  CanvasObject,
  CanvasState,
  BackgroundState,
  PartialObjectUpdate,
  LockInfo,
  RemoteCursor,
  RemoteSelection,
} from '@shared/types';
import { useCanvasStore } from '@/store/canvasStore';
import { useEngineStore } from '@/store/engineStore';
import { useUserStore } from '@/store/userStore';
import { generateUserId } from '@/utils/id';

type AppSocket = Socket<ServerToClientEvents, ClientToServerEvents>;

export interface SocketState {
  socket: AppSocket | null;
  connected: boolean;
  currentRoomId: string | null;
  currentUser: User | null;
  remoteUsers: Record<string, User>;
  remoteCursors: Record<string, RemoteCursor>;
  remoteSelections: Record<string, RemoteSelection>;
  locks: Record<string, LockInfo>;
  canvasState: CanvasState | null;
  suppressEvents: boolean;
}

export interface SocketActions {
  connect: (url: string) => void;
  disconnect: () => void;
  joinRoom: (roomId: string, user: Omit<User, 'joinedAt'>) => void;
  leaveRoom: () => void;
  emitCursorMove: (position: { x: number; y: number }) => void;
  emitSelectionChange: (objectId: string | null) => void;
  emitCreateObject: (object: Omit<CanvasObject, 'createdAt' | 'updatedAt'>) => void;
  emitUpdateObject: (update: PartialObjectUpdate) => void;
  emitDeleteObject: (objectId: string) => void;
  emitReorderObjects: (order: string[]) => void;
  emitLockObject: (objectId: string) => void;
  emitUnlockObject: (objectId: string) => void;
  emitStrokeStart: (strokeId: string, color: string, width: number, opacity: number, smoothness: number, background?: string, isEraser?: boolean) => void;
  emitStrokePoints: (strokeId: string, points: StrokePoint[]) => void;
  emitStrokeEnd: (strokeId: string, points: StrokePoint[]) => void;
  emitBackgroundChange: (background: BackgroundState) => void;
  emitUndo: () => void;
  emitRedo: () => void;
  emitSaveCanvas: () => void;
  emitZoomViewport: (zoom: number, panX?: number, panY?: number) => void;
}

export type SocketStore = SocketState & SocketActions;

function applyRemote(fn: () => void) {
  set({ suppressEvents: true });
  fn();
  setTimeout(() => set({ suppressEvents: false }), 0);
}

let set: (partial: Partial<SocketStore> | ((prev: SocketStore) => Partial<SocketStore>)) => void;

export const useSocketStore = create<SocketStore>((s) => {
  set = s;
  return {
    socket: null,
    connected: false,
    currentRoomId: null,
    currentUser: null,
    remoteUsers: {},
    remoteCursors: {},
    remoteSelections: {},
    locks: {},
    canvasState: null,
    suppressEvents: false,

    connect: (url) => {
      const socket = io(url) as AppSocket;
      set({ socket, connected: socket.connected });

      socket.on('connect', () => {
        set({ connected: true });
        useUserStore.getState().setConnectionStatus('connected');
      });
      socket.on('disconnect', () => {
        set({ connected: false });
        useUserStore.getState().setConnectionStatus('disconnected');
      });

      socket.on('room_joined', ({ roomId, canvas, users, locks, currentUser }) => {
        const remoteUsers: Record<string, User> = {};
        for (const u of users) {
          if (u.id !== currentUser.id) remoteUsers[u.id] = u;
        }
        set({
          currentRoomId: roomId,
          currentUser,
          remoteUsers,
          locks: locks || {},
          canvasState: canvas,
        });
        useUserStore.getState().setUsers(users);

        if (canvas && canvas.objects) {
          const canvasStore = useCanvasStore.getState();
          applyRemote(() => canvasStore.restoreFromSnapshot(canvas));
        }
      });

      socket.on('room_error', ({ code, message }) => {
        console.error('Room error:', code, message);
      });

      socket.on('user_joined', ({ user }) => {
        set((s) => ({
          remoteUsers: { ...s.remoteUsers, [user.id]: user },
        }));
        useUserStore.getState().addUser(user);
      });

      socket.on('user_left', ({ userId }) => {
        set((s) => {
          const { [userId]: _, ...rest } = s.remoteUsers;
          return { remoteUsers: rest };
        });
        useUserStore.getState().removeUser(userId);
      });

      socket.on('presence_update', ({ users }) => {
        const remoteUsers: Record<string, User> = {};
        for (const u of users) {
          if (u.id !== get().currentUser?.id) remoteUsers[u.id] = u;
        }
        set({ remoteUsers });
        useUserStore.getState().setUsers(users);
      });

      socket.on('cursor_updated', (cursor: RemoteCursor) => {
        set((s) => ({
          remoteCursors: { ...s.remoteCursors, [cursor.userId]: cursor },
        }));
      });

      socket.on('selection_updated', (selection: RemoteSelection) => {
        set((s) => ({
          remoteSelections: { ...s.remoteSelections, [selection.userId]: selection },
        }));
      });

      socket.on('object_created', ({ object }) => {
        if (get().suppressEvents) return;
        const { addObject } = useCanvasStore.getState();
        applyRemote(() => addObject(object));
      });

      socket.on('object_updated', ({ objectId, changes }) => {
        if (get().suppressEvents) return;
        const { updateObject } = useCanvasStore.getState();
        applyRemote(() => updateObject(objectId, changes as any));
      });

      socket.on('object_deleted', ({ objectId }) => {
        if (get().suppressEvents) return;
        const { deleteObject } = useCanvasStore.getState();
        applyRemote(() => deleteObject(objectId));
      });

      socket.on('objects_reordered', ({ order }) => {
        if (get().suppressEvents) return;
        const { reorderObjects } = useCanvasStore.getState();
        applyRemote(() => reorderObjects(order));
      });

      socket.on('object_locked', (lock: LockInfo) => {
        set((s) => ({
          locks: { ...s.locks, [lock.objectId]: lock },
        }));
      });

      socket.on('object_unlocked', ({ objectId }) => {
        set((s) => {
          const { [objectId]: _, ...rest } = s.locks;
          return { locks: rest };
        });
      });

      socket.on('stroke_created', ({ stroke }: { stroke: StrokeData }) => {
        if (get().suppressEvents) return;
        const { addObject } = useCanvasStore.getState();
        applyRemote(() => addObject(stroke as unknown as CanvasObject));
      });

      socket.on('stroke_updated', ({ strokeId, points }) => {
        const engine = useEngineStore.getState().engine;
        if (engine) {
          engine.updateStrokePoints?.(strokeId, points);
        }
      });

      socket.on('background_changed', ({ background }) => {
        if (get().suppressEvents) return;
        const { setBackground } = useCanvasStore.getState();
        applyRemote(() => setBackground(background));
      });

      socket.on('viewport_synced', ({ zoom, panX, panY, userId }) => {
        const engine = useEngineStore.getState().engine;
        if (engine && userId !== get().currentUser?.id) {
          engine.syncViewport?.(zoom, panX, panY);
        }
      });

      socket.on('cursor_sync', ({ cursors }) => {
        set({ remoteCursors: cursors });
      });
    },

    disconnect: () => {
      const { socket } = get();
      if (socket) {
        socket.disconnect();
      }
      set({
        socket: null,
        connected: false,
        currentRoomId: null,
        currentUser: null,
        remoteUsers: {},
        remoteCursors: {},
        remoteSelections: {},
        locks: {},
        canvasState: null,
      });
    },

    joinRoom: (roomId, user) => {
      const socket = get().socket;
      if (socket) {
        const safeUser = { ...user, id: user.id || generateUserId(), joinedAt: Date.now() };
        socket.emit('join_room', { roomId, user: safeUser });
        set({ currentUser: safeUser });
      }
    },

    leaveRoom: () => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('leave_room', { roomId: currentRoomId });
      }
    },

    emitCursorMove: (position) => {
      const { socket, currentRoomId, currentUser, suppressEvents } = get();
      if (socket && currentRoomId && currentUser && !suppressEvents) {
        socket.emit('cursor_move', {
          roomId: currentRoomId,
          position: { ...position, tool: 'select' as const },
        });
      }
    },

    emitSelectionChange: (objectId) => {
      const { socket, currentRoomId, currentUser, suppressEvents, canvasState } = get();
      if (socket && currentRoomId && currentUser && !suppressEvents) {
        let boundingBox: { x: number; y: number; width: number; height: number } | null = null;
        if (objectId && canvasState?.objects?.[objectId]) {
          const obj = canvasState.objects[objectId];
          const w = (obj as any).width || 100;
          const h = (obj as any).height || 100;
          boundingBox = { x: obj.x, y: obj.y, width: w, height: h };
        }
        socket.emit('selection_change', {
          roomId: currentRoomId,
          objectId,
          boundingBox,
        });
      }
    },

    emitCreateObject: (object) => {
      const { socket, currentRoomId, suppressEvents } = get();
      if (socket && currentRoomId && !suppressEvents) {
        socket.emit('create_object', { roomId: currentRoomId, object });
      }
    },

    emitUpdateObject: (update) => {
      const { socket, currentRoomId, suppressEvents } = get();
      if (socket && currentRoomId && !suppressEvents) {
        socket.emit('update_object', { roomId: currentRoomId, update });
      }
    },

    emitDeleteObject: (objectId) => {
      const { socket, currentRoomId, suppressEvents } = get();
      if (socket && currentRoomId && !suppressEvents) {
        socket.emit('delete_object', { roomId: currentRoomId, objectId });
      }
    },

    emitReorderObjects: (order) => {
      const { socket, currentRoomId, suppressEvents } = get();
      if (socket && currentRoomId && !suppressEvents) {
        socket.emit('reorder_objects', { roomId: currentRoomId, order });
      }
    },

    emitLockObject: (objectId) => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('lock_object', { roomId: currentRoomId, objectId });
      }
    },

    emitUnlockObject: (objectId) => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('unlock_object', { roomId: currentRoomId, objectId });
      }
    },

    emitStrokeStart: (strokeId, color, width, opacity, smoothness, background, isEraser) => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('stroke_start', {
          roomId: currentRoomId,
          strokeId, color, width, opacity, smoothness, background, isEraser,
        });
      }
    },

    emitStrokePoints: (strokeId, points) => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('stroke_points', { roomId: currentRoomId, strokeId, points });
      }
    },

    emitStrokeEnd: (strokeId, points) => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('stroke_end', { roomId: currentRoomId, strokeId, points });
      }
    },

    emitBackgroundChange: (background) => {
      const { socket, currentRoomId, suppressEvents } = get();
      if (socket && currentRoomId && !suppressEvents) {
        socket.emit('background_change', { roomId: currentRoomId, background });
      }
    },

    emitUndo: () => {
      const { socket, currentRoomId, suppressEvents } = get();
      if (socket && currentRoomId && !suppressEvents) {
        socket.emit('undo', { roomId: currentRoomId });
      }
    },

    emitRedo: () => {
      const { socket, currentRoomId, suppressEvents } = get();
      if (socket && currentRoomId && !suppressEvents) {
        socket.emit('redo', { roomId: currentRoomId });
      }
    },

    emitSaveCanvas: () => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('save_canvas', { roomId: currentRoomId });
      }
    },

    emitZoomViewport: (zoom, panX, panY) => {
      const { socket, currentRoomId } = get();
      if (socket && currentRoomId) {
        socket.emit('zoom_viewport', { roomId: currentRoomId, zoom, panX, panY });
      }
    },
  };
});

function get() {
  return useSocketStore.getState();
}
