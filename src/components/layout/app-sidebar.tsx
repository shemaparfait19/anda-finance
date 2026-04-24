'use client';

import { usePathname } from 'next/navigation';
import Link from 'next/link';
import { useSession, signOut } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import {
  BookOpen,
  FileText,
  GanttChartSquare,
  Landmark,
  LayoutDashboard,
  LineChart,
  Settings,
  Shield,
  Users,
  Wallet,
  CreditCard,
  LogOut,
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
import { Logo }    from '@/components/icons';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { roleLabel } from '@/lib/permissions';
import type { NavLink, UserRole } from '@/lib/types';

// Navigation for cooperative staff
const staffNavLinks: NavLink[] = [
  { href: '/',            label: 'Dashboard',   icon: LayoutDashboard },
  { href: '/members',     label: 'Members',      icon: Users },
  { href: '/savings',     label: 'Savings',      icon: Wallet },
  { href: '/loans',       label: 'Loans',        icon: Landmark },
  { href: '/investments', label: 'Investments',  icon: LineChart },
  { href: '/accounting',  label: 'Accounting',   icon: BookOpen },
  { href: '/reports',     label: 'Reports',      icon: FileText },
  { href: '/payments',    label: 'Payments',     icon: CreditCard },
  { href: '/admin',       label: 'Admin',        icon: Settings },
  { href: '/audit',       label: 'Audit',        icon: GanttChartSquare },
];

// Navigation for SUPER_ADMIN — system owner, no cooperative data
const superAdminNavLinks: NavLink[] = [
  { href: '/admin', label: 'Control Panel', icon: Shield },
];

// Navigation for IT_ADMIN — settings only
const itAdminNavLinks: NavLink[] = [
  { href: '/admin', label: 'Settings', icon: Settings },
];

function getNavLinks(role?: UserRole | null): NavLink[] {
  if (role === 'SUPER_ADMIN') return superAdminNavLinks;
  if (role === 'IT_ADMIN')    return itAdminNavLinks;
  return staffNavLinks;
}

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function AppSidebar() {
  const pathname = usePathname();
  const router   = useRouter();
  const { data: session } = useSession();
  const user = session?.user;
  const role = user?.role as UserRole | undefined;

  const navLinks = getNavLinks(role);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

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
                href={link.href}
                isActive={pathname === link.href || (link.href !== '/' && pathname.startsWith(link.href))}
                tooltip={link.label}
              >
                <Link href={link.href}>
                  <link.icon />
                  <span>{link.label}</span>
                </Link>
              </SidebarMenuButton>
            </SidebarMenuItem>
          ))}
        </SidebarMenu>
      </SidebarContent>

      <SidebarFooter className="border-t border-sidebar-border p-2 space-y-2">
        {/* User card */}
        <div className="flex items-center gap-3 p-2 rounded-md bg-sidebar-accent">
          <Avatar className="h-9 w-9 shrink-0">
            <AvatarFallback className="bg-sidebar-primary text-sidebar-primary-foreground text-xs font-bold">
              {initials(user?.name)}
            </AvatarFallback>
          </Avatar>
          <div className="flex flex-col min-w-0">
            <span className="text-sm font-semibold text-sidebar-accent-foreground truncate">
              {user?.name ?? '…'}
            </span>
            <span className="text-xs text-sidebar-accent-foreground/70 truncate">
              {user?.role ? roleLabel(user.role as UserRole) : ''}
            </span>
            {(user as any)?.groupName && (
              <span className="text-xs font-medium text-sidebar-primary truncate">
                {(user as any).groupName}
              </span>
            )}
          </div>
          <button
            onClick={handleLogout}
            title="Sign out"
            className="ml-auto shrink-0 text-sidebar-accent-foreground/60 hover:text-sidebar-accent-foreground transition-colors"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>

        <div className="px-2 pb-1 flex items-center justify-between">
          <span className="text-[10px] text-sidebar-foreground/40 font-mono">ANDA Finance v1.0</span>
          <span className="text-[10px] text-sidebar-foreground/40">FY 2025–26</span>
        </div>
      </SidebarFooter>
    </Sidebar>
  );
}
