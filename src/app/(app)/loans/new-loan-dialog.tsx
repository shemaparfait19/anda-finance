
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { PlusCircle, Loader2 } from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { ScrollArea } from '@/components/ui/scroll-area';
import { applyForLoan } from './actions';
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
            Submit Application
        </Button>
    )
}

export default function NewLoanDialog({ members }: { members: Member[] }) {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(applyForLoan, initialState);
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
    }
   }, [open]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            New Loan Application
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-xl">
        <form ref={formRef} action={formAction}>
            <DialogHeader>
            <DialogTitle>New Loan Application</DialogTitle>
            <DialogDescription>
                Create a loan application for a member
            </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-96 w-full">
            <div className="space-y-6 p-4">
                
                {/* Applicant Information */}
                <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Applicant Information</h3>
                     <div className="grid gap-2">
                        <Label htmlFor="memberId">Select Member *</Label>
                        <Select name="memberId">
                             <SelectTrigger>
                                <SelectValue placeholder="Search member by name or ID..." />
                            </SelectTrigger>
                            <SelectContent>
                                {members.map(member => (
                                    <SelectItem key={member.id} value={member.id}>{member.name} ({member.memberId})</SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                        {state.fields?.memberId && <p className="text-sm text-destructive mt-1">{state.fields.memberId}</p>}
                    </div>
                </div>

                {/* Loan Details */}
                <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Loan Details</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="amount">Loan Amount (RWF) *</Label>
                            <Input id="amount" name="amount" type="number" placeholder="e.g., 500000" />
                            {state.fields?.amount && <p className="text-sm text-destructive">{state.fields.amount}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="term">Loan Term (months) *</Label>
                            <Input id="term" name="term" type="number" placeholder="e.g., 12" />
                            {state.fields?.term && <p className="text-sm text-destructive">{state.fields.term}</p>}
                        </div>
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="interestRate">Interest Rate (%) *</Label>
                        <Input id="interestRate" name="interestRate" type="number" step="0.1" defaultValue="10" />
                        {state.fields?.interestRate && <p className="text-sm text-destructive">{state.fields.interestRate}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="loanPurpose">Loan Purpose *</Label>
                        <Select name="loanPurpose">
                            <SelectTrigger>
                                <SelectValue placeholder="Select purpose" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="Business">Business</SelectItem>
                                <SelectItem value="Education">Education</SelectItem>
                                <SelectItem value="Home Improvement">Home Improvement</SelectItem>
                                <SelectItem value="Medical">Medical</SelectItem>
                                <SelectItem value="Agriculture">Agriculture</SelectItem>
                                <SelectItem value="Other">Other</SelectItem>
                            </SelectContent>
                        </Select>
                        {state.fields?.loanPurpose && <p className="text-sm text-destructive">{state.fields.loanPurpose}</p>}
                    </div>
                     <div className="grid gap-2">
                        <Label htmlFor="purposeDescription">Purpose Description</Label>
                        <Textarea id="purposeDescription" name="purposeDescription" placeholder="Describe how the loan will be used..." />
                    </div>
                </div>
            </div>
            </ScrollArea>
            <DialogFooter className='pt-4 border-t'>
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
