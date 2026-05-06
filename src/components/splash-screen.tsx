'use client';

import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/icons';

type Phase = 'visible' | 'fading' | 'gone';

export function SplashScreen() {
  // Start visible so the overlay covers the page during SSR/initial paint.
  // The CSS class html.splash-done hides it instantly on return visits (set by
  // the inline script in layout.tsx before React renders).
  const [phase, setPhase] = useState<Phase>('visible');
  const phaseRef = useRef<Phase>('visible');
  phaseRef.current = phase;

  useEffect(() => {
    let alreadyShown = false;
    try { alreadyShown = !!sessionStorage.getItem('af-splash'); } catch { /* */ }

    if (alreadyShown) {
      setPhase('gone');
      return;
    }

    try { sessionStorage.setItem('af-splash', '1'); } catch { /* */ }
    const t = setTimeout(() => setPhase('fading'), 2000);
    return () => clearTimeout(t);
  }, []);

  if (phase === 'gone') return null;

  return (
    <div
      // af-splash-overlay is targeted by globals.css to hide instantly on return visits
      className="af-splash-overlay fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d1526] pointer-events-none"
      style={{
        opacity: phase === 'fading' ? 0 : 1,
        transition: phase === 'fading' ? 'opacity 500ms ease-in' : 'none',
      }}
      onTransitionEnd={() => {
        if (phaseRef.current === 'fading') setPhase('gone');
      }}
    >
      <div className="flex flex-col items-center gap-6">
        <Logo className="h-10 w-10 text-white" />

        <div className="text-center">
          <h1 className="text-[1.75rem] font-bold tracking-tight text-white">
            ANDA Finance
          </h1>
          <p className="mt-1 text-[11px] font-medium tracking-[0.2em] uppercase text-white/40">
            Core Banking System
          </p>
        </div>

        <div className="mt-2 h-px w-24 overflow-hidden bg-white/10">
          <div
            className="h-full origin-left bg-white/35"
            style={{ animation: 'splash-fill 1.8s ease-out forwards' }}
          />
        </div>
      </div>
    </div>
  );
}
