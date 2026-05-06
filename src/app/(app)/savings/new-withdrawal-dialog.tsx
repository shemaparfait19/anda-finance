
'use client';

import { useState, useEffect, useRef, ReactNode, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowUpCircle, Loader2 } from 'lucide-react';
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
import { makeWithdrawal } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { Member, SavingsAccount } from '@/lib/types';

const initialState = {
  message: '',
  fields: {},
  success: false,
};

function SubmitButton() {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" variant="destructive" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Confirm Withdrawal
        </Button>
    )
}

interface NewWithdrawalDialogProps {
    members: Member[];
    accounts?: SavingsAccount[];
    selectedMemberId?: string;
    selectedAccountNumber?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
}

export default function NewWithdrawalDialog({ members, accounts = [], selectedMemberId, selectedAccountNumber, open, onOpenChange, trigger }: NewWithdrawalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [pickedMemberId, setPickedMemberId] = useState(selectedMemberId ?? '');
  const [state, formAction] = useActionState(makeWithdrawal, initialState);
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
   // eslint-disable-next-line react-hooks/exhaustive-deps
   }, [state]);
   
   useEffect(() => {
    if (!currentOpen) {
      formRef.current?.reset();
      setPickedMemberId(selectedMemberId ?? '');
    }
   }, [currentOpen, selectedMemberId]);


  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
       {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[425px]">
        <form ref={formRef} action={formAction}>
            <DialogHeader>
            <DialogTitle>New Withdrawal</DialogTitle>
            <DialogDescription>
                Record a new savings withdrawal for a member.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                {/* Debit Member Account */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label className="text-right text-xs leading-tight">
                        Debit<br/>Member Acct
                    </Label>
                    <div className='col-span-3 space-y-2'>
                        <Select
                            name="memberId"
                            defaultValue={selectedMemberId}
                            onValueChange={setPickedMemberId}
                            disabled={!!selectedMemberId}
                        >
                            <SelectTrigger>
                                <SelectValue placeholder="Select member" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(member => (
                                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {state.fields?.memberId && <p className="text-sm text-destructive">{state.fields.memberId}</p>}
                        {(() => {
                            const memberAccounts = accounts.filter(a => a.memberId === pickedMemberId);
                            if (selectedAccountNumber) {
                                return <Input name="account" defaultValue={selectedAccountNumber} disabled />;
                            }
                            if (memberAccounts.length > 1) {
                                return (
                                    <Select name="account">
                                        <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                                        <SelectContent>
                                            {memberAccounts.map(a => (
                                                <SelectItem key={a.id} value={a.accountNumber}>
                                                    {a.accountNumber}{a.accountName ? ` — ${a.accountName}` : ''}
                                                </SelectItem>
                                            ))}
                                        </SelectContent>
                                    </Select>
                                );
                            }
                            return (
                                <Input
                                    name="account"
                                    value={memberAccounts.length === 1 ? memberAccounts[0].accountNumber : undefined}
                                    defaultValue={memberAccounts.length === 1 ? memberAccounts[0].accountNumber : ''}
                                    placeholder="Account number"
                                    autoComplete="off"
                                    readOnly={memberAccounts.length === 1}
                                />
                            );
                        })()}
                    </div>
                </div>
                {/* Amount */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="amount" className="text-right">Amount</Label>
                    <div className='col-span-3'>
                        <Input id="amount" name="amount" type="number" placeholder='RWF 0' className="w-full" />
                        {state.fields?.amount && <p className="text-sm text-destructive mt-1">{state.fields.amount}</p>}
                    </div>
                </div>
                {/* Credit Account / Wallet */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="creditWallet" className="text-right text-xs leading-tight">
                        Credit Acct /<br/>Wallet
                    </Label>
                    <div className='col-span-3'>
                        <Input
                            id="creditWallet"
                            name="creditWallet"
                            placeholder="e.g. Cash, Mobile Money, Bank A/C"
                            autoComplete="off"
                        />
                        <p className="text-[11px] text-muted-foreground mt-1">Where funds are being paid out to</p>
                    </div>
                </div>
                {/* Reason */}
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="reason" className="text-right">Reason</Label>
                    <div className='col-span-3'>
                        <Input id="reason" name="reason" placeholder="Reason for withdrawal" />
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
