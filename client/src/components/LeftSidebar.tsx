import {
  MousePointer,
  Pen,
  Eraser,
  Square,
  Circle,
  Triangle,
  Minus,
  ArrowRight,
  Star,
  Hexagon,
  Heart,
  Diamond,
  Ellipsis,
  Type,
  Image as ImageIcon,
} from 'lucide-react';
import { useUIStore } from '@/store/uiStore';
import { useToolStore } from '@/store/toolStore';
import { useCanvasStore } from '@/store/canvasStore';
import { TOOL_GROUPS, BRUSH_SIZES } from '@/tools';
import type { ToolName } from '@shared/constants';

const TOOL_ICONS: Record<ToolName, React.ComponentType<{ className?: string }>> = {
  select: MousePointer,
  pen: Pen,
  eraser: Eraser,
  rect: Square,
   'rounded-rect': Square,
  circle: Circle,
  ellipse: Ellipsis,
  triangle: Triangle,
  line: Minus,
  arrow: ArrowRight,
  star: Star,
  polygon: Hexagon,
  heart: Heart,
  diamond: Diamond,
  text: Type,
  image: ImageIcon,
};

export function LeftSidebar() {
  const { activeTool, setActiveTool, activePanel, setActivePanel } = useUIStore();
  const { penColor, setPenColor, penSize, setPenSize, shapeFill, setShapeFill, shapeStroke, setShapeStroke, shapeStrokeWidth, setShapeStrokeWidth } = useToolStore();
  const { background, setBackground } = useCanvasStore();

  const Icon = TOOL_ICONS[activeTool] || MousePointer;

  const handleToolClick = (tool: ToolName) => {
    setActiveTool(tool);
  };

  return (
    <div className="flex w-64 flex-col gap-2 border-r bg-card p-3 overflow-y-auto">
      <div className="flex flex-col gap-1 mb-2">
        {TOOL_GROUPS[0].tools.map((tool) => {
          const ToolIcon = TOOL_ICONS[tool.name] || MousePointer;
          return (
            <button
              key={tool.name}
              onClick={() => handleToolClick(tool.name)}
              className={`flex items-center gap-3 rounded-md px-3 py-2 text-sm transition ${
                activeTool === tool.name
                  ? 'bg-primary text-primary-foreground'
                  : 'hover:bg-muted'
              }`}
              title={tool.label}
            >
              <ToolIcon className="h-4 w-4" />
              {tool.label}
            </button>
          );
        })}
      </div>

      <div className="border-t pt-2">
        {activeTool === 'pen' && (
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-muted-foreground">Pen Color</label>
            <div className="flex gap-2">
              <input
                type="color"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
                className="h-8 w-8 cursor-pointer rounded border"
              />
              <input
                type="text"
                value={penColor}
                onChange={(e) => setPenColor(e.target.value)}
                className="flex-1 rounded-md border border-input px-2 py-1 text-xs"
              />
            </div>
            <label className="text-xs font-medium text-muted-foreground">Brush Size</label>
            <div className="flex gap-1 flex-wrap">
              {BRUSH_SIZES.map((size) => (
                <button
                  key={size}
                  onClick={() => setPenSize(size)}
                  className={`h-8 px-3 rounded-md text-xs transition ${
                    penSize === size
                      ? 'bg-primary text-primary-foreground'
                      : 'border border-input hover:bg-muted'
                  }`}
                >
                  {size}px
                </button>
              ))}
            </div>
          </div>
        )}

        {['rect', 'rounded-rect', 'circle', 'ellipse', 'triangle', 'line', 'arrow', 'star', 'polygon', 'heart', 'diamond'].includes(activeTool) && (
          <div className="flex flex-col gap-3">
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Fill</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={shapeFill}
                  onChange={(e) => setShapeFill(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <input
                  type="text"
                  value={shapeFill}
                  onChange={(e) => setShapeFill(e.target.value)}
                  className="flex-1 rounded-md border border-input px-2 py-1 text-xs"
                />
              </div>
            </div>
            <div>
              <label className="block text-xs font-medium text-muted-foreground mb-1">Stroke</label>
              <div className="flex gap-2">
                <input
                  type="color"
                  value={shapeStroke}
                  onChange={(e) => setShapeStroke(e.target.value)}
                  className="h-8 w-8 cursor-pointer rounded border"
                />
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={shapeStrokeWidth}
                  onChange={(e) => setShapeStrokeWidth(parseInt(e.target.value, 10) || 0)}
                  className="w-16 rounded-md border border-input px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        {activeTool === 'text' && (
          <div className="flex flex-col gap-3">
            <label className="text-xs font-medium text-muted-foreground">Font</label>
            <select
              value={useToolStore.getState().textFont}
              onChange={(e) => useToolStore.getState().setTextFont(e.target.value)}
              className="rounded-md border border-input px-2 py-1 text-sm"
            >
              {['Inter', 'Roboto', 'Arial', 'Georgia', 'Times New Roman', 'Courier New'].map((font) => (
                <option key={font} value={font}>{font}</option>
              ))}
            </select>
            <label className="text-xs font-medium text-muted-foreground">Size</label>
            <input
              type="number"
              min="8"
              max="200"
              value={useToolStore.getState().textSize}
              onChange={(e) => useToolStore.getState().setTextSize(parseInt(e.target.value, 10) || 16)}
              className="rounded-md border border-input px-2 py-1 text-sm"
            />
            <div className="flex gap-2">
              <button
                onClick={() => useToolStore.getState().setTextWeight(useToolStore.getState().textWeight === 'bold' ? 'normal' : 'bold')}
                className="flex-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-muted"
              >
                {useToolStore.getState().textWeight === 'bold' ? 'Bold' : 'Bold'}
              </button>
              <button
                onClick={() => useToolStore.getState().setTextStyle(useToolStore.getState().textStyle === 'italic' ? 'normal' : 'italic')}
                className="flex-1 rounded-md border border-input px-2 py-1 text-xs hover:bg-muted"
              >
                Italic
              </button>
            </div>
            <input
              type="color"
              value={useToolStore.getState().textColor}
              onChange={(e) => useToolStore.getState().setTextColor(e.target.value)}
              className="h-8 w-8 cursor-pointer rounded border"
            />
          </div>
        )}
      </div>
    </div>
  );
}
