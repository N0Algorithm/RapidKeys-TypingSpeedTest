'use client';

import { useEffect, useState } from 'react';
import TypingArea from '../components/TypingArea';

export default function Home() {
  const [bestWpm, setBestWpm] = useState(0);

  useEffect(() => {
    // Check local storage for high score
    try {
      const history = JSON.parse(localStorage.getItem('rapidkeys_history') || '[]');
      if (history.length > 0) {
        const max = Math.max(...history.map(h => h.wpm));
        setBestWpm(max);
      }
    } catch (e) {
      console.error("Failed to load history", e);
    }
  }, []); // Run once on mount

  return (
    <main className="relative flex min-h-screen flex-col items-center justify-center p-4 sm:p-8 overflow-hidden">

      {/* Logo / Header Area */}
      <div
        onClick={() => window.location.reload()}
        className="absolute top-4 sm:top-12 left-4 sm:left-12 z-20 flex items-center gap-2 sm:gap-3 opacity-80 hover:opacity-100 transition-opacity cursor-pointer"
      >
        <div className="h-4 sm:h-6 w-1 bg-[var(--color-caret)] rounded-full shadow-[0_0_8px_var(--color-caret)]"></div>
        <h1 className="text-lg sm:text-2xl font-bold tracking-tight text-[var(--color-text-primary)]">
          RapidKeys
        </h1>
        <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest bg-white/5 px-1.5 sm:px-2 py-0.5 sm:py-1 rounded text-text-secondary border border-white/5">
          Beta
        </span>
      </div>

      {/* Personal Best Display */}
      {bestWpm > 0 && (
        <div className="absolute top-4 sm:top-12 right-4 sm:right-12 z-20 flex flex-col items-end animate-in fade-in duration-1000">
          <span className="text-[8px] sm:text-[10px] uppercase font-bold tracking-widest text-text-secondary">Personal Best</span>
          <span className="text-base sm:text-xl font-bold text-[var(--color-caret)] drop-shadow-[0_0_8px_rgba(251,191,36,0.3)]">
            {bestWpm} WPM
          </span>
        </div>
      )}

      {/* Main Typing Container */}
      <div className="z-10 w-full max-w-6xl mx-auto flex items-center justify-center">
        <TypingArea />
      </div>

      {/* Footer */}
      <div className="absolute bottom-4 sm:bottom-8 flex gap-4 sm:gap-6 text-[10px] sm:text-xs text-text-secondary z-20 font-medium tracking-wide">
        <span className="opacity-40 hover:opacity-80 transition-opacity cursor-default">
          Made by <span className="text-green-400 font-semibold">Akshay</span>
        </span>
      </div>
    </main>
  );
}

