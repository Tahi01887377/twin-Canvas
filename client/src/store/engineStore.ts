import { create } from 'zustand';
import type { FabricEngineAPI } from '@/canvas/FabricEngine';

interface EngineStore {
  engine: FabricEngineAPI | null;
  setEngine: (engine: FabricEngineAPI | null) => void;
}

export const useEngineStore = create<EngineStore>()((set) => ({
  engine: null,
  setEngine: (engine) => set({ engine }),
}));
