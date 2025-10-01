
'use client';

import { useState, useEffect, useRef } from 'react';
import { useFormStatus, useFormState } from 'react-dom';
import { PlusCircle, Loader2, UploadCloud, File as FileIcon } from 'lucide-react';
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
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';

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

function FileUpload({ id, label, acceptedFileTypes, helpText }: { id: string, label: string, acceptedFileTypes: string, helpText: string }) {
    const [file, setFile] = useState<File | null>(null);

    return (
        <div className="grid gap-2">
            <Label htmlFor={id}>{label}</Label>
            <div className="flex items-center gap-2">
                <Input id={id} name={id} type="file" className="hidden" accept={acceptedFileTypes} onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
                <Label htmlFor={id} className="cursor-pointer flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 text-muted-foreground">
                    <UploadCloud className="h-4 w-4" />
                    <span>{file ? 'File selected' : 'Choose a file'}</span>
                </Label>
                {file && (
                    <div className="flex items-center gap-2 p-2 rounded-md bg-muted text-sm">
                        <FileIcon className="h-4 w-4" />
                        <span className="truncate max-w-28">{file.name}</span>
                    </div>
                )}
            </div>
            <p className="text-xs text-muted-foreground">{helpText}</p>
        </div>
    )
}


export default function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [state, formAction] = useFormState(addMember, initialState);
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
      } else if (state.fields && Object.keys(state.fields).length > 0) {
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
          formRef.current?.reset();
      }
  },[open]);


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
      <DialogContent className="sm:max-w-3xl">
        <form ref={formRef} action={formAction}>
            <DialogHeader>
            <DialogTitle>Add New Member</DialogTitle>
            <DialogDescription>
                Register a new member to the savings group
            </DialogDescription>
            </DialogHeader>
            <ScrollArea className="h-96 w-full">
            <div className="space-y-6 p-4">
                
                {/* Personal Information */}
                <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Personal Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="firstName">First Name *</Label>
                            <Input id="firstName" name="firstName" />
                            {state.fields?.firstName && <p className="text-sm text-destructive">{state.fields.firstName}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input id="lastName" name="lastName" />
                            {state.fields?.lastName && <p className="text-sm text-destructive">{state.fields.lastName}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dateOfBirth">Date of Birth</Label>
                            <Input id="dateOfBirth" name="dateOfBirth" type="date" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="gender">Gender</Label>
                            <Select name="gender">
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
                            <Input id="nationalId" name="nationalId" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="phoneNumber">Phone Number *</Label>
                            <Input id="phoneNumber" name="phoneNumber" />
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
                            <Input id="email" name="email" type="email" />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="alternativePhone">Alternative Phone</Label>
                            <Input id="alternativePhone" name="alternativePhone" />
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="address">Address</Label>
                            <Input id="address" name="address" />
                        </div>
                    </div>
                </div>

                {/* Group & Role Information */}
                 <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Group & Role Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                         <div className="grid gap-2">
                            <Label htmlFor="joinDate">Join Date *</Label>
                            <Input id="joinDate" name="joinDate" type="date" />
                             {state.fields?.joinDate && <p className="text-sm text-destructive">{state.fields.joinDate}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="savingsGroup">Savings Group *</Label>
                            <Select name="savingsGroup">
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
                            <Select name="memberRole">
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
                            <Label htmlFor="monthlyContribution">Monthly Contribution (RWF)</Label>
                            <Input id="monthlyContribution" name="monthlyContribution" type="number" />
                        </div>
                    </div>
                </div>

                {/* KYC Documents */}
                 <div className='space-y-4'>
                    <h3 className="text-lg font-medium">KYC Documents</h3>
                     <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                       <FileUpload 
                            id="profilePhoto" 
                            label="Profile Photo"
                            acceptedFileTypes="image/jpeg, image/png"
                            helpText="JPG, PNG (max 5MB)"
                        />
                        <FileUpload 
                            id="nationalIdCopy" 
                            label="National ID Copy"
                            acceptedFileTypes="application/pdf, image/jpeg, image/png"
                            helpText="PDF, JPG, PNG (max 10MB)"
                        />
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
