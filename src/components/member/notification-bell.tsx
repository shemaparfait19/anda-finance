'use client';

import { useEffect, useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import type { MemberNotification } from '@/lib/member-data';

export function NotificationBell({ sidebarMode }: { sidebarMode?: boolean } = {}) {
  const router = useRouter();
  const [unread, setUnread] = useState(0);
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<MemberNotification[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchCount = useCallback(async () => {
    try {
      const res = await fetch('/api/member/notifications');
      if (!res.ok) return;
      const data = await res.json();
      setUnread(data.unread ?? 0);
      // Update app icon badge via service worker
      if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
        navigator.serviceWorker.controller.postMessage({ type: 'SET_BADGE', count: data.unread });
      }
    } catch {}
  }, []);

  useEffect(() => {
    fetchCount();
    // Poll every 30s to pick up new notifications
    const interval = setInterval(fetchCount, 30_000);
    return () => clearInterval(interval);
  }, [fetchCount]);

  async function handleOpen() {
    setOpen(true);
    setLoading(true);
    try {
      const res = await fetch('/api/member/notifications');
      const data = await res.json();
      setNotifications(data.notifications ?? []);
      setUnread(data.unread ?? 0);
    } catch {}
    setLoading(false);
  }

  async function handleMarkAllRead() {
    await fetch('/api/member/notifications', { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({}) });
    setNotifications((n) => n.map((item) => ({ ...item, isRead: true })));
    setUnread(0);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SET_BADGE', count: 0 });
    }
  }

  async function handleClear() {
    await fetch('/api/member/notifications', { method: 'DELETE' });
    setNotifications([]);
    setUnread(0);
    if ('serviceWorker' in navigator && navigator.serviceWorker.controller) {
      navigator.serviceWorker.controller.postMessage({ type: 'SET_BADGE', count: 0 });
    }
  }

  async function handleTap(notif: MemberNotification) {
    // Mark this one read
    if (!notif.isRead) {
      await fetch('/api/member/notifications', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ids: [notif.id] }),
      });
      setNotifications((n) => n.map((item) => item.id === notif.id ? { ...item, isRead: true } : item));
      setUnread((c) => Math.max(0, c - 1));
    }
    setOpen(false);
    router.push(notif.url);
  }

  function timeAgo(dateStr: string) {
    const diff = Date.now() - new Date(dateStr).getTime();
    const mins = Math.floor(diff / 60000);
    if (mins < 1) return 'just now';
    if (mins < 60) return `${mins}m ago`;
    const hrs = Math.floor(mins / 60);
    if (hrs < 24) return `${hrs}h ago`;
    return `${Math.floor(hrs / 24)}d ago`;
  }

  return (
    <>
      {/* Bell button */}
      {sidebarMode ? (
        <button
          onClick={handleOpen}
          className="relative w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-white/50 hover:bg-white/6 hover:text-white/80 transition-colors"
          aria-label="Notifications"
        >
          <span className="relative flex-shrink-0">
            <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
              <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
            {unread > 0 && (
              <span className="absolute -top-1 -right-1 h-4 min-w-4 px-0.5 rounded-full bg-red-500 text-white text-[9px] font-bold flex items-center justify-center leading-none">
                {unread > 99 ? '99+' : unread}
              </span>
            )}
          </span>
          <span className="text-[13px] font-medium">Notifications</span>
          {unread > 0 && (
            <span className="ml-auto bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      ) : (
        <button
          onClick={handleOpen}
          className="fixed top-4 right-4 z-30 h-10 w-10 rounded-full bg-white/10 backdrop-blur-sm flex items-center justify-center transition-all active:scale-95"
          aria-label="Notifications"
        >
          <svg width="20" height="20" fill="none" viewBox="0 0 24 24">
            <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
              stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          {unread > 0 && (
            <span className="absolute -top-0.5 -right-0.5 h-5 min-w-5 px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center leading-none">
              {unread > 99 ? '99+' : unread}
            </span>
          )}
        </button>
      )}

      {/* Drawer overlay */}
      {open && (
        <div className="fixed inset-0 z-50 flex flex-col" onClick={() => setOpen(false)}>
          {/* Backdrop */}
          <div className="flex-1 bg-black/40" />

          {/* Panel — slides up from bottom */}
          <div
            className="bg-white rounded-t-3xl max-h-[80vh] flex flex-col max-w-md mx-auto w-full"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="h-1 w-10 rounded-full bg-gray-200" />
            </div>

            {/* Header */}
            <div className="flex items-center justify-between px-5 py-3 border-b border-gray-100">
              <div className="flex items-center gap-2">
                <h2 className="text-[16px] font-bold text-[#0d1526]">Notifications</h2>
                {unread > 0 && (
                  <span className="bg-red-500 text-white text-[10px] font-bold px-1.5 py-0.5 rounded-full">
                    {unread}
                  </span>
                )}
              </div>
              <div className="flex items-center gap-3">
                {notifications.some((n) => !n.isRead) && (
                  <button onClick={handleMarkAllRead} className="text-[12px] text-[#0d1526] font-medium hover:opacity-70">
                    Mark all read
                  </button>
                )}
                {notifications.length > 0 && (
                  <button onClick={handleClear} className="text-[12px] text-red-400 font-medium hover:opacity-70">
                    Clear
                  </button>
                )}
                <button onClick={() => setOpen(false)} className="text-gray-400 text-[20px] leading-none hover:text-gray-600">
                  ×
                </button>
              </div>
            </div>

            {/* List */}
            <div className="overflow-y-auto flex-1">
              {loading ? (
                <div className="flex items-center justify-center py-16">
                  <div className="h-6 w-6 border-2 border-gray-200 border-t-[#0d1526] rounded-full animate-spin" />
                </div>
              ) : notifications.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-16 px-6">
                  <div className="h-14 w-14 rounded-full bg-gray-50 flex items-center justify-center mb-3">
                    <svg width="26" height="26" fill="none" viewBox="0 0 24 24">
                      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
                        stroke="#d1d5db" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </div>
                  <p className="text-[14px] font-medium text-gray-400">No notifications</p>
                  <p className="text-[12px] text-gray-300 mt-1">You're all caught up</p>
                </div>
              ) : (
                <div className="divide-y divide-gray-50 pb-6">
                  {notifications.map((notif) => (
                    <button
                      key={notif.id}
                      onClick={() => handleTap(notif)}
                      className="w-full flex items-start gap-3 px-5 py-4 hover:bg-gray-50 transition-colors text-left"
                    >
                      {/* Unread dot */}
                      <div className="mt-1.5 flex-shrink-0">
                        <div className={`h-2 w-2 rounded-full ${notif.isRead ? 'bg-transparent' : 'bg-[#0d1526]'}`} />
                      </div>

                      {/* Icon */}
                      <div className={`h-9 w-9 rounded-full flex items-center justify-center flex-shrink-0 ${
                        notif.isRead ? 'bg-gray-100' : 'bg-[#0d1526]/8'
                      }`}>
                        <NotifIcon url={notif.url} />
                      </div>

                      {/* Text */}
                      <div className="flex-1 min-w-0">
                        <p className={`text-[13px] leading-snug ${notif.isRead ? 'text-gray-500 font-normal' : 'text-[#0d1526] font-semibold'}`}>
                          {notif.title}
                        </p>
                        {notif.body && (
                          <p className="text-[12px] text-gray-400 mt-0.5 leading-relaxed">{notif.body}</p>
                        )}
                        <p className="text-[11px] text-gray-300 mt-1">{timeAgo(notif.createdAt)}</p>
                      </div>

                      <span className="text-gray-200 text-[14px] mt-1 flex-shrink-0">›</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function NotifIcon({ url }: { url: string }) {
  if (url.includes('savings')) {
    return (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <rect x="3" y="6" width="18" height="13" rx="2" stroke="#0d1526" strokeWidth="1.8" />
        <path d="M3 10h18" stroke="#0d1526" strokeWidth="1.8" />
      </svg>
    );
  }
  if (url.includes('loan')) {
    return (
      <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
        <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2z" stroke="#0d1526" strokeWidth="1.8" />
        <path d="M12 7v5l3 3" stroke="#0d1526" strokeWidth="1.8" strokeLinecap="round" />
      </svg>
    );
  }
  return (
    <svg width="16" height="16" fill="none" viewBox="0 0 24 24">
      <path d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6 6 0 00-5-5.917V4a1 1 0 10-2 0v1.083A6 6 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
        stroke="#0d1526" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}
