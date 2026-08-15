import { useUIStore } from '@/store/uiStore';
import { useCanvasStore } from '@/store/canvasStore';
import { Trash2, BringToFront, SendToBack } from 'lucide-react';

export function RightSidebar() {
  const { selectedObjectId } = useUIStore();
  const { objects, deleteObject, moveObjectToFront, moveObjectToBack, updateObject } = useCanvasStore();

  const selectedObj = selectedObjectId ? objects[selectedObjectId] : null;

  if (!selectedObj) {
    return (
      <div className="w-64 border-l bg-card p-4">
        <h3 className="text-sm font-medium mb-3">Properties</h3>
        <p className="text-sm text-muted-foreground">Select an object to edit its properties.</p>
      </div>
    );
  }

  return (
    <div className="w-64 border-l bg-card p-4 overflow-y-auto">
      <h3 className="text-sm font-medium mb-3">Properties</h3>

      <div className="space-y-3">
        <div>
          <label className="block text-xs text-muted-foreground mb-1">Type</label>
          <div className="text-sm">{selectedObj.type}</div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Position</label>
          <div className="grid grid-cols-2 gap-2">
            <div>
              <label className="block text-xs text-muted-foreground">X</label>
              <input
                type="number"
                value={selectedObj.x}
                onChange={(e) => updateObject(selectedObj.id, { x: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-md border border-input px-2 py-1 text-xs"
              />
            </div>
            <div>
              <label className="block text-xs text-muted-foreground">Y</label>
              <input
                type="number"
                value={selectedObj.y}
                onChange={(e) => updateObject(selectedObj.id, { y: parseInt(e.target.value, 10) || 0 })}
                className="w-full rounded-md border border-input px-2 py-1 text-xs"
              />
            </div>
          </div>
        </div>

        {'width' in selectedObj && (
          <div>
            <label className="block text-xs text-muted-foreground mb-1">Size</label>
            <div className="grid grid-cols-2 gap-2">
              <div>
                <label className="block text-xs text-muted-foreground">W</label>
                <input
                  type="number"
                  value={(selectedObj as any).width}
                  onChange={(e) => updateObject(selectedObj.id, { width: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-md border border-input px-2 py-1 text-xs"
                />
              </div>
              <div>
                <label className="block text-xs text-muted-foreground">H</label>
                <input
                  type="number"
                  value={(selectedObj as any).height}
                  onChange={(e) => updateObject(selectedObj.id, { height: parseInt(e.target.value, 10) || 0 })}
                  className="w-full rounded-md border border-input px-2 py-1 text-xs"
                />
              </div>
            </div>
          </div>
        )}

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Rotation</label>
          <input
            type="number"
            value={selectedObj.rotation}
            onChange={(e) => updateObject(selectedObj.id, { rotation: parseInt(e.target.value, 10) || 0 })}
            className="w-full rounded-md border border-input px-2 py-1 text-xs"
          />
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Fill</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={((selectedObj as any).fill as string) || '#000000'}
              onChange={(e) => updateObject(selectedObj.id, { fill: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <input
              type="text"
              value={(selectedObj as any).fill || ''}
              onChange={(e) => updateObject(selectedObj.id, { fill: e.target.value })}
              className="flex-1 rounded-md border border-input px-2 py-1 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Stroke</label>
          <div className="flex gap-2">
            <input
              type="color"
              value={((selectedObj as any).stroke as string) || '#000000'}
              onChange={(e) => updateObject(selectedObj.id, { stroke: e.target.value })}
              className="h-8 w-8 cursor-pointer rounded border"
            />
            <input
              type="number"
              min="0"
              max="10"
              value={(selectedObj as any).strokeWidth || 0}
              onChange={(e) => updateObject(selectedObj.id, { strokeWidth: parseInt(e.target.value, 10) || 0 })}
              className="w-16 rounded-md border border-input px-2 py-1 text-xs"
            />
          </div>
        </div>

        <div>
          <label className="block text-xs text-muted-foreground mb-1">Opacity</label>
          <input
            type="range"
            min="0"
            max="1"
            step="0.01"
            value={selectedObj.opacity}
            onChange={(e) => updateObject(selectedObj.id, { opacity: parseFloat(e.target.value) })}
            className="w-full"
          />
        </div>

        <div className="flex gap-1 pt-2">
          <button
            onClick={() => moveObjectToFront(selectedObj.id)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs hover:bg-muted"
            title="Bring to front"
          >
            <BringToFront className="h-3 w-3" />
            Front
          </button>
          <button
            onClick={() => moveObjectToBack(selectedObj.id)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs hover:bg-muted"
            title="Send to back"
          >
            <SendToBack className="h-3 w-3" />
            Back
          </button>
          <button
            onClick={() => deleteObject(selectedObj.id)}
            className="flex flex-1 items-center justify-center gap-1 rounded-md px-3 py-2 text-xs text-destructive hover:bg-destructive/10"
            title="Delete"
          >
            <Trash2 className="h-3 w-3" />
          </button>
        </div>
      </div>
    </div>
  );
}
