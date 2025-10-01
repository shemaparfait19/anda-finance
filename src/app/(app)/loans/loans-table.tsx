
'use client';

import { useState, useTransition } from 'react';
import { MoreHorizontal } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { CardFooter } from '@/components/ui/card';
import type { Loan } from '@/lib/types';
import { AppConfirmationDialog } from '@/components/ui/app-confirmation-dialog';
import { useToast } from '@/hooks/use-toast';
import { approveLoan } from './actions';
import RecordRepaymentDialog from './record-repayment-dialog';
import ViewLoanDetailsDialog from './view-loan-details-dialog';

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

interface LoansTableProps {
    loans: Loan[];
}

export default function LoansTable({ loans }: LoansTableProps) {
    const { toast } = useToast();
    const [isApproving, startApproveTransition] = useTransition();

    const [dialogState, setDialogState] = useState({
        approve: { open: false, loan: null as Loan | null },
        repayment: { open: false, loan: null as Loan | null },
        details: { open: false, loan: null as Loan | null },
    });

    const handleOpenDialog = (type: 'approve' | 'repayment' | 'details', loan: Loan) => {
        setDialogState(prev => ({ ...prev, [type]: { open: true, loan }}));
    };

    const handleCloseDialog = (type: 'approve' | 'repayment' | 'details') => {
        setDialogState(prev => ({ ...prev, [type]: { open: false, loan: null }}));
    };

    const handleApprove = async (loanId: string) => {
        startApproveTransition(async () => {
            const result = await approveLoan(loanId);
             if (result.success) {
                toast({ title: 'Success', description: result.message });
            } else {
                toast({ variant: 'destructive', title: 'Error', description: result.message });
            }
            handleCloseDialog('approve');
        });
    }

    return (
        <>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Loan ID</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Due Date
                  </TableHead>
                  <TableHead className="hidden md:table-cell text-right">
                    Principal
                  </TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {loans.map((loan) => (
                  <TableRow key={loan.id}>
                    <TableCell className="font-medium">{loan.memberName}</TableCell>
                    <TableCell>{loan.loanId}</TableCell>
                    <TableCell>
                      <Badge variant={getStatusBadgeVariant(loan.status)}>
                        {loan.status}
                      </Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {loan.dueDate}
                    </TableCell>
                    <TableCell className="hidden md:table-cell text-right">
                      RWF {loan.principal.toLocaleString()}
                    </TableCell>
                    <TableCell className="text-right">
                      RWF {loan.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button
                            aria-haspopup="true"
                            size="icon"
                            variant="ghost"
                          >
                            <MoreHorizontal className="h-4 w-4" />
                            <span className="sr-only">Toggle menu</span>
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Actions</DropdownMenuLabel>
                           {loan.status === 'Pending' && <DropdownMenuItem onSelect={() => handleOpenDialog('approve', loan)}>Approve Loan</DropdownMenuItem>}
                          <DropdownMenuItem onSelect={() => handleOpenDialog('details', loan)}>View Details</DropdownMenuItem>
                           {loan.status === 'Active' || loan.status === 'Overdue' ? (
                            <DropdownMenuItem onSelect={() => handleOpenDialog('repayment', loan)}>Record Repayment</DropdownMenuItem>
                           ) : null}
                          <DropdownMenuSeparator />
                          <DropdownMenuItem>Send Reminder</DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
            <CardFooter>
                <div className="text-xs text-muted-foreground">
                Showing <strong>1-{loans.length}</strong> of <strong>{loans.length}</strong> loans
                </div>
            </CardFooter>

            {/* Dialogs for actions */}
            {dialogState.approve.loan && (
                <AppConfirmationDialog
                    open={dialogState.approve.open}
                    onOpenChange={(open) => !open && handleCloseDialog('approve')}
                    title="Approve Loan"
                    description={`Are you sure you want to approve this RWF ${dialogState.approve.loan.principal.toLocaleString()} loan for ${dialogState.approve.loan.memberName}? This will mark it as Active and update the member's loan balance.`}
                    onConfirm={() => handleApprove(dialogState.approve.loan!.id)}
                    isPending={isApproving}
                    confirmText="Yes, Approve"
                />
            )}

            {dialogState.repayment.loan && (
                 <RecordRepaymentDialog
                    loan={dialogState.repayment.loan}
                    open={dialogState.repayment.open}
                    onOpenChange={(open) => !open && handleCloseDialog('repayment')}
                />
            )}
            
            {dialogState.details.loan && (
                <ViewLoanDetailsDialog
                    loan={dialogState.details.loan}
                    open={dialogState.details.open}
                    onOpenChange={(open) => !open && handleCloseDialog('details')}
                />
            )}
        </>
    )
}
