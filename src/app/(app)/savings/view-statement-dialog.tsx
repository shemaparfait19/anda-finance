"use client";

import { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Download, Printer, X } from "lucide-react";
import type { SavingsAccount, Transaction } from "@/lib/types";
import { getTransactionsByAccountNumber } from "@/lib/data-service";
import { ORGANIZATION_NAME } from "@/lib/statement-utils";

interface ViewStatementDialogProps {
  account: SavingsAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

const th =
  "border border-gray-400 bg-[#2A7886] text-white text-xs font-semibold px-2 py-1 text-center";
const td = "border border-gray-300 text-xs px-2 py-1";
const tdRight = "border border-gray-300 text-xs px-2 py-1 text-right";

function fmt(n: number) {
  return n.toLocaleString();
}

export default function ViewStatementDialog({
  account,
  open,
  onOpenChange,
}: ViewStatementDialogProps) {
  const printRef = useRef<HTMLDivElement>(null);
  const [allTx, setAllTx] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");

  useEffect(() => {
    if (open) {
      setLoading(true);
      setFromDate("");
      setToDate("");
      if (!account.accountNumber) {
        setAllTx([]);
        setLoading(false);
        return;
      }
      getTransactionsByAccountNumber(account.accountNumber)
        .then((data) => {
          const sorted = [...data].sort(
            (a, b) => new Date(a.date).getTime() - new Date(b.date).getTime()
          );
          setAllTx(sorted);
        })
        .finally(() => setLoading(false));
    }
  }, [open, account.accountNumber]);

  // Apply date range filter
  const filtered = allTx.filter((tx) => {
    const d = new Date(tx.date);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate)) return false;
    return true;
  });

  // Opening balance = sum of all transactions BEFORE fromDate
  const openingBalance = fromDate
    ? allTx
        .filter((tx) => new Date(tx.date) < new Date(fromDate))
        .reduce(
          (sum, tx) =>
            tx.type === "Deposit" ? sum + tx.amount : sum - tx.amount,
          0
        )
    : 0;

  // Build rows with running balance starting from openingBalance
  const rows = filtered.reduce<{ tx: Transaction; balance: number }[]>(
    (acc, tx) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].balance : openingBalance;
      const balance =
        tx.type === "Deposit" ? prev + tx.amount : prev - tx.amount;
      return [...acc, { tx, balance }];
    },
    []
  );

  const totalDeposits = filtered
    .filter((t) => t.type === "Deposit")
    .reduce((s, t) => s + t.amount, 0);
  const totalWithdrawals = filtered
    .filter((t) => t.type === "Withdrawal")
    .reduce((s, t) => s + t.amount, 0);

  const closingBalance = account.balance;

  const statementDate = new Date().toLocaleDateString("en-GB", {
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const periodLabel =
    fromDate || toDate
      ? `${fromDate ? new Date(fromDate).toLocaleDateString() : "Beginning"} – ${toDate ? new Date(toDate).toLocaleDateString() : "Today"}`
      : "All Transactions";

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${ORGANIZATION_NAME} — Statement ${account.accountNumber}</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
            table { border-collapse: collapse; width: 100%; margin-bottom: 6px; }
            th, td { border: 1px solid #ccc; padding: 4px 6px; }
            th { background: #2A7886; color: white; }
            .credit  { color: #16a34a; font-weight: 600; }
            .debit   { color: #dc2626; font-weight: 600; }
            .total-row { background: #E8F4F8; font-weight: bold; }
            .footer  { font-size: 9px; color: #999; text-align: center; margin-top: 8px; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  // ── Download PDF ──────────────────────────────────────────────────────────
  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 14;

    // Header
    doc.setFillColor(42, 120, 134);
    doc.rect(0, 0, W, 30, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text(ORGANIZATION_NAME, W / 2, 12, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(210, 235, 238);
    doc.text("SAVINGS ACCOUNT STATEMENT", W / 2, 21, { align: "center" });

    // Meta
    doc.setFillColor(248, 249, 250);
    doc.rect(0, 30, W, 30, "F");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(0, 30, W, 30, "S");

    const col2 = W / 2 + 4;
    const meta: [string, string, number, number][] = [
      ["Account Name", account.memberName || account.accountName || "—", M, 38],
      ["Account No.", account.accountNumber, col2, 38],
      ["Account Type", account.type, M, 50],
      ["Period", periodLabel, col2, 50],
      ["Statement Date", statementDate, M, 56],
    ];
    meta.forEach(([label, value, x, y]) => {
      doc.setFontSize(7);
      doc.setTextColor(120, 120, 120);
      doc.setFont("helvetica", "normal");
      doc.text(label, x, y - 4);
      doc.setFontSize(8.5);
      doc.setTextColor(30, 30, 30);
      doc.setFont("helvetica", "bold");
      doc.text(value, x, y);
    });

    // Balance badge
    const bX = W - M - 30;
    doc.setFillColor(42, 120, 134);
    doc.roundedRect(bX, 32, 30, 14, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(8);
    doc.setTextColor(255, 255, 255);
    doc.text(`RWF ${fmt(closingBalance)}`, bX + 15, 40, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Current Balance", bX + 15, 45, { align: "center" });

    // Transactions table
    const body =
      rows.length > 0
        ? rows.map(({ tx, balance }) => [
            new Date(tx.date).toLocaleDateString("en-GB"),
            `${tx.id}${tx.reason ? ` | ${tx.reason}` : ""}`,
            tx.type === "Deposit" ? fmt(tx.amount) : "",
            tx.type === "Withdrawal" ? fmt(tx.amount) : "",
            fmt(balance),
          ])
        : [["—", "No transactions in this period", "", "", ""]];

    autoTable(doc, {
      startY: 64,
      head: [["Date", "Description", "Deposit (RWF)", "Withdraw (RWF)", "Balance (RWF)"]],
      body: [
        ...body,
        ["", "CLOSING BALANCE", "", "", fmt(closingBalance)],
      ],
      theme: "grid",
      margin: { left: M, right: M },
      headStyles: {
        fillColor: [42, 120, 134],
        textColor: 255,
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: 3,
      },
      bodyStyles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
      columnStyles: {
        0: { cellWidth: 24 },
        1: { cellWidth: "auto" },
        2: { halign: "right", cellWidth: 30 },
        3: { halign: "right", cellWidth: 30 },
        4: { halign: "right", cellWidth: 30, fontStyle: "bold" },
      },
      didParseCell: (hookData) => {
        if (hookData.row.index === body.length) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [235, 245, 247];
        }
        if (
          hookData.column.index === 2 &&
          hookData.section === "body" &&
          hookData.cell.raw !== ""
        ) {
          hookData.cell.styles.textColor = [22, 163, 74];
        }
        if (
          hookData.column.index === 3 &&
          hookData.section === "body" &&
          hookData.cell.raw !== ""
        ) {
          hookData.cell.styles.textColor = [220, 38, 38];
        }
      },
    });

    // Summary
    const sumY = (doc as any).lastAutoTable.finalY + 5;
    autoTable(doc, {
      startY: sumY,
      body: [
        ["Total Deposits", fmt(totalDeposits)],
        ["Total Withdrawals", fmt(totalWithdrawals)],
        ["Closing Balance", fmt(closingBalance)],
      ],
      theme: "grid",
      margin: { left: M, right: M },
      bodyStyles: { fontSize: 8, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: "auto", fontStyle: "bold" },
        1: { halign: "right", cellWidth: 40 },
      },
      didParseCell: (hookData) => {
        if (hookData.row.index === 2) {
          hookData.cell.styles.fillColor = [235, 245, 247];
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });

    const footerY = (doc as any).lastAutoTable.finalY + 8;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `System-generated statement · ${ORGANIZATION_NAME} · ${statementDate}`,
      W / 2,
      footerY,
      { align: "center" }
    );

    doc.save(
      `${ORGANIZATION_NAME.replace(/\s+/g, "_")}_Acct_${account.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        {/* Custom close */}
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-full bg-[#2A7886] p-1 text-white hover:bg-[#1e6270]"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Top bar: date filters + action buttons */}
        <div className="flex flex-wrap items-end gap-3 px-4 pt-4 pb-3 border-b">
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs mb-1 block">From</Label>
              <Input
                type="date"
                value={fromDate}
                onChange={(e) => setFromDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            <div>
              <Label className="text-xs mb-1 block">To</Label>
              <Input
                type="date"
                value={toDate}
                onChange={(e) => setToDate(e.target.value)}
                className="h-8 text-xs w-36"
              />
            </div>
            {(fromDate || toDate) && (
              <Button
                variant="ghost"
                size="sm"
                className="h-8 text-xs"
                onClick={() => { setFromDate(""); setToDate(""); }}
              >
                Clear
              </Button>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-2" />
              Print
            </Button>
            <Button size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-2" />
              Download PDF
            </Button>
          </div>
        </div>

        {/* Statement body */}
        <div ref={printRef} className="mx-4 mb-4 mt-3 border rounded-lg overflow-hidden font-mono text-xs bg-white">
          {/* Header */}
          <div className="bg-[#2A7886] text-white text-center py-3 px-4">
            <h2 className="text-base font-bold tracking-wide">{ORGANIZATION_NAME}</h2>
            <p className="text-xs opacity-90">SAVINGS ACCOUNT STATEMENT</p>
          </div>

          {/* Meta */}
          <div className="grid grid-cols-2 gap-x-4 px-4 py-3 bg-gray-50 border-b text-xs">
            <div>
              <span className="text-muted-foreground">Account Name: </span>
              <span className="font-semibold">
                {account.memberName || account.accountName || "—"}
              </span>
            </div>
            <div className="flex justify-between items-start">
              <div>
                <span className="text-muted-foreground">Account No: </span>
                <span className="font-semibold">{account.accountNumber}</span>
              </div>
              <div className="bg-[#2A7886] text-white rounded px-3 py-1 text-sm font-bold whitespace-nowrap">
                RWF {fmt(closingBalance)}
              </div>
            </div>
            <div>
              <span className="text-muted-foreground">Account Type: </span>
              <span className="font-semibold">{account.type}</span>
            </div>
            <div>
              <span className="text-muted-foreground">Period: </span>
              <span className="font-semibold">{periodLabel}</span>
            </div>
          </div>

          {/* Transaction table */}
          <table className="w-full border-collapse">
            <thead>
              <tr>
                <th className={`${th} text-left w-24`}>Date</th>
                <th className={`${th} text-left`}>Description</th>
                <th className={th}>Deposit (RWF)</th>
                <th className={th}>Withdraw (RWF)</th>
                <th className={th}>Balance (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className={`${td} text-center py-6 text-muted-foreground`}>
                    Loading transactions…
                  </td>
                </tr>
              ) : rows.length > 0 ? (
                <>
                  {rows.map(({ tx, balance }, i) => (
                    <tr key={i}>
                      <td className={td}>
                        {new Date(tx.date).toLocaleDateString()}
                      </td>
                      <td className={td}>
                        <span className="font-mono text-[10px] text-muted-foreground">{tx.id}</span>
                        {tx.reason && <span className="ml-1">| {tx.reason}</span>}
                      </td>
                      <td className={tdRight}>
                        {tx.type === "Deposit" ? (
                          <span className="text-green-700 font-semibold">{fmt(tx.amount)}</span>
                        ) : ""}
                      </td>
                      <td className={tdRight}>
                        {tx.type === "Withdrawal" ? (
                          <span className="text-red-600 font-semibold">{fmt(tx.amount)}</span>
                        ) : ""}
                      </td>
                      <td className={`${tdRight} font-semibold`}>{fmt(balance)}</td>
                    </tr>
                  ))}
                  <tr className="bg-[#E8F4F8]">
                    <td className={`${td} font-bold`} colSpan={2}>
                      CLOSING BALANCE
                    </td>
                    <td className={td}></td>
                    <td className={td}></td>
                    <td className={`${tdRight} font-bold`}>{fmt(closingBalance)}</td>
                  </tr>
                </>
              ) : (
                <tr>
                  <td colSpan={5} className={`${td} text-center py-6 text-muted-foreground`}>
                    No transactions found{fromDate || toDate ? " in this period" : ""}.
                  </td>
                </tr>
              )}
            </tbody>
          </table>

          {/* Summary */}
          <table className="w-full border-collapse mt-2">
            <tbody>
              <tr>
                <td className={`${td} font-semibold w-1/2`}>Total Deposits</td>
                <td className={`${tdRight} text-green-700 font-semibold`}>{fmt(totalDeposits)}</td>
              </tr>
              <tr>
                <td className={`${td} font-semibold`}>Total Withdrawals</td>
                <td className={`${tdRight} text-red-600 font-semibold`}>{fmt(totalWithdrawals)}</td>
              </tr>
              <tr className="bg-[#E8F4F8]">
                <td className={`${td} font-bold`}>Closing Balance</td>
                <td className={`${tdRight} font-bold`}>{fmt(closingBalance)}</td>
              </tr>
            </tbody>
          </table>

          <div className="px-4 py-2 text-[10px] text-muted-foreground border-t">
            System-generated statement · {ORGANIZATION_NAME} · {statementDate}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
