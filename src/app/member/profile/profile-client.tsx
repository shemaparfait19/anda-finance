'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getInstallPrompt, clearInstallPrompt, isInstalledPWA } from '@/lib/install-prompt';

export function MemberProfileClient() {
  const router = useRouter();
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);

  useEffect(() => {
    if (isInstalledPWA()) {
      setInstalled(true);
      return;
    }
    // Check if prompt is available (captured by MobileShell)
    setCanInstall(!!getInstallPrompt());

    // Also listen in case the event fires while on this page
    const handler = (e: Event) => {
      e.preventDefault();
      setCanInstall(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  async function handleInstall() {
    const prompt = getInstallPrompt();
    if (!prompt) return;
    setInstalling(true);
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      clearInstallPrompt();
      setCanInstall(false);
      setInstalled(true);
    }
    setInstalling(false);
  }

  async function handleLogout() {
    await fetch('/api/member/logout', { method: 'POST' });
    localStorage.removeItem('af_member_group');
    localStorage.removeItem('af_member_email');
    router.replace('/member/login');
  }

  return (
    <div className="mt-4 space-y-3">

      {/* Install App card */}
      {installed ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <span className="text-lg">✓</span>
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0d1526]">App Installed</p>
            <p className="text-[11px] text-gray-400 mt-0.5">ANDA Finance is on your home screen</p>
          </div>
        </div>
      ) : canInstall ? (
        <button
          onClick={handleInstall}
          disabled={installing}
          className="w-full bg-[#0d1526] rounded-2xl px-4 py-4 flex items-center gap-3 active:opacity-80 transition-opacity text-left"
        >
          <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
            <DownloadIcon />
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-white">
              {installing ? 'Installing…' : 'Install ANDA Finance'}
            </p>
            <p className="text-[11px] text-white/45 mt-0.5">Add to home screen for quick access</p>
          </div>
          {!installing && (
            <span className="text-white/30 text-[18px]">→</span>
          )}
        </button>
      ) : (
        // iOS or browser that doesn't support beforeinstallprompt
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-[#0d1526]/6 flex items-center justify-center flex-shrink-0">
              <DownloadIcon dark />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0d1526]">Install ANDA Finance</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Add to your home screen</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-3 space-y-1.5">
            <p className="text-[11px] font-semibold text-gray-500 uppercase tracking-wide">How to install</p>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              <strong className="text-[#0d1526]">iPhone/iPad:</strong> Tap the Share button <span className="font-mono bg-gray-100 px-1 rounded text-[11px]">⎙</span> in Safari, then tap <em>"Add to Home Screen"</em>
            </p>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              <strong className="text-[#0d1526]">Android:</strong> Tap the menu <span className="font-mono bg-gray-100 px-1 rounded text-[11px]">⋮</span> in Chrome, then tap <em>"Add to Home Screen"</em>
            </p>
          </div>
        </div>
      )}

      {/* Sign out */}
      <button
        onClick={handleLogout}
        className="w-full bg-white border border-red-100 text-red-500 rounded-2xl py-4 text-[14px] font-semibold active:opacity-80 transition-opacity"
      >
        Sign Out
      </button>
    </div>
  );
}

function DownloadIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={dark ? '#0d1526' : 'white'}
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
