
'use client';

import { useEffect, useRef } from 'react';
import { useFormState, useFormStatus } from 'react-dom';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetClose,
} from '@/components/ui/sheet';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { editMember } from './actions';
import { useToast } from '@/hooks/use-toast';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
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
            Save Changes
        </Button>
    )
}

export default function EditMemberSheet({ member, open, onOpenChange }: { member: Member, open: boolean, onOpenChange: (open: boolean) => void }) {
  const [state, formAction] = useFormState(editMember, initialState);
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
      } else if (state.fields && Object.keys(state.fields).length > 0) {
        // Validation errors are displayed next to fields
      } else {
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
        // state is not directly mutable, this is incorrect.
        // The state will be reset when the component unmounts and remounts,
        // or by managing a key on the form.
        // For this scenario, just resetting the form visually is enough.
    }
  }, [open]);


  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent className="sm:max-w-xl">
        <form ref={formRef} action={formAction}>
            <SheetHeader>
            <SheetTitle>Edit Member: {member.name}</SheetTitle>
            <SheetDescription>
                Update the details for this member.
            </SheetDescription>
            </SheetHeader>
            <ScrollArea className="h-[calc(100vh-150px)] w-full">
            <div className="space-y-6 p-4">
                <input type="hidden" name="id" value={member.id} />
                <input type="hidden" name="joinDate" value={member.joinDate} />

                {/* Personal Information */}
                <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input id="firstName" name="firstName" defaultValue={member.firstName} />
                            {state.fields?.firstName && <p className="text-sm text-destructive">{state.fields.firstName}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input id="lastName" name="lastName" defaultValue={member.lastName} />
                            {state.fields?.lastName && <p className="text-sm text-destructive">{state.fields.lastName}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={member.dateOfBirth} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select name="gender" defaultValue={member.gender}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select gender" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Male">Male</SelectItem>
                                    <SelectItem value="Female">Female</SelectItem>
                                    <SelectItem value="Other">Other</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="nationalId">National ID</Label>
                            <Input id="nationalId" name="nationalId" defaultValue={member.nationalId} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                            <Input id="phoneNumber" name="phoneNumber" defaultValue={member.phoneNumber} />
                             {state.fields?.phoneNumber && <p className="text-sm text-destructive">{state.fields.phoneNumber}</p>}
                        </div>
                    </div>
                </div>

                {/* Contact Information */}
                 <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Contact Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={member.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="alternativePhone">Alternative Phone</Label>
                            <Input id="alternativePhone" name="alternativePhone" defaultValue={member.alternativePhone} />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" defaultValue={member.address} />
                        </div>
                    </div>
                </div>

                {/* Group & Role Information */}
                 <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Group & Role Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="savingsGroup">Savings Group *</Label>
                            <Select name="savingsGroup" defaultValue={member.savingsGroup}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select group" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Group-A">Group A</SelectItem>
                                    <SelectItem value="Group-B">Group B</SelectItem>
                                </SelectContent>
                            </Select>
                            {state.fields?.savingsGroup && <p className="text-sm text-destructive">{state.fields.savingsGroup}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="memberRole">Member Role *</Label>
                            <Select name="memberRole" defaultValue={member.memberRole}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select role" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Member">Member</SelectItem>
                                    <SelectItem value="Chairperson">Chairperson</SelectItem>
                                    <SelectItem value="Treasurer">Treasurer</SelectItem>
                                    <SelectItem value="Secretary">Secretary</SelectItem>
                                    <SelectItem value="Teller">Teller</SelectItem>
                                </SelectContent>
                            </Select>
                            {state.fields?.memberRole && <p className="text-sm text-destructive">{state.fields.memberRole}</p>}
                        </div>
                         <div className="grid gap-2">
                            <Label htmlFor="monthlyContribution">Monthly Contribution (RWF)</Label>                            <Input id="monthlyContribution" name="monthlyContribution" type="number" defaultValue={member.monthlyContribution} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="status">Member Status *</Label>
                             <Select name="status" defaultValue={member.status}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select status" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="Active">Active</SelectItem>
                                    <SelectItem value="Inactive">Inactive</SelectItem>
                                    <SelectItem value="Dormant">Dormant</SelectItem>
                                    <SelectItem value="Closed">Closed</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>
                </div>
            </div>
            </ScrollArea>
            <SheetFooter className='pt-4 mt-4 border-t'>
                <SheetClose asChild>
                    <Button variant="outline">Cancel</Button>
                </SheetClose>
                <SubmitButton />
            </SheetFooter>
        </form>
      </SheetContent>
    </Sheet>
  );
}
