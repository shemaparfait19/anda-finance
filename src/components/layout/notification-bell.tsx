"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Bell, AlertTriangle, Clock, ShieldAlert } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { getNotifications, type AppNotification } from "@/lib/notifications";
import { cn } from "@/lib/utils";

const ICON: Record<AppNotification["type"], React.ElementType> = {
  overdue: AlertTriangle,
  defaulted: ShieldAlert,
  pending: Clock,
};

const COLOR: Record<AppNotification["type"], string> = {
  overdue: "text-orange-500",
  defaulted: "text-red-500",
  pending: "text-yellow-500",
};

export function NotificationBell() {
  const [notifications, setNotifications] = useState<AppNotification[]>([]);

  useEffect(() => {
    getNotifications().then(setNotifications);
  }, []);

  const count = notifications.length;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" size="icon" className="rounded-full relative">
          <Bell className="h-5 w-5" />
          {count > 0 && (
            <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-[10px] font-bold text-white leading-none">
              {count}
            </span>
          )}
          <span className="sr-only">Notifications</span>
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-80">
        <DropdownMenuLabel className="flex items-center justify-between">
          <span>Alerts</span>
          {count > 0 && (
            <span className="text-xs font-normal text-muted-foreground">
              {count} active
            </span>
          )}
        </DropdownMenuLabel>
        <DropdownMenuSeparator />
        {count === 0 ? (
          <div className="py-6 text-center text-sm text-muted-foreground">
            <Bell className="h-8 w-8 mx-auto mb-2 opacity-30" />
            All clear — no alerts
          </div>
        ) : (
          notifications.map((n) => {
            const Icon = ICON[n.type];
            return (
              <DropdownMenuItem key={n.id} asChild>
                <Link href={n.href} className="flex items-start gap-3 py-3 cursor-pointer">
                  <Icon className={cn("h-4 w-4 mt-0.5 shrink-0", COLOR[n.type])} />
                  <div className="flex flex-col gap-0.5">
                    <span className="text-sm font-medium">{n.title}</span>
                    <span className="text-xs text-muted-foreground">{n.description}</span>
                  </div>
                </Link>
              </DropdownMenuItem>
            );
          })
        )}
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild>
          <Link href="/loans" className="text-xs text-center w-full justify-center text-muted-foreground">
            View all loans →
          </Link>
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
