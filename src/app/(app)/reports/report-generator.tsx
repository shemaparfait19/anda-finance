"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Download, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { generateReportData, type ReportData } from "./actions";
import type { Member } from "@/lib/types";

const REPORT_TYPES = [
  { id: "member_statement", name: "Member Statement", needsMember: true },
  { id: "group_summary", name: "Group Summary", needsMember: false },
  { id: "loan_portfolio", name: "Loan Portfolio", needsMember: false },
  { id: "savings_report", name: "Savings Report", needsMember: false },
  { id: "arrears_list", name: "Loan Arrears List", needsMember: false },
];

function downloadCSV(filename: string, rows: string[][]): void {
  const csv = rows.map((r) => r.map((c) => `"${String(c ?? "").replace(/"/g, '""')}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

async function downloadExcel(filename: string, sheetName: string, rows: any[][]): Promise<void> {
  const XLSX = await import("xlsx");
  const ws = XLSX.utils.aoa_to_sheet(rows);
  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, sheetName);
  XLSX.writeFile(wb, filename);
}

async function downloadPDF(reportType: string, data: ReportData): Promise<void> {
  const { jsPDF } = await import("jspdf");
  const autoTable = (await import("jspdf-autotable")).default;

  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const H = doc.internal.pageSize.getHeight();
  const M = 18;
  const statementDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  const reportLabel = REPORT_TYPES.find((r) => r.id === reportType)?.name ?? reportType;

  let y = 18;

  // Org header
  doc.setFont("helvetica", "bold"); doc.setFontSize(16); doc.setTextColor(0, 0, 0);
  doc.text("ANDA FINANCE", M, y);
  y += 5;
  doc.setFont("helvetica", "normal"); doc.setFontSize(8); doc.setTextColor(100, 100, 100);
  doc.text("Savings & Microfinance Institution", M, y);
  y += 4;
  doc.setDrawColor(0, 0, 0); doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setFont("helvetica", "bold"); doc.setFontSize(10); doc.setTextColor(0, 0, 0);
  doc.text(reportLabel.toUpperCase(), W / 2, y, { align: "center" });
  y += 9;

  const plainHead = { fillColor: false as any, textColor: [0,0,0] as [number,number,number], fontStyle: "bold" as const, fontSize: 8,
    cellPadding: { top:2, bottom:3, left:2, right:2 }, lineWidth: { bottom: 0.5 } as any, lineColor: [0,0,0] as [number,number,number] };
  const plainBody = { fontSize: 8, cellPadding: { top:2, bottom:2, left:2, right:2 }, textColor: [0,0,0] as [number,number,number],
    lineWidth: { bottom: 0.2 } as any, lineColor: [210,210,210] as [number,number,number] };

  if (data.type === "member_statement") {
    const { member, accounts, transactions } = data;

    // Info grid
    const col2 = W / 2 + 4;
    const infoItems: [string, string, number, number][] = [
      ["Member Name",   member.name,                                         M,    y],
      ["Member ID",     member.memberId,                                     col2, y],
      ["Status",        member.status,                                       M,    y + 9],
      ["Join Date",     new Date(member.joinDate).toLocaleDateString('en-GB'), col2, y + 9],
      ["Savings",       `RWF ${member.savingsBalance.toLocaleString()}`,     M,    y + 18],
      ["Loan Balance",  `RWF ${member.loanBalance.toLocaleString()}`,        col2, y + 18],
    ];
    infoItems.forEach(([label, value, x, iy]) => {
      doc.setFont("helvetica", "normal"); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
      doc.text(label, x, iy);
      doc.setFont("helvetica", "bold"); doc.setFontSize(8.5); doc.setTextColor(0, 0, 0);
      doc.text(value, x, iy + 4);
    });
    y += 27;

    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;

    if (accounts.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Account No.", "Type", "Name", "Balance (RWF)"]],
        body: accounts.map((a: any) => [a.accountNumber, a.type, a.accountName || "-", Number(a.balance).toLocaleString()]),
        theme: "plain", margin: { left: M, right: M },
        headStyles: plainHead, bodyStyles: plainBody,
        alternateRowStyles: { fillColor: [248,248,248] },
        columnStyles: { 3: { halign: "right" } },
      });
      y = (doc as any).lastAutoTable.finalY + 8;
    }

    if (transactions.length > 0) {
      autoTable(doc, {
        startY: y,
        head: [["Date", "Type", "Amount (RWF)", "Status"]],
        body: transactions.slice(0, 30).map((t: any) => [t.date, t.type, Number(t.amount).toLocaleString(), t.status]),
        theme: "plain", margin: { left: M, right: M },
        headStyles: plainHead, bodyStyles: plainBody,
        alternateRowStyles: { fillColor: [248,248,248] },
        columnStyles: { 2: { halign: "right" } },
      });
    }
  } else if (data.type === "group_summary") {
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Name", "Member ID", "Status", "Savings (RWF)", "Loan Balance (RWF)"]],
      body: data.members.map((m: any) => [m.name, m.memberId, m.status, m.savingsBalance.toLocaleString(), m.loanBalance.toLocaleString()]),
      theme: "plain", margin: { left: M, right: M },
      headStyles: plainHead, bodyStyles: plainBody,
      alternateRowStyles: { fillColor: [248,248,248] },
      columnStyles: { 3: { halign: "right" }, 4: { halign: "right" } },
    });
  } else if (data.type === "loan_portfolio") {
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Loan ID", "Member", "Principal (RWF)", "Balance (RWF)", "Rate %", "Status", "Due Date"]],
      body: data.loans.map((l: any) => [l.loanId, l.memberName, l.principal.toLocaleString(), l.balance.toLocaleString(), l.interestRate, l.status, l.dueDate]),
      theme: "plain", margin: { left: M, right: M },
      headStyles: plainHead, bodyStyles: plainBody,
      alternateRowStyles: { fillColor: [248,248,248] },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
    });
  } else if (data.type === "savings_report") {
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Account No.", "Member", "Type", "Name", "Balance (RWF)", "Open Date"]],
      body: data.accounts.map((a: any) => [a.accountNumber, a.memberName || "Internal", a.type, a.accountName || "-", Number(a.balance).toLocaleString(), a.openDate]),
      theme: "plain", margin: { left: M, right: M },
      headStyles: plainHead, bodyStyles: plainBody,
      alternateRowStyles: { fillColor: [248,248,248] },
      columnStyles: { 4: { halign: "right" } },
    });
  } else if (data.type === "arrears_list") {
    doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
    doc.line(M, y, W - M, y);
    y += 5;
    autoTable(doc, {
      startY: y,
      head: [["Loan ID", "Member", "Principal (RWF)", "Balance (RWF)", "Status", "Due Date"]],
      body: data.loans.map((l: any) => [l.loanId, l.memberName, l.principal.toLocaleString(), l.balance.toLocaleString(), l.status, l.dueDate]),
      theme: "plain", margin: { left: M, right: M },
      headStyles: plainHead, bodyStyles: plainBody,
      alternateRowStyles: { fillColor: [248,248,248] },
      columnStyles: { 2: { halign: "right" }, 3: { halign: "right" } },
    });
  }

  // Footer
  doc.setFont("helvetica", "italic"); doc.setFontSize(7); doc.setTextColor(150,150,150);
  doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
  doc.line(M, H - 14, W - M, H - 14);
  doc.text(`This is a system-generated report.  ·  ANDA FINANCE  ·  Generated: ${statementDate}`, W/2, H - 9, { align: "center" });

  const today = new Date().toISOString().split("T")[0];
  doc.save(`ANDA_${reportLabel.replace(/\s+/g, "_")}_${today}.pdf`);
}

function buildRows(reportType: string, data: ReportData): { headers: string[]; rows: any[][] } {
  if (data.type === "member_statement") {
    const { member, transactions } = data;
    return {
      headers: ["Date", "Type", "Amount (RWF)", "Status"],
      rows: [
        [`Member: ${member.name}`, `ID: ${member.memberId}`, `Status: ${member.status}`, ""],
        ["Date", "Type", "Amount (RWF)", "Status"],
        ...transactions.map((t: any) => [t.date, t.type, t.amount, t.status]),
      ],
    };
  }
  if (data.type === "group_summary") {
    return {
      headers: ["Name", "Member ID", "Status", "Savings (RWF)", "Loan Balance (RWF)"],
      rows: [
        ["Name", "Member ID", "Status", "Savings (RWF)", "Loan Balance (RWF)"],
        ...data.members.map((m: any) => [m.name, m.memberId, m.status, m.savingsBalance, m.loanBalance]),
      ],
    };
  }
  if (data.type === "loan_portfolio") {
    return {
      headers: ["Loan ID", "Member", "Principal", "Balance", "Rate %", "Status", "Due Date"],
      rows: [
        ["Loan ID", "Member", "Principal (RWF)", "Balance (RWF)", "Rate %", "Status", "Due Date"],
        ...data.loans.map((l: any) => [l.loanId, l.memberName, l.principal, l.balance, l.interestRate, l.status, l.dueDate]),
      ],
    };
  }
  if (data.type === "savings_report") {
    return {
      headers: ["Account No.", "Member", "Type", "Name", "Balance", "Open Date"],
      rows: [
        ["Account No.", "Member", "Type", "Name", "Balance (RWF)", "Open Date"],
        ...data.accounts.map((a: any) => [a.accountNumber, a.memberName || "Internal", a.type, a.accountName || "-", a.balance, a.openDate]),
      ],
    };
  }
  if (data.type === "arrears_list") {
    return {
      headers: ["Loan ID", "Member", "Principal", "Balance", "Status", "Due Date"],
      rows: [
        ["Loan ID", "Member", "Principal (RWF)", "Balance (RWF)", "Status", "Due Date"],
        ...data.loans.map((l: any) => [l.loanId, l.memberName, l.principal, l.balance, l.status, l.dueDate]),
      ],
    };
  }
  return { headers: [], rows: [] };
}

interface ReportGeneratorProps {
  members: Member[];
}

export default function ReportGenerator({ members }: ReportGeneratorProps) {
  const { toast } = useToast();
  const [reportType, setReportType] = useState("");
  const [memberId, setMemberId] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [format, setFormat] = useState("pdf");
  const [isLoading, setIsLoading] = useState(false);

  const selectedReportType = REPORT_TYPES.find((r) => r.id === reportType);

  const handleGenerate = async () => {
    if (!reportType) {
      toast({ variant: "destructive", title: "Error", description: "Please select a report type." });
      return;
    }
    setIsLoading(true);
    try {
      const result = await generateReportData({ reportType, memberId: memberId || undefined, startDate: startDate || undefined, endDate: endDate || undefined });

      if (!result.success || !result.data) {
        toast({ variant: "destructive", title: "Error", description: result.error || "Failed to generate report." });
        return;
      }

      const reportLabel = selectedReportType?.name ?? reportType;
      const today = new Date().toISOString().split("T")[0];
      const filename = `ANDA_${reportLabel.replace(/\s+/g, "_")}_${today}`;

      if (format === "pdf") {
        await downloadPDF(reportType, result.data);
      } else if (format === "csv") {
        const { rows } = buildRows(reportType, result.data);
        downloadCSV(`${filename}.csv`, rows);
      } else if (format === "excel") {
        const { rows } = buildRows(reportType, result.data);
        await downloadExcel(`${filename}.xlsx`, reportLabel, rows);
      }

      toast({ title: "Success", description: `${reportLabel} downloaded as ${format.toUpperCase()}.` });
    } catch (e: any) {
      toast({ variant: "destructive", title: "Error", description: e.message || "An unexpected error occurred." });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        <div className="grid gap-2">
          <Label>Report Type</Label>
          <Select value={reportType} onValueChange={setReportType}>
            <SelectTrigger>
              <SelectValue placeholder="Select a report" />
            </SelectTrigger>
            <SelectContent>
              {REPORT_TYPES.map((r) => (
                <SelectItem key={r.id} value={r.id}>
                  {r.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedReportType?.needsMember && (
          <div className="grid gap-2">
            <Label>Member</Label>
            <Select value={memberId} onValueChange={setMemberId}>
              <SelectTrigger>
                <SelectValue placeholder="Select a member" />
              </SelectTrigger>
              <SelectContent>
                {members.map((m) => (
                  <SelectItem key={m.id} value={m.id}>
                    {m.name} — {m.memberId}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}

        <div className="grid gap-2">
          <Label>Start Date</Label>
          <Input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label>End Date</Label>
          <Input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
        </div>

        <div className="grid gap-2">
          <Label>Format</Label>
          <Select value={format} onValueChange={setFormat}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="pdf">PDF</SelectItem>
              <SelectItem value="csv">CSV</SelectItem>
              <SelectItem value="excel">Excel</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="border-t pt-4">
        <Button onClick={handleGenerate} disabled={isLoading}>
          {isLoading ? (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          ) : (
            <Download className="mr-2 h-4 w-4" />
          )}
          {isLoading ? "Generating…" : "Generate Report"}
        </Button>
      </div>
    </div>
  );
}
