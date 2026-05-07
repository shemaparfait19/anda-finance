// Module-level store for the beforeinstallprompt event.
// Captured once in MobileShell, readable from any client component.
let deferredPrompt: any = null;

export function setInstallPrompt(e: any) { deferredPrompt = e; }
export function getInstallPrompt() { return deferredPrompt; }
export function clearInstallPrompt() { deferredPrompt = null; }

export function isInstalledPWA(): boolean {
  if (typeof window === 'undefined') return false;
  return window.matchMedia('(display-mode: standalone)').matches;
}
