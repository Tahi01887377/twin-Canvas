import { create } from 'zustand';
import type { CanvasObject, CanvasState, BackgroundState } from '@shared/types';
import {
  CANVAS_DEFAULT_WIDTH,
  CANVAS_DEFAULT_HEIGHT,
} from '@shared/constants';

type HistoryEntry = {
  objects: Record<string, CanvasObject>;
  objectOrder: string[];
};

interface CanvasStore {
  width: number;
  height: number;
  objects: Record<string, CanvasObject>;
  objectOrder: string[];
  background: BackgroundState;
  version: number;
  history: HistoryEntry[];
  historyIndex: number;

  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, changes: Partial<CanvasObject>) => void;
  deleteObject: (id: string) => void;
  reorderObjects: (order: string[]) => void;
  moveObjectToFront: (id: string) => void;
  moveObjectForward: (id: string) => void;
  moveObjectBackward: (id: string) => void;
  moveObjectToBack: (id: string) => void;
  setBackground: (bg: BackgroundState) => void;
  setCanvasSize: (width: number, height: number) => void;
  undo: () => void;
  redo: () => void;
  canUndo: () => boolean;
  canRedo: () => boolean;
  resetHistory: () => void;
  restoreFromSnapshot: (snapshot: CanvasState) => void;
}

const MAX_HISTORY = 100;

function createSnapshot(objects: Record<string, CanvasObject>, objectOrder: string[]): HistoryEntry {
  return {
    objects: { ...objects },
    objectOrder: [...objectOrder],
  };
}

export const useCanvasStore = create<CanvasStore>()((set, get) => ({
  width: CANVAS_DEFAULT_WIDTH,
  height: CANVAS_DEFAULT_HEIGHT,
  objects: {},
  objectOrder: [],
  background: { type: 'solid', color: '#ffffff' },
  version: 1,
  history: [createSnapshot({}, [])],
  historyIndex: 0,

  addObject: (obj) => {
    set((state) => {
      const newObjects: Record<string, CanvasObject> = { ...state.objects };
      newObjects[obj.id] = { ...obj, updatedAt: Date.now() } as unknown as CanvasObject;
      const newOrder = [...state.objectOrder, obj.id];
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(newObjects, newOrder));
      const newIndex = newHistory.length - 1;
      return {
        objects: newObjects,
        objectOrder: newOrder,
        version: state.version + 1,
        history: newHistory.length > MAX_HISTORY ? newHistory.slice(newHistory.length - MAX_HISTORY) : newHistory,
        historyIndex: newIndex,
      };
    });
  },

  updateObject: (id, changes) => {
    set((state) => {
      const existing = state.objects[id];
      if (!existing) return state;
      const newObjects = { ...state.objects };
      newObjects[id] = { ...existing, ...changes, updatedAt: Date.now() } as unknown as CanvasObject;
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(newObjects, state.objectOrder));
      const newIndex = newHistory.length - 1;
      return {
        objects: newObjects,
        version: state.version + 1,
        history: newHistory.length > MAX_HISTORY ? newHistory.slice(newHistory.length - MAX_HISTORY) : newHistory,
        historyIndex: newIndex,
      };
    });
  },

  deleteObject: (id) => {
    set((state) => {
      const newObjects: Record<string, CanvasObject> = {};
      for (const [k, v] of Object.entries(state.objects)) {
        if (k !== id) newObjects[k] = v;
      }
      const newOrder = state.objectOrder.filter((oid) => oid !== id);
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(newObjects, newOrder));
      const newIndex = newHistory.length - 1;
      return {
        objects: newObjects,
        objectOrder: newOrder,
        version: state.version + 1,
        history: newHistory.length > MAX_HISTORY ? newHistory.slice(newHistory.length - MAX_HISTORY) : newHistory,
        historyIndex: newIndex,
      };
    });
  },

  reorderObjects: (order) => {
    set((state) => {
      const newHistory = state.history.slice(0, state.historyIndex + 1);
      newHistory.push(createSnapshot(state.objects, order));
      const newIndex = newHistory.length - 1;
      return {
        objectOrder: order,
        version: state.version + 1,
        history: newHistory.length > MAX_HISTORY ? newHistory.slice(newHistory.length - MAX_HISTORY) : newHistory,
        historyIndex: newIndex,
      };
    });
  },

  moveObjectToFront: (id) => {
    const { objectOrder } = get();
    const idx = objectOrder.indexOf(id);
    if (idx === -1 || idx === objectOrder.length - 1) return;
    const newOrder = [...objectOrder];
    newOrder.splice(idx, 1);
    newOrder.push(id);
    get().reorderObjects(newOrder);
  },

  moveObjectForward: (id) => {
    const { objectOrder } = get();
    const idx = objectOrder.indexOf(id);
    if (idx === -1 || idx === objectOrder.length - 1) return;
    const newOrder = [...objectOrder];
    [newOrder[idx], newOrder[idx + 1]] = [newOrder[idx + 1], newOrder[idx]];
    get().reorderObjects(newOrder);
  },

  moveObjectBackward: (id) => {
    const { objectOrder } = get();
    const idx = objectOrder.indexOf(id);
    if (idx <= 0) return;
    const newOrder = [...objectOrder];
    [newOrder[idx], newOrder[idx - 1]] = [newOrder[idx - 1], newOrder[idx]];
    get().reorderObjects(newOrder);
  },

  moveObjectToBack: (id) => {
    const { objectOrder } = get();
    const idx = objectOrder.indexOf(id);
    if (idx === -1 || idx === 0) return;
    const newOrder = [...objectOrder];
    newOrder.splice(idx, 1);
    newOrder.unshift(id);
    get().reorderObjects(newOrder);
  },

  setBackground: (bg) => {
    set((state) => ({ background: bg, version: state.version + 1 }));
  },

  setCanvasSize: (width, height) => {
    set({ width, height });
  },

  undo: () => {
    const { historyIndex, history } = get();
    if (historyIndex <= 0) return;
    const prev = history[historyIndex - 1];
    set((state) => ({
      objects: prev.objects,
      objectOrder: prev.objectOrder,
      historyIndex: state.historyIndex - 1,
    }));
  },

  redo: () => {
    const { historyIndex, history } = get();
    if (historyIndex >= history.length - 1) return;
    const next = history[historyIndex + 1];
    set((state) => ({
      objects: next.objects,
      objectOrder: next.objectOrder,
      historyIndex: state.historyIndex + 1,
    }));
  },

  canUndo: () => get().historyIndex > 0,
  canRedo: () => get().historyIndex < get().history.length - 1,

  resetHistory: () => {
    set((state) => ({
      history: [createSnapshot(state.objects, state.objectOrder)],
      historyIndex: 0,
    }));
  },

  restoreFromSnapshot: (snapshot) => {
    set({
      width: snapshot.width,
      height: snapshot.height,
      objects: snapshot.objects,
      objectOrder: snapshot.objectOrder,
      background: snapshot.background,
      version: snapshot.version,
      history: [createSnapshot(snapshot.objects, snapshot.objectOrder)],
      historyIndex: 0,
    });
  },
}));
