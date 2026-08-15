import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { COLLABORATION_COLORS } from '@shared/constants';

export function JoinDialog() {
  const { roomId } = useParams<{ roomId: string }>();
  const navigate = useNavigate();
  const { currentUser, initUser } = useUserStore();
  const { darkMode } = useUIStore();
  const [show, setShow] = useState(!currentUser);
  const [name, setName] = useState('');
  const [selectedColor, setSelectedColor] = useState<string>(COLLABORATION_COLORS[0]);

  useEffect(() => {
    setShow(!currentUser);
  }, [currentUser]);

  const handleJoin = () => {
    if (!name.trim()) return;
    const storedOwnerId = sessionStorage.getItem('tc_ownerId');
    initUser(name.trim(), selectedColor, storedOwnerId || undefined, !!storedOwnerId);
    if (storedOwnerId) sessionStorage.removeItem('tc_ownerId');
  };

  const roomLink = roomId ? `${window.location.origin}/twin/${roomId}` : '';

  if (!show) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-background/80 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-lg border border-border bg-card p-6 shadow-lg">
        <h2 className="text-xl font-bold mb-4">Join Collaboration</h2>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-1">Your name</label>
          <input
            type="text"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Enter your name..."
            className="w-full rounded-md border border-input px-3 py-2 text-sm"
            onKeyDown={(e) => e.key === 'Enter' && name.trim() && handleJoin()}
          />
        </div>

        <div className="mb-4">
          <label className="block text-sm font-medium mb-2">Choose your color</label>
          <div className="flex gap-2">
            {COLLABORATION_COLORS.map((color) => (
              <button
                key={color}
                onClick={() => setSelectedColor(color)}
                className={`h-8 w-8 rounded-full border-2 transition ${
                  selectedColor === color ? 'border-foreground' : 'border-2 border-muted'
                }`}
                style={{ backgroundColor: color }}
                aria-label={`Color ${color}`}
              />
            ))}
          </div>
        </div>

        {roomId && (
          <div className="mb-4">
            <label className="block text-sm font-medium mb-1">Room</label>
            <div className="break-all text-sm text-muted-foreground">{roomLink}</div>
          </div>
        )}

        <div className="flex gap-2 pt-2">
          <button
            onClick={() => navigate('/')}
            className="flex-1 rounded-md border border-input px-4 py-2 text-sm hover:bg-muted"
          >
            Cancel
          </button>
          <button
            onClick={handleJoin}
            disabled={!name.trim()}
            className="flex-1 rounded-md bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            Join Canvas
          </button>
        </div>
      </div>
    </div>
  );
}
