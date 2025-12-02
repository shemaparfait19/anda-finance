
'use client';

import { useState, useEffect, useRef, ReactNode, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { ArrowDownCircle, Loader2, Upload } from 'lucide-react';
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { makeDeposit, processBulkDeposit } from './actions';
import { useToast } from '@/hooks/use-toast';
import type { Member } from '@/lib/types';
import * as XLSX from 'xlsx';

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
            Submit Deposit
        </Button>
    )
}

interface NewDepositDialogProps {
    members: Member[];
    selectedMemberId?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
}

export default function NewDepositDialog({ members, selectedMemberId, open, onOpenChange, trigger }: NewDepositDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, formAction] = useActionState(makeDeposit, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [depositType, setDepositType] = useState("single"); // Changed to state for dropdown
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);

  const isControlled = open !== undefined && onOpenChange !== undefined;
  const currentOpen = isControlled ? open : internalOpen;
  const setCurrentOpen = isControlled ? onOpenChange : setInternalOpen;


   useEffect(() => {
    if (state.message) {
      if (state.success) {
        toast({
          title: 'Success',
          description: state.message,
        });
        setCurrentOpen(false);
        formRef.current?.reset();
      } else if (!state.fields || Object.keys(state.fields).length === 0) {
        toast({
          variant: 'destructive',
          title: 'Error',
          description: state.message,
        });
      }
    }
   }, [state, toast, setCurrentOpen]);
   
   useEffect(() => {
    if (!currentOpen) {
      formRef.current?.reset();
      setBulkFile(null);
      setDepositType("single");
    }
   }, [currentOpen]);

   const handleBulkUpload = async () => {
     if (!bulkFile) {
       toast({ variant: "destructive", title: "Error", description: "Please select a file" });
       return;
     }

     setIsBulkUploading(true);
     try {
       const data = await bulkFile.arrayBuffer();
       const workbook = XLSX.read(data);
       const worksheet = workbook.Sheets[workbook.SheetNames[0]];
       const jsonData = XLSX.utils.sheet_to_json(worksheet);

       // Call server action
       const result = await processBulkDeposit(jsonData);

       if (result.success) {
           toast({
             title: "Bulk Upload Processed",
             description: result.message,
           });
           setCurrentOpen(false);
       } else {
           toast({
             variant: "destructive",
             title: "Bulk Upload Failed",
             description: result.message,
           });
       }
     } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: "Failed to process file: " + error.message });
     } finally {
       setIsBulkUploading(false);
     }
   };


  return (
    <Dialog open={currentOpen} onOpenChange={setCurrentOpen}>
      {trigger && <DialogTrigger asChild>{trigger}</DialogTrigger>}
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>New Deposit</DialogTitle>
          <DialogDescription>
            Record a new savings deposit.
          </DialogDescription>
        </DialogHeader>
        
        <div className="space-y-4">
            <div>
                <Label>Deposit Type</Label>
                <Select value={depositType} onValueChange={setDepositType}>
                    <SelectTrigger>
                        <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                        <SelectItem value="single">Single Deposit</SelectItem>
                        <SelectItem value="bulk">Bulk Upload</SelectItem>
                    </SelectContent>
                </Select>
            </div>

            {depositType === "single" ? (
                <form ref={formRef} action={formAction}>
                    <div className="grid gap-4 py-4">
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="memberId" className="text-right">
                            MEMBER ID
                            </Label>
                            <div className='col-span-3'>
                                <Input id="memberId" name="memberId" placeholder="Enter Member ID" autoComplete="off"
                                onBlur={async (e) => {
                                    const val = e.target.value.trim();
                                    const display = document.getElementById('memberNameDisplay');
                                    if (!val) { if (display) display.textContent = ''; return; }
                                    display!.textContent = '...';
                                    try {
                                    const res = await fetch(`/api/members/lookup?memberId=${encodeURIComponent(val)}`);
                                    const data = await res.json();
                                    display!.textContent = data.name ? data.name : 'Not found';
                                    } catch {
                                    display!.textContent = 'Not found';
                                    }
                                }}
                                />
                                <div id="memberNameDisplay" className="text-xs text-muted-foreground mt-1"></div>
                                {state.fields?.memberId && <p className="text-sm text-destructive mt-1">{state.fields.memberId}</p>}
                            </div>
                        </div>
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="account" className="text-right">
                            Account
                            </Label>
                            <div className='col-span-3'>
                                <Input id="account" name="account" placeholder="e.g. BIF00501" autoComplete="off" />
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
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reason" className="text-right">
                            Reason
                            </Label>
                            <div className='col-span-3'>
                                <Input id="reason" name="reason" placeholder="Reason for deposit" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <SubmitButton />
                    </DialogFooter>
                </form>
            ) : (
                <div className="grid gap-4 py-4">
                <div className="border-2 border-dashed rounded-lg p-6 flex flex-col items-center justify-center text-center">
                    <Upload className="h-8 w-8 text-muted-foreground mb-2" />
                    <p className="text-sm font-medium mb-2">
                    Upload Excel file for bulk deposits
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                    Required columns (first row): <strong>MEMBER ID</strong>, <strong>ACCOUNT NUMBER</strong>, <strong>AMOUNT</strong>, <strong>REASON</strong>
                    </p>
                    <p className="text-xs text-muted-foreground mb-4">
                    Example: BIF001 | BIF00101 | 50000 | Monthly contribution
                    </p>
                    <Input 
                    type="file" 
                    accept=".xlsx, .xls, .csv" 
                    onChange={(e) => setBulkFile(e.target.files?.[0] || null)}
                    />
                </div>
                {bulkFile && (
                    <div className="text-sm">
                    Selected: {bulkFile.name}
                    </div>
                )}
                <DialogFooter>
                    <Button onClick={handleBulkUpload} disabled={isBulkUploading || !bulkFile}>
                        {isBulkUploading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                        Submit Deposit
                    </Button>
                </DialogFooter>
                </div>
            )}
        </div>
      </DialogContent>
    </Dialog>
  );
}
