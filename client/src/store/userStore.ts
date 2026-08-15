import { create } from 'zustand';
import type { User, RemoteCursor, RemoteSelection } from '@shared/types';
import { COLLABORATION_COLORS } from '@shared/constants';
import { generateUserId } from '@/utils/id';

interface UserState {
  currentUser: User | null;
  users: User[];
  remoteCursors: Record<string, RemoteCursor>;
  remoteSelections: Record<string, RemoteSelection>;
  locks: Record<string, { userId: string; name: string; expiresAt: number }>;
}

interface UserStore extends UserState {
  initUser: (name: string, color?: string, userId?: string, isOwner?: boolean) => void;
  setUsers: (users: User[]) => void;
  addUser: (user: User) => void;
  removeUser: (userId: string) => void;
  updateUser: (user: User) => void;
  setRemoteCursor: (cursor: RemoteCursor) => void;
  removeRemoteCursor: (userId: string) => void;
  setRemoteSelection: (selection: RemoteSelection) => void;
  removeRemoteSelection: (userId: string) => void;
  setRemoteLock: (objectId: string, userId: string, name: string, expiresAt: number) => void;
  removeRemoteLock: (objectId: string, userId: string) => void;
  clearRemoteState: () => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting') => void;
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}

export const useUserStore = create<UserStore>()((set) => ({
  currentUser: null,
  users: [],
  remoteCursors: {},
  remoteSelections: {},
  locks: {},
  connectionStatus: 'connected',

  initUser: (name, color, userId, isOwner) => {
    const colors = COLLABORATION_COLORS;
    const assignedColor = color || colors[Math.floor(Math.random() * colors.length)];
    const user: User = {
      id: userId || generateUserId(),
      name,
      color: assignedColor,
      joinedAt: Date.now(),
      isOwner: isOwner ?? true,
    };
    set({ currentUser: user });
  },

  setUsers: (users) => set({ users }),
  addUser: (user) =>
    set((state) => ({ users: [...state.users.filter((u) => u.id !== user.id), user] })),
  removeUser: (userId) =>
    set((state) => ({
      users: state.users.filter((u) => u.id !== userId),
      remoteCursors: Object.fromEntries(Object.entries(state.remoteCursors).filter(([k]) => k !== userId)),
      remoteSelections: Object.fromEntries(Object.entries(state.remoteSelections).filter(([k]) => k !== userId)),
    })),
  updateUser: (user) =>
    set((state) => ({
      users: state.users.map((u) => (u.id === user.id ? user : u)),
    })),

  setRemoteCursor: (cursor) =>
    set((state) => ({
      remoteCursors: { ...state.remoteCursors, [cursor.userId]: cursor },
    })),
  removeRemoteCursor: (userId) =>
    set((state) => {
      const { [userId]: _removed, ...rest } = state.remoteCursors;
      return { remoteCursors: rest };
    }),

  setRemoteSelection: (selection) =>
    set((state) => ({
      remoteSelections: { ...state.remoteSelections, [selection.userId]: selection },
    })),
  removeRemoteSelection: (userId) =>
    set((state) => {
      const { [userId]: _removed, ...rest } = state.remoteSelections;
      return { remoteSelections: rest };
    }),

  setRemoteLock: (objectId, userId, name, expiresAt) =>
    set((state) => ({
      locks: { ...state.locks, [objectId]: { userId, name, expiresAt } },
    })),
  removeRemoteLock: (objectId, userId) =>
    set((state) => {
      const lock = state.locks[objectId];
      if (lock && (lock.userId === userId || lock.expiresAt <= Date.now())) {
        const { [objectId]: _removed, ...rest } = state.locks;
        return { locks: rest };
      }
      return state;
    }),

  clearRemoteState: () =>
    set({ remoteCursors: {}, remoteSelections: {}, locks: {} }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
}));
