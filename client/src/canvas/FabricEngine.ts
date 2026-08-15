// @ts-nocheck
import * as fabric from 'fabric';
import type {
  CanvasObject,
  CanvasState,
  BackgroundState,
  RectObject,
  CircleObject,
  EllipseObject,
  TriangleObject,
  LineObject,
  ArrowObject,
  PolygonObject,
  StarObject,
  HeartObject,
  DiamondObject,
} from '@shared/types';
import { generateObjectId } from '@/utils/id';

export interface FabricEventCallbacks {
  onObjectModified: (objectId: string, changes: Record<string, any>) => void;
  onObjectSelected: (objectId: string | null) => void;
  onCanvasClick: (x: number, y: number) => void;
  onPathCreated: (object: CanvasObject) => void;
  onCursorMove: (x: number, y: number) => void;
}

export interface FabricEngineAPI {
  canvas: fabric.Canvas | null;
  init: (container: HTMLDivElement, callbacks: FabricEventCallbacks) => void;
  destroy: () => void;
  addObject: (obj: CanvasObject) => void;
  updateObject: (id: string, changes: Partial<CanvasObject>) => void;
  removeObject: (id: string) => void;
  syncObjects: (objects: Record<string, CanvasObject>, order: string[]) => void;
  syncSelection: (id: string | null) => void;
  syncBackground: (bg: BackgroundState) => void;
  setDrawingMode: (enabled: boolean, settings?: { color: string; width: number; opacity: number; eraser?: boolean }) => void;
  addShapeAt: (type: string, x: number, y: number, settings?: any) => void;
  addTextAt: (x: number, y: number, settings?: any) => void;
  addImage: (src: string, x?: number, y?: number) => void;
  setZoom: (zoom: number) => void;
  getZoom: () => number;
  fitToScreen: () => void;
  resetView: () => void;
  export: (format: 'png' | 'jpeg' | 'svg') => string;
  getSelectedObjectId: () => string | null;
  render: () => void;
  getCanvasSize: () => { width: number; height: number };
  setCanvasSize: (width: number, height: number) => void;
  updateStrokePoints: (strokeId: string, points: Array<{ x: number; y: number; pressure?: number }>) => void;
  syncViewport: (zoom: number, panX?: number, panY?: number) => void;
}

const FABRIC_KEY_MAP: Record<string, string> = {
  x: 'left',
  y: 'top',
  rotation: 'angle',
  scaleX: 'scaleX',
  scaleY: 'scaleY',
  opacity: 'opacity',
  visible: 'visible',
  selectable: 'selectable',
  evented: 'evented',
  fill: 'fill',
  stroke: 'stroke',
  strokeWidth: 'strokeWidth',
  width: 'width',
  height: 'height',
  radius: 'radius',
  rx: 'rx',
  ry: 'ry',
  text: 'text',
  fontFamily: 'fontFamily',
  fontSize: 'fontSize',
  fontWeight: 'fontWeight',
  fontStyle: 'fontStyle',
  underline: 'underline',
  textAlign: 'textAlign',
  lineHeight: 'lineHeight',
  charAt: 'text',
  src: 'src',
  path: 'path',
  points: 'points',
  outerRadius: 'outerRadius',
  innerRadius: 'innerRadius',
  cropX: 'cropX',
  cropY: 'cropY',
};

function mapChanges(changes: Record<string, any>): Record<string, any> {
  const mapped: Record<string, any> = {};
  for (const [key, value] of Object.entries(changes)) {
    const fabricKey = FABRIC_KEY_MAP[key] || key;
    mapped[fabricKey] = value;
  }
  return mapped;
}

function createStarPath(cx: number, cy: number, outerRadius: number, innerRadius: number, points: number = 5): number[][] {
  const coords: number[][] = [];
  const total = points * 2;
  for (let i = 0; i < total; i++) {
    const angle = (i * Math.PI) / points;
    const r = i % 2 === 0 ? outerRadius : innerRadius;
    coords.push([cx + r * Math.cos(angle - Math.PI / 2), cy + r * Math.sin(angle - Math.PI / 2)]);
  }
  return coords;
}

function createHeartPath(size: number): number[][] {
  const s = size / 4;
  const coords: number[][] = [];
  for (let i = 0; i <= 10; i++) {
    const t = i / 10;
    const x = 5 * Math.sin(t * Math.PI) * (Math.cos(t * Math.PI) * Math.log(3) - 2 * Math.cos(2 * t * Math.PI));
    const y = -5 * Math.cos(t * Math.PI) * (Math.sin(t * Math.PI) * Math.log(3) - 2 * Math.sin(2 * t * Math.PI));
    coords.push([x * s + s * 2, -y * s + s * 2]);
  }
  return coords;
}

function createDiamondPath(size: number): number[][] {
  const half = size / 2;
  return [
    [0, -half],
    [half, 0],
    [0, half],
    [-half, 0],
  ];
}

export function createFabricEngine(): FabricEngineAPI {
  let canvas: fabric.Canvas | null = null;
  let drawingMode = false;
  let drawingSettings: { color: string; width: number; opacity: number; eraser?: boolean } | null = null;
  let brushSize: number = 5;
  let callbacksRef: FabricEventCallbacks | null = null;
  let suppressEvents = false;
  let currentStrokeId: string | null = null;
  let strokePoints: Array<{ x: number; y: number; pressure?: number }> = [];

  const fabricObjectCache: Record<string, fabric.Object> = {};

  function createFabricObject(obj: CanvasObject): fabric.Object | null {
    const baseProps: any = {
      left: obj.x,
      top: obj.y,
      originX: obj.originX || 'left',
      originY: obj.originY || 'top',
      angle: obj.rotation,
      scaleX: obj.scaleX ?? 1,
      scaleY: obj.scaleY ?? 1,
      opacity: obj.opacity ?? 1,
      visible: obj.visible ?? true,
      selectable: obj.selectable ?? true,
      evented: obj.evented ?? true,
      data: { objectId: obj.id },
      strokeLineCap: 'round',
      strokeLineJoin: 'round',
    };

    let fabricObj: fabric.Object | null = null;

    switch (obj.type) {
      case 'rect':
        fabricObj = new fabric.Rect({
          ...baseProps,
          width: (obj as any).width,
          height: (obj as any).height,
          fill: (obj as any).fill,
          stroke: (obj as any).stroke || 'transparent',
          strokeWidth: (obj as any).strokeWidth ?? 0,
          rx: (obj as any).rx ?? 0,
          ry: (obj as any).ry ?? 0,
        });
        break;

      case 'circle':
        fabricObj = new fabric.Circle({
          ...baseProps,
          radius: (obj as any).radius,
          fill: (obj as any).fill,
          stroke: (obj as any).stroke || 'transparent',
          strokeWidth: (obj as any).strokeWidth ?? 0,
        });
        break;

      case 'ellipse':
        fabricObj = new fabric.Ellipse({
          ...baseProps,
          rx: (obj as any).rx,
          ry: (obj as any).ry,
          fill: (obj as any).fill,
          stroke: (obj as any).stroke || 'transparent',
          strokeWidth: (obj as any).strokeWidth ?? 0,
        });
        break;

      case 'triangle':
        fabricObj = new fabric.Triangle({
          ...baseProps,
          width: (obj as any).width,
          height: (obj as any).height,
          fill: (obj as any).fill,
          stroke: (obj as any).stroke || 'transparent',
          strokeWidth: (obj as any).strokeWidth ?? 0,
        });
        break;

      case 'line': {
        const o = obj as any;
        const path = `M ${o.x1} ${o.y1} L ${o.x2} ${o.y2}`;
        fabricObj = new fabric.Line([o.x1, o.y1, o.x2, o.y2], {
          ...baseProps,
          stroke: o.stroke,
          strokeWidth: o.strokeWidth ?? 2,
        });
        break;
      }

      case 'arrow': {
        const o = obj as any;
        fabricObj = new fabric.Line([o.x1, o.y1, o.x2, o.y2], {
          ...baseProps,
          stroke: o.stroke,
          strokeWidth: o.strokeWidth ?? 2,
          fill: o.fill || o.stroke,
        });
        break;
      }

      case 'polygon': {
        const o = obj as any;
        fabricObj = new fabric.Polygon(o.points, {
          ...baseProps,
          fill: o.fill,
          stroke: o.stroke || 'transparent',
          strokeWidth: o.strokeWidth ?? 0,
        });
        break;
      }

      case 'star': {
        const o = obj as any;
        const pts = createStarPath(0, 0, o.outerRadius, o.innerRadius, o.points ?? 5);
        fabricObj = new fabric.Polygon(pts, {
          ...baseProps,
          fill: o.fill,
          stroke: o.stroke || 'transparent',
          strokeWidth: o.strokeWidth ?? 0,
        });
        break;
      }

      case 'heart': {
        const o = obj as any;
        const pts = createHeartPath(o.width ?? 100);
        fabricObj = new fabric.Polygon(pts, {
          ...baseProps,
          fill: o.fill,
          stroke: o.stroke || 'transparent',
          strokeWidth: o.strokeWidth ?? 0,
        });
        break;
      }

      case 'diamond': {
        const o = obj as any;
        const pts = createDiamondPath(o.width ?? 100);
        fabricObj = new fabric.Polygon(pts, {
          ...baseProps,
          fill: o.fill,
          stroke: o.stroke || 'transparent',
          strokeWidth: o.strokeWidth ?? 0,
        });
        break;
      }

      case 'rounded-rect': {
        const o = obj as any;
        fabricObj = new fabric.Rect({
          ...baseProps,
          width: o.width,
          height: o.height,
          fill: o.fill,
          stroke: o.stroke || 'transparent',
          strokeWidth: o.strokeWidth ?? 0,
          rx: o.rx ?? Math.min(o.width, o.height) * 0.1,
          ry: o.ry ?? Math.min(o.width, o.height) * 0.1,
        });
        break;
      }

      case 'path': {
        const o = obj as any;
        fabricObj = new fabric.Path(o.path, {
          ...baseProps,
          fill: o.fill || null,
          stroke: o.stroke,
          strokeWidth: o.strokeWidth ?? 2,
        });
        break;
      }

      case 'text':
      case 'i-text': {
        const o = obj as any;
        fabricObj = new fabric.IText(o.text || 'Text', {
          ...baseProps,
          fontFamily: o.fontFamily || 'Inter',
          fontSize: o.fontSize || 32,
          fontWeight: o.fontWeight || 'normal',
          fontStyle: o.fontStyle || 'normal',
          underline: o.underline || false,
          textAlign: o.textAlign || 'left',
          fill: o.fill || '#000000',
          lineHeight: o.lineHeight || 1.16,
        });
        break;
      }

      case 'image': {
        const o = obj as any;
        const imgEl = document.querySelector(`img[data-object-id="${o.id}"]`);
        if (imgEl) {
          fabricObj = new fabric.Image(imgEl as HTMLImageElement, {
            ...baseProps,
            width: o.width,
            height: o.height,
          });
        } else {
          loadFabricImage(o.id, o.src, baseProps);
        }
        break;
      }

      default:
        return null;
    }

    if (fabricObj) {
      fabricObj.set('data', { objectId: obj.id });
    }
    return fabricObj;
  }

  function loadFabricImage(objectId: string, src: string, baseProps: any) {
    fabric.util.loadImage(src, (img) => {
      if (!canvas) return;
      const image = new fabric.Image(img as any, {
        ...baseProps,
      });
      image.set('data', { objectId });
      fabricObjectCache[objectId] = image;
      canvas.add(image);
      canvas.renderAll();
    });
  }

  function serializeFabricObject(fObj: fabric.Object): Partial<CanvasObject> {
    const changes: any = {
      x: fObj.left ?? 0,
      y: fObj.top ?? 0,
      rotation: fObj.angle ?? 0,
      scaleX: fObj.scaleX ?? 1,
      scaleY: fObj.scaleY ?? 1,
      opacity: fObj.opacity ?? 1,
      visible: fObj.visible ?? true,
      selected: fObj.selectable ?? true,
    };

    if (fObj.type === 'rect' || fObj.type === 'rounded-rect') {
      changes.width = (fObj as fabric.Rect).width;
      changes.height = (fObj as fabric.Rect).height;
      changes.fill = (fObj as any).fill;
      changes.stroke = (fObj as any).stroke;
      changes.strokeWidth = (fObj as any).strokeWidth;
      changes.rx = (fObj as any).rx;
      changes.ry = (fObj as any).ry;
    } else if (fObj.type === 'circle') {
      changes.radius = (fObj as fabric.Circle).radius;
      changes.fill = (fObj as any).fill;
      changes.stroke = (fObj as any).stroke;
      changes.strokeWidth = (fObj as any).strokeWidth;
    } else if (fObj.type === 'i-text' || fObj.type === 'text') {
      changes.text = (fObj as fabric.IText).text;
      changes.fontFamily = (fObj as any).fontFamily;
      changes.fontSize = (fObj as any).fontSize;
      changes.fontWeight = (fObj as any).fontWeight;
      changes.fontStyle = (fObj as any).fontStyle;
      changes.underline = (fObj as any).underline;
      changes.textAlign = (fObj as any).textAlign;
      changes.fill = (fObj as any).fill;
      changes.lineHeight = (fObj as any).lineHeight;
    } else if (fObj.type === 'line' || fObj.type === 'arrow') {
      changes.stroke = (fObj as any).stroke;
      changes.strokeWidth = (fObj as any).strokeWidth;
    } else if (fObj.type === 'polygon' || fObj.type === 'star' || fObj.type === 'heart' || fObj.type === 'diamond') {
      changes.fill = (fObj as any).fill;
      changes.stroke = (fObj as any).stroke;
      changes.strokeWidth = (fObj as any).strokeWidth;
    } else if (fObj.type === 'path') {
      changes.path = (fObj as any).path;
      changes.fill = (fObj as any).fill;
      changes.stroke = (fObj as any).stroke;
      changes.strokeWidth = (fObj as any).strokeWidth;
    } else if (fObj.type === 'ellipse') {
      changes.rx = (fObj as fabric.Ellipse).rx;
      changes.ry = (fObj as fabric.Ellipse).ry;
      changes.fill = (fObj as any).fill;
      changes.stroke = (fObj as any).stroke;
      changes.strokeWidth = (fObj as any).strokeWidth;
    } else if (fObj.type === 'image') {
      changes.width = (fObj as any)._originalElement?.naturalWidth ?? 0;
      changes.height = (fObj as any)._originalElement?.naturalHeight ?? 0;
    }

    return changes;
  }

  const engine: FabricEngineAPI = {
    canvas: null,

    init(container: HTMLDivElement, cb: FabricEventCallbacks) {
      callbacksRef = cb;

      const existing = document.getElementById('twin-canvas-element');
      if (existing) existing.remove();

      const canvasEl = document.createElement('canvas');
      canvasEl.id = 'twin-canvas-element';
      container.appendChild(canvasEl);

      canvas = new fabric.Canvas(canvasEl, {
        preserveObjectStacking: true,
        selection: true,
        backgroundColor: '#ffffff',
        width: container.clientWidth,
        height: container.clientHeight,
      });

      canvas.on('object:modified', (e: any) => {
        if (suppressEvents || !callbacksRef) return;
        const target = e.target as fabric.Object;
        if (!target) return;
        const objectId = target.data?.objectId;
        if (!objectId) return;
        callbacksRef.onObjectModified(objectId, serializeFabricObject(target));
      });

      canvas.on('object:added', (e: any) => {
        if (suppressEvents || !callbacksRef) return;
        const target = e.target as fabric.Object;
        if (!target) return;
        const objectId = target.data?.objectId;
        if (objectId) {
          fabricObjectCache[objectId] = target;
        }
      });

      canvas.on('object:removed', (e: any) => {
        if (suppressEvents || !callbacksRef) return;
        const target = e.target as fabric.Object;
        if (!target) return;
        const objectId = target.data?.objectId;
        if (objectId && fabricObjectCache[objectId]) {
          delete fabricObjectCache[objectId];
        }
      });

      canvas.on('selection:created', (e: any) => {
        if (suppressEvents || !callbacksRef) return;
        const target = e.selected as fabric.Object;
        if (!target) return;
        const objectId = target.data?.objectId;
        callbacksRef.onObjectSelected(objectId || null);
      });

      canvas.on('selection:updated', (e: any) => {
        if (suppressEvents || !callbacksRef) return;
        const target = e.target as fabric.Object;
        if (!target) return;
        const objectId = target.data?.objectId;
        callbacksRef.onObjectSelected(objectId || null);
      });

      canvas.on('selection:canceled', () => {
        if (suppressEvents || !callbacksRef) return;
        callbacksRef.onObjectSelected(null);
      });

      canvas.on('mouse:down', (e: any) => {
        if (drawingMode && drawingSettings && currentStrokeId) {
          const pointer = canvas!.getPointer(e.e);
          strokePoints.push({ x: pointer.x, y: pointer.y, pressure: e.pressure });
        }
        if (!drawingMode && callbacksRef) {
          const pointer = canvas!.getPointer(e.e);
          callbacksRef.onCanvasClick(pointer.x, pointer.y);
        }
      });

      canvas.on('mouse:move', (e: any) => {
        if (drawingMode && drawingSettings && currentStrokeId && callbacksRef) {
          const pointer = canvas!.getPointer(e.e);
          strokePoints.push({ x: pointer.x, y: pointer.y, pressure: e.pressure });
          callbacksRef.onCursorMove(pointer.x, pointer.y);
        } else if (!drawingMode && callbacksRef) {
          const pointer = canvas!.getPointer(e.e);
          callbacksRef.onCursorMove(pointer.x, pointer.y);
        }
      });

      canvas.on('mouse:up', () => {
        if (drawingMode && drawingSettings && currentStrokeId && callbacksRef) {
          const strokeId = currentStrokeId;
          currentStrokeId = null;
          callbacksRef.onPathCreated({
            id: strokeId,
            type: 'path',
            x: 0,
            y: 0,
            rotation: 0,
            scaleX: 1,
            scaleY: 1,
            originX: 'left',
            originY: 'top',
            opacity: drawingSettings.opacity,
            visible: true,
            selectable: true,
            evented: true,
            zIndex: 0,
            locked: false,
            createdAt: Date.now(),
            updatedAt: Date.now(),
            path: convertPointsToPath(strokePoints, drawingSettings.width, drawingSettings.eraser),
            fill: drawingSettings.eraser ? '#ffffff' : null,
            stroke: drawingSettings.color,
            strokeWidth: drawingSettings.width,
          } as any);
          strokePoints = [];
        }
      });
    },

    destroy() {
      if (canvas) {
        canvas.dispose();
        canvas = null;
      }
      Object.keys(fabricObjectCache).forEach((k) => delete fabricObjectCache[k]);
      callbacksRef = null;
    },

    addObject(obj) {
      if (!canvas) return;
      const fObj = createFabricObject(obj);
      if (!fObj) return;
      fabricObjectCache[obj.id] = fObj;
      canvas.add(fObj);
      canvas.renderAll();
    },

    updateObject(id, changes) {
      if (!canvas) return;
      const fObj = fabricObjectCache[id];
      if (!fObj) return;
      suppressEvents = true;
      const mapped = mapChanges(changes);
      fObj.set(mapped);
      canvas.renderAll();
      suppressEvents = false;
    },

    removeObject(id) {
      if (!canvas) return;
      const fObj = fabricObjectCache[id];
      if (!fObj) return;
      suppressEvents = true;
      canvas.remove(fObj);
      delete fabricObjectCache[id];
      canvas.renderAll();
      suppressEvents = false;
    },

    syncObjects(objects, order) {
      if (!canvas) return;
      suppressEvents = true;
      const existingIds = Object.keys(fabricObjectCache);

      for (const oldId of existingIds) {
        if (!(oldId in objects)) {
          const fObj = fabricObjectCache[oldId];
          canvas.remove(fObj);
          delete fabricObjectCache[oldId];
        }
      }

      const existingFabricIds = new Set(existingIds);
      for (const objectId of order) {
        const obj = objects[objectId];
        if (!obj) continue;
        if (existingFabricIds.has(objectId)) {
          const fObj = fabricObjectCache[objectId];
          if (fObj.type !== 'image') {
            const mapped = mapChanges(obj);
            delete (mapped as any).data;
            fObj.set(mapped);
          }
        } else {
          const fObj = createFabricObject(obj);
          if (fObj) {
            fabricObjectCache[objectId] = fObj;
            canvas.add(fObj);
          }
        }
      }

      canvas.renderAll();
      suppressEvents = false;
    },

    syncSelection(id) {
      if (!canvas) return;
      if (id) {
        const fObj = fabricObjectCache[id];
        if (fObj) {
          canvas.setActiveObject(fObj);
        }
      } else {
        canvas.discardActiveObject();
      }
      canvas.renderAll();
    },

    syncBackground(bg) {
      if (!canvas) return;
      suppressEvents = true;
      let color = '#ffffff';
      if (bg.type === 'solid') color = bg.color || '#ffffff';
      canvas.setBackgroundColor(color, canvas.renderAll.bind(canvas));
      suppressEvents = false;
    },

    setDrawingMode(enabled, settings) {
      if (!canvas) return;
      drawingMode = enabled;
      canvas.isDrawingMode = enabled;
      drawingSettings = settings || null;

      if (enabled && settings) {
        const brush = new fabric.PencilBrush(canvas, {
          color: settings.eraser ? '#ffffff' : settings.color,
          width: settings.width,
          opacity: settings.opacity,
        });
        canvas.freeDrawingBrush = brush;
        brushSize = settings.width;
      }

      currentStrokeId = null;
      strokePoints = [];
    },

    addShapeAt(type, x, y, settings) {
      if (!canvas) return;
      const id = generateObjectId();
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

      let obj: CanvasObject | null = null;
      const s = settings || {};

      switch (type) {
        case 'rect':
          obj = { ...base, type: 'rect', width: 200, height: 150, fill: s.fill || '#3b82f6', stroke: s.stroke || '#1e40af', strokeWidth: s.strokeWidth ?? 0, rx: 0, ry: 0 } as RectObject;
          break;
        case 'rounded-rect':
          obj = { ...base, type: 'rect' as const, width: 200, height: 150, fill: s.fill || '#3b82f6', stroke: s.stroke || '#1e40af', strokeWidth: s.strokeWidth ?? 0, rx: 12, ry: 12 } as RectObject;
          break;
        case 'circle':
          obj = { ...base, type: 'circle' as const, radius: 100, fill: s.fill || '#3b82f6', stroke: s.stroke || '#1e40af', strokeWidth: s.strokeWidth ?? 0 } as CircleObject;
          break;
        case 'ellipse':
          obj = { ...base, type: 'ellipse' as const, rx: 120, ry: 80, fill: s.fill || '#3b82f6', stroke: s.stroke || '#1e40af', strokeWidth: s.strokeWidth ?? 0 } as EllipseObject;
          break;
        case 'triangle':
          obj = { ...base, type: 'triangle' as const, width: 200, height: 200, fill: s.fill || '#3b82f6', stroke: s.stroke || '#1e40af', strokeWidth: s.strokeWidth ?? 0 } as TriangleObject;
          break;
        case 'line':
          obj = { ...base, type: 'line' as const, width: 200, height: 2, x1: 0, y1: 0, x2: 0, y2: 200, stroke: s.stroke || '#000000', strokeWidth: s.strokeWidth ?? 2 } as LineObject;
          break;
        case 'arrow':
          obj = { ...base, type: 'arrow' as const, width: 200, height: 2, x1: 0, y1: 0, x2: 200, y2: 0, stroke: s.stroke || '#000000', strokeWidth: s.strokeWidth ?? 2, fill: s.stroke || '#000000', headLength: 20, headWidth: 20 } as ArrowObject;
          break;
        case 'star':
          obj = { ...base, type: 'star' as const, outerRadius: 80, innerRadius: 40, points: 5, fill: s.fill || '#f59e0b', stroke: s.stroke || '#d97706', strokeWidth: s.strokeWidth ?? 0 } as StarObject;
          break;
        case 'polygon':
          obj = { ...base, type: 'polygon' as const, points: [{ x: 0, y: 0 }, { x: 100, y: 0 }, { x: 150, y: 100 }, { x: 50, y: 150 }, { x: -50, y: 100 }], fill: s.fill || '#3b82f6', stroke: s.stroke || '#1e40af', strokeWidth: s.strokeWidth ?? 0 } as PolygonObject;
          break;
        case 'heart':
          obj = { ...base, type: 'heart' as const, width: 100, height: 100, fill: s.fill || '#ef4444', stroke: s.stroke || '#b91c1c', strokeWidth: s.strokeWidth ?? 0 } as DiamondObject;
          break;
        case 'diamond':
          obj = { ...base, type: 'diamond' as const, width: 120, height: 120, fill: s.fill || '#3b82f6', stroke: s.stroke || '#1e40af', strokeWidth: s.strokeWidth ?? 0 } as DiamondObject;
          break;
      }

      if (obj) {
        fabricObjectCache[id] = (createFabricObject(obj) as fabric.Object);
        canvas.add(fabricObjectCache[id]);
        canvas.setActiveObject(fabricObjectCache[id]);
        canvas.renderAll();
      }
    },

    addTextAt(x, y, settings) {
      if (!canvas) return;
      const id = generateObjectId();
      const s = settings || {};
      const obj: any = {
        id,
        type: 'i-text',
        text: s.text || 'Double click to edit',
        x,
        y,
        rotation: 0,
        scaleX: 1,
        scaleY: 1,
        originX: 'left',
        originY: 'top',
        opacity: 1,
        visible: true,
        selectable: true,
        evented: true,
        zIndex: 0,
        locked: false,
        fontFamily: s.fontFamily || 'Inter',
        fontSize: s.fontSize || 32,
        fontWeight: s.fontWeight || 'normal',
        fontStyle: s.fontStyle || 'normal',
        underline: s.underline || false,
        textAlign: s.textAlign || 'left',
        fill: s.fill || '#000000',
        lineHeight: s.lineHeight || 1.16,
        width: 0,
        height: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
      };
      const fObj = new fabric.IText(obj.text, {
        left: obj.x,
        top: obj.y,
        fontFamily: obj.fontFamily,
        fontSize: obj.fontSize,
        fontWeight: obj.fontWeight,
        fontStyle: obj.fontStyle,
        underline: obj.underline,
        textAlign: obj.textAlign,
        fill: obj.fill,
        lineHeight: obj.lineHeight,
        originX: 'left',
        originY: 'top',
        opacity: obj.opacity,
        data: { objectId: id },
      });
      fabricObjectCache[id] = fObj;
      canvas.add(fObj);
      canvas.setActiveObject(fObj);
      fObj.enterEditing();
      canvas.renderAll();
    },

    addImage(src, x, y) {
      if (!canvas) return;
      const id = generateObjectId();
      fabric.util.loadImage(src, (img) => {
        const image = new fabric.Image(img as any, {
          left: x ?? 100,
          top: y ?? 100,
          originX: 'left',
          originY: 'top',
          data: { objectId: id },
        });
        image.scaleToWidth(300);
        fabricObjectCache[id] = image;
        canvas.add(image);
        canvas.setActiveObject(image);
        canvas.renderAll();
      });
    },

    setZoom(zoom) {
      if (!canvas) return;
      canvas.setZoom(zoom);
      canvas.renderAll();
    },

    getZoom() {
      return canvas ? canvas.getZoom() : 1;
    },

    fitToScreen() {
      if (!canvas) return;
      const { width, height } = canvas.getCanvasRetinaRenderingOnLowerZoom
        ? { width: canvas.getWidth(), height: canvas.getHeight() }
        : { width: canvas.getWidth(), height: canvas.getHeight() };
      const objs = canvas.getObjects();
      if (objs.length === 0) {
        canvas.setZoom(1);
        canvas.viewportCenteredObjectEnabled = true;
        canvas.renderAll();
        return;
      }
      const bbox = canvas.getObjects().reduce((acc, obj) => {
        const o = obj.getBBox();
        return {
          left: Math.min(acc.left, o.left),
          top: Math.min(acc.top, o.top),
          right: Math.max(acc.right, o.left + o.width),
          bottom: Math.max(acc.bottom, o.top + o.height),
        };
      }, { left: Infinity, top: Infinity, right: -Infinity, bottom: -Infinity });
      const contentWidth = bbox.right - bbox.left;
      const contentHeight = bbox.bottom - bbox.top;
      const scaleX = width / contentWidth;
      const scaleY = height / contentHeight;
      const scale = Math.min(scaleX, scaleY, 1) * 0.9;
      canvas.setZoom(scale);
      canvas.renderAll();
    },

    resetView() {
      if (!canvas) return;
      canvas.setZoom(1);
      canvas.renderAll();
    },

    export(format) {
      if (!canvas) throw new Error('Canvas not initialized');
      switch (format) {
        case 'png':
          return canvas.toDataURL({ format: 'png', quality: 1 });
        case 'jpeg':
          return canvas.toDataURL({ format: 'jpeg', quality: 0.95 });
        case 'svg':
          return canvas.toSVG();
        default:
          throw new Error('Unsupported format');
      }
    },

    getSelectedObjectId() {
      if (!canvas) return null;
      const active = canvas.getActiveObject();
      if (!active) return null;
      return active.data?.objectId || null;
    },

    render() {
      if (canvas) canvas.renderAll();
    },

    getCanvasSize() {
      if (!canvas) return { width: 0, height: 0 };
      return { width: canvas.getWidth(), height: canvas.getHeight() };
    },

    setCanvasSize(width, height) {
      if (!canvas) return;
      canvas.setDimensions({ width, height });
      canvas.renderAll();
    },

    updateStrokePoints(strokeId, points) {
      if (!canvas) return;
      const target = canvas.getObjects().find((o) => o.data?.strokeId === strokeId);
      if (target && target.type === 'path' && typeof (target as any).path === 'object') {
        const pathData = convertPointsToPath(points, drawingSettings?.width || brushSize, drawingSettings?.eraser || false);
        if (pathData.length > 0) {
          (target as any).path = pathData;
          canvas.renderAll();
        }
      }
    },

    syncViewport(zoom, panX, panY) {
      if (!canvas) return;
      canvas.setZoom(zoom);
      if (panX !== undefined && panY !== undefined) {
        const vpt = canvas.viewportTransform;
        if (vpt) {
          vpt[4] = panX;
          vpt[5] = panY;
          canvas.setViewportTransform(vpt);
        }
      }
      canvas.renderAll();
    },
  };

  function convertPointsToPath(
    points: Array<{ x: number; y: number; pressure?: number }>,
    width: number,
    isEraser: boolean = false
  ): Array<[string, ...number[]]> {
    if (points.length < 2) return [];
    const path: Array<[string, ...number[]]> = [];
    const start = points[0];
    path.push(['M', start.x, start.y]);
    for (let i = 1; i < points.length; i++) {
      const p = points[i];
      if (i < points.length - 1) {
        const next = points[i + 1];
        const cpX = p.x + (next.x - p.x) * 0.2;
        const cpY = p.y + (next.y - p.y) * 0.2;
        path.push(['Q', p.x, p.y, cpX, cpY]);
      } else {
        path.push(['L', p.x, p.y]);
      }
    }
    return path;
  }
}
