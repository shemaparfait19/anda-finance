'use client';

import { useState, useEffect } from 'react';
import { useActionState } from 'react';
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
import { addMember } from './actions';
import { useToast } from '@/hooks/use-toast';

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
            Save Member
        </Button>
    )
}

export default function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useActionState(addMember, initialState);
  const { toast } = useToast();

   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        setOpen(false);
        // Reset form state on success
        state.message = '';
        state.success = false;
        state.fields = {};
      } else if (state.fields) {
        // Validation errors are displayed next to fields, no toast needed.
      } else {
        // General error
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
  }, [state, toast]);

  // Reset form action state when dialog is closed
  useEffect(() => {
      if (!open) {
          state.message = '';
          state.success = false;
          state.fields = {};
      }
  },[open, state]);


  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="h-8 gap-1">
          <PlusCircle className="h-3.5 w-3.5" />
          <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
            Add Member
          </span>
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[425px]">
        <form action={formAction}>
            <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
                Fill in the details below to add a new member to the group.
            </DialogDescription>
            </DialogHeader>
            <div className="grid gap-4 py-4">
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="name" className="text-right">
                    Name
                    </Label>
                    <div className='col-span-3'>
                    <Input id="name" name="name" className="w-full" />
                    {state.fields?.name && <p className="text-sm text-destructive mt-1">{state.fields.name}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="memberId" className="text-right">
                    Member ID
                    </Label>
                    <div className='col-span-3'>
                    <Input id="memberId" name="memberId" className="w-full" />
                    {state.fields?.memberId && <p className="text-sm text-destructive mt-1">{state.fields.memberId}</p>}
                    </div>
                </div>
                <div className="grid grid-cols-4 items-center gap-4">
                    <Label htmlFor="joinDate" className="text-right">
                    Join Date
                    </Label>
                    <div className='col-span-3'>
                    <Input id="joinDate" name="joinDate" type="date" className="w-full" />
                    {state.fields?.joinDate && <p className="text-sm text-destructive mt-1">{state.fields.joinDate}</p>}
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
