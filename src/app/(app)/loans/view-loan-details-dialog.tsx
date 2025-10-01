
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import type { Loan } from '@/lib/types';
import { Separator } from '@/components/ui/separator';

interface ViewLoanDetailsDialogProps {
  loan: Loan;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

function DetailRow({ label, value, isBadge=false, badgeVariant='outline' }: { label: string, value: string | number, isBadge?: boolean, badgeVariant?: any }) {
    return (
        <div className="flex justify-between items-center py-2">
            <span className="text-muted-foreground">{label}</span>
            {isBadge ? (
                <Badge variant={badgeVariant}>{value}</Badge>
            ) : (
                 <span className="font-medium">{typeof value === 'number' ? `RWF ${value.toLocaleString()}` : value}</span>
            )}
        </div>
    )
}

export default function ViewLoanDetailsDialog({ loan, open, onOpenChange }: ViewLoanDetailsDialogProps) {
  const getStatusBadgeVariant = (status: Loan['status']) => {
    switch (status) {
        case 'Active': return 'default';
        case 'Paid': return 'secondary';
        case 'Overdue': return 'destructive';
        case 'Defaulted': return 'destructive';
        case 'Pending': return 'outline';
        default: return 'outline';
    }
  }
    
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Loan Details: {loan.loanId}</DialogTitle>
          <DialogDescription>
            Showing full details for the loan issued to {loan.memberName}.
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-3">
            <DetailRow label="Status" value={loan.status} isBadge badgeVariant={getStatusBadgeVariant(loan.status)} />
            <Separator />
            <DetailRow label="Principal Amount" value={loan.principal} />
            <DetailRow label="Outstanding Balance" value={loan.balance} />
            <DetailRow label="Interest Rate" value={`${loan.interestRate}%`} />
             <Separator />
            <DetailRow label="Issue Date" value={loan.issueDate} />
            <DetailRow label="Due Date" value={loan.dueDate} />
            <DetailRow label="Loan Term" value={`${loan.loanTerm} months`} />
            <Separator />
            <div className="py-2 space-y-1">
                <span className="text-muted-foreground">Loan Purpose</span>
                <p className="font-medium">{loan.loanPurpose}</p>
                {loan.purposeDescription && (
                    <p className="text-sm text-muted-foreground/80">{loan.purposeDescription}</p>
                )}
            </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
