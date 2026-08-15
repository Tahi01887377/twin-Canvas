import { useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { useUserStore } from '@/store/userStore';
import { useUIStore } from '@/store/uiStore';
import { TEMPLATE_SIZES } from '@shared/constants';

export function LandingPage() {
  const navigate = useNavigate();
  const { initUser } = useUserStore();
  const { darkMode, toggleDarkMode } = useUIStore();

  const startCreate = () => {
    initUser('Guest');
    navigate('/new');
  };

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="flex h-14 items-center justify-between px-6 border-b">
        <div className="flex items-center space-x-4">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary text-primary-foreground font-bold">TC</div>
          <span className="text-xl font-bold">TwinCanvas</span>
        </div>
        <nav className="flex items-center space-x-4">
          <a href="https://github.com" className="text-sm hover:text-foreground/70">Docs</a>
          <button
            onClick={toggleDarkMode}
            className="rounded-md p-2 hover:bg-muted"
            aria-label={darkMode ? "Switch to light mode" : "Switch to dark mode"}
          >
            {darkMode ? "☀" : "🌙"}
          </button>
        </nav>
      </header>

      <main className="flex-1 flex flex-col items-center justify-center px-6">
        <div className="max-w-4xl text-center">
          <h1 className="text-5xl font-bold tracking-tight mb-6">
            Create together.
            <br />
            Design together.
            <br />
            <span className="text-primary">In real time.</span>
          </h1>
          <p className="text-xl text-muted-foreground mb-10 max-w-2xl mx-auto">
            A collaborative canvas where two people can draw, design, and create
            together from anywhere.
          </p>
          <div className="flex justify-center gap-4">
            <button
              onClick={startCreate}
              className="rounded-lg bg-primary px-8 py-3 text-lg font-medium text-primary-foreground hover:bg-primary/90 transition"
            >
              Start Creating
            </button>
            <button
              onClick={() => navigate('/twin/demo')}
              className="rounded-lg border border-input px-8 py-3 text-lg font-medium hover:bg-muted/50 transition"
            >
              Try Demo
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}
