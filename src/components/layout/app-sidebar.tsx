'use client';

import { usePathname } from 'next/navigation';
import {
  BookOpen,
  FileText,
  GanttChartSquare,
  Landmark,
  LayoutDashboard,
  LineChart,
  Settings,
  Users,
  Wallet,
  CreditCard,
} from 'lucide-react';

import {
  Sidebar,
  SidebarHeader,
  SidebarContent,
  SidebarMenu,
  SidebarMenuItem,
  SidebarMenuButton,
  SidebarFooter,
} from '@/components/ui/sidebar';
import { Logo } from '@/components/icons';
import type { NavLink } from '@/lib/types';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getPlaceholderImage } from '@/lib/placeholder-images';

const navLinks: NavLink[] = [
  { href: '/', label: 'Dashboard', icon: LayoutDashboard },
  { href: '/members', label: 'Members', icon: Users },
  { href: '/savings', label: 'Savings', icon: Wallet },
  { href: '/loans', label: 'Loans', icon: Landmark },
  { href: '/investments', label: 'Investments', icon: LineChart },
  { href: '/accounting', label: 'Accounting', icon: BookOpen },
  { href: '/reports', label: 'Reports', icon: FileText },
  { href: '/payments', label: 'Payments', icon: CreditCard },
  { href: '/admin', label: 'Admin', icon: Settings },
  { href: '/audit', label: 'Audit', icon: GanttChartSquare },
];

export default function AppSidebar() {
  const pathname = usePathname();
  const adminAvatar = getPlaceholderImage('admin_avatar');

  return (
    <Sidebar>
      <SidebarHeader className="border-b border-sidebar-border">
        <div className="flex items-center gap-2 p-2">
          <Logo className="w-8 h-8 text-primary-foreground" />
          <h1 className="font-headline text-lg font-semibold text-primary-foreground">
            ANDA Finance
          </h1>
        </div>
      </SidebarHeader>
      <SidebarContent>
        <SidebarMenu>
          {navLinks.map((link) => (
            <SidebarMenuItem key={link.href}>
              <SidebarMenuButton
                asChild
                // @ts-ignore Next.js Link component is compatible with asChild
                href={link.href}
                isActive={pathname === link.href}
                tooltip={link.label}
              >
                <link.icon />
                <span>{link.label}</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>
      <SidebarFooter className="border-t border-sidebar-border p-2">
        <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
            <Avatar className='h-9 w-9'>
                <AvatarImage src={adminAvatar.imageUrl} alt={adminAvatar.description} data-ai-hint={adminAvatar.imageHint}/>
                <AvatarFallback>AD</AvatarFallback>
            </Avatar>
            <div className="flex flex-col">
                <span className="text-sm font-semibold text-sidebar-accent-foreground">Admin User</span>
                <span className="text-xs text-sidebar-accent-foreground/80">admin@anda.fi</span>
            </div>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
