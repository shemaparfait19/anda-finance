"use client";

import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import type { Investment } from "@/lib/types";

export default function InvestmentsTable({ investments }: { investments: Investment[] }) {
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
    ? investments.filter((inv) => {
        const q = query.toLowerCase();
        return (
          (inv.name ?? "").toLowerCase().includes(q) ||
          (inv.type ?? "").toLowerCase().includes(q)
        );
      })
    : investments;

  return (
    <>
      <div className="relative mb-4 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by investment name or type…"
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
          No investments match &quot;{query}&quot;
        </p>
      ) : (
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Investment</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="hidden md:table-cell">Purchase Date</TableHead>
              <TableHead className="text-right">Amount Invested</TableHead>
              <TableHead className="text-right">Current Value</TableHead>
              <TableHead className="text-right">ROI (%)</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((inv) => (
              <TableRow key={inv.id}>
                <TableCell className="font-medium">{inv.name}</TableCell>
                <TableCell>{inv.type}</TableCell>
                <TableCell className="hidden md:table-cell">
                  {new Date(inv.purchaseDate).toLocaleDateString()}
                </TableCell>
                <TableCell className="text-right">RWF {inv.amountInvested.toLocaleString()}</TableCell>
                <TableCell className="text-right">RWF {inv.currentValue.toLocaleString()}</TableCell>
                <TableCell className={`text-right font-semibold ${inv.returnOnInvestment >= 0 ? "text-green-600" : "text-red-600"}`}>
                  {inv.returnOnInvestment.toFixed(2)}%
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      )}
    </>
  );
}
