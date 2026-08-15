import { useCanvasStore } from '@/store/canvasStore';
import { useUIStore } from '@/store/uiStore';
import { ChevronUp, ChevronDown, Eye, EyeOff, Trash2, Lock } from 'lucide-react';

export function LayersPanel() {
  const { objects, objectOrder, deleteObject, moveObjectForward, moveObjectBackward, moveObjectToFront, moveObjectToBack } = useCanvasStore();
  const { selectedObjectId, setSelectedObject } = useUIStore();

  if (objectOrder.length === 0) {
    return (
      <div className="border-t p-3">
        <h3 className="text-xs font-medium text-muted-foreground mb-2">Layers</h3>
        <p className="text-xs text-muted-foreground/70">No layers</p>
      </div>
    );
  }

  return (
    <div className="border-t p-3">
      <h3 className="text-xs font-medium text-muted-foreground mb-2">Layers</h3>
      <div className="space-y-1">
        {objectOrder.slice().reverse().map((id) => {
          const obj = objects[id];
          if (!obj) return null;
          const isSelected = selectedObjectId === id;
          return (
            <div
              key={id}
              className={`flex items-center gap-1 rounded-md p-1.5 text-xs cursor-pointer transition ${
                isSelected ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted/50'
              }`}
              onClick={() => setSelectedObject(id)}
            >
              <div className="w-3 h-3 rounded bg-muted flex-shrink-0" />
              <span className="truncate flex-1">{obj.type}</span>
              <div className="flex items-center gap-0.5">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveObjectToFront(id);
                  }}
                  className="rounded p-0.5 hover:bg-muted"
                  title="Bring to front"
                >
                  <ChevronUp className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    moveObjectToBack(id);
                  }}
                  className="rounded p-0.5 hover:bg-muted"
                  title="Send to back"
                >
                  <ChevronDown className="h-3 w-3" />
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    deleteObject(id);
                  }}
                  className="rounded p-0.5 hover:bg-destructive/10 text-destructive"
                  title="Delete"
                >
                  <Trash2 className="h-3 w-3" />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
