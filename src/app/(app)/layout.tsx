import type { ReactNode } from 'react';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';
import AppSidebar from '@/components/layout/app-sidebar';
import Header from '@/components/layout/header';
import { BottomNav } from '@/components/layout/bottom-nav';

export default function AppLayout({ children }: { children: ReactNode }) {
  return (
    <SidebarProvider>
      {/* Sidebar: hidden on mobile, visible on md+ */}
      <div className="hidden md:block">
        <AppSidebar />
      </div>
      <SidebarInset>
        <Header />
        {/* pb-20 on mobile reserves space above the bottom nav */}
        <main className="p-4 pb-24 md:pb-6 lg:p-6">{children}</main>
      </SidebarInset>
      {/* Bottom nav: only on mobile/tablet */}
      <BottomNav />
    </SidebarProvider>
  );
}
