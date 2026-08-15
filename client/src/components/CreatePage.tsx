import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { TEMPLATE_SIZES, type TemplateSize } from '@shared/constants';
import { useUserStore } from '@/store/userStore';
import { useCanvasStore } from '@/store/canvasStore';

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:3001';

export function CreatePage() {
  const navigate = useNavigate();
  const { initUser } = useUserStore();
  const { setCanvasSize } = useCanvasStore();
  const [customW, setCustomW] = useState('1600');
  const [customH, setCustomH] = useState('900');
  const [creating, setCreating] = useState(false);

  const handleSelect = async (template: TemplateSize) => {
    if (creating) return;
    setCreating(true);
    const w = template.name === 'Custom Size'
      ? (parseInt(customW, 10) || 1600)
      : template.width;
    const h = template.name === 'Custom Size'
      ? (parseInt(customH, 10) || 900)
      : template.height;

    setCanvasSize(w, h);
    initUser('Guest');

    try {
      const res = await fetch(`${SERVER_URL}/api/rooms`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ownerName: 'Guest', width: w, height: h }),
      });
      if (!res.ok) throw new Error('Failed to create room');
      const data = await res.json();
      sessionStorage.setItem('tc_ownerId', data.ownerId);
      navigate(`/twin/${data.roomId}`);
    } catch (err) {
      console.error('Room creation failed:', err);
      const roomId = `local-${Date.now().toString(36)}`;
      sessionStorage.setItem('tc_ownerId', '');
      navigate(`/twin/${roomId}`);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-6">
      <div className="w-full max-w-3xl">
        <div className="mb-6">
          <h1 className="text-2xl font-bold">Create a new design</h1>
          <p className="text-sm text-muted-foreground">Choose a template to get started.</p>
        </div>

        <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
          {TEMPLATE_SIZES.map((t) => (
            <button
              key={t.name}
              onClick={() => handleSelect(t)}
              className="group rounded-lg border border-border p-4 text-left hover:border-primary hover:bg-muted/50 transition"
            >
              <div className="font-medium">{t.name}</div>
              {t.width > 0 && (
                <div className="text-sm text-muted-foreground">{t.width} × {t.height}</div>
              )}
              {t.name === 'Custom Size' && t.width === 0 && (
                <div className="text-sm text-muted-foreground">Set your own dimensions</div>
              )}
            </button>
          ))}
        </div>

        <div className="mt-6 rounded-lg border border-border p-4">
          <label className="text-sm font-medium">Custom dimensions (px)</label>
          <div className="mt-2 flex gap-3">
            <input
              type="number"
              min="1"
              value={customW}
              onChange={(e) => setCustomW(e.target.value)}
              className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
              placeholder="Width"
            />
            <input
              type="number"
              min="1"
              value={customH}
              onChange={(e) => setCustomH(e.target.value)}
              className="flex-1 rounded-md border border-input px-3 py-2 text-sm"
              placeholder="Height"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
