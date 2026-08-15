export function generateObjectId(): string {
  return 'obj_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function generateUserId(): string {
  return 'user_' + Math.random().toString(36).slice(2, 10) + Math.random().toString(36).slice(2, 10);
}

export function generateStrokeId(): string {
  return 'stroke_' + Math.random().toString(36).slice(2, 10);
}

export function generateRoomId(): string {
  const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
  let id = '';
  for (let i = 0; i < 6; i++) {
    id += chars[Math.floor(Math.random() * chars.length)];
  }
  return id;
}
