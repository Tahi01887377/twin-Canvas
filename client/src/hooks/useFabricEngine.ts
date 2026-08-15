import { useEffect, useRef } from 'react';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { useToolStore } from '@/store/toolStore';
import { useEngineStore } from '@/store/engineStore';
import { useSocketStore } from '@/store/socketStore';
import { createFabricEngine, type FabricEventCallbacks } from '@/canvas/FabricEngine';
import type { CanvasObject, CanvasState, BackgroundState } from '@shared/types';
import type { RectObject, CircleObject, EllipseObject, TriangleObject, LineObject, ArrowObject, PolygonObject, StarObject, HeartObject, DiamondObject } from '@shared/types';

export function useFabricEngine() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const engineRef = useRef<ReturnType<typeof createFabricEngine> | null>(null);

  const { objects, objectOrder, background, addObject, updateObject, deleteObject } = useCanvasStore();
  const { activeTool, setSelectedObject, selectedObjectId } = useUIStore();
  const { setEngine } = useEngineStore();
  const { penColor, penSize, penOpacity } = useToolStore();

  useEffect(() => {
    if (!containerRef.current) return;

    const engine = createFabricEngine();
    engineRef.current = engine;
    setEngine(engine);

    const callbacks: FabricEventCallbacks = {
      onObjectModified: (objectId, changes) => {
        updateObject(objectId, changes);
        useSocketStore.getState().emitUpdateObject({ id: objectId, changes });
      },
      onObjectSelected: (objectId) => {
        setSelectedObject(objectId);
        useSocketStore.getState().emitSelectionChange(objectId);
      },
      onCanvasClick: (x, y) => {
        if (activeTool === 'pen' || activeTool === 'eraser') return;
        if (
          activeTool === 'rect' || activeTool === 'rounded-rect' || activeTool === 'circle' ||
          activeTool === 'ellipse' || activeTool === 'triangle' || activeTool === 'line' ||
          activeTool === 'arrow' || activeTool === 'star' || activeTool === 'polygon' ||
          activeTool === 'heart' || activeTool === 'diamond'
        ) {
          const t = useToolStore.getState();
          engine.addShapeAt(activeTool, x, y, {
            fill: t.shapeFill,
            stroke: t.shapeStroke,
            strokeWidth: t.shapeStrokeWidth,
            opacity: t.shapeOpacity,
            radius: t.shapeRadius,
          });
          const newId = Object.keys(useCanvasStore.getState().objects).pop();
          if (newId) {
            const newObj = buildCanvasObject(activeTool, x, y, t, newId);
            addObject(newObj);
            useSocketStore.getState().emitCreateObject(newObj);
          }
        } else if (activeTool === 'text') {
          const t = useToolStore.getState();
          engine.addTextAt(x, y, {
            text: 'Double click to edit',
            fontFamily: t.textFont,
            fontSize: t.textSize,
            fontWeight: t.textWeight,
            fontStyle: t.textStyle,
            fill: t.textColor,
            textAlign: t.textAlign,
            underline: t.textUnderline,
            lineHeight: t.lineHeight,
          });
        }
      },
      onPathCreated: (stroke) => {
        const pathObj = stroke as CanvasObject;
        addObject(pathObj);
        useSocketStore.getState().emitCreateObject(pathObj);
      },
      onCursorMove: (x, y) => {
        useSocketStore.getState().emitCursorMove({ x, y });
      },
    };

    engine.init(containerRef.current, callbacks);
    engine.syncBackground(background);
    engine.syncObjects(objects, objectOrder);

    const resizeObserver = new ResizeObserver(() => {
      if (engine && containerRef.current) {
        engine.setCanvasSize(containerRef.current.clientWidth, containerRef.current.clientHeight);
      }
    });
    resizeObserver.observe(containerRef.current);

    return () => {
      resizeObserver.disconnect();
      engine.destroy();
      engineRef.current = null;
      setEngine(null);
    };
  }, []);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.syncObjects(objects, objectOrder);
  }, [objects, objectOrder]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.syncBackground(background);
  }, [background]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;
    engine.syncSelection(selectedObjectId);
  }, [selectedObjectId]);

  useEffect(() => {
    const engine = engineRef.current;
    if (!engine) return;

    if (activeTool === 'pen') {
      engine.setDrawingMode(true, {
        color: penColor,
        width: penSize,
        opacity: penOpacity,
      });
    } else if (activeTool === 'eraser') {
      engine.setDrawingMode(true, {
        color: '#ffffff',
        width: penSize,
        opacity: penOpacity,
        eraser: true,
      });
    } else {
      engine.setDrawingMode(false);
    }
  }, [activeTool, penColor, penSize, penOpacity]);

  return { canvasRef, containerRef, engine: engineRef };
}

function buildCanvasObject(
  tool: string,
  x: number,
  y: number,
  t: ReturnType<typeof useToolStore.getState>,
  id: string
): CanvasObject {
  const base = {
    id,
    x,
    y,
    rotation: 0,
    scaleX: 1,
    scaleY: 1,
    originX: 'left' as const,
    originY: 'top' as const,
    opacity: 1,
    visible: true,
    selectable: true,
    evented: true,
    zIndex: 0,
    locked: false,
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };

  switch (tool) {
    case 'rect':
      return { ...base, type: 'rect' as const, width: 200, height: 150, fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth, rx: 0, ry: 0 } as RectObject;
    case 'rounded-rect':
      return { ...base, type: 'rect' as const, width: 200, height: 150, fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth, rx: 12, ry: 12 } as RectObject;
    case 'circle':
      return { ...base, type: 'circle' as const, radius: 100, fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth } as CircleObject;
    case 'ellipse':
      return { ...base, type: 'ellipse' as const, rx: 120, ry: 80, fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth } as EllipseObject;
    case 'triangle':
      return { ...base, type: 'triangle' as const, width: 200, height: 200, fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth } as TriangleObject;
    case 'line':
      return { ...base, type: 'line' as const, width: 200, height: 2, x1: 0, y1: 0, x2: 0, y2: 200, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth || 2 } as LineObject;
    case 'arrow':
      return { ...base, type: 'arrow' as const, width: 200, height: 2, x1: 0, y1: 0, x2: 200, y2: 0, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth || 2, fill: t.shapeStroke, headLength: 20, headWidth: 20 } as ArrowObject;
    case 'star':
      return { ...base, type: 'star' as const, outerRadius: 80, innerRadius: 40, points: 5, fill: '#f59e0b', stroke: '#d97706', strokeWidth: t.shapeStrokeWidth } as StarObject;
    case 'polygon':
      return { ...base, type: 'polygon' as const, points: [{x:0,y:0},{x:100,y:0},{x:150,y:100},{x:50,y:150},{x:-50,y:100}], fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth } as PolygonObject;
    case 'heart':
      return { ...base, type: 'heart' as const, width: 100, height: 100, fill: '#ef4444', stroke: '#b91c1c', strokeWidth: t.shapeStrokeWidth } as HeartObject;
    case 'diamond':
      return { ...base, type: 'diamond' as const, width: 120, height: 120, fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth } as DiamondObject;
    default:
      return { ...base, type: 'rect' as const, width: 200, height: 150, fill: t.shapeFill, stroke: t.shapeStroke, strokeWidth: t.shapeStrokeWidth, rx: 0, ry: 0 } as RectObject;
  }
}
