"use client";

import { Suspense, useEffect, useRef, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
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

// Isolated component so useSearchParams is inside its own Suspense boundary
function HeaderSearch() {
  const pathname = usePathname();
  const router = useRouter();
  const searchParams = useSearchParams();

  const [searchValue, setSearchValue] = useState(searchParams.get("q") ?? "");
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setSearchValue(searchParams.get("q") ?? "");
  }, [pathname, searchParams]);

  const handleSearch = (value: string) => {
    setSearchValue(value);
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      if (value.trim()) {
        params.set("q", value.trim());
      } else {
        params.delete("q");
      }
      router.replace(`${pathname}?${params.toString()}`);
    }, 300);
  };

  return (
    <div className="relative">
      <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
      <Input
        type="search"
        placeholder="Search…"
        value={searchValue}
        onChange={(e) => handleSearch(e.target.value)}
        className="pl-8 w-[180px] lg:w-[260px] h-9 text-sm"
      />
    </div>
  );
}

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

        {/* Search — wrapped in Suspense because HeaderSearch uses useSearchParams */}
        <div className="hidden sm:block">
          <Suspense fallback={
            <div className="relative">
              <Search className="absolute left-2.5 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search…" className="pl-8 w-[180px] lg:w-[260px] h-9 text-sm" disabled />
            </div>
          }>
            <HeaderSearch />
          </Suspense>
        </div>

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
