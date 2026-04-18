"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableRow,
  TableHead,
  TableHeader,
} from "@/components/ui/table";
import type { Member } from "@/lib/types";
import MemberActions from "./member-actions";

export default function MembersTable({ members }: { members: Member[] }) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? members.filter((m) => {
        const q = query.toLowerCase();
        return (
          (m.name ?? "").toLowerCase().includes(q) ||
          (m.memberId ?? "").toLowerCase().includes(q) ||
          (m.status ?? "").toLowerCase().includes(q) ||
          (m.phoneNumber ?? "").toLowerCase().includes(q)
        );
      })
    : members;

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by name, member ID, status…"
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
        <p className="py-10 text-center text-sm text-muted-foreground">
          No members match &quot;{query}&quot;
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="hidden w-[100px] sm:table-cell">
                <span className="sr-only">Image</span>
              </TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Member ID</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="hidden md:table-cell">Savings</TableHead>
              <TableHead className="hidden md:table-cell">Loan Balance</TableHead>
              <TableHead><span className="sr-only">Actions</span></TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((member) => (
              <TableRow key={member.id}>
                <MemberActions member={member} />
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
      <p className="mt-3 text-xs text-muted-foreground">
        Showing <strong>{filtered.length}</strong> of{" "}
        <strong>{members.length}</strong> members
      </p>
    </>
  );
}
