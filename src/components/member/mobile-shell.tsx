'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setInstallPrompt, clearInstallPrompt, isInstalledPWA } from '@/lib/install-prompt';

const NAV = [
  { href: '/member/dashboard', label: 'Home', icon: HomeIcon },
  { href: '/member/savings', label: 'Savings', icon: SavingsIcon },
  { href: '/member/loans', label: 'Loans', icon: LoanIcon },
  { href: '/member/profile', label: 'Profile', icon: ProfileIcon },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [installPrompt, setInstallPrompt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    // Register service worker
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }

    // Request push permission and subscribe
    subscribeToPush();

    // Already installed as PWA — don't show banner
    if (isInstalledPWA()) return;
    // User already dismissed the banner
    if (localStorage.getItem('af_install_dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);       // store in module for Profile page
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  async function handleInstall() {
    if (!installPrompt) return;
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPrompt(null);
      clearInstallPrompt();
    }
  }

  function handleDismiss() {
    setShowInstallBanner(false);
    localStorage.setItem('af_install_dismissed', '1');
  }

  return (
    <div className="min-h-screen bg-[#f7f8f9] flex flex-col max-w-md mx-auto relative">
      {/* PWA install banner */}
      {showInstallBanner && (
        <div className="fixed bottom-[68px] left-0 right-0 z-40 max-w-md mx-auto px-3">
          <div className="bg-[#0d1526] rounded-2xl px-4 py-4 flex items-center gap-3 shadow-2xl">
            <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
              <span className="text-lg font-bold text-white">A</span>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-[13px] font-semibold text-white leading-tight">Install ANDA Finance</p>
              <p className="text-[11px] text-white/45 mt-0.5">Add to home screen for quick access</p>
            </div>
            <button
              onClick={handleInstall}
              className="bg-white text-[#0d1526] text-[12px] font-semibold px-3.5 py-2 rounded-lg flex-shrink-0 active:opacity-80 transition-opacity"
            >
              Install
            </button>
            <button
              onClick={handleDismiss}
              className="text-white/30 hover:text-white/60 text-[18px] leading-none flex-shrink-0 pl-1"
            >
              ×
            </button>
          </div>
        </div>
      )}

      {/* Content */}
      <div className="flex-1 pb-20">{children}</div>

      {/* Bottom navigation */}
      <nav className="fixed bottom-0 left-0 right-0 z-50 bg-white border-t border-gray-100 max-w-md mx-auto">
        <div className="flex items-stretch h-[60px]">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = pathname === href || (href !== '/member/dashboard' && pathname.startsWith(href));
            return (
              <Link
                key={href}
                href={href}
                className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-[#0d1526]' : 'text-gray-400'
                }`}
              >
                <Icon active={active} />
                <span className={`text-[10px] font-medium ${active ? 'text-[#0d1526]' : 'text-gray-400'}`}>
                  {label}
                </span>
              </Link>
            );
          })}
        </div>
      </nav>
    </div>
  );
}

async function subscribeToPush() {
  try {
    if (!('PushManager' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm !== 'granted') return;

    const reg = await navigator.serviceWorker.ready;
    const existing = await reg.pushManager.getSubscription();
    if (existing) {
      await sendSubToServer(existing);
      return;
    }

    const keyRes = await fetch('/api/push/vapid-public-key');
    if (!keyRes.ok) return;
    const { key } = await keyRes.json();

    const sub = await reg.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: urlBase64ToUint8Array(key),
    });
    await sendSubToServer(sub);
  } catch {}
}

async function sendSubToServer(sub: PushSubscription) {
  const json = sub.toJSON();
  await fetch('/api/push/subscribe', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(json),
  });
}

function urlBase64ToUint8Array(base64String: string) {
  const padding = '='.repeat((4 - (base64String.length % 4)) % 4);
  const base64 = (base64String + padding).replace(/-/g, '+').replace(/_/g, '/');
  const raw = atob(base64);
  return new Uint8Array([...raw].map((c) => c.charCodeAt(0)));
}

// ── Icons ──────────────────────────────────────────────────────────────────────

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path
        d="M3 12L12 3L21 12V20a1 1 0 01-1 1H15V15H9v6H4a1 1 0 01-1-1V12z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
    </svg>
  );
}

function SavingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      <path d="M3 10h18" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="7.5" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function LoanIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path
        d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0}
      />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
