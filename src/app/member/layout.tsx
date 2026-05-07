import type { Metadata, Viewport } from 'next';

export const metadata: Metadata = {
  title: 'ANDA Finance — Member Portal',
  description: 'View your savings, loans, and account statement',
  manifest: '/manifest.json',
  appleWebApp: {
    capable: true,
    statusBarStyle: 'black-translucent',
    title: 'ANDA Finance',
  },
};

export const viewport: Viewport = {
  themeColor: '#0d1526',
  width: 'device-width',
  initialScale: 1,
  maximumScale: 1,
  userScalable: false,
};

export default function MemberLayout({ children }: { children: React.ReactNode }) {
  return <>{children}</>;
}
