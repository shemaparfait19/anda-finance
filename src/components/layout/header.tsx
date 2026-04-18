"use client";

import { usePathname } from "next/navigation";
import { SidebarTrigger } from "@/components/ui/sidebar";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import { ThemeToggle } from "@/components/layout/theme-toggle";
import { NotificationBell } from "@/components/layout/notification-bell";
import { LiveHeaderInfo } from "@/components/layout/live-header-info";
import { Breadcrumbs } from "@/components/layout/breadcrumbs";

const getPageTitle = (pathname: string) => {
  const segment = pathname.split("/").filter(Boolean)[0] || "dashboard";
  if (pathname === "/") return "Dashboard";
  return segment.charAt(0).toUpperCase() + segment.slice(1);
};


export default function Header() {
  const pathname = usePathname();
  const title = getPageTitle(pathname);
  const adminAvatar = getPlaceholderImage("admin_avatar");

  return (
    <header className="sticky top-0 z-30 flex h-14 flex-col border-b border-border/50 bg-background/95 backdrop-blur-sm px-4 lg:h-auto lg:px-6">
      <div className="flex h-14 items-center gap-4">
        <SidebarTrigger className="hidden" />

        <div className="flex flex-col min-w-0">
          <h1 className="text-base font-headline font-semibold leading-tight truncate">
            {title}
          </h1>
          <Breadcrumbs />
        </div>

        <div className="flex-1" />

        <LiveHeaderInfo />

        <ThemeToggle />
        <NotificationBell />

        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="ghost" size="icon" className="rounded-full">
              <Avatar className="h-8 w-8">
                <AvatarImage
                  src={adminAvatar.imageUrl}
                  alt={adminAvatar.description}
                  data-ai-hint={adminAvatar.imageHint}
                />
                <AvatarFallback>ZJ</AvatarFallback>
              </Avatar>
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end" className="w-56">
            <DropdownMenuLabel>
              <p className="font-semibold">ZIGAMA Julius</p>
              <p className="text-xs text-muted-foreground font-normal">Administrator</p>
            </DropdownMenuLabel>
            <DropdownMenuSeparator />
            <DropdownMenuItem>Settings</DropdownMenuItem>
            <DropdownMenuItem>Support</DropdownMenuItem>
            <DropdownMenuSeparator />
            <DropdownMenuItem className="text-destructive">Logout</DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
    </header>
  );
}
