"use client";

import { useRef, useMemo } from "react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Download, Printer, X } from "lucide-react";
import type { Loan } from "@/lib/types";
import { ORGANIZATION_NAME } from "@/lib/statement-utils";

interface Props {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function pmt(r: number, n: number, pv: number): number {
  if (r === 0) return pv / n;
  return (pv * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

const th = "border border-gray-400 bg-[#2A7886] text-white text-xs font-semibold px-2 py-1.5 text-center";
const td = "border border-gray-300 text-xs px-2 py-1.5 text-right";
const tdLeft = "border border-gray-300 text-xs px-2 py-1.5";

export default function LoanAmortizationDialog({ loan, open, onOpenChange }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const monthlyRate = (loan.interestRate ?? 3) / 100;
  const term = loan.loanTerm ?? 12;
  const principal = loan.principal;

  const { monthlyInstalment, rows, totalInterest } = useMemo(() => {
    const monthlyInstalment = Math.round(pmt(monthlyRate, term, principal));
    const rows: { date: string; openingBalance: number; instalment: number; principalPortion: number; interest: number; closingBalance: number }[] = [];
    let remaining = principal;
    const startDate = new Date(loan.issueDate);

    for (let i = 0; i < term; i++) {
      const interest = Math.round(remaining * monthlyRate);
      const isLast = i === term - 1;
      const principalPortion = isLast ? remaining : Math.round(monthlyInstalment - interest);
      const actualInstalment = isLast ? remaining + interest : monthlyInstalment;

      const d = new Date(startDate);
      d.setMonth(d.getMonth() + i + 1);
      const dateStr = `${d.getDate().toString().padStart(2, "0")}/${(d.getMonth() + 1).toString().padStart(2, "0")}/${d.getFullYear()}`;

      rows.push({
        date: dateStr,
        openingBalance: Math.round(remaining),
        instalment: actualInstalment,
        principalPortion,
        interest,
        closingBalance: Math.max(0, Math.round(remaining - principalPortion)),
      });

      remaining -= principalPortion;
      if (remaining < 1) remaining = 0;
    }

    return {
      monthlyInstalment,
      rows,
      totalInterest: rows.reduce((s, r) => s + r.interest, 0),
    };
  }, [principal, monthlyRate, term, loan.issueDate]);

  const termLabel = term >= 12
    ? `${Math.floor(term / 12)} Year${Math.floor(term / 12) > 1 ? "s" : ""}${term % 12 > 0 ? ` ${term % 12}M` : ""}`
    : `${term} Months`;

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${ORGANIZATION_NAME} — Amortization ${loan.loanId}</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
        th, td { border: 1px solid #ccc; padding: 3px 6px; }
        th { background: #2A7886; color: white; }
        .total-row { background: #FFF9C4; font-weight: bold; }
      </style></head>
      <body>${content.innerHTML}</body></html>
    `);
    win.document.close(); win.focus(); win.print(); win.close();
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "landscape", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const H = doc.internal.pageSize.getHeight();
    const M = 18;
    const statementDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
    let y = 18;

    // Org header
    doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(0, 0, 0);
    doc.text(ORGANIZATION_NAME, M, y);
    y += 5;
    doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
    doc.text("Savings & Microfinance Institution", M, y);
    y += 4;
    doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.6);
    doc.line(M, y, W - M, y);
    y += 6;

    doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
    doc.text(`LOAN AMORTIZATION SCHEDULE — ${loan.loanId}`, W / 2, y, { align: "center" });
    y += 9;

    // Info grid (3 columns for landscape)
    const colW3 = (W - M * 2) / 3;
    const metaItems: [string, string][] = [
      ["Member",            loan.memberName],
      ["Loan ID",           loan.loanId],
      ["Principal",         `RWF ${fmt(principal)}`],
      ["Term",              termLabel],
      ["Monthly Instalment",`RWF ${fmt(monthlyInstalment)}`],
      ["Total Interest",    `RWF ${fmt(totalInterest)}`],
    ];
    metaItems.forEach(([label, value], i) => {
      const col = i % 3;
      const row = Math.floor(i / 3);
      const x = M + col * colW3;
      const iy = y + row * 11;
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
      doc.text(label, x, iy);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(0, 0, 0);
      doc.text(value, x, iy + 4);
    });
    y += 22;

    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;

    const body = rows.map((r, i) => [
      `${i + 1}`, r.date, fmt(r.openingBalance), fmt(r.instalment),
      fmt(r.principalPortion), fmt(r.interest), fmt(r.closingBalance),
    ]);
    body.push(["", termLabel, fmt(principal), fmt(rows.reduce((s, r) => s + r.instalment, 0)), fmt(principal), fmt(totalInterest), "0"]);

    autoTable(doc, {
      startY: y,
      head: [["#", "Date", "Principal Amount", "Instalment", "Principal Portion", "Interest", "Remaining Balance"]],
      body,
      theme: "plain",
      margin: { left: M, right: M },
      headStyles: { fillColor: false as any, textColor: [0,0,0] as [number,number,number], fontStyle: "bold" as const, fontSize: 8,
        cellPadding: { top:2, bottom:3, left:2, right:2 }, lineWidth: { bottom: 0.5 } as any, lineColor: [0,0,0] as [number,number,number] },
      bodyStyles: { fontSize: 8, cellPadding: { top:2, bottom:2, left:2, right:2 }, textColor: [0,0,0] as [number,number,number],
        lineWidth: { bottom: 0.2 } as any, lineColor: [210,210,210] as [number,number,number] },
      alternateRowStyles: { fillColor: [248,248,248] },
      columnStyles: {
        0: { cellWidth: 8, halign: "center" },
        1: { cellWidth: 22 },
        2: { halign: "right", cellWidth: 34 },
        3: { halign: "right", cellWidth: 28 },
        4: { halign: "right", cellWidth: 28 },
        5: { halign: "right", cellWidth: 28 },
        6: { halign: "right", cellWidth: 34, fontStyle: "bold" },
      },
      didParseCell: (h) => {
        if (h.row.index === body.length - 1) {
          h.cell.styles.fontStyle = "bold"; h.cell.styles.fillColor = [235,235,235];
          (h.cell.styles as any).lineWidth = { top: 0.5 }; h.cell.styles.lineColor = [0,0,0];
        }
      },
    });

    // Footer
    doc.setFont("helvetica", "italic"); doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
    doc.line(M, H - 14, W - M, H - 14);
    doc.text(`System-generated amortization schedule · ${ORGANIZATION_NAME} · Generated: ${statementDate}`, W/2, H - 9, { align: "center" });

    doc.save(`${ORGANIZATION_NAME.replace(/\s+/g, "_")}_Amort_${loan.loanId}.pdf`);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-4xl max-h-[92vh] overflow-y-auto p-0">
        <button
          onClick={() => onOpenChange(false)}
          className="absolute right-4 top-4 z-10 rounded-full bg-[#2A7886] p-1 text-white hover:bg-[#1e6270]"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="flex gap-2 justify-end px-4 pt-4 pb-2">
          <Button variant="outline" size="sm" onClick={handlePrint}>
            <Printer className="h-4 w-4 mr-2" />Print
          </Button>
          <Button size="sm" onClick={handleDownloadPDF}>
            <Download className="h-4 w-4 mr-2" />Download PDF
          </Button>
        </div>

        <div ref={printRef} className="mx-4 mb-4 border rounded-lg overflow-hidden font-mono text-xs bg-white">
          <div className="bg-[#2A7886] text-white text-center py-3 px-4">
            <h2 className="text-base font-bold tracking-wide">{ORGANIZATION_NAME}</h2>
            <p className="text-xs opacity-90">LOAN AMORTIZATION — {loan.loanId}</p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 px-4 py-3 bg-gray-50 border-b text-xs">
            <div><span className="text-muted-foreground">Member: </span><span className="font-semibold">{loan.memberName}</span></div>
            <div><span className="text-muted-foreground">Loan ID: </span><span className="font-semibold">{loan.loanId}</span></div>
            <div><span className="text-muted-foreground">Principal: </span><span className="font-semibold">RWF {fmt(principal)}</span></div>
            <div><span className="text-muted-foreground">Term: </span><span className="font-semibold">{termLabel}</span></div>
            <div><span className="text-muted-foreground">Monthly Instalment: </span><span className="font-semibold">RWF {fmt(monthlyInstalment)}</span></div>
            <div><span className="text-muted-foreground">Interest Rate: </span><span className="font-semibold">{loan.interestRate}%/mo · Total: RWF {fmt(totalInterest)}</span></div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full border-collapse min-w-[640px]">
              <thead>
                <tr>
                  <th className={th} rowSpan={2}>#</th>
                  <th className={th} rowSpan={2}>Month</th>
                  <th className={th} rowSpan={2}>Principle Amount</th>
                  <th className={th} colSpan={3}>Loan Repayment</th>
                  <th className={th} rowSpan={2}>Remaining Loan Amount</th>
                </tr>
                <tr>
                  <th className={th}>Instalment</th>
                  <th className={th}>Amount</th>
                  <th className={th}>Interests</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((row, i) => (
                  <tr key={i} className={i % 2 === 0 ? "" : "bg-gray-50"}>
                    <td className={`${td} text-center`}>{i + 1}</td>
                    <td className={tdLeft}>{row.date}</td>
                    <td className={td}>{fmt(row.openingBalance)}</td>
                    <td className={td}>{fmt(row.instalment)}</td>
                    <td className={td}>{fmt(row.principalPortion)}</td>
                    <td className={td}>{fmt(row.interest)}</td>
                    <td className={`${td} font-semibold`}>{fmt(row.closingBalance)}</td>
                  </tr>
                ))}
                <tr className="bg-[#FFF9C4] font-bold">
                  <td className={`${td} text-center`} colSpan={2}>{termLabel}</td>
                  <td className={td}>{fmt(principal)}</td>
                  <td className={td}>{fmt(rows.reduce((s, r) => s + r.instalment, 0))}</td>
                  <td className={td}>{fmt(principal)}</td>
                  <td className={`${td} text-orange-700`}>{fmt(totalInterest)}</td>
                  <td className={td}>0</td>
                </tr>
              </tbody>
            </table>
          </div>

          <div className="px-4 py-2 text-[10px] text-muted-foreground border-t">
            System-generated amortization · {ORGANIZATION_NAME} · Generated {new Date().toLocaleDateString()}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
