"use client";

import { useState, useTransition } from "react";
import { FileDown, MessageSquare, Loader2, AlertCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import { useToast } from "@/hooks/use-toast";
import { getSkippedSavings, type SkippedSavingsRow } from "./actions";

function monthLabel(month: string) {
  if (!month) return "";
  const [y, m] = month.split("-");
  return new Date(Number(y), Number(m) - 1, 1).toLocaleString("en-RW", { month: "short", year: "2-digit" });
}

function currentMonth() {
  const now = new Date();
  return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
}

async function downloadExcel(month: string, rows: SkippedSavingsRow[]) {
  const XLSX = await import("xlsx");
  const label = monthLabel(month);
  const header = ["No", "Names", "Phone Contact", `Monthly SHARE(S) (${label})`, "Other Individual Savings", "Status"];
  const data = rows.map((r) => [
    r.no,
    r.name,
    r.phone,
    r.paidShares,
    r.paidOther,
    r.isSkipped ? "SKIPPED" : "PAID",
  ]);
  const ws = XLSX.utils.aoa_to_sheet([header, ...data]);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, "Skipped Savings");
  XLSX.writeFile(wb, `skipped-savings-${month}.xlsx`);
}

async function downloadPDF(month: string, rows: SkippedSavingsRow[], groupName?: string) {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;
  const doc = new jsPDF({ orientation: "landscape" });
  const label = monthLabel(month);
  const pageW = doc.internal.pageSize.getWidth();

  // Title block
  doc.setFontSize(14);
  doc.setFont("helvetica", "bold");
  doc.text("SKIPPED SAVINGS", pageW / 2, 15, { align: "center" });
  let y = 22;
  if (groupName) {
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(groupName, pageW / 2, y, { align: "center" });
    y += 7;
  }
  doc.setFontSize(10);
  doc.setFont("helvetica", "normal");
  doc.text(`Period: ${label}`, pageW / 2, y, { align: "center" });

  autoTable(doc, {
    startY: y + 6,
    theme: "plain",
    head: [["No", "Names", "Phone Contact", `Monthly SHARE(S) (RWF)`, "Other Individual Savings (RWF)"]],
    body: rows.map((r) => [
      r.no,
      r.name,
      r.phone,
      r.paidShares > 0 ? r.paidShares.toLocaleString() : "0",
      r.paidOther  > 0 ? r.paidOther.toLocaleString()  : "0",
    ]),
    styles: {
      fontSize: 9,
      cellPadding: { top: 3, right: 4, bottom: 3, left: 4 },
      textColor: [30, 30, 30],
      lineColor: [180, 180, 180],
      lineWidth: 0.1,
    },
    headStyles: {
      fillColor: [34, 85, 34],
      textColor: [255, 255, 255],
      fontStyle: "bold",
      lineColor: [34, 85, 34],
      lineWidth: 0,
    },
    alternateRowStyles: {
      fillColor: [248, 248, 248],
    },
    columnStyles: {
      0: { cellWidth: 12, halign: "center" },
      3: { halign: "right" },
      4: { halign: "right" },
    },
    // Draw a simple bottom border under each row instead of full cell boxes
    didDrawCell: (data: any) => {
      if (data.section === "body") {
        const { doc: d, cell } = data;
        d.setDrawColor(200, 200, 200);
        d.setLineWidth(0.1);
        d.line(cell.x, cell.y + cell.height, cell.x + cell.width, cell.y + cell.height);
      }
    },
  });

  doc.save(`skipped-savings-${month}.pdf`);
}

export default function SkippedSavingsReport() {
  const [month, setMonth]       = useState(currentMonth);
  const [rows, setRows]         = useState<SkippedSavingsRow[] | null>(null);
  const [smsOpen, setSmsOpen]   = useState(false);
  const [isPending, startTransition] = useTransition();
  const { toast } = useToast();

  const skipped = rows?.filter((r) => r.isSkipped) ?? [];
  const paid    = rows?.filter((r) => !r.isSkipped) ?? [];

  const load = () => {
    startTransition(async () => {
      const res = await getSkippedSavings(month);
      if (!res.success) {
        toast({ title: "Error", description: res.error, variant: "destructive" });
        return;
      }
      setRows(res.rows ?? []);
    });
  };

  const smsText = skipped
    .map((r) => `${r.name} (${r.phone}): RWF ${r.monthlyContribution.toLocaleString()} due`)
    .join("\n");

  return (
    <div className="space-y-4">
      {/* Controls */}
      <div className="flex flex-wrap items-end gap-3">
        <div className="grid gap-1">
          <Label htmlFor="skip-month">Month</Label>
          <Input
            id="skip-month"
            type="month"
            value={month}
            onChange={(e) => { setMonth(e.target.value); setRows(null); }}
            className="w-40"
          />
        </div>
        <Button onClick={load} disabled={isPending}>
          {isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
          Generate
        </Button>
        {rows && (
          <>
            <Button variant="outline" size="sm" onClick={() => downloadExcel(month, rows)}>
              <FileDown className="mr-1.5 h-4 w-4" /> Excel
            </Button>
            <Button variant="outline" size="sm" onClick={() => downloadPDF(month, rows)}>
              <FileDown className="mr-1.5 h-4 w-4" /> PDF
            </Button>
            {skipped.length > 0 && (
              <Button variant="secondary" size="sm" onClick={() => setSmsOpen(true)}>
                <MessageSquare className="mr-1.5 h-4 w-4" />
                SMS List ({skipped.length})
              </Button>
            )}
          </>
        )}
      </div>

      {/* Summary badges */}
      {rows && (
        <div className="flex gap-3 flex-wrap">
          <Badge variant="outline" className="text-sm py-1 px-3">
            Total members: {rows.length}
          </Badge>
          <Badge variant="destructive" className="text-sm py-1 px-3">
            Skipped: {skipped.length}
          </Badge>
          <Badge className="text-sm py-1 px-3 bg-green-600 hover:bg-green-700">
            Paid: {paid.length}
          </Badge>
        </div>
      )}

      {/* Table */}
      {rows && (
        <div className="rounded-md border overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow className="bg-green-900 hover:bg-green-900">
                <TableHead className="text-white font-bold text-center w-12">No</TableHead>
                <TableHead className="text-white font-bold">Names</TableHead>
                <TableHead className="text-white font-bold">Phone Contact</TableHead>
                <TableHead className="text-white font-bold text-right">
                  Monthly SHARE(S)<br />
                  <span className="text-xs font-normal opacity-80">{monthLabel(month)} (RWF)</span>
                </TableHead>
                <TableHead className="text-white font-bold text-right">
                  Other Individual<br />
                  <span className="text-xs font-normal opacity-80">Savings (RWF)</span>
                </TableHead>
                <TableHead className="text-white font-bold text-center">Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                    No active members found.
                  </TableCell>
                </TableRow>
              )}
              {rows.map((r) => (
                <TableRow
                  key={r.memberId}
                  className={r.isSkipped ? "bg-red-50 dark:bg-red-950/20" : ""}
                >
                  <TableCell className="text-center font-medium text-sm">{r.no}</TableCell>
                  <TableCell className="font-medium text-sm">{r.name}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{r.phone}</TableCell>
                  <TableCell className="text-right text-sm">
                    {r.paidShares > 0 ? r.paidShares.toLocaleString() : <span className="text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-right text-sm">
                    {r.paidOther > 0 ? r.paidOther.toLocaleString() : <span className="text-muted-foreground">0</span>}
                  </TableCell>
                  <TableCell className="text-center">
                    {r.isSkipped ? (
                      <Badge variant="destructive" className="text-xs">Skipped</Badge>
                    ) : (
                      <Badge className="text-xs bg-green-600 hover:bg-green-700">Paid</Badge>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}

      {/* SMS list dialog */}
      <Dialog open={smsOpen} onOpenChange={setSmsOpen}>
        <DialogContent className="sm:max-w-lg">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-destructive" />
              SMS Reminder List — {monthLabel(month)}
            </DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            {skipped.length} member{skipped.length !== 1 ? "s" : ""} have not paid their savings for {monthLabel(month)}.
            Copy this list to your SMS tool.
          </p>
          <div className="rounded-md border bg-muted/50 p-3 max-h-64 overflow-y-auto">
            <pre className="text-xs whitespace-pre-wrap font-mono">{smsText}</pre>
          </div>
          <Button
            variant="outline"
            size="sm"
            onClick={() => { navigator.clipboard.writeText(smsText); toast({ title: "Copied to clipboard" }); }}
          >
            Copy to clipboard
          </Button>
        </DialogContent>
      </Dialog>
    </div>
  );
}
