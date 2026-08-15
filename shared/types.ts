export type FabricObjectType =
  | 'rect'
  | 'circle'
  | 'triangle'
  | 'ellipse'
  | 'line'
  | 'arrow'
  | 'polygon'
  | 'star'
  | 'heart'
  | 'diamond'
  | 'path'
  | 'text'
  | 'i-text'
  | 'image';

export interface BaseObjectProps {
  id: string;
  type: FabricObjectType;
  x: number;
  y: number;
  rotation: number;
  scaleX: number;
  scaleY: number;
  originX: 'left' | 'center';
  originY: 'top' | 'center';
  opacity: number;
  visible: boolean;
  selectable: boolean;
  evented: boolean;
  zIndex: number;
  locked: boolean;
  lockedBy?: string | null;
  createdAt: number;
  updatedAt: number;
}

export interface RectObject extends BaseObjectProps {
  type: 'rect';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  rx: number;
  ry: number;
}

export interface CircleObject extends BaseObjectProps {
  type: 'circle';
  radius: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface TriangleObject extends BaseObjectProps {
  type: 'triangle';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface EllipseObject extends BaseObjectProps {
  type: 'ellipse';
  rx: number;
  ry: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface LineObject extends BaseObjectProps {
  type: 'line';
  width: number;
  height: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
}

export interface ArrowObject extends BaseObjectProps {
  type: 'arrow';
  width: number;
  height: number;
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  stroke: string;
  strokeWidth: number;
  fill: string;
  headLength: number;
  headWidth: number;
}

export interface PolygonObject extends BaseObjectProps {
  type: 'polygon';
  points: Array<{ x: number; y: number }>;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface StarObject extends BaseObjectProps {
  type: 'star';
  outerRadius: number;
  innerRadius: number;
  points: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface HeartObject extends BaseObjectProps {
  type: 'heart';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface DiamondObject extends BaseObjectProps {
  type: 'diamond';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
}

export interface PathObject extends BaseObjectProps {
  type: 'path';
  path: Array<[string, ...number[]]>;
  fill: string | null;
  stroke: string;
  strokeWidth: number;
}

export interface TextObject extends BaseObjectProps {
  type: 'text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  fill: string;
  lineHeight: number;
  charCount: number;
}

export interface ITextObject extends BaseObjectProps {
  type: 'i-text';
  text: string;
  fontFamily: string;
  fontSize: number;
  fontWeight: 'normal' | 'bold';
  fontStyle: 'normal' | 'italic';
  underline: boolean;
  textAlign: 'left' | 'center' | 'right' | 'justify';
  fill: string;
  lineHeight: number;
}

export interface ImageObject extends BaseObjectProps {
  type: 'image';
  width: number;
  height: number;
  fill: string;
  stroke: string;
  strokeWidth: number;
  src: string;
  cropX: number;
  cropY: number;
  filters: unknown[];
}

export type CanvasObject =
  | RectObject
  | CircleObject
  | TriangleObject
  | EllipseObject
  | LineObject
  | ArrowObject
  | PolygonObject
  | StarObject
  | HeartObject
  | DiamondObject
  | PathObject
  | TextObject
  | ITextObject
  | ImageObject;

export interface CanvasState {
  version: number;
  width: number;
  height: number;
  background: BackgroundState;
  objects: Record<string, CanvasObject>;
  objectOrder: string[];
  updatedAt: number;
  createdAt?: number;
}

export interface BackgroundState {
  type: 'solid' | 'gradient' | 'transparent' | 'image';
  color: string;
  gradient?: GradientConfig;
  image?: string;
}

export interface GradientConfig {
  type: 'linear' | 'radial';
  coords: { x1: number; y1: number; x2: number; y2: number };
  colorStops: Array<{ offset: number; color: string; opacity?: number }>;
}

export interface User {
  id: string;
  name: string;
  color: string;
  avatar?: string;
  joinedAt: number;
  isOwner: boolean;
}

export interface RoomInfo {
  roomId: string;
  canvas: CanvasState;
  users: User[];
  locks: Record<string, LockInfo>;
  version: number;
}

export interface LockInfo {
  objectId: string;
  userId: string;
  timestamp: number;
  expiresAt: number;
}

export interface CursorPosition {
  x: number;
  y: number;
  tool: string;
  pressure?: number;
}

export interface RemoteCursor {
  userId: string;
  position: CursorPosition;
  timestamp: number;
  lastSeen: number;
}

export interface RemoteSelection {
  userId: string;
  objectId: string | null;
  boundingBox: { x: number; y: number; width: number; height: number } | null;
  timestamp: number;
}

export interface PartialObjectUpdate {
  id: string;
  changes: Partial<CanvasObject>;
}

export type CollaboratorColor = '#3b82f6' | '#a855f7' | '#ec4899' | '#f59e0b' | '#10b981' | '#6366f1';
