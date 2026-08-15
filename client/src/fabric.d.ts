// Fabric.js v5 type declarations
// Minimal but complete type coverage for the API surface we use

export interface Point {
  x: number;
  y: number;
}

export interface ObjectData {
  [key: string]: any;
  objectId?: string;
}

export interface Transformable {
  left: number;
  top: number;
  scaleX: number;
  scaleY: number;
  angle: number;
  opacity: number;
  visible: boolean;
  selectable: boolean;
  evented: boolean;
  originX: string;
  originY: string;
  flipX: boolean;
  flipY: boolean;
  stroke?: string | null;
  strokeWidth?: number;
  fill?: string | null;
  rx?: number;
  ry?: number;
  data: ObjectData;
  id?: string;

  set(prop: string, value: any): this;
  set(props: Record<string, any>): this;
  get(prop: string): any;
  getBBox(): { left: number; top: number; width: number; height: number; right: number; bottom: number };
  setCoords(): void;
  render(): void;
  getBoundingRect(): { left: number; top: number; width: number; height: number };
}

export interface FabricRect extends Transformable {
  type: 'rect';
  width: number;
  height: number;
  rx: number;
  ry: number;
}

export interface FabricCircle extends Transformable {
  type: 'circle';
  radius: number;
}

export interface FabricEllipse extends Transformable {
  type: 'ellipse';
  rx: number;
  ry: number;
}

export interface FabricTriangle extends Transformable {
  type: 'triangle';
  width: number;
  height: number;
}

export interface FabricLine extends Transformable {
  type: 'line';
}

export interface FabricPolygon extends Transformable {
  type: 'polygon';
  points: Point[];
}

export interface FabricPath extends Transformable {
  type: 'path';
  path: any[];
  _units: string[];
}

export interface FabricIText extends Transformable {
  type: 'i-text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: string;
  fontStyle: string;
  textAlign: string;
  underline: boolean;
  lineHeight: number;
  isEditing: boolean;
  enterEditing(): void;
  exitEditing(): void;
}

export interface FabricImage extends Transformable {
  type: 'image';
  _originalElement: HTMLImageElement;
  scaleToWidth(w: number): void;
  scaleToHeight(h: number): void;
}

export type FabricObject =
  | FabricRect
  | FabricCircle
  | FabricEllipse
  | FabricTriangle
  | FabricLine
  | FabricPolygon
  | FabricPath
  | FabricIText
  | FabricImage
  | Transformable;

export interface PencilBrush {
  color: string;
  width: number;
  opacity: number;
}

export interface ICanvasOptions {
  width?: number;
  height?: number;
  backgroundColor?: string;
  preserveObjectStacking?: boolean;
  selection?: boolean;
  isDrawingMode?: boolean;
  [key: string]: any;
}

export interface ICanvasEvent {
  target: FabricObject | null;
  selected: FabricObject[] | FabricObject | null;
  e: any;
  path: FabricPath;
  pressure?: number;
  [key: string]: any;
}

export interface ICanvas extends Transformable {
  getWidth(): number;
  getHeight(): number;
  setDimensions(dim: { width: number; height: number }): void;
  getCenter(): Point;
  setZoom(z: number): void;
  getZoom(): number;
  renderAll(): void;
  requestRenderAll(): void;
  add(obj: FabricObject): void;
  remove(obj: FabricObject): void;
  getObjects(): FabricObject[];
  getObjects(type: string): FabricObject[];
  setActiveObject(obj: FabricObject): void;
  discardActiveObject(): void;
  getActiveObject(): FabricObject | null;
  getActiveObjects(): FabricObject[];
  setBackgroundColor(color: string, cb: () => void): void;
  toDataURL(opts?: any): string;
  toSVG(): string;
  getPointer(evt: any, options?: any): Point;
  viewport: any;
  isDrawingMode: boolean;
  freeDrawingBrush: PencilBrush | null;
  backgroundColor: string;
  on(event: string, handler: (e: ICanvasEvent) => void): void;
  off(event: string, handler?: (e: ICanvasEvent) => void): void;
  dispose(): void;
}

export interface Util {
  loadImage(src: string, cb: (img: HTMLImageElement | null, error?: any) => void): void;
  loadSVGFromURL(url: string, cb: (err: any, svg: any) => void): void;
}

export interface FabricStatic {
  Canvas: new (el: HTMLCanvasElement, options?: ICanvasOptions) => ICanvas;
  Rect: new (options?: any) => FabricRect;
  Circle: new (options?: any) => FabricCircle;
  Ellipse: new (options?: any) => FabricEllipse;
  Triangle: new (options?: any) => FabricTriangle;
  Line: new (points: number[], options?: any) => FabricLine;
  Polygon: new (points: any, options?: any) => FabricPolygon;
  Path: new (path: any, options?: any) => FabricPath;
  IText: new (text: string, options?: any) => FabricIText;
  Image: new (el: HTMLImageElement, options?: any) => FabricImage;
  PencilBrush: new (canvas: ICanvas, options?: any) => PencilBrush;
  Star: new (options?: any) => FabricObject;
  util: Util;
}

declare module 'fabric' {
  const fabric: FabricStatic;
  export = fabric;
}
