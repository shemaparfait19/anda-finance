'use client';

import { useRouter } from 'next/navigation';
import { useEffect, useState } from 'react';
import { getInstallPrompt, clearInstallPrompt, isInstalledPWA } from '@/lib/install-prompt';

type NotifState = 'unknown' | 'unsupported' | 'denied' | 'granted' | 'requesting';

export function MemberProfileClient() {
  const router = useRouter();
  const [canInstall, setCanInstall] = useState(false);
  const [installing, setInstalling] = useState(false);
  const [installed, setInstalled] = useState(false);
  const [notifState, setNotifState] = useState<NotifState>('unknown');
  const [notifLoading, setNotifLoading] = useState(false);

  useEffect(() => {
    // Install state
    if (isInstalledPWA()) {
      setInstalled(true);
    } else {
      setCanInstall(!!getInstallPrompt());
      const handler = (e: Event) => { e.preventDefault(); setCanInstall(true); };
      window.addEventListener('beforeinstallprompt', handler as any);
      return () => window.removeEventListener('beforeinstallprompt', handler as any);
    }
  }, []);

  useEffect(() => {
    // Notification permission state
    if (!('Notification' in window)) { setNotifState('unsupported'); return; }
    if (!('PushManager' in window)) { setNotifState('unsupported'); return; }
    if (Notification.permission === 'granted') {
      setNotifState('granted');
      // Re-subscribe silently in case subscription was lost
      subscribePush().catch(() => {});
    } else if (Notification.permission === 'denied') {
      setNotifState('denied');
    } else {
      setNotifState('unknown'); // 'default' — not yet asked
    }
  }, []);

  async function handleEnableNotifications() {
    setNotifLoading(true);
    try {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        await subscribePush();
        setNotifState('granted');
      } else {
        setNotifState('denied');
      }
    } catch {
      setNotifState('denied');
    }
    setNotifLoading(false);
  }

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

      {/* ── Install App ─────────────────────────────────────────────── */}
      {installed ? (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <span className="text-[18px]">✓</span>
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
          {!installing && <span className="text-white/30 text-lg">→</span>}
        </button>
      ) : (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
              <DownloadIcon dark />
            </div>
            <div>
              <p className="text-[13px] font-semibold text-[#0d1526]">Install ANDA Finance</p>
              <p className="text-[11px] text-gray-400 mt-0.5">Add to your home screen</p>
            </div>
          </div>
          <div className="bg-gray-50 rounded-xl px-3 py-3 space-y-2">
            <p className="text-[11px] font-semibold text-gray-400 uppercase tracking-wide">How to install</p>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              <span className="font-semibold text-[#0d1526]">iPhone / iPad (Safari):</span> tap the Share icon <span className="font-mono bg-gray-200 px-1 rounded">⎙</span> then <em>"Add to Home Screen"</em>
            </p>
            <p className="text-[12px] text-gray-500 leading-relaxed">
              <span className="font-semibold text-[#0d1526]">Android (Chrome):</span> tap menu <span className="font-mono bg-gray-200 px-1 rounded">⋮</span> then <em>"Add to Home Screen"</em>
            </p>
          </div>
        </div>
      )}

      {/* ── Push Notifications ──────────────────────────────────────── */}
      {notifState === 'granted' && (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-emerald-50 flex items-center justify-center flex-shrink-0">
            <BellIcon color="#10b981" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0d1526]">Notifications enabled</p>
            <p className="text-[11px] text-gray-400 mt-0.5">You'll be notified of deposits and updates</p>
          </div>
        </div>
      )}

      {notifState === 'unknown' && (
        <button
          onClick={handleEnableNotifications}
          disabled={notifLoading}
          className="w-full bg-white border border-gray-200 rounded-2xl px-4 py-4 flex items-center gap-3 active:opacity-70 transition-opacity text-left"
        >
          <div className="h-10 w-10 rounded-xl bg-[#0d1526]/6 flex items-center justify-center flex-shrink-0">
            {notifLoading
              ? <div className="h-5 w-5 border-2 border-gray-300 border-t-[#0d1526] rounded-full animate-spin" />
              : <BellIcon color="#0d1526" />
            }
          </div>
          <div className="flex-1">
            <p className="text-[13px] font-semibold text-[#0d1526]">
              {notifLoading ? 'Enabling…' : 'Enable Notifications'}
            </p>
            <p className="text-[11px] text-gray-400 mt-0.5">Get alerted when deposits are credited</p>
          </div>
          {!notifLoading && <span className="text-gray-300 text-lg">→</span>}
        </button>
      )}

      {notifState === 'denied' && (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-start gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-50 flex items-center justify-center flex-shrink-0 mt-0.5">
            <BellIcon color="#f97316" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0d1526]">Notifications blocked</p>
            <p className="text-[11.5px] text-gray-400 mt-1 leading-relaxed">
              To enable: open your browser settings, find this site under notifications, and allow them.
            </p>
          </div>
        </div>
      )}

      {notifState === 'unsupported' && (
        <div className="bg-white rounded-2xl border border-gray-100 px-4 py-4 flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-gray-50 flex items-center justify-center flex-shrink-0">
            <BellIcon color="#9ca3af" />
          </div>
          <div>
            <p className="text-[13px] font-semibold text-[#0d1526]">Notifications not supported</p>
            <p className="text-[11px] text-gray-400 mt-0.5">Install the app for push notifications</p>
          </div>
        </div>
      )}

      {/* ── Sign out ─────────────────────────────────────────────────── */}
      <button
        onClick={handleLogout}
        className="w-full bg-white border border-red-100 text-red-500 rounded-2xl py-4 text-[14px] font-semibold active:opacity-80 transition-opacity"
      >
        Sign Out
      </button>
    </div>
  );
}

// ── helpers ────────────────────────────────────────────────────────────────────

async function subscribePush() {
  if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
  const reg = await navigator.serviceWorker.ready;
  const existing = await reg.pushManager.getSubscription();
  if (existing) { await sendSubToServer(existing); return; }

  const keyRes = await fetch('/api/push/vapid-public-key');
  if (!keyRes.ok) return;
  const { key } = await keyRes.json();

  const sub = await reg.pushManager.subscribe({
    userVisibleOnly: true,
    applicationServerKey: urlBase64ToUint8Array(key),
  });
  await sendSubToServer(sub);
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

function DownloadIcon({ dark }: { dark?: boolean }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path d="M12 3v12m0 0l-4-4m4 4l4-4M4 17v2a2 2 0 002 2h12a2 2 0 002-2v-2"
        stroke={dark ? '#0d1526' : 'white'} strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function BellIcon({ color }: { color: string }) {
  return (
    <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
