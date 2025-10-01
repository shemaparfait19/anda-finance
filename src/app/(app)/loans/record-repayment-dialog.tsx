
'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { recordRepayment } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { Loan } from '@/lib/types';

const initialState = {
  message: '',
  fields: {},
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Repayment
        </Button>
    )
}

interface RecordRepaymentDialogProps {
    loan: Loan;
    open: boolean;
    onOpenChange: (open: boolean) => void;
}

export default function RecordRepaymentDialog({ loan, open, onOpenChange }: RecordRepaymentDialogProps) {
  const [state, formAction] = useActionState(recordRepayment, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        onOpenChange(false);
      } else if (!state.fields || Object.keys(state.fields).length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
   }, [state, toast, onOpenChange]);
   
   useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      if (state.message || state.success || state.fields) {
            state.message = '';
            state.success = false;
            state.fields = {};
       }
    }
   }, [open, state]);


  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} action={formAction}>
            <DialogHeader>
            <DialogTitle>Record Repayment</DialogTitle>
            <DialogDescription>
                For {loan.memberName} (Loan ID: {loan.loanId}).
                <br />
                Outstanding Balance: RWF {loan.balance.toLocaleString()}
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <input type="hidden" name="loanId" value={loan.id} />
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                    Amount
                    </Label>
                    <div className='col-span-3'>
                    <Input id="amount" name="amount" type="number" placeholder='RWF 0' className="w-full" />
                    {state.fields?.amount && <p className="text-sm text-destructive mt-1">{state.fields.amount}</p>}
                    </div>
                </div>
            </div>
            <DialogFooter>
                <DialogClose asChild>
                    <Button variant="outline">Cancel</Button>
                </DialogClose>
                <SubmitButton />
            </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
