
'use client';

import { useState, useEffect, useRef, ReactNode } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
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
import type { Member } from '@/lib/types';

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
    selectedMemberId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
}

export default function NewWithdrawalDialog({ members, selectedMemberId, open, onOpenChange, trigger }: NewWithdrawalDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, formAction] = useFormState(makeWithdrawal, initialState);
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
            <DialogTitle>New Withdrawal</DialogTitle>
            <DialogDescription>
                Record a new savings withdrawal for a member.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="memberId" className="text-right">
                    Member
                    </Label>
                    <div className='col-span-3'>
                        <Select name="memberId" defaultValue={selectedMemberId}>
                             <SelectTrigger disabled={!!selectedMemberId}>
                                <SelectValue placeholder="Select a member" />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(member => (
                                    <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {state.fields?.memberId && <p className="text-sm text-destructive mt-1">{state.fields.memberId}</p>}
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
