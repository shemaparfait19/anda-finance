import type { ReactNode } from 'react';
import { SessionProvider } from 'next-auth/react';
import { auth } from '@/auth';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';
import { OfflineBanner } from '@/components/layout/offline-banner';

export default async function AppLayout({ children }: { children: ReactNode }) {
  const session = await auth();

  return (
    <SessionProvider session={session}>
      <OfflineBanner />
      <SidebarProvider>
        {/* Sidebar: hidden on mobile, visible on md+ */}
        <div className="hidden md:block">
          <AppSidebar />
        </div>
        <SidebarInset>
          <Header />
          {/* pb-20 on mobile reserves space above the bottom nav */}
          <main className="flex-1 p-4 pb-24 md:p-6 md:pb-6 lg:p-8 w-full max-w-screen-2xl">{children}</main>
        </SidebarInset>
        {/* Bottom nav: only on mobile/tablet */}
        <BottomNav />
      </SidebarProvider>
    </SessionProvider>
  );
}
