"use client";

import { useState, useMemo, useRef } from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import type { Member } from "@/lib/types";
import {
  ORGANIZATION_NAME,
  SAVINGS_INTEREST_RATE,
  LOAN_ELIGIBILITY_RATE,
  SHARE_PRICE,
} from "@/lib/statement-utils";

interface Props {
  members: Member[];
}

// Standard PMT formula: fixed monthly payment
function pmt(r: number, n: number, pv: number): number {
  if (r === 0) return pv / n;
  return (pv * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1);
}

function fmt(n: number) {
  return Math.round(n).toLocaleString();
}

interface AmortRow {
  date: string;
  openingBalance: number;
  instalment: number;
  principalPortion: number;
  interest: number;
  closingBalance: number;
}

function buildSchedule(
  principal: number,
  monthlyRate: number,
  termMonths: number,
  startDate: Date
): { monthlyInstalment: number; rows: AmortRow[]; totalInterest: number } {
  const monthlyInstalment = pmt(monthlyRate, termMonths, principal);
  const rows: AmortRow[] = [];
  let remaining = principal;

  for (let i = 0; i < termMonths; i++) {
    const interest = Math.round(remaining * monthlyRate);
    const isLast = i === termMonths - 1;
    const principalPortion = isLast
      ? remaining
      : Math.round(monthlyInstalment - interest);
    const actualInstalment = isLast
      ? remaining + interest
      : Math.round(monthlyInstalment);

    const d = new Date(startDate);
    d.setMonth(d.getMonth() + i);
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

  const totalInterest = rows.reduce((s, r) => s + r.interest, 0);
  return { monthlyInstalment: Math.round(monthlyInstalment), rows, totalInterest };
}

const th =
  "border border-gray-400 bg-[#2A7886] text-white text-xs font-semibold px-2 py-1.5 text-center";
const td = "border border-gray-300 text-xs px-2 py-1.5 text-right";
const tdLeft = "border border-gray-300 text-xs px-2 py-1.5";

export default function LoanAmortizationTab({ members }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const [selectedMemberId, setSelectedMemberId] = useState("");
  const [amountStr, setAmountStr] = useState("");
  const [termStr, setTermStr] = useState("24");
  const [generated, setGenerated] = useState(false);

  const selectedMember = members.find((m) => m.id === selectedMemberId);

  // Eligibility calculation
  const savingsPrincipal = selectedMember?.savingsBalance ?? 0;
  const savingsTotal = Math.round(savingsPrincipal * (1 + SAVINGS_INTEREST_RATE));
  const eligibleAmount = Math.round(savingsTotal * LOAN_ELIGIBILITY_RATE);

  const amount = parseFloat(amountStr.replace(/,/g, "")) || 0;
  const term = parseInt(termStr) || 12;

  // Rate determination
  const eligiblePortion = Math.min(amount, eligibleAmount);
  const excessPortion = Math.max(0, amount - eligibleAmount);
  // Blended monthly rate
  const effectiveMonthlyRate =
    amount > 0
      ? (eligiblePortion * 0.03 + excessPortion * 0.05) / amount
      : 0.03;

  const schedule = useMemo(() => {
    if (!generated || amount <= 0 || term <= 0) return null;
    return buildSchedule(amount, effectiveMonthlyRate, term, new Date());
  }, [generated, amount, effectiveMonthlyRate, term]);

  const termLabel = term >= 12 ? `${Math.floor(term / 12)} Year${Math.floor(term / 12) > 1 ? "s" : ""}${term % 12 > 0 ? ` ${term % 12}M` : ""}` : `${term} Months`;

  const handleGenerate = () => setGenerated(true);
  const handleReset = () => { setGenerated(false); setAmountStr(""); setTermStr("24"); setSelectedMemberId(""); };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html><head><title>${ORGANIZATION_NAME} — Amortization</title>
      <style>
        body { font-family: Arial, sans-serif; font-size: 10px; margin: 20px; }
        table { border-collapse: collapse; width: 100%; margin-bottom: 8px; }
        th, td { border: 1px solid #ccc; padding: 3px 6px; }
        th { background: #2A7886; color: white; }
        .highlight { background: #FFF9C4; font-weight: bold; }
        .total-row { background: #E8F4F8; font-weight: bold; }
      </style></head>
      <body>${content.innerHTML}</body></html>
    `);
    win.document.close();
    win.focus();
    win.print();
    win.close();
  };

  const handleDownloadPDF = async () => {
    if (!schedule) return;
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
    doc.text("LOAN AMORTIZATION SCHEDULE", W / 2, y, { align: "center" });
    y += 9;

    // Info grid (3 columns for landscape)
    const colW3 = (W - M * 2) / 3;
    const metaItems: [string, string][] = [
      ["Member",            selectedMember?.name ?? "—"],
      ["Loan Amount",       `RWF ${fmt(amount)}`],
      ["Term",              termLabel],
      ["Monthly Instalment",`RWF ${fmt(schedule.monthlyInstalment)}`],
      ["Effective Rate",    `${(effectiveMonthlyRate * 100).toFixed(2)}% / month`],
      ["Total Interest",    `RWF ${fmt(schedule.totalInterest)}`],
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

    const body = schedule.rows.map((r, i) => [
      `${i + 1}`, r.date, fmt(r.openingBalance), fmt(r.instalment),
      fmt(r.principalPortion), fmt(r.interest), fmt(r.closingBalance),
    ]);
    body.push([
      "", `TOTAL (${termLabel})`, fmt(amount),
      fmt(schedule.rows.reduce((s, r) => s + r.instalment, 0)),
      fmt(amount), fmt(schedule.totalInterest), "0",
    ]);

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
      didParseCell: (hookData) => {
        if (hookData.row.index === body.length - 1) {
          hookData.cell.styles.fontStyle = "bold"; hookData.cell.styles.fillColor = [235,235,235];
          (hookData.cell.styles as any).lineWidth = { top: 0.5 }; hookData.cell.styles.lineColor = [0,0,0];
        }
      },
    });

    // Footer
    doc.setFont("helvetica", "italic"); doc.setFontSize(7); doc.setTextColor(150,150,150);
    doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
    doc.line(M, H - 14, W - M, H - 14);
    doc.text(`System-generated amortization schedule · ${ORGANIZATION_NAME} · Generated: ${statementDate}`, W/2, H - 9, { align: "center" });

    doc.save(`${ORGANIZATION_NAME.replace(/\s+/g, "_")}_Amortization_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-6">
      {/* Calculator form */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 p-4 bg-muted/30 rounded-xl border">
        <div className="space-y-1.5">
          <Label>Member (optional)</Label>
          <Select value={selectedMemberId} onValueChange={(v) => { setSelectedMemberId(v); setGenerated(false); }}>
            <SelectTrigger>
              <SelectValue placeholder="Select member…" />
            </SelectTrigger>
            <SelectContent>
              {members.map((m) => (
                <SelectItem key={m.id} value={m.id}>
                  {m.name} ({m.memberId})
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1.5">
          <Label>Loan Amount (RWF)</Label>
          <Input
            placeholder="e.g. 2,000,000"
            value={amountStr}
            onChange={(e) => { setAmountStr(e.target.value); setGenerated(false); }}
          />
        </div>
        <div className="space-y-1.5">
          <Label>Term (months)</Label>
          <Input
            type="number"
            min={1}
            max={360}
            placeholder="e.g. 24"
            value={termStr}
            onChange={(e) => { setTermStr(e.target.value); setGenerated(false); }}
          />
        </div>
        <div className="flex flex-col justify-end gap-2">
          <Button onClick={handleGenerate} disabled={!amount || !term}>
            Generate Schedule
          </Button>
          {generated && (
            <Button variant="ghost" size="sm" onClick={handleReset}>
              Reset
            </Button>
          )}
        </div>
      </div>

      {/* Eligibility summary (when member selected) */}
      {selectedMember && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {[
            { label: "Total Savings (+ 8% interest)", value: `RWF ${fmt(savingsTotal)}`, color: "text-green-600" },
            { label: `Eligible (${(LOAN_ELIGIBILITY_RATE * 100).toFixed(0)}%) at 3%/mo`, value: `RWF ${fmt(eligibleAmount)}`, color: "text-primary" },
            { label: "Excess portion at 5%/mo", value: excessPortion > 0 ? `RWF ${fmt(excessPortion)}` : "None", color: excessPortion > 0 ? "text-orange-600" : "text-muted-foreground" },
            { label: "Effective monthly rate", value: `${(effectiveMonthlyRate * 100).toFixed(2)}%`, color: "text-foreground font-semibold" },
          ].map(({ label, value, color }) => (
            <div key={label} className="rounded-lg border p-3 bg-background">
              <p className="text-xs text-muted-foreground">{label}</p>
              <p className={`text-sm font-semibold mt-0.5 ${color}`}>{value}</p>
            </div>
          ))}
        </div>
      )}

      {/* Amortization table */}
      {schedule && (
        <>
          {/* Action bar */}
          <div className="flex items-center justify-between flex-wrap gap-2">
            <div className="text-sm text-muted-foreground">
              <span className="font-semibold text-foreground">RWF {fmt(amount)}</span> over{" "}
              <span className="font-semibold text-foreground">{termLabel}</span> ·{" "}
              Monthly instalment: <span className="font-semibold text-foreground">RWF {fmt(schedule.monthlyInstalment)}</span> ·{" "}
              Total interest: <span className="font-semibold text-orange-600">RWF {fmt(schedule.totalInterest)}</span>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={handlePrint}>
                <Printer className="h-4 w-4 mr-2" />Print
              </Button>
              <Button size="sm" onClick={handleDownloadPDF}>
                <Download className="h-4 w-4 mr-2" />Download PDF
              </Button>
            </div>
          </div>

          <div ref={printRef} className="border rounded-lg overflow-hidden font-mono text-xs bg-white">
            {/* Header */}
            <div className="bg-[#2A7886] text-white text-center py-3 px-4">
              <h2 className="text-base font-bold tracking-wide">{ORGANIZATION_NAME}</h2>
              <p className="text-xs opacity-90">LOAN AMORTIZATION SCHEDULE</p>
            </div>

            {/* Meta */}
            <div className="grid grid-cols-2 md:grid-cols-3 gap-x-6 gap-y-1 px-4 py-3 bg-gray-50 border-b text-xs">
              {selectedMember && (
                <div><span className="text-muted-foreground">Member: </span><span className="font-semibold">{selectedMember.name} ({selectedMember.memberId})</span></div>
              )}
              <div><span className="text-muted-foreground">Loan Amount: </span><span className="font-semibold">RWF {fmt(amount)}</span></div>
              <div><span className="text-muted-foreground">Term: </span><span className="font-semibold">{termLabel}</span></div>
              <div><span className="text-muted-foreground">Monthly Instalment: </span><span className="font-semibold">RWF {fmt(schedule.monthlyInstalment)}</span></div>
              <div><span className="text-muted-foreground">Effective Rate: </span><span className="font-semibold">{(effectiveMonthlyRate * 100).toFixed(2)}% / month</span></div>
              <div><span className="text-muted-foreground">Total Interest: </span><span className="font-semibold text-orange-600">RWF {fmt(schedule.totalInterest)}</span></div>
            </div>

            {/* Table */}
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr>
                    <th className={th} rowSpan={2}>#</th>
                    <th className={th} rowSpan={2}>Month</th>
                    <th className={th} rowSpan={2}>Principle Amount</th>
                    <th className={`${th}`} colSpan={3}>Loan Repayment</th>
                    <th className={th} rowSpan={2}>Remaining Loan Amount</th>
                  </tr>
                  <tr>
                    <th className={th}>Instalment</th>
                    <th className={th}>Amount</th>
                    <th className={th}>Interests</th>
                  </tr>
                </thead>
                <tbody>
                  {schedule.rows.map((row, i) => (
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
                  {/* Totals row */}
                  <tr className="bg-[#FFF9C4] font-bold">
                    <td className={`${td} text-center`} colSpan={2}>{termLabel}</td>
                    <td className={td}>{fmt(amount)}</td>
                    <td className={td}>{fmt(schedule.rows.reduce((s, r) => s + r.instalment, 0))}</td>
                    <td className={td}>{fmt(amount)}</td>
                    <td className={`${td} text-orange-700`}>{fmt(schedule.totalInterest)}</td>
                    <td className={td}>0</td>
                  </tr>
                </tbody>
              </table>
            </div>

            <div className="px-4 py-2 text-[10px] text-muted-foreground border-t">
              System-generated amortization schedule · {ORGANIZATION_NAME} · Generated {new Date().toLocaleDateString()}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
