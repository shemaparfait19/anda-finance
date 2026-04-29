"use client";

import { usePathname } from "next/navigation";
import Link from "next/link";
import { ChevronRight, ChevronLeft } from "lucide-react";

const LABELS: Record<string, string> = {
  members:     "Members",
  loans:       "Loans",
  savings:     "Savings",
  payments:    "Payments",
  reports:     "Reports",
  investments: "Investments",
  accounting:  "Accounting",
  admin:       "Admin",
  audit:       "Audit",
  edit:        "Edit",
  new:         "New",
};

function segLabel(seg: string) {
  if (LABELS[seg]) return LABELS[seg];
  // Long IDs (UUIDs etc.) → "Detail"
  if (seg.length > 20) return "Detail";
  return seg.charAt(0).toUpperCase() + seg.slice(1);
}

export function Breadcrumbs() {
  const pathname = usePathname();

  if (pathname === "/") return null;

  const segments = pathname.split("/").filter(Boolean);

  const crumbs = [
    { href: "/", label: "Dashboard" },
    ...segments.map((seg, i) => ({
      href: "/" + segments.slice(0, i + 1).join("/"),
      label: segLabel(seg),
    })),
  ];

  const parent = crumbs[crumbs.length - 2];

  return (
    <>
      {/* ── Mobile: back link ───────────────────────────────────────── */}
      <Link
        href={parent.href}
        className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground transition-colors md:hidden"
      >
        <ChevronLeft className="h-3 w-3" />
        {parent.label}
      </Link>

      {/* ── Desktop: full trail ─────────────────────────────────────── */}
      <nav className="hidden md:flex items-center gap-0.5 text-xs text-muted-foreground">
        {crumbs.map((crumb, i) => {
          const isLast = i === crumbs.length - 1;
          return (
            <span key={crumb.href} className="flex items-center gap-0.5">
              {i > 0 && <ChevronRight className="h-3 w-3 shrink-0 opacity-40" />}
              {isLast ? (
                <span className="font-medium text-foreground truncate max-w-[160px]">
                  {crumb.label}
                </span>
              ) : (
                <Link
                  href={crumb.href}
                  className="hover:text-foreground transition-colors truncate max-w-[120px]"
                >
                  {crumb.label}
                </Link>
              )}
            </span>
          );
        })}
      </nav>
    </>
  );
}
