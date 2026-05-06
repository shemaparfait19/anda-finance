"use client";

import { useRef, useEffect, useState } from "react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
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

  const filtered = allTx.filter((tx) => {
    const d = new Date(tx.date);
    if (fromDate && d < new Date(fromDate)) return false;
    if (toDate && d > new Date(toDate)) return false;
    return true;
  });

  const openingBalance = fromDate
    ? allTx
        .filter((tx) => new Date(tx.date) < new Date(fromDate))
        .reduce(
          (sum, tx) =>
            tx.type === "Deposit" ? sum + tx.amount : sum - tx.amount,
          0
        )
    : 0;

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

  // ── Download PDF — bank statement style ──────────────────────────────────
  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const M = 18;
    let y = 18;

    // Org name
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(ORGANIZATION_NAME, M, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(100, 100, 100);
    doc.text("Savings & Microfinance Institution", M, y);
    y += 4;

    // Top rule
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y);
    y += 6;

    // Title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("ACCOUNT STATEMENT", W / 2, y, { align: "center" });
    y += 8;

    // Account info — 2-column grid
    const col2 = W / 2 + 4;
    const infoRows: [string, string, number, number][] = [
      ["Account Holder",   account.memberName || account.accountName || "—", M,    y],
      ["Account Number",   account.accountNumber,                             col2, y],
      ["Account Type",     account.type,                                      M,    y + 9],
      ["Statement Period", periodLabel,                                        col2, y + 9],
      ["Statement Date",   statementDate,                                      M,    y + 18],
      ["Current Balance",  `RWF ${fmt(closingBalance)}`,                       col2, y + 18],
    ];

    infoRows.forEach(([label, value, x, iy]) => {
      doc.setFont("helvetica", "normal");
      doc.setFontSize(7);
      doc.setTextColor(100, 100, 100);
      doc.text(label, x, iy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(0, 0, 0);
      doc.text(value, x, iy + 4);
    });
    y += 27;

    // Thin divider
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;

    // Transactions table
    const body =
      rows.length > 0
        ? rows.map(({ tx, balance }) => [
            new Date(tx.date).toLocaleDateString("en-GB"),
            tx.reason || tx.id || "—",
            tx.type === "Withdrawal" ? fmt(tx.amount) : "",
            tx.type === "Deposit"    ? fmt(tx.amount) : "",
            fmt(balance),
          ])
        : [["—", "No transactions in this period", "", "", ""]];

    if (fromDate) {
      body.unshift([
        new Date(fromDate).toLocaleDateString("en-GB"),
        "Opening Balance",
        "", "",
        fmt(openingBalance),
      ]);
    }

    autoTable(doc, {
      startY: y,
      head: [["Date", "Description", "Withdrawals (RWF)", "Deposits (RWF)", "Balance (RWF)"]],
      body: [
        ...body,
        ["", "CLOSING BALANCE", "", "", fmt(closingBalance)],
      ],
      theme: "plain",
      margin: { left: M, right: M },
      headStyles: {
        fillColor: false as any,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 2, bottom: 3, left: 2, right: 2 },
        lineWidth: { bottom: 0.5 } as any,
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        textColor: [0, 0, 0],
        lineWidth: { bottom: 0.2 } as any,
        lineColor: [210, 210, 210],
      },
      alternateRowStyles: { fillColor: [248, 248, 248] },
      columnStyles: {
        0: { cellWidth: 22 },
        1: { cellWidth: "auto" },
        2: { halign: "right", cellWidth: 32 },
        3: { halign: "right", cellWidth: 32 },
        4: { halign: "right", cellWidth: 32, fontStyle: "bold" },
      },
      didParseCell: (data) => {
        const isClosing = data.row.index === body.length;
        if (isClosing) {
          data.cell.styles.fontStyle = "bold";
          data.cell.styles.fillColor = [235, 235, 235];
          (data.cell.styles as any).lineWidth = { top: 0.5, bottom: 0 };
          data.cell.styles.lineColor = [0, 0, 0];
        }
      },
    });

    // Summary — right-aligned
    const sumY = (doc as any).lastAutoTable.finalY + 6;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(W - M - 72, sumY, W - M, sumY);

    const summaryRows: [string, string][] = [
      ["Total Deposits",    `RWF ${fmt(totalDeposits)}`],
      ["Total Withdrawals", `RWF ${fmt(totalWithdrawals)}`],
      ["Closing Balance",   `RWF ${fmt(closingBalance)}`],
    ];
    let sY = sumY + 5;
    summaryRows.forEach(([label, value], i) => {
      const isBold = i === summaryRows.length - 1;
      doc.setFont("helvetica", isBold ? "bold" : "normal");
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);
      doc.text(label, W - M - 72, sY);
      doc.text(value, W - M, sY, { align: "right" });
      sY += 5;
    });
    // Final rule under summary
    doc.setLineWidth(0.4);
    doc.line(W - M - 72, sY - 2, W - M, sY - 2);

    // Footer
    const pgH = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(M, pgH - 14, W - M, pgH - 14);
    doc.text(
      `This is a system-generated statement and does not require a signature.  ·  ${ORGANIZATION_NAME}  ·  Generated: ${statementDate}`,
      W / 2, pgH - 9,
      { align: "center" }
    );

    doc.save(`Statement_${account.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Account Statement</DialogTitle>
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

        {/* Statement body — unchanged from original */}
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
