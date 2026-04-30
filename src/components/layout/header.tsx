'use client';

import { useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { useSession, signOut } from 'next-auth/react';
import { SidebarTrigger } from '@/components/ui/sidebar';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { ThemeToggle }    from '@/components/layout/theme-toggle';
import { NotificationBell } from '@/components/layout/notification-bell';
import { Breadcrumbs }     from '@/components/layout/breadcrumbs';
import { ChangeCredentialsDialog } from '@/components/auth/change-credentials-dialog';
import { roleLabel }       from '@/lib/permissions';
import type { UserRole }   from '@/lib/types';

const getPageTitle = (pathname: string) => {
  if (pathname === '/') return 'Dashboard';
  const segment = pathname.split('/').filter(Boolean)[0] ?? 'dashboard';
  return segment.charAt(0).toUpperCase() + segment.slice(1);
};

function initials(name?: string | null) {
  if (!name) return '??';
  return name.split(' ').slice(0, 2).map((w) => w[0]).join('').toUpperCase();
}

export default function Header() {
  const pathname = usePathname();
  const router   = useRouter();
  const title    = getPageTitle(pathname);
  const { data: session } = useSession();
  const user = session?.user;
  const [changePwOpen, setChangePwOpen] = useState(false);

  const handleLogout = async () => {
    await signOut({ redirect: false });
    router.push('/login');
    router.refresh();
  };

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-col border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 lg:h-auto lg:px-6">
      <div className="flex h-14 items-center gap-4">
        <SidebarTrigger className="hidden md:flex text-muted-foreground hover:text-foreground" />

        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-headline font-semibold leading-tight truncate">{title}</h1>
          <Breadcrumbs />
        </div>

        <div className="flex-1" />

        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarFallback className="bg-primary text-primary-foreground text-xs font-semibold">
                  {initials(user?.name)}
                </AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-semibold truncate">{user?.name ?? 'Loading…'}</p>
              <p className="text-xs text-muted-foreground font-normal truncate">
                {user?.role ? roleLabel(user.role as UserRole) : ''}
              </p>
              <p className="text-xs text-muted-foreground font-normal truncate mt-0.5">
                {user?.email}
              </p>
              {(user as any)?.groupName && (
                <p className="text-xs font-medium text-primary truncate mt-1">
                  {(user as any).groupName}
                </p>
              )}
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem onSelect={() => setChangePwOpen(true)}>
              Change Password / PIN
            </DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onSelect={handleLogout}
            >
              Sign Out
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      <ChangeCredentialsDialog open={changePwOpen} onOpenChange={setChangePwOpen} />
    </header>
  );
}
