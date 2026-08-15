import type { CanvasState } from '@shared/types.js';

const kv = await Deno.openKv();

export async function saveCanvas(
  roomId: string,
  canvas: CanvasState,
  ownerId: string,
  name: string = 'Untitled'
): Promise<void> {
  await kv.set(['canvas', roomId], {
    ownerId,
    name,
    snapshot: canvas,
  });
}

export async function loadCanvas(roomId: string): Promise<CanvasState | null> {
  const record = await kv.get<{ ownerId: string; name: string; snapshot: CanvasState }>(['canvas', roomId]);
  return record.value?.snapshot ?? null;
}

export async function deleteCanvas(roomId: string): Promise<void> {
  await kv.delete(['canvas', roomId]);
}
