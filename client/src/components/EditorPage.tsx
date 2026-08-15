import { useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useUIStore } from '@/store/uiStore';
import { useUserStore } from '@/store/userStore';
import { useCanvasStore } from '@/store/canvasStore';
import { useFabricEngine } from '@/hooks/useFabricEngine';
import { useSocket } from '@/hooks/useSocket';
import { TopToolbar } from '@/components/TopToolbar';
import { LeftSidebar } from '@/components/LeftSidebar';
import { RightSidebar } from '@/components/RightSidebar';
import { LayersPanel } from '@/components/LayersPanel';
import { PresenceBar } from '@/components/PresenceBar';
import { Statusbar } from '@/components/Statusbar';
import { JoinDialog } from '@/components/JoinDialog';
import { EmptyState } from '@/components/EmptyState';
import { RemoteCursors } from '@/components/RemoteCursors';
import { DevPanel } from '@/components/DevPanel';

export function EditorPage() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { darkMode } = useUIStore();
  const { objectOrder } = useCanvasStore();
  const { containerRef } = useFabricEngine();
  useSocket(roomId);

  useEffect(() => {
    if (!roomId) {
      navigate('/');
    }
  }, [roomId, navigate]);

  if (!roomId) return null;

  return (
    <div className="flex h-screen flex-col">
      <TopToolbar />
      <div className="flex flex-1 overflow-hidden bg-muted/20">
        <LeftSidebar />
        <div className="flex-1 relative overflow-hidden" ref={containerRef}>
          <RemoteCursors />
          {objectOrder.length === 0 && <EmptyState />}
        </div>
        <div className="flex w-64 flex-col border-l">
          <RightSidebar />
          <LayersPanel />
        </div>
      </div>
      <Statusbar />
      <PresenceBar />
      <JoinDialog />
      <DevPanel />
    </div>
  );
}
