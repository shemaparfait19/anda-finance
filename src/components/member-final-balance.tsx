"use client";

import { useRef } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer } from "lucide-react";
import type { FinalBalanceData } from "@/lib/statement-utils";
import { LOAN_INTEREST_RATE } from "@/lib/statement-utils";

interface Props {
  data: FinalBalanceData;
}

// ── Shared cell styles ────────────────────────────────────────────────────────
const th = "border border-gray-400 bg-[#2A7886] text-white text-xs font-semibold px-2 py-1 text-center";
const td = "border border-gray-300 text-xs px-2 py-1";
const tdRight = "border border-gray-300 text-xs px-2 py-1 text-right";
const tdBold = "border border-gray-300 text-xs px-2 py-1 font-semibold";
const tdBoldRight = "border border-gray-300 text-xs px-2 py-1 font-semibold text-right";
const totalRow = "bg-[#E8F4F8]";
const highlightRow = "bg-[#FFF3E0]";

function fmt(n: number) {
  return n.toLocaleString();
}
function fmtShares(n: number) {
  return n.toFixed(2);
}

export function MemberFinalBalance({ data }: Props) {
  const printRef = useRef<HTMLDivElement>(null);

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>ANDA Finance — Member Final Balance</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #999; padding: 4px 6px; }
            th { background: #2A7886; color: white; }
            .total-row { background: #E8F4F8; font-weight: bold; }
            .highlight-row { background: #FFF3E0; }
            .refund-row { background: #1a7a4a; color: white; font-weight: bold; font-size: 13px; }
            .zero-row { background: #555; color: white; font-weight: bold; }
            .header { text-align: center; margin-bottom: 12px; }
            .header h2 { font-size: 14px; margin: 0; }
            .header h3 { font-size: 12px; margin: 2px 0; color: #555; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
            .shares-badge { background: #2A7886; color: white; padding: 4px 10px; border-radius: 4px; display: inline-block; font-weight: bold; }
            .section-title { background: #555; color: white; font-weight: bold; padding: 4px 6px; }
          </style>
        </head>
        <body>${content.innerHTML}</body>
      </html>
    `);
    printWindow.document.close();
    printWindow.focus();
    printWindow.print();
    printWindow.close();
  };

  const handleDownloadPDF = async () => {
    const { jsPDF } = await import("jspdf");
    const autoTable = (await import("jspdf-autotable")).default;

    const doc = new jsPDF({ orientation: "portrait", unit: "mm", format: "a4" });
    const W = doc.internal.pageSize.getWidth();
    const margin = 14;

    // Header
    doc.setFont("helvetica", "bold");
    doc.setFontSize(14);
    doc.text("ANDA FINANCE", W / 2, 14, { align: "center" });
    doc.setFontSize(11);
    doc.text("MEMBER'S FINAL BALANCE", W / 2, 21, { align: "center" });
    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.text(`Account Name: ${data.memberName}`, margin, 30);
    doc.text(`Account No: ${data.accountNumber}`, W / 2, 30);
    doc.text(`Member ID: ${data.memberId}`, margin, 36);
    doc.text(`Date: ${data.statementDate}`, W / 2, 36);

    let y = 44;

    // Savings section
    autoTable(doc, {
      startY: y,
      head: [["SAVINGS / INTERESTS", "Amount (RWF)", "Shares", "Total Shares"]],
      body: [
        ["Total Saved (Principle Amount)", fmt(data.principal), fmtShares(data.principalShares), ""],
        ["Interest Gained (Amount)", fmt(data.interest), fmtShares(data.interestShares), ""],
        ["Total (Principle Amount and Interests)", fmt(data.total), fmtShares(data.totalShares), fmtShares(data.totalShares)],
        [`Total Savings Amount (Open to Loan at ${LOAN_INTEREST_RATE}%)`, fmt(data.loanEligibility), "", ""],
      ],
      theme: "grid",
      headStyles: { fillColor: [42, 120, 134], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 90 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "right", fontStyle: "bold" } },
      didParseCell: (hookData) => {
        if (hookData.row.index === 2) hookData.cell.styles.fontStyle = "bold";
        if (hookData.row.index === 3) hookData.cell.styles.fillColor = [255, 243, 224];
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;

    // Loans section
    const loanBody = data.loans.length > 0
      ? data.loans.map((l) => [`Loan (${l.label})`, fmt(l.principal), fmt(l.balance), l.status, l.dueDate])
      : [["No loans on record", "", "", "", ""]];

    autoTable(doc, {
      startY: y,
      head: [["LOAN", "Principal (RWF)", "Balance (RWF)", "Status", "Due Date"]],
      body: [
        ...loanBody,
        ["Total Current Loans", "", fmt(data.totalCurrentLoans), "", ""],
      ],
      theme: "grid",
      headStyles: { fillColor: [85, 85, 85], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 80 }, 1: { halign: "right" }, 2: { halign: "right" }, 3: { halign: "center" } },
      didParseCell: (hookData) => {
        const isLastRow = hookData.row.index === loanBody.length;
        if (isLastRow) hookData.cell.styles.fontStyle = "bold";
      },
    });

    y = (doc as any).lastAutoTable.finalY + 6;

    // Final settlement section
    const activeLoansForSettlement = data.loans.filter(
      (l) => l.status === "Active" || l.status === "Overdue" || l.status === "Defaulted"
    );

    const settlementBody: any[] = [
      ["Total Savings (Principle Amount and Interests)", fmt(data.total)],
      ...activeLoansForSettlement.map((l) => [`Less: Loan (${l.label})`, `(${fmt(l.balance)})`]),
    ];

    if (data.exitFee > 0) {
      settlementBody.push([`Exit Fee (${data.exitFeeRate}%) from Total Savings`, `(${fmt(data.exitFee)})`]);
    }

    settlementBody.push(["Unpaid Account Charges (Related to Loan)", "0"]);
    settlementBody.push(["TOTAL TO BE REFUNDED", fmt(data.totalToBeRefunded)]);
    settlementBody.push(["Net Closing Balance", "0"]);

    autoTable(doc, {
      startY: y,
      head: [["FINAL SETTLEMENT", "Amount (RWF)"]],
      body: settlementBody,
      theme: "grid",
      headStyles: { fillColor: [26, 122, 74], textColor: 255, fontStyle: "bold", fontSize: 8 },
      bodyStyles: { fontSize: 8 },
      columnStyles: { 0: { cellWidth: 130, fontStyle: "bold" }, 1: { halign: "right", fontStyle: "bold" } },
      didParseCell: (hookData) => {
        const refundRowIndex = settlementBody.length - 2;
        const zeroRowIndex = settlementBody.length - 1;
        if (hookData.row.index === refundRowIndex) {
          hookData.cell.styles.fillColor = [26, 122, 74];
          hookData.cell.styles.textColor = [255, 255, 255];
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fontSize = 10;
        }
        if (hookData.row.index === zeroRowIndex) {
          hookData.cell.styles.fillColor = [85, 85, 85];
          hookData.cell.styles.textColor = [255, 255, 255];
          hookData.cell.styles.fontStyle = "bold";
        }
      },
    });

    // Total shares badge
    doc.setFillColor(42, 120, 134);
    doc.roundedRect(W - margin - 40, 40, 40, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(10);
    doc.setTextColor(255, 255, 255);
    doc.text(`${fmtShares(data.totalShares)} shares`, W - margin - 20, 48, { align: "center" });
    doc.setTextColor(0, 0, 0);

    doc.save(`ANDA_FinalBalance_${data.memberId}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  // Active loans for the settlement deduction rows
  const activeLoansForSettlement = data.loans.filter(
    (l) => l.status === "Active" || l.status === "Overdue" || l.status === "Defaulted"
  );

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 justify-end">
        <Button variant="outline" size="sm" onClick={handlePrint}>
          <Printer className="h-4 w-4 mr-2" />
          Print
        </Button>
        <Button size="sm" onClick={handleDownloadPDF}>
          <Download className="h-4 w-4 mr-2" />
          Download PDF
        </Button>
      </div>

      {/* Printable statement */}
      <div ref={printRef} className="border rounded-lg overflow-hidden font-mono text-xs bg-white">
        {/* Header */}
        <div className="bg-[#2A7886] text-white text-center py-3 px-4">
          <h2 className="text-base font-bold tracking-wide">ANDA FINANCE</h2>
          <p className="text-xs opacity-90">MEMBER&apos;S FINAL BALANCE</p>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-x-4 px-4 py-2 bg-gray-50 border-b text-xs">
          <div>
            <span className="text-muted-foreground">Account Name: </span>
            <span className="font-semibold">{data.memberName}</span>
          </div>
          <div className="flex justify-between items-start">
            <div>
              <span className="text-muted-foreground">Account No: </span>
              <span className="font-semibold">{data.accountNumber}</span>
            </div>
            <div className="bg-[#2A7886] text-white rounded px-3 py-1 text-sm font-bold row-span-2">
              {fmtShares(data.totalShares)}
            </div>
          </div>
          <div>
            <span className="text-muted-foreground">Member ID: </span>
            <span className="font-semibold">{data.memberId}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Date: </span>
            <span className="font-semibold">{data.statementDate}</span>
          </div>
        </div>

        {/* Savings table */}
        <table className="w-full border-collapse">
          <thead>
            <tr>
              <th className={`${th} text-left w-1/2`}>SAVINGS / INTERESTS</th>
              <th className={th}>Amount (RWF)</th>
              <th className={th}>Shares</th>
              <th className={th}>Total Shares</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={td}>Total Saved (Principle Amount)</td>
              <td className={tdRight}>{fmt(data.principal)}</td>
              <td className={tdRight}>{fmtShares(data.principalShares)}</td>
              <td className={tdRight}></td>
            </tr>
            <tr>
              <td className={td}>Interest Gained (Amount)</td>
              <td className={tdRight}>{fmt(data.interest)}</td>
              <td className={tdRight}>{fmtShares(data.interestShares)}</td>
              <td className={tdRight}></td>
            </tr>
            <tr className={totalRow}>
              <td className={tdBold}>Total (Principle Amount and Interests)</td>
              <td className={tdBoldRight}>{fmt(data.total)}</td>
              <td className={tdBoldRight}>{fmtShares(data.totalShares)}</td>
              <td className={`${tdBoldRight} text-[#2A7886]`}>{fmtShares(data.totalShares)}</td>
            </tr>
            <tr className={highlightRow}>
              <td className={tdBold}>
                Total Savings Amount (Open to Loan at {LOAN_INTEREST_RATE}%)
              </td>
              <td className={tdBoldRight}>{fmt(data.loanEligibility)}</td>
              <td className={tdRight}></td>
              <td className={tdRight}></td>
            </tr>
          </tbody>
        </table>

        {/* Loan table */}
        <table className="w-full border-collapse mt-2">
          <thead>
            <tr>
              <th className={`${th} text-left w-1/2`} style={{ background: "#555" }}>LOAN</th>
              <th className={th} style={{ background: "#555" }}>Principal (RWF)</th>
              <th className={th} style={{ background: "#555" }}>Balance (RWF)</th>
              <th className={th} style={{ background: "#555" }}>Status</th>
              <th className={th} style={{ background: "#555" }}>Due Date</th>
            </tr>
          </thead>
          <tbody>
            {data.loans.length > 0 ? (
              data.loans.map((loan, i) => (
                <tr key={i}>
                  <td className={td}>Loan ({loan.label})</td>
                  <td className={tdRight}>{fmt(loan.principal)}</td>
                  <td className={tdRight}>{fmt(loan.balance)}</td>
                  <td className={`${td} text-center`}>
                    <span className={`px-1 rounded text-[10px] font-medium ${
                      loan.status === "Active" ? "bg-green-100 text-green-800" :
                      loan.status === "Paid" ? "bg-gray-100 text-gray-600" :
                      loan.status === "Overdue" || loan.status === "Defaulted" ? "bg-red-100 text-red-700" :
                      "bg-yellow-100 text-yellow-800"
                    }`}>
                      {loan.status}
                    </span>
                  </td>
                  <td className={`${td} text-center`}>
                    {new Date(loan.dueDate).toLocaleDateString()}
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan={5} className={`${td} text-center text-muted-foreground`}>
                  No loans on record.
                </td>
              </tr>
            )}
            <tr className={totalRow}>
              <td className={tdBold}>Total Current Loans</td>
              <td className={tdRight}></td>
              <td className={tdBoldRight}>{fmt(data.totalCurrentLoans)}</td>
              <td colSpan={2} className={tdRight}></td>
            </tr>
          </tbody>
        </table>

        {/* Final Settlement section */}
        <table className="w-full border-collapse mt-2">
          <thead>
            <tr>
              <th className="border border-gray-400 bg-[#1a7a4a] text-white text-xs font-semibold px-2 py-1 text-left w-3/4">
                FINAL SETTLEMENT
              </th>
              <th className="border border-gray-400 bg-[#1a7a4a] text-white text-xs font-semibold px-2 py-1 text-right">
                Amount (RWF)
              </th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className={tdBold}>Total Savings (Principle Amount and Interests)</td>
              <td className={tdBoldRight}>{fmt(data.total)}</td>
            </tr>
            {activeLoansForSettlement.map((loan, i) => (
              <tr key={i}>
                <td className={td}>Less: Loan ({loan.label})</td>
                <td className={`${tdRight} text-red-600`}>({fmt(loan.balance)})</td>
              </tr>
            ))}
            {data.exitFee > 0 && (
              <tr>
                <td className={td}>Exit Fee ({data.exitFeeRate}%) from Total Savings</td>
                <td className={`${tdRight} text-red-600`}>({fmt(data.exitFee)})</td>
              </tr>
            )}
            <tr>
              <td className={td}>Unpaid Account Charges (Related to Loan)</td>
              <td className={tdRight}>0</td>
            </tr>
            <tr className="bg-[#1a7a4a] text-white">
              <td className="border border-[#155f38] text-sm px-2 py-2 font-bold">
                TOTAL TO BE REFUNDED
              </td>
              <td className="border border-[#155f38] text-sm px-2 py-2 font-bold text-right">
                {fmt(data.totalToBeRefunded)}
              </td>
            </tr>
            <tr className="bg-[#555] text-white">
              <td className="border border-gray-600 text-xs px-2 py-1 font-bold">
                Net Closing Balance
              </td>
              <td className="border border-gray-600 text-xs px-2 py-1 font-bold text-right">
                0
              </td>
            </tr>
          </tbody>
        </table>

        <div className="px-4 py-2 text-[10px] text-muted-foreground border-t">
          This is a system-generated exit statement from ANDA Finance. Share price: RWF 15,000.
          Interest rate: 8% p.a. Loan eligibility: 80% of total savings. Account scheme charges excluded.
        </div>
      </div>
    </div>
  );
}
