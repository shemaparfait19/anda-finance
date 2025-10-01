'use client';

import { useState, useEffect, useActionState, useRef } from 'react';
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

export default function NewWithdrawalDialog({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(makeWithdrawal, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        setOpen(false);
        formRef.current?.reset();
      } else if (!state.fields) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
   }, [state, toast]);
   
   useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      state.message = '';
      state.fields = {};
      state.success = false;
    }
   }, [open, state]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              New Withdrawal
            </span>
          </Button>
      </DialogTrigger>
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
                        <Select name="memberId">
                             <SelectTrigger>
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
