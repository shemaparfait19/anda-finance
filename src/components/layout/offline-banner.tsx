'use client';

import { useEffect, useState } from 'react';
import { WifiOff, Wifi } from 'lucide-react';

type Status = 'online' | 'offline' | 'restored';

export function OfflineBanner() {
  const [status, setStatus] = useState<Status>('online');

  useEffect(() => {
    // Set initial state — SSR always starts as online
    if (!navigator.onLine) setStatus('offline');

    let restoreTimer: ReturnType<typeof setTimeout>;

    const handleOffline = () => {
      clearTimeout(restoreTimer);
      setStatus('offline');
    };

    const handleOnline = () => {
      clearTimeout(restoreTimer);
      setStatus('restored');
      // Hide the "back online" message after 3 s
      restoreTimer = setTimeout(() => setStatus('online'), 3000);
    };

    window.addEventListener('offline', handleOffline);
    window.addEventListener('online',  handleOnline);

    return () => {
      clearTimeout(restoreTimer);
      window.removeEventListener('offline', handleOffline);
      window.removeEventListener('online',  handleOnline);
    };
  }, []);

  if (status === 'online') return null;

  if (status === 'restored') {
    return (
      <div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 flex items-center gap-2.5 rounded-full bg-green-600 px-5 py-2.5 text-sm font-medium text-white shadow-lg animate-in fade-in slide-in-from-bottom-4 duration-300">
        <Wifi className="h-4 w-4 shrink-0" />
        Back online
      </div>
    );
  }

  // offline
  return (
    <div className="fixed inset-x-0 top-0 z-50">
      <div className="flex items-center justify-center gap-2.5 bg-orange-500 px-4 py-2.5 text-sm font-medium text-white shadow-md">
        <WifiOff className="h-4 w-4 shrink-0 animate-pulse" />
        <span>
          You are offline — changes will not be saved until your connection is restored.
        </span>
      </div>
    </div>
  );
}
