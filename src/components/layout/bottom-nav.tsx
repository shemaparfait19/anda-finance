"use client";

import { useState } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";
import {
  BookOpen,
  CreditCard,
  FileText,
  GanttChartSquare,
  Landmark,
  LayoutDashboard,
  LineChart,
  MoreHorizontal,
  Settings,
  Users,
  Wallet,
  X,
} from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Sheet,
  SheetContent,
  SheetTrigger,
} from "@/components/ui/sheet";

const primaryLinks = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/members", label: "Members", icon: Users },
  { href: "/loans", label: "Loans", icon: Landmark },
  { href: "/payments", label: "Payments", icon: CreditCard },
];

const moreLinks = [
  { href: "/savings", label: "Savings", icon: Wallet },
  { href: "/investments", label: "Investments", icon: LineChart },
  { href: "/accounting", label: "Accounting", icon: BookOpen },
  { href: "/reports", label: "Reports", icon: FileText },
  { href: "/admin", label: "Admin", icon: Settings },
  { href: "/audit", label: "Audit", icon: GanttChartSquare },
];

export function BottomNav() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);

  const isMoreActive = moreLinks.some((l) => pathname.startsWith(l.href));

  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 md:hidden bg-background border-t border-border shadow-[0_-4px_24px_rgba(0,0,0,0.08)]">
      <div className="flex items-center justify-around h-16 px-2">
        {primaryLinks.map(({ href, label, icon: Icon }) => {
          const isActive = href === "/" ? pathname === "/" : pathname.startsWith(href);
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200",
                isActive
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-6 transition-all duration-200",
                  isActive && "bg-primary/10"
                )}
              >
                <Icon className={cn("h-5 w-5 transition-transform duration-200", isActive && "scale-110")} />
              </div>
              <span className={cn("text-[10px] font-medium", isActive && "font-semibold")}>
                {label}
              </span>
            </Link>
          );
        })}

        {/* More button */}
        <Sheet open={open} onOpenChange={setOpen}>
          <SheetTrigger asChild>
            <button
              className={cn(
                "flex flex-col items-center justify-center gap-1 flex-1 h-full transition-all duration-200",
                isMoreActive || open
                  ? "text-primary"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              <div
                className={cn(
                  "flex items-center justify-center w-10 h-6 transition-all duration-200",
                  (isMoreActive || open) && "bg-primary/10"
                )}
              >
                {open
                  ? <X className="h-5 w-5 transition-transform duration-200 scale-110" />
                  : <MoreHorizontal className="h-5 w-5" />
                }
              </div>
              <span className="text-[10px] font-medium">More</span>
            </button>
          </SheetTrigger>
          <SheetContent side="bottom" className="h-auto pb-8">
            <div className="w-10 h-1 bg-muted mx-auto mb-6" />
            <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider px-1 mb-3">
              More
            </p>
            <div className="grid grid-cols-3 gap-2">
              {moreLinks.map(({ href, label, icon: Icon }) => {
                const isActive = pathname.startsWith(href);
                return (
                  <Link
                    key={href}
                    href={href}
                    onClick={() => setOpen(false)}
                    className={cn(
                      "flex flex-col items-center justify-center gap-2 p-4 border transition-all duration-200",
                      isActive
                        ? "bg-primary/10 border-primary/20 text-primary"
                        : "border-border text-muted-foreground hover:bg-muted hover:text-foreground"
                    )}
                  >
                    <Icon className="h-6 w-6" />
                    <span className="text-xs font-medium">{label}</span>
                  </Link>
                );
              })}
            </div>
          </SheetContent>
        </Sheet>
      </div>
    </nav>
  );
}
