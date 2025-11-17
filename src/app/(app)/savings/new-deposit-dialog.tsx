
'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { ArrowDownCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { makeDeposit } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { Member } from '@/lib/types';

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
            Confirm Deposit
        </Button>
    )
}

interface NewDepositDialogProps {
    members: Member[];
    selectedMemberId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
}

export default function NewDepositDialog({ members, selectedMemberId, open, onOpenChange, trigger }: NewDepositDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, formAction] = useFormState(makeDeposit, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange : setInternalOpen;


   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        setCurrentOpen(false);
        formRef.current?.reset();
      } else if (!state.fields || Object.keys(state.fields).length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
   }, [state, toast, setCurrentOpen]);
   
   useEffect(() => {
    if (!currentOpen) {
      formRef.current?.reset();
    }
   }, [currentOpen]);


  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} action={formAction}>
            <DialogHeader>
            <DialogTitle>New Deposit</DialogTitle>
            <DialogDescription>
                Record a new savings deposit for a member.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="memberId" className="text-right">
                    Member ID
                    </Label>
                    <div className='col-span-3'>
                        <Input id="memberId" name="memberId" placeholder="Enter Member ID" autoComplete="off"
                          onBlur={async (e) => {
                            const val = e.target.value.trim();
                            const display = document.getElementById('memberNameDisplay');
                            if (!val) { if (display) display.textContent = ''; return; }
                            display!.textContent = '...';
                            try {
                              const res = await fetch(`/api/members/lookup?memberId=${encodeURIComponent(val)}`);
                              const data = await res.json();
                              display!.textContent = data.name ? data.name : 'Not found';
                            } catch {
                              display!.textContent = 'Not found';
                            }
                          }}
                        />
                        <div id="memberNameDisplay" className="text-xs text-muted-foreground mt-1"></div>
                        {state.fields?.memberId && <p className="text-sm text-destructive mt-1">{state.fields.memberId}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="account" className="text-right">
                    Account to deposit to
                    </Label>
                    <div className='col-span-3'>
                        <Input id="account" name="account" placeholder="e.g. BIF00501" autoComplete="off" />
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">
                    Amount
                    </Label>
                    <div className='col-span-3'>
                        <Input id="amount" name="amount" type="number" placeholder='RWF 0' className="w-full" />
                        {state.fields?.amount && <p className="text-sm text-destructive mt-1">{state.fields.amount}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">
                    Reason
                    </Label>
                    <div className='col-span-3'>
                        <Input id="reason" name="reason" placeholder="Reason for deposit (shows on statement)" />
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
