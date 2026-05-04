
'use client';

import { useState, useEffect, useRef, ReactNode, useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { Loader2, Upload } from 'lucide-react';
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
import type { Member, SavingsAccount } from '@/lib/types';
import * as XLSX from 'xlsx';
import BulkUploadResultsDialog from './bulk-upload-results-dialog';

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
    accounts?: SavingsAccount[];
    selectedMemberId?: string;
    selectedAccountNumber?: string;
    open?: boolean;
    onOpenChange?: (open: boolean) => void;
    trigger?: ReactNode;
}

export default function NewDepositDialog({ members, accounts = [], selectedMemberId, selectedAccountNumber, open, onOpenChange, trigger }: NewDepositDialogProps) {
  const [internalOpen, setInternalOpen] = useState(false);
  const [state, formAction] = useActionState(makeDeposit, initialState);
  const { toast } = useToast();
  const formRef = useRef<HTMLFormElement>(null);
  const [depositType, setDepositType] = useState("single");
  const [pickedMemberId, setPickedMemberId] = useState(selectedMemberId ?? '');
  const [bulkFile, setBulkFile] = useState<File | null>(null);
  const [isBulkUploading, setIsBulkUploading] = useState(false);
  
  // Results dialog state
  const [resultsDialogOpen, setResultsDialogOpen] = useState(false);
  const [uploadResults, setUploadResults] = useState<any[]>([]);
  const [uploadSummary, setUploadSummary] = useState({
    total: 0,
    succeeded: 0,
    failed: 0,
    skipped: 0
  });

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
      setPickedMemberId(selectedMemberId ?? '');
    }
   }, [currentOpen, selectedMemberId]);

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

       // Calculate summary
       const succeeded = result.results?.filter(r => r.status === 'success').length || 0;
       const failed = result.results?.filter(r => r.status === 'failed').length || 0;
       const skipped = result.results?.filter(r => r.status === 'skipped').length || 0;
       
       setUploadResults(result.results || []);
       setUploadSummary({
         total: result.results?.length || 0,
         succeeded,
         failed,
         skipped
       });

       // Show results dialog
       setResultsDialogOpen(true);
       
       // Also show toast for quick feedback
       if (result.success) {
           toast({
             title: "Bulk Upload Processed",
             description: result.message,
           });
       } else {
           toast({
             variant: "destructive",
             title: "Bulk Upload Failed",
             description: result.message,
           });
       }
       
       // Close main dialog
       setCurrentOpen(false);
     } catch (error: any) {
       toast({ variant: "destructive", title: "Error", description: "Failed to process file: " + error.message });
     } finally {
       setIsBulkUploading(false);
     }
   };


  return (
    <>
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
                        {/* Debit Account Number (source — informational) */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="debitAcct" className="text-right text-xs leading-tight">
                                Debit<br/>Account No.
                            </Label>
                            <div className='col-span-3'>
                                <Input
                                    id="debitAcct"
                                    name="debitAccountNumber"
                                    placeholder="Source account / cash reference"
                                    autoComplete="off"
                                />
                                <p className="text-[11px] text-muted-foreground mt-1">Where the money is coming from</p>
                            </div>
                        </div>
                        {/* Amount */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="amount" className="text-right">Amount</Label>
                            <div className='col-span-3'>
                                <Input id="amount" name="amount" type="number" placeholder='RWF 0' className="w-full" />
                                {state.fields?.amount && <p className="text-sm text-destructive mt-1">{state.fields.amount}</p>}
                            </div>
                        </div>
                        {/* Credit Member Account */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label className="text-right text-xs leading-tight">
                                Credit<br/>Member Acct
                            </Label>
                            <div className='col-span-3 space-y-2'>
                                <Select
                                    name="memberId"
                                    defaultValue={selectedMemberId}
                                    onValueChange={setPickedMemberId}
                                    disabled={!!selectedMemberId}
                                >
                                    <SelectTrigger>
                                        <SelectValue placeholder="Select member" />
                                    </SelectTrigger>
                                    <SelectContent>
                                        {members.map(member => (
                                            <SelectItem key={member.id} value={member.id}>{member.name}</SelectItem>
                                        ))}
                                    </SelectContent>
                                </Select>
                                {state.fields?.memberId && <p className="text-sm text-destructive">{state.fields.memberId}</p>}
                                {/* Account within the member */}
                                {(() => {
                                    const memberAccounts = accounts.filter(a => a.memberId === pickedMemberId);
                                    if (selectedAccountNumber) {
                                        return <Input name="account" defaultValue={selectedAccountNumber} disabled />;
                                    }
                                    if (memberAccounts.length > 1) {
                                        return (
                                            <Select name="account">
                                                <SelectTrigger><SelectValue placeholder="Select account" /></SelectTrigger>
                                                <SelectContent>
                                                    {memberAccounts.map(a => (
                                                        <SelectItem key={a.id} value={a.accountNumber}>
                                                            {a.accountNumber}{a.accountName ? ` — ${a.accountName}` : ''}
                                                        </SelectItem>
                                                    ))}
                                                </SelectContent>
                                            </Select>
                                        );
                                    }
                                    return (
                                        <Input
                                            name="account"
                                            value={memberAccounts.length === 1 ? memberAccounts[0].accountNumber : undefined}
                                            defaultValue={memberAccounts.length === 1 ? memberAccounts[0].accountNumber : ''}
                                            placeholder="Account number"
                                            autoComplete="off"
                                            readOnly={memberAccounts.length === 1}
                                        />
                                    );
                                })()}
                            </div>
                        </div>
                        {/* Reason */}
                        <div className="grid grid-cols-4 items-center gap-4">
                            <Label htmlFor="reason" className="text-right">Reason</Label>
                            <div className='col-span-3'>
                                <Input id="reason" name="reason" placeholder="Reason for deposit" />
                            </div>
                        </div>
                    </div>
                    <DialogFooter>
                        <DialogClose asChild><Button variant="outline" type="button">Cancel</Button></DialogClose>
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
    
    {/* Bulk Upload Results Dialog */}
    <BulkUploadResultsDialog
      open={resultsDialogOpen}
      onOpenChange={setResultsDialogOpen}
      results={uploadResults}
      summary={uploadSummary}
    />
    </>
  );
}
