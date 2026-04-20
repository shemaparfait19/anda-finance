"use client";

import { useRef, useState } from "react";
import { Button } from "@/components/ui/button";
import { Download, Printer, Mail, CheckCircle } from "lucide-react";
import type { StatementData } from "@/lib/statement-utils";
import { LOAN_INTEREST_RATE, ORGANIZATION_NAME } from "@/lib/statement-utils";

interface Props {
  data: StatementData;
  memberEmail?: string;
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

export function MemberAccountStatement({ data, memberEmail }: Props) {
  const printRef = useRef<HTMLDivElement>(null);
  const [emailSent, setEmailSent] = useState(false);

  const handleEmailStatement = async () => {
    if (!memberEmail) return;
    // Build mailto link — replace with a real email service when available
    const subject = encodeURIComponent(`${ORGANIZATION_NAME} — Account Statement for ${data.memberName}`);
    const body = encodeURIComponent(
      `Dear ${data.memberName},\n\nPlease find your account summary below.\n\n` +
      `Member ID: ${data.memberId}\nAccount No: ${data.accountNumber}\nDate: ${data.statementDate}\n\n` +
      `Total Savings (incl. interest): RWF ${data.total.toLocaleString()}\n` +
      `Total Shares: ${data.totalShares.toFixed(2)}\n` +
      `Outstanding Loans: RWF ${data.totalCurrentLoans.toLocaleString()}\n\n` +
      `For a full PDF statement, please contact the office.\n\nRegards,\n${ORGANIZATION_NAME}`
    );
    window.location.href = `mailto:${memberEmail}?subject=${subject}&body=${body}`;
    setEmailSent(true);
    setTimeout(() => setEmailSent(false), 3000);
  };

  const handlePrint = () => {
    const content = printRef.current;
    if (!content) return;
    const printWindow = window.open("", "_blank");
    if (!printWindow) return;
    printWindow.document.write(`
      <html>
        <head>
          <title>ANDA Finance — Member Statement</title>
          <style>
            body { font-family: Arial, sans-serif; font-size: 11px; margin: 20px; }
            table { border-collapse: collapse; width: 100%; }
            th, td { border: 1px solid #999; padding: 4px 6px; }
            th { background: #2A7886; color: white; }
            .total-row { background: #E8F4F8; font-weight: bold; }
            .highlight-row { background: #FFF3E0; }
            .header { text-align: center; margin-bottom: 12px; }
            .header h2 { font-size: 14px; margin: 0; }
            .header h3 { font-size: 12px; margin: 2px 0; color: #555; }
            .meta { display: flex; justify-content: space-between; margin-bottom: 8px; font-size: 11px; }
            .shares-badge { background: #2A7886; color: white; padding: 4px 10px; border-radius: 4px; display: inline-block; font-weight: bold; }
            .section-title { background: #555; color: white; font-weight: bold; padding: 4px 6px; }
            .debt-total { background: #c0392b; color: white; font-weight: bold; }
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
    const M = 14; // margin

    // ── Header block ─────────────────────────────────────────────
    doc.setFillColor(42, 120, 134);
    doc.rect(0, 0, W, 30, "F");

    doc.setFont("helvetica", "bold");
    doc.setFontSize(17);
    doc.setTextColor(255, 255, 255);
    doc.text(ORGANIZATION_NAME, W / 2, 12, { align: "center" });

    doc.setFont("helvetica", "normal");
    doc.setFontSize(9);
    doc.setTextColor(210, 235, 238);
    doc.text("MEMBER'S ACCOUNT STATEMENT", W / 2, 21, { align: "center" });

    // thin accent line under header
    doc.setFillColor(255, 255, 255, 0.3);
    doc.rect(0, 29, W, 0.4, "F");

    // ── Meta section (gray bg) ────────────────────────────────────
    const metaBg = 30;
    const metaH = 28;
    doc.setFillColor(248, 249, 250);
    doc.rect(0, metaBg, W, metaH, "F");
    doc.setDrawColor(220, 220, 220);
    doc.setLineWidth(0.3);
    doc.rect(0, metaBg, W, metaH, "S"); // border

    const metaY = metaBg + 7;
    const col2 = W / 2 + 4;

    // Row 1
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Account Name", M, metaY);
    doc.text("Account No.", col2, metaY);

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(data.memberName, M, metaY + 5);
    doc.text(data.accountNumber, col2, metaY + 5);

    // Row 2
    doc.setFontSize(8);
    doc.setTextColor(120, 120, 120);
    doc.setFont("helvetica", "normal");
    doc.text("Member ID", M, metaY + 13);
    doc.text("Date", col2, metaY + 13);

    doc.setFontSize(9);
    doc.setTextColor(30, 30, 30);
    doc.setFont("helvetica", "bold");
    doc.text(data.memberId, M, metaY + 18);
    doc.text(data.statementDate, col2, metaY + 18);

    // Shares badge (teal pill, top-right of meta)
    const badgeX = W - M - 28;
    const badgeY = metaBg + 4;
    doc.setFillColor(42, 120, 134);
    doc.roundedRect(badgeX, badgeY, 28, 12, 2, 2, "F");
    doc.setFont("helvetica", "bold");
    doc.setFontSize(9);
    doc.setTextColor(255, 255, 255);
    doc.text(`${fmtShares(data.totalShares)} sh`, badgeX + 14, badgeY + 7.5, { align: "center" });
    doc.setFontSize(7);
    doc.setFont("helvetica", "normal");
    doc.text("Total Shares", badgeX + 14, badgeY + 13, { align: "center" });
    doc.setTextColor(30, 30, 30);

    let y = metaBg + metaH + 4;

    // ── Savings table ─────────────────────────────────────────────
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
      margin: { left: M, right: M },
      headStyles: { fillColor: [42, 120, 134], textColor: 255, fontStyle: "bold", fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", cellWidth: 30 },
        2: { halign: "right", cellWidth: 22 },
        3: { halign: "right", cellWidth: 28, fontStyle: "bold" },
      },
      didParseCell: (hookData) => {
        if (hookData.row.index === 2) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [235, 245, 247];
        }
        if (hookData.row.index === 3) {
          hookData.cell.styles.fillColor = [255, 246, 230];
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 5;

    // ── Loan table ────────────────────────────────────────────────
    const loanBody = data.loans.length > 0
      ? data.loans.map((l) => [
          `Loan (${l.label})`,
          fmt(l.principal),
          fmt(l.balance),
          l.status,
          new Date(l.dueDate).toLocaleDateString("en-GB"),
        ])
      : [["No loans on record", "", "", "", ""]];

    autoTable(doc, {
      startY: y,
      head: [["LOAN", "Principal (RWF)", "Balance (RWF)", "Status", "Due Date"]],
      body: [
        ...loanBody,
        ["Total Current Loans", "", fmt(data.totalCurrentLoans), "", ""],
      ],
      theme: "grid",
      margin: { left: M, right: M },
      headStyles: { fillColor: [70, 70, 70], textColor: 255, fontStyle: "bold", fontSize: 8, cellPadding: 3 },
      bodyStyles: { fontSize: 8, cellPadding: 3, textColor: [40, 40, 40] },
      columnStyles: {
        0: { cellWidth: "auto" },
        1: { halign: "right", cellWidth: 32 },
        2: { halign: "right", cellWidth: 32 },
        3: { halign: "center", cellWidth: 22 },
        4: { halign: "center", cellWidth: 26 },
      },
      didParseCell: (hookData) => {
        const isLastRow = hookData.row.index === loanBody.length;
        if (isLastRow) {
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fillColor = [235, 245, 247];
        }
      },
    });

    y = (doc as any).lastAutoTable.finalY + 5;

    // ── Totals table ──────────────────────────────────────────────
    autoTable(doc, {
      startY: y,
      body: [
        ["Advanced Account Charges", "", "0"],
        ["TOTAL DEBTS", "", fmt(data.totalDebts)],
      ],
      theme: "grid",
      margin: { left: M, right: M },
      bodyStyles: { fontSize: 9, cellPadding: 3 },
      columnStyles: {
        0: { cellWidth: "auto", fontStyle: "bold" },
        1: { cellWidth: 32 },
        2: { halign: "right", cellWidth: 32, fontStyle: "bold" },
      },
      didParseCell: (hookData) => {
        if (hookData.row.index === 1) {
          hookData.cell.styles.fillColor = [192, 57, 43];
          hookData.cell.styles.textColor = [255, 255, 255];
          hookData.cell.styles.fontStyle = "bold";
          hookData.cell.styles.fontSize = 9;
        }
      },
    });

    // ── Footer ────────────────────────────────────────────────────
    const footerY = (doc as any).lastAutoTable.finalY + 10;
    doc.setFont("helvetica", "italic");
    doc.setFontSize(7);
    doc.setTextColor(150, 150, 150);
    doc.text(
      `System-generated statement · ${ORGANIZATION_NAME} · Share price: RWF 15,000 · Interest: 8% p.a. · Loan eligibility: 80%`,
      W / 2,
      footerY,
      { align: "center" }
    );

    doc.save(`${ORGANIZATION_NAME.replace(/\s+/g, "_")}_Statement_${data.memberId}_${new Date().toISOString().split("T")[0]}.pdf`);
  };

  return (
    <div className="space-y-4">
      {/* Actions */}
      <div className="flex gap-2 justify-end flex-wrap">
        {memberEmail && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleEmailStatement}
            className={emailSent ? "text-green-600 border-green-300" : ""}
          >
            {emailSent ? (
              <><CheckCircle className="h-4 w-4 mr-2 text-green-600" />Sent!</>
            ) : (
              <><Mail className="h-4 w-4 mr-2" />Email Statement</>
            )}
          </Button>
        )}
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
          <h2 className="text-base font-bold tracking-wide">{ORGANIZATION_NAME}</h2>
          <p className="text-xs opacity-90">MEMBER'S ACCOUNT STATEMENT</p>
        </div>

        {/* Meta row */}
        <div className="grid grid-cols-2 gap-x-4 px-4 py-2 bg-gray-50 border-b text-xs">
          <div>
            <span className="text-muted-foreground">Account Name: </span>
            <span className="font-semibold">{data.memberName}</span>
          </div>
          <div>
            <span className="text-muted-foreground">Account No: </span>
            <span className="font-semibold">{data.accountNumber}</span>
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

        {/* Totals */}
        <table className="w-full border-collapse mt-2">
          <tbody>
            <tr>
              <td className={`${tdBold} w-1/2`}>Advanced Account Charges</td>
              <td className={tdBoldRight}>0</td>
              <td colSpan={2} className="border border-gray-300"></td>
            </tr>
            <tr className="bg-red-600 text-white">
              <td className="border border-red-700 text-xs px-2 py-1 font-bold">Total Debts</td>
              <td className="border border-red-700 text-xs px-2 py-1 font-bold text-right">
                {fmt(data.totalDebts)}
              </td>
              <td colSpan={2} className="border border-red-700"></td>
            </tr>
          </tbody>
        </table>

        <div className="px-4 py-2 text-[10px] text-muted-foreground border-t">
          This is a system-generated statement from ANDA Finance. Share price: RWF 15,000.
          Interest rate: 8% p.a. Loan eligibility: 80% of total savings.
        </div>
      </div>
    </div>
  );
}
