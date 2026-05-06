'use client';

import { useEffect, useRef, useState } from 'react';
import { Logo } from '@/components/icons';

type Phase = 'none' | 'visible' | 'fading';

export function SplashScreen() {
  const [phase, setPhase] = useState<Phase>('none');
  const phaseRef = useRef<Phase>('none');
  phaseRef.current = phase;

  useEffect(() => {
    try {
      if (sessionStorage.getItem('af-splash')) return;
      sessionStorage.setItem('af-splash', '1');
    } catch {
      return;
    }
    setPhase('visible');
    const t = setTimeout(() => setPhase('fading'), 2100);
    return () => clearTimeout(t);
  }, []);

  if (phase === 'none') return null;

  return (
    <div
      className="fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-[#0d1526] pointer-events-none"
      style={{
        opacity: phase === 'fading' ? 0 : 1,
        transition: 'opacity 550ms ease-in',
      }}
      onTransitionEnd={() => {
        if (phaseRef.current === 'fading') setPhase('none');
      }}
    >
      <div
        className="flex flex-col items-center gap-7"
        style={{ animation: 'splash-in 0.5s ease-out both' }}
      >
        {/* Logo ring */}
        <div className="relative">
          <div className="absolute -inset-5 rounded-full bg-white/4 blur-2xl" />
          <div className="relative flex h-16 w-16 items-center justify-center rounded-2xl border border-white/10 bg-white/5">
            <Logo className="h-8 w-8 text-white" />
          </div>
        </div>

        {/* Name */}
        <div className="text-center space-y-2">
          <p className="text-[10px] font-medium tracking-[0.22em] uppercase text-white/30">
            Welcome to
          </p>
          <h1 className="text-[2rem] font-bold tracking-tight text-white leading-none">
            ANDA Finance
          </h1>
          <p className="text-[11px] tracking-[0.18em] uppercase text-white/35">
            Core Banking System
          </p>
        </div>

        {/* Loading bar */}
        <div className="mt-1 h-px w-28 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full origin-left rounded-full bg-white/40"
            style={{ animation: 'splash-fill 1.9s ease-out forwards' }}
          />
        </div>
      </div>
    </div>
  );
}
