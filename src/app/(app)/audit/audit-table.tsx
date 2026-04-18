"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import Image from "next/image";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { getPlaceholderImage } from "@/lib/placeholder-images";
import type { AuditLog } from "@/lib/types";

export default function AuditTable({ logs }: { logs: AuditLog[] }) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();

  const query = searchParams.get("q") ?? "";

  const setQuery = (value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (value.trim()) params.set("q", value.trim());
    else params.delete("q");
    router.replace(`${pathname}?${params.toString()}`);
  };

  const filtered = query.trim()
    ? logs.filter((log) => {
        const q = query.toLowerCase();
        return (
          (log.user.name ?? "").toLowerCase().includes(q) ||
          (log.action ?? "").toLowerCase().includes(q) ||
          (log.details ?? "").toLowerCase().includes(q)
        );
      })
    : logs;

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by user, action, or details…"
          className="pl-9 pr-9"
        />
        {query && (
          <button
            onClick={() => setQuery("")}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        )}
      </div>

      {filtered.length === 0 ? (
        <p className="py-8 text-center text-sm text-muted-foreground">
          No logs match &quot;{query}&quot;
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User</TableHead>
              <TableHead>Action</TableHead>
              <TableHead className="hidden md:table-cell">Timestamp</TableHead>
              <TableHead>Details</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((log) => {
              const image = getPlaceholderImage(log.user.avatarId);
              return (
                <TableRow key={log.id}>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Image
                        alt={`Avatar of ${log.user.name}`}
                        className="aspect-square rounded-full object-cover"
                        height="32"
                        width="32"
                        src={image.imageUrl}
                        data-ai-hint={image.imageHint}
                      />
                      <span className="font-medium">{log.user.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>{log.action}</TableCell>
                  <TableCell className="hidden md:table-cell">{log.timestamp}</TableCell>
                  <TableCell>{log.details}</TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
