"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X, ArrowDownCircle, ArrowUpCircle, Banknote, RefreshCw } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Transaction } from "@/lib/types";

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Deposit:             { label: "Deposit",            color: "text-green-600",  icon: <ArrowDownCircle className="h-4 w-4 text-green-600" /> },
  Withdrawal:          { label: "Withdrawal",          color: "text-red-600",    icon: <ArrowUpCircle className="h-4 w-4 text-red-600" /> },
  "Loan Repayment":    { label: "Loan Repayment",      color: "text-blue-600",   icon: <RefreshCw className="h-4 w-4 text-blue-600" /> },
  "Loan Disbursement": { label: "Loan Disbursement",   color: "text-orange-600", icon: <Banknote className="h-4 w-4 text-orange-600" /> },
};

export default function PaymentsTable({ transactions }: { transactions: Transaction[] }) {
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
    ? transactions.filter((tx) => {
        const q = query.toLowerCase();
        return (
          (tx.member.name ?? "").toLowerCase().includes(q) ||
          (tx.type ?? "").toLowerCase().includes(q) ||
          (tx.status ?? "").toLowerCase().includes(q)
        );
      })
    : transactions;

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by member, type, or status…"
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
          No transactions match &quot;{query}&quot;
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Member</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Date</TableHead>
              <TableHead className="hidden md:table-cell">Status</TableHead>
              <TableHead className="text-right">Amount (RWF)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((tx) => {
              const meta = TYPE_META[tx.type] ?? { label: tx.type, color: "", icon: null };
              return (
                <TableRow key={tx.id}>
                  <TableCell className="font-medium">{tx.member.name}</TableCell>
                  <TableCell>
                    <span className={`flex items-center gap-1 text-sm ${meta.color}`}>
                      {meta.icon}{meta.label}
                    </span>
                  </TableCell>
                  <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                    {new Date(tx.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    <Badge variant={tx.status === "Completed" ? "success" : tx.status === "Failed" ? "destructive" : "warning"}>
                      {tx.status}
                    </Badge>
                  </TableCell>
                  <TableCell className={`text-right font-medium ${meta.color}`}>
                    {tx.type === "Withdrawal" || tx.type === "Loan Disbursement" ? "-" : "+"}
                    {tx.amount.toLocaleString()}
                  </TableCell>
                </TableRow>
              );
            })}
          </TableBody>
        </Table>
      )}
    </>
  );
}
