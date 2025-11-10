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
  const pageWidth = doc.internal.pageSize.getWidth();
  const margin = 20;
  
  // Add logo and header
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('ANDA FINANCE', pageWidth / 2, 20, { align: 'center' });
  
  doc.setFontSize(12);
  doc.setFont('helvetica', 'normal');
  doc.text('Member Savings Statement', pageWidth / 2, 30, { align: 'center' });
  
  // Member info
  doc.setFontSize(10);
  doc.text(`Member: ${member.name}`, margin, 50);
  doc.text(`Member ID: ${member.memberId}`, margin, 58);
  doc.text(`Join Date: ${new Date(member.joinDate).toLocaleDateString()}`, margin, 66);
  doc.text(`Status: ${member.status}`, margin, 74);
  doc.text(`Statement Date: ${new Date().toLocaleDateString()}`, margin, 82);
  
  // Savings breakdown
  doc.setFontSize(12);
  doc.setFont('helvetica', 'bold');
  doc.text('Savings Breakdown', margin, 100);
  
  // Table data
  const tableData = [
    ['Principal Savings', member.principal.toLocaleString() + ' RWF', member.principalShares.toFixed(2) + ' shares'],
    ['Interest Earned', member.interest.toLocaleString() + ' RWF', member.interestShares.toFixed(2) + ' shares'],
    ['Total', member.totalSavings.toLocaleString() + ' RWF', member.totalShares.toFixed(2) + ' shares']
  ];
  
  // Generate table
  autoTable(doc, {
    startY: 110,
    head: [['Description', 'Amount', 'Shares']],
    body: tableData,
    theme: 'grid',
    headStyles: {
      fillColor: [41, 128, 185],
      textColor: 255,
      fontStyle: 'bold',
    },
    didDrawPage: function (data) {
      // Footer
      const pageSize = doc.internal.pageSize;
      const pageHeight = pageSize.height ? pageSize.height : pageSize.getHeight();
      doc.setFontSize(10);
      doc.text(
        'This is an auto-generated statement from ANDA FINANCE',
        pageWidth / 2,
        pageHeight - 20,
        { align: 'center' }
      );
    },
  });
  
  // Save the PDF
  doc.save(`ANDA_Statement_${member.memberId}_${new Date().toISOString().split('T')[0]}.pdf`);
}
