import { jsPDF } from 'jspdf';
import autoTable from 'jspdf-autotable';

type MemberData = {
  name: string;
  memberId: string;
  joinDate: string;
  status: string;
  principal: number;
  interest: number;
  principalShares: number;
  interestShares: number;
  totalSavings: number;
  totalShares: number;
};

export async function generateMemberStatementPdf(member: MemberData) {
  const doc = new jsPDF();
  const W = doc.internal.pageSize.getWidth();
  const M = 18;
  const statementDate = new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' });
  let y = 18;

  // Org name
  doc.setFont('helvetica', 'bold');
  doc.setFontSize(16);
  doc.setTextColor(0, 0, 0);
  doc.text('ANDA FINANCE', M, y);
  y += 5;
  doc.setFont('helvetica', 'normal');
  doc.setFontSize(8);
  doc.setTextColor(100, 100, 100);
  doc.text('Savings & Microfinance Institution', M, y);
  y += 4;
  doc.setDrawColor(0, 0, 0);
  doc.setLineWidth(0.6);
  doc.line(M, y, W - M, y);
  y += 6;

  doc.setFont('helvetica', 'bold');
  doc.setFontSize(10);
  doc.setTextColor(0, 0, 0);
  doc.text('MEMBER SAVINGS STATEMENT', W / 2, y, { align: 'center' });
  y += 9;

  // Info grid
  const col2 = W / 2 + 4;
  const info: [string, string, number, number][] = [
    ['Member Name',  member.name,                                     M,    y],
    ['Member ID',    member.memberId,                                  col2, y],
    ['Join Date',    new Date(member.joinDate).toLocaleDateString('en-GB'), M, y + 9],
    ['Status',       member.status,                                    col2, y + 9],
    ['Statement Date', statementDate,                                  M,    y + 18],
    ['Total Shares', member.totalShares.toFixed(2) + ' shares',       col2, y + 18],
  ];
  info.forEach(([label, value, x, iy]) => {
    doc.setFont('helvetica', 'normal'); doc.setFontSize(7); doc.setTextColor(100, 100, 100);
    doc.text(label, x, iy);
    doc.setFont('helvetica', 'bold'); doc.setFontSize(8.5); doc.setTextColor(0, 0, 0);
    doc.text(value, x, iy + 4);
  });
  y += 27;

  doc.setDrawColor(180, 180, 180); doc.setLineWidth(0.3);
  doc.line(M, y, W - M, y);
  y += 5;

  autoTable(doc, {
    startY: y,
    head: [['Description', 'Amount (RWF)', 'Shares']],
    body: [
      ['Principal Savings', member.principal.toLocaleString(), member.principalShares.toFixed(2)],
      ['Interest Earned',   member.interest.toLocaleString(),  member.interestShares.toFixed(2)],
      ['Total',             member.totalSavings.toLocaleString(), member.totalShares.toFixed(2)],
    ],
    theme: 'plain',
    margin: { left: M, right: M },
    headStyles: { fillColor: false as any, textColor: [0,0,0], fontStyle: 'bold', fontSize: 8,
      cellPadding: { top:2, bottom:3, left:2, right:2 }, lineWidth: { bottom: 0.5 } as any, lineColor: [0,0,0] },
    bodyStyles: { fontSize: 8, cellPadding: { top:2, bottom:2, left:2, right:2 }, textColor: [0,0,0],
      lineWidth: { bottom: 0.2 } as any, lineColor: [210,210,210] },
    alternateRowStyles: { fillColor: [248,248,248] },
    columnStyles: { 0: { cellWidth: 'auto' }, 1: { halign: 'right', cellWidth: 40 }, 2: { halign: 'right', cellWidth: 30 } },
    didParseCell: (d) => {
      if (d.row.index === 2) { d.cell.styles.fontStyle = 'bold'; d.cell.styles.fillColor = [235,235,235]; (d.cell.styles as any).lineWidth = { top: 0.5 }; d.cell.styles.lineColor = [0,0,0]; }
    },
  });

  const pgH = doc.internal.pageSize.getHeight();
  doc.setFont('helvetica', 'italic'); doc.setFontSize(7); doc.setTextColor(150,150,150);
  doc.setDrawColor(200,200,200); doc.setLineWidth(0.2);
  doc.line(M, pgH - 14, W - M, pgH - 14);
  doc.text(`This is a system-generated statement and does not require a signature.  ·  ANDA FINANCE  ·  Generated: ${statementDate}`, W/2, pgH - 9, { align: 'center' });

  doc.save(`Statement_${member.memberId}_${new Date().toISOString().split('T')[0]}.pdf`);
}
