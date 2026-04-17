"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

const SEGMENT_LABELS: Record<string, string> = {
  members: "Members",
  loans: "Loans",
  savings: "Savings",
  payments: "Payments",
  reports: "Reports",
  investments: "Investments",
  accounting: "Accounting",
  admin: "Admin",
  audit: "Audit",
  edit: "Edit",
  new: "New",
};

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  // Only show breadcrumbs when we're 2+ levels deep
  if (segments.length < 2) return null;

  const crumbs = segments.map((seg, i) => {
    const href = "/" + segments.slice(0, i + 1).join("/");
    // UUIDs or IDs — shorten them
    const isId = seg.length > 16 && !SEGMENT_LABELS[seg];
    const label = SEGMENT_LABELS[seg] ?? (isId ? "Detail" : seg.charAt(0).toUpperCase() + seg.slice(1));
    return { href, label };
  });

  return (
    <nav className="hidden md:flex items-center gap-1 text-xs text-muted-foreground">
      <Link href="/" className="hover:text-foreground transition-colors">
        Dashboard
      </Link>
      {crumbs.map((crumb, i) => (
        <span key={crumb.href} className="flex items-center gap-1">
          <ChevronRight className="h-3 w-3" />
          {i === crumbs.length - 1 ? (
            <span className="text-foreground font-medium">{crumb.label}</span>
          ) : (
            <Link href={crumb.href} className="hover:text-foreground transition-colors">
              {crumb.label}
            </Link>
          )}
        </span>
      ))}
    </nav>
  );
}
