'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { useEffect, useState } from 'react';
import { setInstallPrompt, clearInstallPrompt, isInstalledPWA } from '@/lib/install-prompt';
import { NotificationBell } from './notification-bell';

const NAV = [
  { href: '/member/dashboard', label: 'Home',    icon: HomeIcon },
  { href: '/member/savings',   label: 'Savings', icon: SavingsIcon },
  { href: '/member/loans',     label: 'Loans',   icon: LoanIcon },
  { href: '/member/profile',   label: 'Profile', icon: ProfileIcon },
];

export function MobileShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const [installPromptEvt, setInstallPromptEvt] = useState<any>(null);
  const [showInstallBanner, setShowInstallBanner] = useState(false);

  useEffect(() => {
    if ('serviceWorker' in navigator) {
      navigator.serviceWorker.register('/sw.js').catch(() => {});
    }
    if (isInstalledPWA()) return;
    if (localStorage.getItem('af_install_dismissed')) return;

    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e);
      setInstallPromptEvt(e);
      setShowInstallBanner(true);
    };
    window.addEventListener('beforeinstallprompt', handler as any);
    return () => window.removeEventListener('beforeinstallprompt', handler as any);
  }, []);

  async function handleInstall() {
    if (!installPromptEvt) return;
    installPromptEvt.prompt();
    const { outcome } = await installPromptEvt.userChoice;
    if (outcome === 'accepted') {
      setShowInstallBanner(false);
      setInstallPromptEvt(null);
      clearInstallPrompt();
    }
  }

  function handleDismiss() {
    setShowInstallBanner(false);
    localStorage.setItem('af_install_dismissed', '1');
  }

  function isActive(href: string) {
    return href === '/member/dashboard'
      ? pathname === href
      : pathname.startsWith(href);
  }

  return (
    <div className="min-h-screen bg-[#f7f8f9] flex">

      {/* ── SIDE NAV — tablet & desktop (md+) ─────────────────────────── */}
      <aside className="hidden md:flex flex-col w-56 lg:w-64 min-h-screen bg-[#0d1526] flex-shrink-0 sticky top-0">
        {/* Logo */}
        <div className="px-5 py-6 border-b border-white/8">
          <div className="flex items-center gap-3">
            <div className="h-8 w-8 rounded-lg bg-white/10 flex items-center justify-center flex-shrink-0">
              <LogoIcon />
            </div>
            <div>
              <p className="text-[13px] font-bold text-white tracking-tight leading-tight">ANDA Finance</p>
              <p className="text-[9px] text-white/35 uppercase tracking-widest">Member Portal</p>
            </div>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex-1 px-3 py-4 space-y-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link
                key={href}
                href={href}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-xl transition-colors ${
                  active
                    ? 'bg-white/12 text-white'
                    : 'text-white/50 hover:bg-white/6 hover:text-white/80'
                }`}
              >
                <Icon active={active} />
                <span className={`text-[13px] font-medium`}>{label}</span>
                {active && <div className="ml-auto h-1.5 w-1.5 rounded-full bg-white/60" />}
              </Link>
            );
          })}
        </nav>

        {/* Notifications in sidebar */}
        <div className="px-4 py-4 border-t border-white/8">
          <NotificationBell sidebarMode />
        </div>
      </aside>

      {/* ── MAIN CONTENT ───────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0 relative">
        {/* Mobile-only: notification bell fixed top-right */}
        <div className="md:hidden">
          <NotificationBell />
        </div>

        {/* Content */}
        <main className="flex-1 md:pb-0 pb-20">
          {/* On desktop, constrain content width for readability */}
          <div className="md:max-w-3xl lg:max-w-4xl md:mx-auto">
            {children}
          </div>
        </main>

        {/* ── BOTTOM NAV — mobile only ──────────────────────────────── */}
        <nav className="md:hidden fixed bottom-0 left-0 right-0 z-40 bg-white border-t border-gray-100">
          <div className="flex items-stretch h-[60px] max-w-md mx-auto">
            {NAV.map(({ href, label, icon: Icon }) => {
              const active = isActive(href);
              return (
                <Link
                  key={href}
                  href={href}
                  className={`flex-1 flex flex-col items-center justify-center gap-0.5 transition-colors ${
                    active ? 'text-[#0d1526]' : 'text-gray-400'
                  }`}
                >
                  <Icon active={active} />
                  <span className={`text-[10px] font-medium`}>{label}</span>
                </Link>
              );
            })}
          </div>
        </nav>
      </div>

      {/* ── PWA install banner (above bottom nav on mobile, bottom-right on desktop) ── */}
      {showInstallBanner && (
        <>
          {/* Mobile */}
          <div className="md:hidden fixed bottom-[68px] left-0 right-0 z-50 px-3">
            <div className="bg-[#0d1526] rounded-2xl px-4 py-4 flex items-center gap-3 shadow-2xl max-w-md mx-auto">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <LogoIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white">Install ANDA Finance</p>
                <p className="text-[11px] text-white/45 mt-0.5">Add to home screen</p>
              </div>
              <button onClick={handleInstall} className="bg-white text-[#0d1526] text-[12px] font-semibold px-3.5 py-2 rounded-lg flex-shrink-0">
                Install
              </button>
              <button onClick={handleDismiss} className="text-white/30 text-[20px] leading-none pl-1">×</button>
            </div>
          </div>
          {/* Desktop */}
          <div className="hidden md:block fixed bottom-6 right-6 z-50">
            <div className="bg-[#0d1526] rounded-2xl px-4 py-4 flex items-center gap-3 shadow-2xl w-80">
              <div className="h-10 w-10 rounded-xl bg-white/10 flex items-center justify-center flex-shrink-0">
                <LogoIcon />
              </div>
              <div className="flex-1 min-w-0">
                <p className="text-[13px] font-semibold text-white">Install ANDA Finance</p>
                <p className="text-[11px] text-white/45 mt-0.5">Add to your desktop or home screen</p>
              </div>
              <button onClick={handleInstall} className="bg-white text-[#0d1526] text-[12px] font-semibold px-3.5 py-2 rounded-lg flex-shrink-0">
                Install
              </button>
              <button onClick={handleDismiss} className="text-white/30 text-[20px] leading-none pl-1">×</button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}

// ── Icons ─────────────────────────────────────────────────────────────────────

function LogoIcon() {
  return (
    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <path d="M12 2L2 7l10 5 10-5-10-5z" />
      <path d="M2 17l10 5 10-5" />
      <path d="M2 12l10 5 10-5" />
    </svg>
  );
}

function HomeIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path d="M3 12L12 3L21 12V20a1 1 0 01-1 1H15V15H9v6H4a1 1 0 01-1-1V12z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
    </svg>
  );
}

function SavingsIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <rect x="3" y="6" width="18" height="13" rx="2" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M3 10h18" stroke="currentColor" strokeWidth={1.8} />
      <circle cx="7.5" cy="14" r="1" fill="currentColor" />
    </svg>
  );
}

function LoanIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z"
        stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M12 7v5l3 3" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" />
    </svg>
  );
}

function ProfileIcon({ active }: { active: boolean }) {
  return (
    <svg width="22" height="22" fill="none" viewBox="0 0 24 24">
      <circle cx="12" cy="8" r="4" stroke="currentColor" strokeWidth={active ? 2.2 : 1.8}
        fill={active ? 'currentColor' : 'none'} fillOpacity={active ? 0.12 : 0} />
      <path d="M4 20c0-3.314 3.582-6 8-6s8 2.686 8 6" stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.8} strokeLinecap="round" />
    </svg>
  );
}
