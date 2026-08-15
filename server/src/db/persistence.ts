import { PrismaClient } from '@prisma/client';
import type { CanvasState, BackgroundState, CanvasObject } from '@shared/types.js';

const prisma = new PrismaClient();

export async function saveCanvas(
  roomId: string,
  canvas: CanvasState,
  ownerId: string,
  name: string = 'Untitled'
): Promise<void> {
  const backgroundJson = JSON.stringify(canvas.background || { type: 'solid', color: '#ffffff' });

  const record = await prisma.canvas.upsert({
    where: { roomId },
    create: {
      roomId,
      name,
      ownerId,
      width: canvas.width,
      height: canvas.height,
      background: backgroundJson,
      version: canvas.version || 1,
    },
    update: {
      width: canvas.width,
      height: canvas.height,
      background: backgroundJson,
      version: canvas.version || 1,
      updatedAt: new Date(),
    },
  });

  const objectIds = Object.keys(canvas.objects || {});
  const order = canvas.objectOrder || objectIds;

  await prisma.canvasObject.deleteMany({ where: { canvasId: record.id } });

  if (objectIds.length > 0) {
    await prisma.canvasObject.createMany({
      data: objectIds.map((objectId) => {
        const obj = canvas.objects[objectId];
        return {
          canvasId: record.id,
          objectId,
          type: obj.type,
          data: JSON.stringify(obj),
          zIndex: order.indexOf(objectId),
        };
      }),
    });
  }
}

export async function loadCanvas(roomId: string): Promise<CanvasState | null> {
  const record = await prisma.canvas.findUnique({
    where: { roomId },
    include: { objects: true },
  });
  if (!record) return null;

  const background = parseJson<BackgroundState>(record.background, { type: 'solid', color: '#ffffff' });

  const objects: Record<string, CanvasObject> = {};
  const objectOrder: string[] = [];

  for (const obj of record.objects.sort((a, b) => a.zIndex - b.zIndex)) {
    try {
      const parsed = JSON.parse(obj.data) as CanvasObject;
      if (parsed && parsed.id) {
        objects[obj.objectId] = parsed;
        objectOrder.push(obj.objectId);
      }
    } catch {
      continue;
    }
  }

  return {
    version: record.version,
    width: record.width,
    height: record.height,
    background,
    objects,
    objectOrder,
    createdAt: record.createdAt.getTime(),
    updatedAt: record.updatedAt.getTime(),
  };
}

export async function deleteCanvas(roomId: string): Promise<void> {
  await prisma.canvas.deleteMany({ where: { roomId } });
}

function parseJson<T>(value: string, fallback: T): T {
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}
