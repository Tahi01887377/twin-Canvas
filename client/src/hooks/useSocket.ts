import { useEffect, useRef } from 'react';
import { useSocketStore } from '@/store/socketStore';
import { useUserStore } from '@/store/userStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function useSocket(roomId?: string) {
  useEffect(() => {
    const socketStore = useSocketStore.getState();
    if (socketStore.socket) return;

    socketStore.connect(SERVER_URL);

    return () => {
      const s = useSocketStore.getState();
      if (s.socket) {
        s.socket.disconnect();
      }
    };
  }, []);

  const connected = useSocketStore((s) => s.connected);
  const currentUser = useUserStore((s) => s.currentUser);

  useEffect(() => {
    if (!roomId || !connected || !currentUser) return;
    useSocketStore.getState().joinRoom(roomId, {
      id: currentUser.id,
      name: currentUser.name,
      color: currentUser.color,
      isOwner: currentUser.isOwner,
    });
  }, [roomId, connected, currentUser]);
}

export function useCursorTracking() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const onMove = (e: MouseEvent) => {
      const rect = el.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      useSocketStore.getState().emitCursorMove({ x, y });
    };

    el.addEventListener('mousemove', onMove);
    return () => el.removeEventListener('mousemove', onMove);
  }, []);

  return containerRef;
}