'use client';

import { useRef, useEffect, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Landmark } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter,
  DialogHeader, DialogTitle, DialogTrigger, DialogClose,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { loadInternalAccount } from './actions';

const initialState = { message: '', fields: {} as Record<string, string>, success: false };

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Load Account
    </Button>
  );
}

export default function LoadInternalAccountDialog() {
  const [state, formAction] = useActionState(loadInternalAccount, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!state.message) return;
    if (state.success) {
      toast({ title: 'Success', description: state.message });
      formRef.current?.reset();
    } else if (!state.fields || Object.keys(state.fields).length === 0) {
      toast({ variant: 'destructive', title: 'Error', description: state.message });
    }
  }, [state, toast]);

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="sm" variant="outline" className="h-8 gap-1">
          <Landmark className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">Load Internal Account</span>
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[440px]">
        <form ref={formRef} action={formAction}>
          <DialogHeader>
            <DialogTitle>Load Internal Account</DialogTitle>
            <DialogDescription>
              Record incoming funds to an internal account.
            </DialogDescription>
          </DialogHeader>

          <div className="grid gap-4 py-4">
            {/* Transaction Type */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label className="text-right text-sm">Type</Label>
              <div className="col-span-3">
                <Select name="transactionType" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select transaction type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="Monthly Contribution">Monthly Contribution</SelectItem>
                    <SelectItem value="Contribution">Contribution</SelectItem>
                  </SelectContent>
                </Select>
                {state.fields?.transactionType && (
                  <p className="text-sm text-destructive mt-1">{state.fields.transactionType}</p>
                )}
              </div>
            </div>

            {/* Amount + Payment Method side by side */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="load-amount" className="text-right text-sm">Amount</Label>
              <div className="col-span-3 flex gap-2">
                <div className="flex-1">
                  <Input id="load-amount" name="amount" type="number" placeholder="RWF 0" />
                  {state.fields?.amount && (
                    <p className="text-sm text-destructive mt-1">{state.fields.amount}</p>
                  )}
                </div>
                <div className="w-[140px]">
                  <Select name="paymentMethod">
                    <SelectTrigger>
                      <SelectValue placeholder="Method" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="Cash">Cash</SelectItem>
                      <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                      <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </div>

            {/* Description */}
            <div className="grid grid-cols-4 items-center gap-4">
              <Label htmlFor="load-desc" className="text-right text-sm">Description</Label>
              <div className="col-span-3">
                <Input id="load-desc" name="description" placeholder="Purpose or reference" />
              </div>
            </div>
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline" type="button">Cancel</Button>
            </DialogClose>
            <SubmitButton />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
