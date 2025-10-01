
'use client';

import { useEffect, useRef, useState, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { addCashbookEntry, updateCashbookEntry } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { CashbookEntry } from '@/lib/types';


const initialState = {
  message: '',
  fields: {},
  success: false,
};

function SubmitButton({ isEditMode }: { isEditMode: boolean }) {
    const { pending } = useFormStatus();
    return (
        <Button type="submit" disabled={pending}>
            {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isEditMode ? 'Save Changes' : 'Save Entry'}
        </Button>
    )
}

interface AddEntryDialogProps {
    entry?: CashbookEntry;
    children?: React.ReactNode;
}

export default function AddEntryDialog({ entry, children }: AddEntryDialogProps) {
  const [open, setOpen] = useState(false);
  const isEditMode = !!entry;

  const action = isEditMode ? updateCashbookEntry : addCashbookEntry;
  const [state, formAction] = useActionState(action, initialState);

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
      } else if (!state.fields || Object.keys(state.fields).length === 0) {
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
        {children ? (
             <DialogTrigger asChild>{children}</DialogTrigger>
        ) : (
            <DialogTrigger asChild>
                <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                    Add Entry
                </span>
                </Button>
            </DialogTrigger>
        )}
     
      <DialogContent className="sm:max-w-lg">
        <form ref={formRef} action={formAction}>
           {isEditMode && <input type="hidden" name="id" value={entry.id} />}
           {isEditMode && <input type="hidden" name="entryType" value={entry.amount > 0 ? 'income' : 'expenses'} />}
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit' : 'Add New'} Cashbook Entry</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of this transaction.' : 'Record a new income or expense transaction.'}
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type">Entry Type *</Label>
                    <Select name="type" defaultValue={isEditMode ? (entry.category === 'Loan Interest' || entry.category === 'Fees' || entry.category === 'Contributions' ? 'income' : 'expenses') : undefined}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select type" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="income">Income</SelectItem>
                            <SelectItem value="expenses">Expense</SelectItem>
                        </SelectContent>
                    </Select>
                    {state.fields?.type && <p className="text-sm text-destructive">{state.fields.type}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="date">Date *</Label>
                    <Input id="date" name="date" type="date" defaultValue={entry?.date} />
                    {state.fields?.date && <p className="text-sm text-destructive">{state.fields.date}</p>}
                </div>
            </div>
            <div className="grid gap-2">
              <Label htmlFor="description">Description *</Label>
              <Textarea id="description" name="description" placeholder="e.g., Member contributions for July" defaultValue={entry?.description} />
              {state.fields?.description && <p className="text-sm text-destructive">{state.fields.description}</p>}
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="category">Category *</Label>
                    <Input id="category" name="category" placeholder="e.g., Contributions, Office Supplies" defaultValue={entry?.category}/>
                    {state.fields?.category && <p className="text-sm text-destructive">{state.fields.category}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (RWF) *</Label>
                    <Input id="amount" name="amount" type="number" step="1" placeholder="e.g., 150000" defaultValue={entry?.amount}/>
                    {state.fields?.amount && <p className="text-sm text-destructive">{state.fields.amount}</p>}
                </div>
            </div>
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button variant="outline">Cancel</Button>
            </DialogClose>
            <SubmitButton isEditMode={isEditMode} />
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
