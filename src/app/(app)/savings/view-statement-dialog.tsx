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

function fmt(n: number) {
  return n.toLocaleString("en-US", { minimumFractionDigits: 0 });
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
        .reduce((sum, tx) =>
          tx.type === "Deposit" ? sum + tx.amount : sum - tx.amount, 0)
    : 0;

  const rows = filtered.reduce<{ tx: Transaction; balance: number }[]>(
    (acc, tx) => {
      const prev = acc.length > 0 ? acc[acc.length - 1].balance : openingBalance;
      const balance = tx.type === "Deposit" ? prev + tx.amount : prev - tx.amount;
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
    day: "numeric", month: "long", year: "numeric",
  });

  const periodLabel =
    fromDate || toDate
      ? `${fromDate ? new Date(fromDate).toLocaleDateString("en-GB") : "All dates"} to ${toDate ? new Date(toDate).toLocaleDateString("en-GB") : "present"}`
      : "All transactions";

  // ── Print ─────────────────────────────────────────────────────────────────
  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html>
        <head>
          <title>${ORGANIZATION_NAME} — Account Statement ${account.accountNumber}</title>
          <style>
            * { box-sizing: border-box; margin: 0; padding: 0; }
            body { font-family: Arial, Helvetica, sans-serif; font-size: 10px; color: #000; background: #fff; padding: 24px; }
            .statement { max-width: 720px; margin: 0 auto; }
            .org-name { font-size: 18px; font-weight: bold; letter-spacing: 0.5px; }
            .org-sub  { font-size: 10px; color: #555; margin-top: 2px; }
            .divider  { border: none; border-top: 2px solid #000; margin: 10px 0 6px; }
            .divider-thin { border: none; border-top: 1px solid #ccc; margin: 6px 0; }
            .title    { font-size: 12px; font-weight: bold; text-align: center; letter-spacing: 1px; text-transform: uppercase; margin-bottom: 10px; }
            .info-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 4px 16px; margin-bottom: 10px; }
            .info-row  { display: flex; gap: 4px; }
            .info-label { color: #555; min-width: 90px; }
            .info-value { font-weight: bold; }
            table  { width: 100%; border-collapse: collapse; margin-top: 8px; }
            thead tr { border-bottom: 2px solid #000; }
            th { font-size: 9px; font-weight: bold; padding: 4px 6px; text-align: left; white-space: nowrap; }
            th.r { text-align: right; }
            tbody tr { border-bottom: 1px solid #ddd; }
            tbody tr:nth-child(even) { background: #f7f7f7; }
            td { font-size: 9px; padding: 4px 6px; }
            td.r { text-align: right; font-family: 'Courier New', monospace; }
            td.cr { color: #000; }
            td.dr { color: #000; }
            .summary-table { margin-top: 10px; border-top: 2px solid #000; }
            .summary-table td { padding: 3px 6px; font-size: 9px; }
            .summary-total td { font-weight: bold; border-top: 1px solid #000; }
            .footer { margin-top: 16px; font-size: 8px; color: #777; border-top: 1px solid #ccc; padding-top: 6px; }
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
    const M = 18;
    let y = 18;

    // ── Org header ────────────────────────────────────────────────────────
    doc.setFont("helvetica", "bold");
    doc.setFontSize(16);
    doc.setTextColor(0, 0, 0);
    doc.text(ORGANIZATION_NAME, M, y);
    y += 5;
    doc.setFont("helvetica", "normal");
    doc.setFontSize(8);
    doc.setTextColor(80, 80, 80);
    doc.text("Savings & Microfinance Institution", M, y);
    y += 4;

    // Top rule
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y);
    y += 5;

    // Section title
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(0, 0, 0);
    doc.text("ACCOUNT STATEMENT", W / 2, y, { align: "center" });
    y += 7;

    // ── Account info grid ─────────────────────────────────────────────────
    const labelColor: [number, number, number] = [90, 90, 90];
    const valueColor: [number, number, number] = [0, 0, 0];
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
      doc.setTextColor(...labelColor);
      doc.text(label, x, iy);
      doc.setFont("helvetica", "bold");
      doc.setFontSize(8.5);
      doc.setTextColor(...valueColor);
      doc.text(value, x, iy + 4);
    });
    y += 27;

    // Thin rule under info
    doc.setDrawColor(180, 180, 180);
    doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;

    // ── Transactions table ────────────────────────────────────────────────
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
        fromDate ? new Date(fromDate).toLocaleDateString("en-GB") : "—",
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
        fillColor: false,
        textColor: [0, 0, 0],
        fontStyle: "bold",
        fontSize: 8,
        cellPadding: { top: 2, bottom: 3, left: 2, right: 2 },
        lineWidth: { bottom: 0.5 },
        lineColor: [0, 0, 0],
      },
      bodyStyles: {
        fontSize: 8,
        cellPadding: { top: 2, bottom: 2, left: 2, right: 2 },
        textColor: [0, 0, 0],
        lineWidth: { bottom: 0.2 },
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
          data.cell.styles.fillColor = [240, 240, 240];
          data.cell.styles.lineWidth = { top: 0.5, bottom: 0 };
          data.cell.styles.lineColor = [0, 0, 0];
        }
      },
    });

    // ── Summary ───────────────────────────────────────────────────────────
    const sumY = (doc as any).lastAutoTable.finalY + 6;
    doc.setDrawColor(0, 0, 0);
    doc.setLineWidth(0.4);
    doc.line(W - M - 70, sumY, W - M, sumY);

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
      doc.text(label, W - M - 70, sY);
      doc.text(value, W - M, sY, { align: "right" });
      sY += 5;
      if (isBold) {
        doc.setDrawColor(0, 0, 0);
        doc.setLineWidth(0.4);
        doc.line(W - M - 70, sY - 3, W - M, sY - 3);
      }
    });

    // ── Footer ────────────────────────────────────────────────────────────
    const pgH = doc.internal.pageSize.getHeight();
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(140, 140, 140);
    doc.setDrawColor(200, 200, 200);
    doc.setLineWidth(0.2);
    doc.line(M, pgH - 14, W - M, pgH - 14);
    doc.text(
      `This is a system-generated statement and does not require a signature.  ·  ${ORGANIZATION_NAME}  ·  Generated: ${statementDate}`,
      W / 2, pgH - 9,
      { align: "center" }
    );

    doc.save(
      `Statement_${account.accountNumber}_${new Date().toISOString().split("T")[0]}.pdf`
    );
  };

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl max-h-[92vh] overflow-y-auto p-0">
        <DialogTitle className="sr-only">Account Statement — {account.accountNumber}</DialogTitle>

        {/* Toolbar */}
        <div className="flex flex-wrap items-end gap-3 px-4 pt-4 pb-3 border-b bg-muted/30">
          <div className="flex items-end gap-2">
            <div>
              <Label className="text-xs mb-1 block">From</Label>
              <Input type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            <div>
              <Label className="text-xs mb-1 block">To</Label>
              <Input type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="h-8 text-xs w-36" />
            </div>
            {(fromDate || toDate) && (
              <Button variant="ghost" size="sm" className="h-8 text-xs" onClick={() => { setFromDate(""); setToDate(""); }}>
                Clear
              </Button>
            )}
          </div>
          <div className="ml-auto flex gap-2">
            <Button variant="outline" size="sm" onClick={handlePrint}>
              <Printer className="h-4 w-4 mr-1.5" /> Print
            </Button>
            <Button size="sm" onClick={handleDownloadPDF}>
              <Download className="h-4 w-4 mr-1.5" /> Download PDF
            </Button>
          </div>
          <button
            onClick={() => onOpenChange(false)}
            className="absolute right-3 top-3 rounded p-1 hover:bg-muted text-muted-foreground"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        {/* Statement preview */}
        <div ref={printRef} className="statement mx-5 my-4 text-[11px] text-black font-sans">

          {/* Org header */}
          <div className="mb-1">
            <div className="text-xl font-bold tracking-wide">{ORGANIZATION_NAME}</div>
            <div className="text-[10px] text-gray-500">Savings &amp; Microfinance Institution</div>
          </div>
          <hr className="border-t-2 border-black my-2" />
          <div className="text-center font-bold text-sm tracking-widest uppercase mb-3">
            Account Statement
          </div>

          {/* Account info */}
          <div className="info-grid grid grid-cols-2 gap-x-8 gap-y-1.5 mb-4 text-[10.5px]">
            <div className="info-row flex gap-1">
              <span className="info-label text-gray-500 w-28 shrink-0">Account Holder</span>
              <span className="info-value font-semibold">{account.memberName || account.accountName || "—"}</span>
            </div>
            <div className="info-row flex gap-1">
              <span className="info-label text-gray-500 w-28 shrink-0">Account Number</span>
              <span className="info-value font-semibold">{account.accountNumber}</span>
            </div>
            <div className="info-row flex gap-1">
              <span className="info-label text-gray-500 w-28 shrink-0">Account Type</span>
              <span className="info-value font-semibold">{account.type}</span>
            </div>
            <div className="info-row flex gap-1">
              <span className="info-label text-gray-500 w-28 shrink-0">Period</span>
              <span className="info-value font-semibold">{periodLabel}</span>
            </div>
            <div className="info-row flex gap-1">
              <span className="info-label text-gray-500 w-28 shrink-0">Statement Date</span>
              <span className="info-value font-semibold">{statementDate}</span>
            </div>
            <div className="info-row flex gap-1">
              <span className="info-label text-gray-500 w-28 shrink-0">Current Balance</span>
              <span className="info-value font-bold">RWF {fmt(closingBalance)}</span>
            </div>
          </div>

          {/* Transaction table */}
          <table className="w-full border-collapse text-[10.5px]">
            <thead>
              <tr className="border-b-2 border-black">
                <th className="py-1.5 pr-2 text-left font-bold w-24">Date</th>
                <th className="py-1.5 pr-2 text-left font-bold">Description</th>
                <th className="py-1.5 pr-2 text-right font-bold whitespace-nowrap">Withdrawals (RWF)</th>
                <th className="py-1.5 pr-2 text-right font-bold whitespace-nowrap">Deposits (RWF)</th>
                <th className="py-1.5 text-right font-bold whitespace-nowrap">Balance (RWF)</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">Loading…</td>
                </tr>
              ) : rows.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-6 text-center text-gray-400">
                    No transactions found{fromDate || toDate ? " in this period" : ""}.
                  </td>
                </tr>
              ) : (
                <>
                  {fromDate && (
                    <tr className="border-b border-gray-200">
                      <td className="py-1 pr-2 text-gray-500">{new Date(fromDate).toLocaleDateString("en-GB")}</td>
                      <td className="py-1 pr-2 italic text-gray-500" colSpan={3}>Opening Balance</td>
                      <td className="py-1 text-right font-mono">{fmt(openingBalance)}</td>
                    </tr>
                  )}
                  {rows.map(({ tx, balance }, i) => (
                    <tr key={i} className={`border-b border-gray-200 ${i % 2 === 1 ? "bg-gray-50" : ""}`}>
                      <td className="py-1 pr-2">{new Date(tx.date).toLocaleDateString("en-GB")}</td>
                      <td className="py-1 pr-2 max-w-[200px]">
                        <span>{tx.reason || tx.id}</span>
                      </td>
                      <td className="py-1 pr-2 text-right font-mono">
                        {tx.type === "Withdrawal" ? fmt(tx.amount) : ""}
                      </td>
                      <td className="py-1 pr-2 text-right font-mono">
                        {tx.type === "Deposit" ? fmt(tx.amount) : ""}
                      </td>
                      <td className="py-1 text-right font-mono font-semibold">{fmt(balance)}</td>
                    </tr>
                  ))}
                  <tr className="border-t-2 border-black bg-gray-100">
                    <td className="py-1.5 pr-2 font-bold" colSpan={2}>CLOSING BALANCE</td>
                    <td className="py-1.5 pr-2" />
                    <td className="py-1.5 pr-2" />
                    <td className="py-1.5 text-right font-mono font-bold">{fmt(closingBalance)}</td>
                  </tr>
                </>
              )}
            </tbody>
          </table>

          {/* Summary */}
          <div className="mt-4 flex justify-end">
            <table className="text-[10.5px] w-56">
              <tbody>
                <tr className="border-b border-gray-300">
                  <td className="py-1 pr-4">Total Deposits</td>
                  <td className="py-1 text-right font-mono">RWF {fmt(totalDeposits)}</td>
                </tr>
                <tr className="border-b border-gray-300">
                  <td className="py-1 pr-4">Total Withdrawals</td>
                  <td className="py-1 text-right font-mono">RWF {fmt(totalWithdrawals)}</td>
                </tr>
                <tr className="border-t-2 border-black font-bold">
                  <td className="py-1 pr-4">Closing Balance</td>
                  <td className="py-1 text-right font-mono">RWF {fmt(closingBalance)}</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Footer */}
          <div className="footer mt-6 pt-2 border-t border-gray-300 text-[9px] text-gray-400">
            This is a system-generated statement and does not require a signature. &nbsp;·&nbsp; {ORGANIZATION_NAME} &nbsp;·&nbsp; Generated: {statementDate}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
