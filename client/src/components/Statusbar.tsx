import { useUIStore } from '@/store/uiStore';

export function Statusbar() {
  const { connectionStatus, saveStatus } = useUIStore();

  const statusColor = {
    connected: 'text-green-500',
    connecting: 'text-amber-500',
    disconnected: 'text-red-500',
    reconnecting: 'text-amber-500',
  };

  return (
    <div className="flex h-6 items-center justify-between border-t px-3 text-xs text-muted-foreground">
      <div className="flex items-center gap-2">
        <span>Zoom 100%</span>
        <span>•</span>
        <span className={statusColor[connectionStatus]}>
          {connectionStatus === 'connected' ? 'Connected' : connectionStatus}
        </span>
        <span>•</span>
        <span>
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Saved' : 'Unsaved'}
        </span>
      </div>
      <div className="flex items-center gap-2">
        <span>Canvas 1600 × 900</span>
      </div>
    </div>
  );
}
