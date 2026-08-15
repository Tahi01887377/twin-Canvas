import { Undo2, Redo2, ZoomIn, ZoomOut, Maximize2, Copy, FileDown, Save, Share2 } from 'lucide-react';
import { useParams } from 'react-router-dom';
import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { useEngineStore } from '@/store/engineStore';
import { useSocketStore } from '@/store/socketStore';
import { downloadDataUrl } from '@/utils/export';

export function TopToolbar() {
  const { roomId } = useParams<{ roomId: string }>();
  const { undo, redo, canUndo, canRedo } = useCanvasStore();
  const { setSaveStatus, saveStatus } = useUIStore();
  const { engine } = useEngineStore();

  const handleExport = () => {
    if (!engine?.canvas) return;
    const dataUrl = engine.export('png');
    downloadDataUrl(dataUrl, 'twin-canvas-export.png');
  };

  const handleShare = async () => {
    const link = `${window.location.origin}/twin/${roomId}`;
    try {
      await navigator.clipboard.writeText(link);
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('unsaved'), 1500);
    } catch {
      window.prompt('Copy share link:', link);
    }
  };

  const handleSave = () => {
    setSaveStatus('saving');
    useSocketStore.getState().emitSaveCanvas();
    setTimeout(() => setSaveStatus('saved'), 500);
  };

  const handleZoomIn = () => {
    if (!engine) return;
    engine.setZoom(engine.getZoom() * 1.2);
  };

  const handleZoomOut = () => {
    if (!engine) return;
    engine.setZoom(engine.getZoom() / 1.2);
  };

  const handleFitToScreen = () => {
    if (!engine) return;
    engine.fitToScreen();
  };

  return (
    <div className="flex h-12 items-center justify-between gap-1 border-b px-3 bg-card">
      <div className="flex items-center gap-1">
        <button
          onClick={undo}
          disabled={!canUndo()}
          className="rounded-md p-2 text-sm hover:bg-muted disabled:opacity-50"
          title="Undo (Ctrl+Z)"
        >
          <Undo2 className="h-4 w-4" />
        </button>
        <button
          onClick={redo}
          disabled={!canRedo()}
          className="rounded-md p-2 text-sm hover:bg-muted disabled:opacity-50"
          title="Redo (Cmd+Shift+Z)"
        >
          <Redo2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-border" />

        <button
          onClick={handleZoomOut}
          className="rounded-md p-2 text-sm hover:bg-muted"
          title="Zoom out"
        >
          <ZoomOut className="h-4 w-4" />
        </button>
        <button
          onClick={handleZoomIn}
          className="rounded-md p-2 text-sm hover:bg-muted"
          title="Zoom in"
        >
          <ZoomIn className="h-4 w-4" />
        </button>
        <button
          onClick={handleFitToScreen}
          className="rounded-md p-2 text-sm hover:bg-muted"
          title="Fit to screen"
        >
          <Maximize2 className="h-4 w-4" />
        </button>

        <div className="mx-1 h-5 w-px bg-border" />

        <button
          onClick={handleShare}
          className="rounded-md p-2 text-sm hover:bg-muted flex items-center gap-1.5"
          title="Copy invite link"
        >
          <Share2 className="h-4 w-4" />
          <span className="hidden lg:inline text-xs">Invite</span>
        </button>
        <button
          onClick={() => {}}
          className="rounded-md p-2 text-sm hover:bg-muted"
          title="Copy (Ctrl+C)"
        >
          <Copy className="h-4 w-4" />
        </button>
      </div>

      <div className="flex items-center gap-1">
        <span className="text-xs text-muted-foreground">
          {saveStatus === 'saving' ? 'Saving...' : saveStatus === 'saved' ? 'Link copied!' : '● Unsaved'}
        </span>
        <div className="mx-1 h-5 w-px bg-border" />
        <button
          onClick={handleSave}
          className="rounded-md p-2 text-sm hover:bg-muted"
          title="Save (Ctrl+S)"
        >
          <Save className="h-4 w-4" />
        </button>
        <button
          onClick={handleExport}
          className="rounded-md p-2 text-sm hover:bg-muted"
          title="Export"
        >
          <FileDown className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
