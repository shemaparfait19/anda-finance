'use client';

import { Button } from "@/components/ui/button";
import { Download, Mail as MailIcon } from "lucide-react";
import { generateMemberStatementPdf } from "@/lib/pdf-utils";

interface MemberActionsClientProps {
  member: {
    id: string;
    name: string;
    memberId: string;
    joinDate?: string;
    status: string;
    savingsBalance: number;
    email?: string | null;
  };
}

export function MemberActionsClient({ member }: MemberActionsClientProps) {
  const handleDownloadPdf = async () => {
    // Calculate savings breakdown (these would come from your database in a real app)
    const principal = member.savingsBalance * 0.9; // Assuming 90% of savings is principal
    const interest = member.savingsBalance * 0.1; // Assuming 10% is interest
    const principalShares = principal / 15000; // 15,000 RWF per share
    const interestShares = interest / 15000;
    
    await generateMemberStatementPdf({
      name: member.name || '',
      memberId: member.memberId || '',
      joinDate: member.joinDate || new Date().toISOString(),
      status: member.status || 'Active',
      principal,
      interest,
      principalShares,
      interestShares,
      totalSavings: principal + interest,
      totalShares: principalShares + interestShares,
    });
  };

  const handleEmailStatement = () => {
    // In a real app, this would trigger an email with the PDF attachment
    const emailSubject = `Your Savings Statement - ${member.name}`;
    const emailBody = `Dear ${member.name || 'Valued Member'},\n\nPlease find attached your savings statement.\n\nThank you for being a valued member of ANDA FINANCE.`;
    
    window.location.href = `mailto:${member.email || ''}?subject=${encodeURIComponent(emailSubject)}&body=${encodeURIComponent(emailBody)}`;
  };

  return (
    <div className="flex gap-2">
      <Button variant="outline" size="icon" onClick={handleDownloadPdf}>
        <Download className="h-4 w-4" />
      </Button>
      {member.email && (
        <Button variant="outline" size="icon" onClick={handleEmailStatement}>
          <MailIcon className="h-4 w-4" />
        </Button>
      )}
    </div>
  );
}
