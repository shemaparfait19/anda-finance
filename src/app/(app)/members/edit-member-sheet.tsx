'use client';

import { useActionState, useEffect, useRef, useState, useCallback } from 'react';
import { useFormStatus } from 'react-dom';
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
import { Textarea } from '@/components/ui/textarea';
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
import { RwandaLocationSelector } from '@/components/ui/rwanda-location-selector';
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
  const [state, formAction] = useActionState(editMember, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [collectionMeans, setCollectionMeans] = useState(member.collectionMeans || '');
  const [shareAmount, setShareAmount] = useState(member.shareAmount || 0);
  const [numberOfShares, setNumberOfShares] = useState(member.numberOfShares || 0);

  const handleShareAmountChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    setShareAmount(amount);
    // Formula: Total amount ÷ Price per share
    // Example: 50,000 / 15,000 = 3.33 shares
    setNumberOfShares(parseFloat((amount / 15000).toFixed(2)));
  }, []);

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
                            <Label htmlFor="middleName">Middle Name</Label>
                            <Input id="middleName" name="middleName" defaultValue={member.middleName} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="lastName">Last Name *</Label>
                            <Input id="lastName" name="lastName" defaultValue={member.lastName} />
                            {state.fields?.lastName && <p className="text-sm text-destructive">{state.fields.lastName}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="dateOfBirth">Date of Birth (Must be 18+)</Label>
                            <Input id="dateOfBirth" name="dateOfBirth" type="date" defaultValue={member.dateOfBirth} max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                            {state.fields?.dateOfBirth && <p className="text-sm text-destructive">{state.fields.dateOfBirth}</p>}
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

                {/* Contact & Location Information */}
                 <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Contact & Location Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="email">Email</Label>
                            <Input id="email" name="email" type="email" defaultValue={member.email} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="alternativePhone">Alternative Phone</Label>
                            <Input id="alternativePhone" name="alternativePhone" defaultValue={member.alternativePhone} />
                        </div>
                    </div>
                    <RwandaLocationSelector 
                      defaultProvince={member.province}
                      defaultDistrict={member.district}
                      defaultSector={member.sector}
                      defaultCell={member.cell}
                      defaultVillage={member.village}
                    />
                    <div className="grid gap-2">
                        <Label htmlFor="address">Additional Address Details</Label>
                        <Textarea id="address" name="address" defaultValue={member.address} placeholder="Street, house number, landmarks, etc." />
                    </div>
                </div>

                {/* Next of Kin */}
                <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Next of Kin *</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="nextOfKinName">Full Name *</Label>
                            <Input id="nextOfKinName" name="nextOfKinName" defaultValue={member.nextOfKinName} />
                            {state.fields?.nextOfKinName && <p className="text-sm text-destructive">{state.fields.nextOfKinName}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="nextOfKinPhone">Phone Number *</Label>
                            <Input id="nextOfKinPhone" name="nextOfKinPhone" defaultValue={member.nextOfKinPhone} />
                            {state.fields?.nextOfKinPhone && <p className="text-sm text-destructive">{state.fields.nextOfKinPhone}</p>}
                        </div>
                        <div className="grid gap-2 md:col-span-2">
                            <Label htmlFor="nextOfKinRelationship">Relationship *</Label>
                            <Input id="nextOfKinRelationship" name="nextOfKinRelationship" defaultValue={member.nextOfKinRelationship} placeholder="e.g., Spouse, Parent, Sibling" />
                            {state.fields?.nextOfKinRelationship && <p className="text-sm text-destructive">{state.fields.nextOfKinRelationship}</p>}
                        </div>
                    </div>
                </div>

                {/* Shares */}
                <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Shares *</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="shareAmount">Share Amount (RWF) *</Label>
                            <Input 
                              id="shareAmount" 
                              name="shareAmount" 
                              type="number" 
                              min="15000" 
                              step="15000"
                              defaultValue={member.shareAmount}
                              onChange={handleShareAmountChange}
                              placeholder="Minimum 15,000 RWF"
                            />
                            {state.fields?.shareAmount && <p className="text-sm text-destructive">{state.fields.shareAmount}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="numberOfShares">Number of Shares</Label>
                            <Input 
                              id="numberOfShares" 
                              value={numberOfShares || ''} 
                              readOnly 
                              className="bg-muted"
                            />
                            <p className="text-xs text-muted-foreground">Auto-calculated: Amount ÷ 15,000 (e.g., 50,000 ÷ 15,000 = 3.33 shares)</p>
                        </div>
                    </div>
                </div>

                {/* Contribution Information */}
                 <div className='space-y-4'>
                    <h3 className="text-lg font-medium">Contribution Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div className="grid gap-2">
                            <Label htmlFor="monthlyContribution">Monthly Contribution (RWF)</Label>
                            <Input id="monthlyContribution" name="monthlyContribution" type="number" defaultValue={member.monthlyContribution} />
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="contributionDate">Date of Contribution Collection</Label>
                            <Input id="contributionDate" name="contributionDate" type="date" defaultValue={member.contributionDate} min={new Date().toISOString().split('T')[0]} />
                            {state.fields?.contributionDate && <p className="text-sm text-destructive">{state.fields.contributionDate}</p>}
                        </div>
                        <div className="grid gap-2">
                            <Label htmlFor="collectionMeans">Means of Collection</Label>
                            <Select name="collectionMeans" defaultValue={member.collectionMeans} onValueChange={(value) => setCollectionMeans(value)}>
                                <SelectTrigger>
                                    <SelectValue placeholder="Select means of collection" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="MOMO">MOMO</SelectItem>
                                    <SelectItem value="AIRTEL MONEY">AIRTEL MONEY</SelectItem>
                                    <SelectItem value="BANKS IN RWANDA">BANKS IN RWANDA</SelectItem>
                                    <SelectItem value="OTHER">OTHER</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        {collectionMeans === "OTHER" && (
                            <div className="grid gap-2">
                                <Label htmlFor="otherCollectionMeans">Other Means of Collection</Label>
                                <Input id="otherCollectionMeans" name="otherCollectionMeans" defaultValue={member.otherCollectionMeans} />
                            </div>
                        )}
                        <div className="grid gap-2">
                            <Label htmlFor="accountNumber">Wallet number/Bank account Number</Label>
                            <Input id="accountNumber" name="accountNumber" defaultValue={member.accountNumber} />
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
                                    <SelectItem value="Temporary Inactive">Temporary Inactive</SelectItem>
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
