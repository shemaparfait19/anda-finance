
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
import { ScrollArea } from '@/components/ui/scroll-area';
import { addCashbookEntry, updateCashbookEntry } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { CashbookEntry } from '@/lib/types';


const initialState = {
  message: '',
  fields: {},
  success: false,
};

const incomeCategories = [
    'Contributions',
    'Loan Interest',
    'Loan Repayment Principal',
    'Fees',
    'Investment Returns',
    'Other Income',
];

const expenseCategories = [
    'Office Supplies',
    'Bank Fees',
    'IT & Software',
    'Transport',
    'Utilities',
    'Loan Disbursement',
    'Investment Purchase',
    'Other Expenses',
];

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
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
}

export default function AddEntryDialog({ entry, children, open: openProp, onOpenChange: onOpenChangeProp }: AddEntryDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = openProp !== undefined && onOpenChangeProp !== undefined;
  const open = isControlled ? openProp : internalOpen;
  const setOpen = isControlled ? onOpenChangeProp : setInternalOpen;
  
  const isEditMode = !!entry;

  const [entryType, setEntryType] = useState<'income' | 'expenses' | undefined>(isEditMode ? (entry.amount > 0 ? 'income' : 'expenses') : undefined);
  const categories = entryType === 'income' ? incomeCategories : expenseCategories;


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
  }, [state, toast, setOpen]);

  useEffect(() => {
    if (!open) {
      formRef.current?.reset();
      setEntryType(isEditMode ? (entry.amount > 0 ? 'income' : 'expenses') : undefined);
    }
  }, [open, isEditMode, entry]);

  const handleTypeChange = (value: string) => {
    setEntryType(value as 'income' | 'expenses');
  };

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
     
      <DialogContent className="sm:max-w-xl">
        <form ref={formRef} action={formAction}>
           {isEditMode && <input type="hidden" name="id" value={entry.id} />}
          <DialogHeader>
            <DialogTitle>{isEditMode ? 'Edit' : 'Add New'} Cashbook Entry</DialogTitle>
            <DialogDescription>
              {isEditMode ? 'Update the details of this transaction.' : 'Record a new income or expense transaction.'}
            </DialogDescription>
          </DialogHeader>
          <ScrollArea className="h-96 w-full">
          <div className="grid gap-6 p-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="type">Entry Type *</Label>
                    <Select name="type" defaultValue={entryType} onValueChange={handleTypeChange}>
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
                     <Select name="category" defaultValue={entry?.category}>
                        <SelectTrigger disabled={!entryType}>
                            <SelectValue placeholder="Select category" />
                        </SelectTrigger>
                        <SelectContent>
                            {categories.map(cat => (
                                <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                            ))}
                        </SelectContent>
                    </Select>
                    {state.fields?.category && <p className="text-sm text-destructive">{state.fields.category}</p>}
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="amount">Amount (RWF) *</Label>
                    <Input id="amount" name="amount" type="number" step="1" placeholder="e.g., 150000" defaultValue={entry?.amount}/>
                    {state.fields?.amount && <p className="text-sm text-destructive">{state.fields.amount}</p>}
                </div>
            </div>
             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="grid gap-2">
                    <Label htmlFor="paymentMethod">Payment Method</Label>
                     <Select name="paymentMethod" defaultValue={entry?.paymentMethod}>
                        <SelectTrigger>
                            <SelectValue placeholder="Select method" />
                        </SelectTrigger>
                        <SelectContent>
                            <SelectItem value="Cash">Cash</SelectItem>
                            <SelectItem value="Mobile Money">Mobile Money</SelectItem>
                             <SelectItem value="Bank Transfer">Bank Transfer</SelectItem>
                        </SelectContent>
                    </Select>
                </div>
                <div className="grid gap-2">
                    <Label htmlFor="reference">Reference #</Label>
                    <Input id="reference" name="reference" placeholder="e.g., INV-123, MTN-456" defaultValue={entry?.reference}/>
                </div>
            </div>
            <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" placeholder="Add any additional details..." defaultValue={entry?.notes} />
            </div>
          </div>
          </ScrollArea>
          <DialogFooter className="border-t pt-4 mt-4">
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
