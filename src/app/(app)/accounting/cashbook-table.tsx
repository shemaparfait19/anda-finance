"use client";

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
  const total = data.reduce((acc, entry) => acc + entry.amount, 0);

  return (
    <Card>
      <CardHeader>
        <CardTitle>{type}</CardTitle>
        <CardDescription>
          All {type.toLowerCase()} recorded in the cashbook.
        </CardDescription>
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
            {data.map((entry) => (
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
            ))}
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
