import { create } from 'zustand';
import type { ToolName } from '@shared/constants';
import { COLLABORATION_COLORS, BRUSH_SIZES, FONT_FAMILIES } from '@shared/constants';

type PanelName = 'design' | 'elements' | 'text' | 'uploads' | 'draw' | 'background' | 'projects' | 'layers';

interface UIState {
  activeTool: ToolName;
  activePanel: PanelName | null;
  darkMode: boolean;
  selectedObjectId: string | null;
  multiSelected: string[];
  showDevPanel: boolean;
  saveStatus: 'saved' | 'saving' | 'unsaved';
  connectionStatus: 'connected' | 'connecting' | 'disconnected' | 'reconnecting';
}

interface UIStore extends UIState {
  setActiveTool: (tool: ToolName) => void;
  setActivePanel: (panel: PanelName | null) => void;
  toggleDarkMode: () => void;
  setSelectedObject: (id: string | null) => void;
  setMultiSelected: (ids: string[]) => void;
  toggleObjectSelection: (id: string) => void;
  setShowDevPanel: (show: boolean) => void;
  setSaveStatus: (status: 'saved' | 'saving' | 'unsaved') => void;
  setConnectionStatus: (status: 'connected' | 'connecting' | 'disconnected' | 'reconnecting') => void;
  reset: () => void;
}

const initialUIState: UIState = {
  activeTool: 'select',
  activePanel: null,
  darkMode: false,
  selectedObjectId: null,
  multiSelected: [],
  showDevPanel: import.meta.env.DEV,
  saveStatus: 'saved',
  connectionStatus: 'connected',
};

export const useUIStore = create<UIStore>()((set) => ({
  ...initialUIState,

  setActiveTool: (tool) => set({ activeTool: tool, multiSelected: [] }),
  setActivePanel: (panel) => set({ activePanel: panel }),
  toggleDarkMode: () => set((state) => ({ darkMode: !state.darkMode })),
  setSelectedObject: (id) =>
    set({ selectedObjectId: id, multiSelected: id ? [id] : [] }),
  setMultiSelected: (ids) => set({ multiSelected: ids, selectedObjectId: ids.length === 1 ? ids[0] : null }),
  toggleObjectSelection: (id) =>
    set((state) => {
      const exists = state.multiSelected.includes(id);
      const newSelected = exists
        ? state.multiSelected.filter((sid) => sid !== id)
        : [...state.multiSelected, id];
      return {
        multiSelected: newSelected,
        selectedObjectId: newSelected.length === 1 ? newSelected[0] : state.selectedObjectId,
      };
    }),
  setShowDevPanel: (show) => set({ showDevPanel: show }),
  setSaveStatus: (status) => set({ saveStatus: status }),
  setConnectionStatus: (status) => set({ connectionStatus: status }),
  reset: () => set({ ...initialUIState, showDevPanel: import.meta.env.DEV }),
}));

export type { ToolName, PanelName };
export { COLLABORATION_COLORS, BRUSH_SIZES, FONT_FAMILIES };
