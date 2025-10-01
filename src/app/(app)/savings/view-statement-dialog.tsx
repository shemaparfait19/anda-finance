
'use client';

import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { ScrollArea } from '@/components/ui/scroll-area';
import type { SavingsAccount, Transaction } from '@/lib/types';
import { useEffect, useState } from 'react';
import { getTransactionsByMemberId } from '@/lib/data-service';

interface ViewStatementDialogProps {
  account: SavingsAccount;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export default function ViewStatementDialog({ account, open, onOpenChange }: ViewStatementDialogProps) {
    const [transactions, setTransactions] = useState<Transaction[]>([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        if (open) {
            setLoading(true);
            getTransactionsByMemberId(account.memberId)
                .then(data => {
                    const filtered = data.filter(t => t.type === 'Deposit' || t.type === 'Withdrawal');
                    setTransactions(filtered);
                })
                .finally(() => setLoading(false));
        }
    }, [open, account.memberId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>Account Statement: {account.accountNumber}</DialogTitle>
          <DialogDescription>
            Showing recent transactions for {account.memberName}.
          </DialogDescription>
        </DialogHeader>
        <ScrollArea className="h-96">
            <Table>
                <TableHeader>
                    <TableRow>
                        <TableHead>Date</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead className='text-right'>Amount</TableHead>
                    </TableRow>
                </TableHeader>
                <TableBody>
                    {loading ? (
                        <TableRow>
                            <TableCell colSpan={3} className='text-center'>Loading transactions...</TableCell>
                        </TableRow>
                    ) : transactions.length > 0 ? (
                        transactions.map(tx => (
                            <TableRow key={tx.id}>
                                <TableCell>{tx.date}</TableCell>
                                <TableCell>
                                    <span className={tx.type === 'Deposit' ? 'text-green-600' : 'text-red-600'}>
                                        {tx.type}
                                    </span>
                                </TableCell>
                                <TableCell className='text-right'>RWF {tx.amount.toLocaleString()}</TableCell>
                            </TableRow>
                        ))
                    ) : (
                         <TableRow>
                            <TableCell colSpan={3} className='text-center'>No transactions found.</TableCell>
                        </TableRow>
                    )}
                </TableBody>
            </Table>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
}
