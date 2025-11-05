"use client";

import { useActionState, useState, useEffect, useRef, useCallback } from "react";
import { useFormStatus } from "react-dom";
import {
  PlusCircle,
  Loader2,
  UploadCloud,
  File as FileIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { addMember } from "./actions";
import { useToast } from "@/hooks/use-toast";
import { ScrollArea } from "@/components/ui/scroll-area";
import { RwandaLocationSelector } from "@/components/ui/rwanda-location-selector";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

const initialState = {
  message: "",
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
  );
}

function FileUpload({
  id,
  label,
  acceptedFileTypes,
  helpText,
}: {
  id: string;
  label: string;
  acceptedFileTypes: string;
  helpText: string;
}) {
  const [file, setFile] = useState<File | null>(null);

  return (
    <div className="grid gap-2">
      <Label htmlFor={id}>{label}</Label>
      <div className="flex items-center gap-2">
        <Input
          id={id}
          name={id}
          type="file"
          className="hidden"
          accept={acceptedFileTypes}
          onChange={(e) => setFile(e.target.files?.[0] ?? null)}
        />
        <Label
          htmlFor={id}
          className="cursor-pointer flex-1 h-10 rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 flex items-center gap-2 text-muted-foreground"
        >
          <UploadCloud className="h-4 w-4" />
          <span>{file ? "File selected" : "Choose a file"}</span>
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
  );
}

export default function AddMemberDialog() {
  const [open, setOpen] = useState(false);
  const [collectionMeans, setCollectionMeans] = useState('');
  const [monthlyContribution, setMonthlyContribution] = useState(0);
  const [numberOfShares, setNumberOfShares] = useState(0);
  const [state, formAction] = useActionState(addMember, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);

  const handleMonthlyContributionChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const amount = parseFloat(e.target.value) || 0;
    setMonthlyContribution(amount);
    // Formula: Total amount ÷ Price per share
    // Example: 45,000 / 15,000 = 3.00 shares
    setNumberOfShares(parseFloat((amount / 15000).toFixed(2)));
  }, []);

  useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: "Success",
          description: state.message,
        });
        setOpen(false);
        formRef.current?.reset();
      } else if (state.fields && Object.keys(state.fields).length > 0) {
        // Validation errors are displayed next to fields, no toast needed.
      } else {
        // General error
        toast({
          variant: "destructive",
          title: "Error",
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
  }, [open]);

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
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Personal Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="firstName">First Name *</Label>
                    <Input id="firstName" name="firstName" />
                    {state.fields?.firstName && (
                      <p className="text-sm text-destructive">
                        {state.fields.firstName}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="middleName">Middle Name</Label>
                    <Input id="middleName" name="middleName" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="lastName">Last Name *</Label>
                    <Input id="lastName" name="lastName" />
                    {state.fields?.lastName && (
                      <p className="text-sm text-destructive">
                        {state.fields.lastName}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="dateOfBirth">Date of Birth (Must be 18+)</Label>
                    <Input id="dateOfBirth" name="dateOfBirth" type="date" max={new Date(new Date().setFullYear(new Date().getFullYear() - 18)).toISOString().split('T')[0]} />
                    {state.fields?.dateOfBirth && (
                      <p className="text-sm text-destructive">
                        {state.fields.dateOfBirth}
                      </p>
                    )}
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
                    {state.fields?.phoneNumber && (
                      <p className="text-sm text-destructive">
                        {state.fields.phoneNumber}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Contact & Location Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Contact & Location Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="email">Email</Label>
                    <Input id="email" name="email" type="email" />
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="alternativePhone">Alternative Phone</Label>
                    <Input id="alternativePhone" name="alternativePhone" />
                  </div>
                </div>
                <RwandaLocationSelector />
                <div className="grid gap-2">
                  <Label htmlFor="address">Additional Address Details</Label>
                  <Textarea id="address" name="address" placeholder="Street, house number, landmarks, etc." />
                </div>
              </div>

              {/* Next of Kin */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Next of Kin *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="nextOfKinName">Full Name *</Label>
                    <Input id="nextOfKinName" name="nextOfKinName" />
                    {state.fields?.nextOfKinName && (
                      <p className="text-sm text-destructive">
                        {state.fields.nextOfKinName}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="nextOfKinPhone">Phone Number *</Label>
                    <Input id="nextOfKinPhone" name="nextOfKinPhone" />
                    {state.fields?.nextOfKinPhone && (
                      <p className="text-sm text-destructive">
                        {state.fields.nextOfKinPhone}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2 md:col-span-2">
                    <Label htmlFor="nextOfKinRelationship">Relationship *</Label>
                    <Input id="nextOfKinRelationship" name="nextOfKinRelationship" placeholder="e.g., Spouse, Parent, Sibling" />
                    {state.fields?.nextOfKinRelationship && (
                      <p className="text-sm text-destructive">
                        {state.fields.nextOfKinRelationship}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Shares/Contribution Information */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">Shares/Contribution Information *</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label htmlFor="monthlyContribution">Monthly Contribution (RWF) *</Label>
                    <Input 
                      id="monthlyContribution" 
                      name="monthlyContribution" 
                      type="number" 
                      min="15000"
                      step="1000"
                      placeholder="Minimum 15,000 RWF"
                      onChange={handleMonthlyContributionChange}
                    />
                    {state.fields?.monthlyContribution && (
                      <p className="text-sm text-destructive">
                        {state.fields.monthlyContribution}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="numberOfShares">Number of Shares</Label>
                    <Input 
                      id="numberOfShares" 
                      value={numberOfShares || ''} 
                      readOnly 
                      className="bg-muted"
                    />
                    <p className="text-xs text-muted-foreground">Auto-calculated: Amount ÷ 15,000 (e.g., 45,000 ÷ 15,000 = 3.00 shares)</p>
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="contributionDate">Date of Contribution Collection</Label>
                    <Input id="contributionDate" name="contributionDate" type="date" />
                    {state.fields?.contributionDate && (
                      <p className="text-sm text-destructive">
                        {state.fields.contributionDate}
                      </p>
                    )}
                  </div>
                  <div className="grid gap-2">
                    <Label htmlFor="collectionMeans">Means of Collection</Label>
                    <Select name="collectionMeans" onValueChange={(value) => setCollectionMeans(value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select means of collection" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="MOMO">MOMO</SelectItem>
                        <SelectItem value="AIRTEL MONEY">AIRTEL MONEY</SelectItem>
                        <SelectItem value="BANKS IN RWANDA">BANKS IN RWANDA</SelectItem>
                        <SelectItem value="BANKS OUTSIDE RWANDA">Banks outside Rwanda</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  {(collectionMeans === "BANKS IN RWANDA" || collectionMeans === "BANKS OUTSIDE RWANDA") && (
                    <div className="grid gap-2">
                      <Label htmlFor="otherCollectionMeans">Bank Name</Label>
                      <Input id="otherCollectionMeans" name="otherCollectionMeans" placeholder="Enter bank name" />
                    </div>
                  )}
                  <div className="grid gap-2">
                    <Label htmlFor="accountNumber">Wallet number/Bank account Number</Label>
                    <Input id="accountNumber" name="accountNumber" />
                  </div>
                </div>
              </div>

              {/* KYC Documents - Temporarily disabled until file upload handling is implemented */}
              <div className="space-y-4">
                <h3 className="text-lg font-medium">KYC Documents</h3>
                <div className="p-4 rounded-lg bg-muted/50 border-2 border-dashed border-muted-foreground/25">
                  <p className="text-sm text-muted-foreground text-center">
                    File upload functionality will be available in a future
                    update.
                  </p>
                </div>
                {/* <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                    </div> */}
              </div>
            </div>
          </ScrollArea>
          <DialogFooter className="pt-4 border-t">
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
