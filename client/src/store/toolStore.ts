import { create } from 'zustand';
import type { ToolSettings } from '@/tools';
import { defaultToolSettings } from '@/tools';

interface ToolStore extends ToolSettings {
  setPenColor: (color: string) => void;
  setPenSize: (size: number) => void;
  setPenOpacity: (opacity: number) => void;
  setPenSmoothness: (smoothness: number) => void;
  setShapeFill: (fill: string) => void;
  setShapeStroke: (stroke: string) => void;
  setShapeStrokeWidth: (width: number) => void;
  setShapeOpacity: (opacity: number) => void;
  setShapeRadius: (radius: number) => void;
  setEraser: (isEraser: boolean) => void;
  setTextColor: (color: string) => void;
  setTextFont: (font: string) => void;
  setTextSize: (size: number) => void;
  setTextWeight: (weight: 'normal' | 'bold') => void;
  setTextStyle: (style: 'normal' | 'italic') => void;
  setTextAlign: (align: 'left' | 'center' | 'right' | 'justify') => void;
  setTextUnderline: (underline: boolean) => void;
  setActiveTool: (tool: ToolSettings['activeTool']) => void;
  reset: () => void;
}

export const useToolStore = create<ToolStore>()((set) => ({
  ...defaultToolSettings,
  setPenColor: (color) => set({ penColor: color }),
  setPenSize: (size) => set({ penSize: size }),
  setPenOpacity: (opacity) => set({ penOpacity: opacity }),
  setPenSmoothness: (smoothness) => set({ penSmoothness: smoothness }),
  setShapeFill: (fill) => set({ shapeFill: fill }),
  setShapeStroke: (stroke) => set({ shapeStroke: stroke }),
  setShapeStrokeWidth: (width) => set({ shapeStrokeWidth: width }),
  setShapeOpacity: (opacity) => set({ shapeOpacity: opacity }),
  setShapeRadius: (radius) => set({ shapeRadius: radius }),
  setEraser: (isEraser) => set({ isEraser }),
  setTextColor: (color) => set({ textColor: color }),
  setTextFont: (font) => set({ textFont: font }),
  setTextSize: (size) => set({ textSize: size }),
  setTextWeight: (weight) => set({ textWeight: weight }),
  setTextStyle: (style) => set({ textStyle: style }),
  setTextAlign: (align) => set({ textAlign: align }),
  setTextUnderline: (underline) => set({ textUnderline: underline }),
  setActiveTool: (tool) => set({ activeTool: tool, isEraser: false }),
  reset: () => set({ ...defaultToolSettings }),
}));
