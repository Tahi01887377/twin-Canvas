import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { useCanvasStore } from '@/store/canvasStore';

export function DevPanel() {
  const { showDevPanel } = useUIStore();
  const { users, connectionStatus, locks } = useUserStore();
  const { version } = useCanvasStore();

  if (!showDevPanel) return null;

  return (
    <div className="fixed bottom-2 right-2 z-40 rounded-md border border-border bg-card/95 p-2 shadow-lg text-xs">
      <div className="grid gap-0.5">
        <div><span className="text-muted-foreground">WebSocket:</span> {connectionStatus}</div>
        <div><span className="text-muted-foreground">Users:</span> {users.length}/2</div>
        <div><span className="text-muted-foreground">Canvas Version:</span> {version}</div>
        <div><span className="text-muted-foreground">Locks:</span> {Object.keys(locks).length}</div>
        <div><span className="text-muted-foreground">Latency:</span> —</div>
      </div>
    </div>
  );
}
