import { useSocketStore } from '@/store/socketStore';
import type { RemoteCursor, RemoteSelection } from '@shared/types';

export function RemoteCursors() {
  const cursors = useSocketStore((s) => s.remoteCursors);
  const selections = useSocketStore((s) => s.remoteSelections);
  const remoteUsers = useSocketStore((s) => s.remoteUsers);
  const currentUserId = useSocketStore((s) => s.currentUser?.id);

  const others = Object.entries(cursors).filter(([userId]) => userId !== currentUserId);

  return (
    <>
      {others.map(([userId, cursor]) => {
        const user = remoteUsers[userId];
        return <RemoteCursorView key={userId} cursor={cursor} name={user?.name || 'User'} color={user?.color || '#3b82f6'} />;
      })}
      {Object.entries(selections)
        .filter(([userId]) => userId !== currentUserId)
        .map(([userId, selection]) => {
          const user = remoteUsers[userId];
          return <RemoteSelectionView key={userId} selection={selection} name={user?.name || 'User'} color={user?.color || '#3b82f6'} />;
        })}
    </>
  );
}

function RemoteCursorView({ cursor, name, color }: { cursor: RemoteCursor; name: string; color: string }) {
  return (
    <div
      className="pointer-events-none absolute z-30"
      style={{ left: cursor.position.x, top: cursor.position.y }}
    >
      <svg
        width="20"
        height="20"
        viewBox="0 0 20 20"
        className="drop-shadow"
        style={{ transform: 'translate(-2px, -2px)' }}
      >
        <path d="M2 2 L2 14 L5.5 11 L8 17 L10.5 15.5 L8 9.5 L13 10 Z" fill={color} stroke="white" strokeWidth="1" />
      </svg>
      <span
        className="absolute top-5 left-2 whitespace-nowrap rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}

function RemoteSelectionView({ selection, name, color }: { selection: RemoteSelection; name: string; color: string }) {
  if (!selection.boundingBox) return null;
  return (
    <div
      className="pointer-events-none absolute z-20 border-2 border-dashed"
      style={{
        left: selection.boundingBox.x,
        top: selection.boundingBox.y,
        width: selection.boundingBox.width,
        height: selection.boundingBox.height,
        borderColor: color,
      }}
    >
      <span
        className="absolute -top-5 left-0 rounded px-1.5 py-0.5 text-[10px] font-medium text-white"
        style={{ backgroundColor: color }}
      >
        {name}
      </span>
    </div>
  );
}