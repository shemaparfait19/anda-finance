"use client";

import { useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import type { CashbookEntry } from "@/lib/types";
import CashbookRowActions from "./cashbook-row-actions";

export default function CashbookTable({
  data,
  type,
}: {
  data: CashbookEntry[];
  type: "Income" | "Expenses";
}) {
  const [query, setQuery] = useState("");

  const filtered = query.trim()
    ? data.filter((e) => {
        const q = query.toLowerCase();
        return (
          (e.description ?? "").toLowerCase().includes(q) ||
          (e.category ?? "").toLowerCase().includes(q)
        );
      })
    : data;

  const total = filtered.reduce((acc, entry) => acc + entry.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type}</CardTitle>
        <CardDescription>
          All {type.toLowerCase()} recorded in the cashbook.
        </CardDescription>
        <div className="relative max-w-sm pt-2">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search by description or category…"
            className="pl-9 pr-9"
          />
          {query && (
            <button onClick={() => setQuery("")} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground">
              <X className="h-4 w-4" />
            </button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Description</TableHead>
              <TableHead className="hidden md:table-cell">Category</TableHead>
              <TableHead className="text-right">Amount</TableHead>
              <TableHead>
                <span className="sr-only">Actions</span>
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-10 text-center text-sm text-muted-foreground">
                  No entries match &quot;{query}&quot;
                </TableCell>
              </TableRow>
            ) : (
              filtered.map((entry) => (
                <TableRow key={entry.id}>
                  <TableCell>
                    {new Date(entry.date).toLocaleDateString()}
                  </TableCell>
                  <TableCell className="font-medium">
                    {entry.description}
                  </TableCell>
                  <TableCell className="hidden md:table-cell">
                    {entry.category}
                  </TableCell>
                  <TableCell className="text-right">
                    RWF {entry.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    <CashbookRowActions
                      entry={entry}
                      type={type.toLowerCase() as "income" | "expenses"}
                    />
                  </TableCell>
                </TableRow>
              ))
            )}
            <TableRow className="bg-muted/50 font-bold">
              <TableCell colSpan={4} className="text-right font-semibold">
                Total
              </TableCell>
              <TableCell className="text-right font-semibold">
                RWF {total.toLocaleString()}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </CardContent>
    </Card>
  );
}
