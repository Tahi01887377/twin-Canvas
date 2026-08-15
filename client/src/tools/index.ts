import type { ToolName } from '@shared/constants';
import { BRUSH_SIZES } from '@shared/constants';

export interface ToolSettings {
  activeTool: ToolName;
  penColor: string;
  penSize: number;
  penOpacity: number;
  penSmoothness: number;
  shapeFill: string;
  shapeStroke: string;
  shapeStrokeWidth: number;
  shapeOpacity: number;
  shapeRadius: number;
  isEraser: boolean;
  textColor: string;
  textFont: string;
  textSize: number;
  textWeight: 'normal' | 'bold';
  textStyle: 'normal' | 'italic';
  textAlign: 'left' | 'center' | 'right' | 'justify';
  textUnderline: boolean;
  lineHeight: number;
}

export const defaultToolSettings: ToolSettings = {
  activeTool: 'select',
  penColor: '#000000',
  penSize: 5,
  penOpacity: 1,
  penSmoothness: 1,
  shapeFill: '#3b82f6',
  shapeStroke: '#1e40af',
  shapeStrokeWidth: 2,
  shapeOpacity: 1,
  shapeRadius: 4,
  isEraser: false,
  textColor: '#000000',
  textFont: 'Inter',
  textSize: 32,
  textWeight: 'normal',
  textStyle: 'normal',
  textAlign: 'left',
  textUnderline: false,
  lineHeight: 1.16,
};

export const TOOL_GROUPS = [
  {
    id: 'main',
    tools: [
      { name: 'select' as ToolName, label: 'Select', icon: 'MousePointer' },
      { name: 'pen' as ToolName, label: 'Pen', icon: 'Pen' },
      { name: 'eraser' as ToolName, label: 'Eraser', icon: 'Eraser' },
    ],
  },
  {
    id: 'shapes',
    tools: [
      { name: 'rect' as ToolName, label: 'Rectangle', icon: 'Square' },
      { name: 'rounded-rect' as ToolName, label: 'Rounded Rect', icon: 'SquareRoundedCorner' },
      { name: 'circle' as ToolName, label: 'Circle', icon: 'Circle' },
      { name: 'ellipse' as ToolName, label: 'Ellipse', icon: 'Ellipse' },
      { name: 'triangle' as ToolName, label: 'Triangle', icon: 'Triangle' },
      { name: 'line' as ToolName, label: 'Line', icon: 'Minus' },
      { name: 'arrow' as ToolName, label: 'Arrow', icon: 'ArrowRight' },
      { name: 'star' as ToolName, label: 'Star', icon: 'Star' },
      { name: 'polygon' as ToolName, label: 'Polygon', icon: 'Hexagon' },
      { name: 'heart' as ToolName, label: 'Heart', icon: 'Heart' },
      { name: 'diamond' as ToolName, label: 'Diamond', icon: 'Diamond' },
    ],
  },
  {
    id: 'text',
    tools: [
      { name: 'text' as ToolName, label: 'Text', icon: 'T' },
      { name: 'image' as ToolName, label: 'Image', icon: 'Image' },
    ],
  },
];

export { BRUSH_SIZES };
