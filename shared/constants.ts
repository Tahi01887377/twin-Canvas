export const CANVAS_DEFAULT_WIDTH = 1600;
export const CANVAS_DEFAULT_HEIGHT = 900;
export const CANVAS_MIN_ZOOM = 0.1;
export const CANVAS_MAX_ZOOM = 8;
export const CANVAS_ZOOM_STEP = 1.2;

export const MAX_USERS_PER_ROOM = 2;

export const OBJECT_LOCK_TIMEOUT_MS = 10000;

export const CURSOR_THROTTLE_MS = 50;

export const MAX_UPLOAD_SIZE_MB = 10;
export const MAX_UPLOAD_SIZE_BYTES = MAX_UPLOAD_SIZE_MB * 1024 * 1024;

export const AUTO_SAVE_DEBOUNCE_MS = 1000;
export const RECONNECT_TIMEOUT_MS = 30000;
export const SERVER_VERSION = '0.1.0';

export const ALLOWED_IMAGE_MIME_TYPES = [
  'image/png',
  'image/jpeg',
  'image/jpg',
  'image/webp',
  'image/svg+xml',
] as const;

export const COLLABORATION_COLORS = [
  '#3b82f6',
  '#a855f7',
  '#ec4899',
  '#f59e0b',
  '#10b981',
  '#6366f1',
] as const;

export const BRUSH_SIZES = [2, 5, 10, 20, 40] as const;
export const BRUSH_SMOOTHNESS_VALUES = [0, 0.5, 1, 2, 3] as const;

export const FONT_FAMILIES = [
  'Inter',
  'Roboto',
  'Arial',
  'Georgia',
  'Times New Roman',
  'Courier New',
  'Helvetica',
  'Verdana',
  'Playfair Display',
  'Poppins',
] as const;

export const EXPORT_FORMATS = ['png', 'jpeg', 'svg', 'pdf'] as const;
export const EXPORT_DPIS = [1, 2, 3] as const;

export const TEMPLATE_SIZES = [
  { name: 'Instagram Post', width: 1080, height: 1080 },
  { name: 'Instagram Story', width: 1080, height: 1920 },
  { name: 'YouTube Thumbnail', width: 1280, height: 720 },
  { name: 'YouTube Banner', width: 2560, height: 1440 },
  { name: 'Facebook Post', width: 1200, height: 630 },
  { name: 'Facebook Cover', width: 820, height: 312 },
  { name: 'Presentation', width: 1920, height: 1080 },
  { name: 'Poster', width: 1800, height: 2400 },
  { name: 'A4 Document', width: 1748, height: 2480 },
  { name: 'Custom Size', width: 0, height: 0 },
] as const;

export type TemplateSize = (typeof TEMPLATE_SIZES)[number];

export const CANVAS_TOOL_NAMES = [
  'select',
  'pen',
  'eraser',
  'rect',
  'circle',
  'triangle',
  'line',
  'arrow',
  'star',
  'polygon',
  'heart',
  'diamond',
  'rounded-rect',
  'ellipse',
  'text',
  'image',
] as const;

export type ToolName = (typeof CANVAS_TOOL_NAMES)[number];
