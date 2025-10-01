'use client';

import { useFormState, useFormStatus } from 'react-dom';
import { useEffect, useRef } from 'react';
import { CheckCircle, AlertTriangle, Info, Loader2 } from 'lucide-react';

import { runSmsPaymentReminder } from './actions';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { useToast } from "@/hooks/use-toast"

const initialState = {
  message: '',
};

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" disabled={pending}>
      {pending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
      Analyze
    </Button>
  );
}

export default function SmsReminderForm() {
  const [state, formAction] = useFormState(runSmsPaymentReminder, initialState);
  const formRef = useRef<HTMLFormElement>(null);
  const { toast } = useToast();

   useEffect(() => {
    if (state.message && state.message !== "Analysis complete." && !state.fields) {
      toast({
        variant: "destructive",
        title: "Error",
        description: state.message,
      });
    }
    if (state.message === "Analysis complete.") {
        formRef.current?.reset();
    }
  }, [state, toast]);


  return (
    <div className="grid gap-6 md:grid-cols-2">
      <form ref={formRef} action={formAction} className="space-y-4">
        <div className="grid gap-2">
          <Label htmlFor="memberId">Member ID</Label>
          <Input id="memberId" name="memberId" placeholder="e.g., MEM001" />
          {state.fields?.memberId && <p className="text-sm text-destructive">{state.fields.memberId}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="loanId">Loan ID</Label>
          <Input id="loanId" name="loanId" placeholder="e.g., LN001" />
          {state.fields?.loanId && <p className="text-sm text-destructive">{state.fields.loanId}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="dueDate">Due Date</Label>
          <Input id="dueDate" name="dueDate" type="date" />
          {state.fields?.dueDate && <p className="text-sm text-destructive">{state.fields.dueDate}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="repaymentHistory">Repayment History</Label>
          <Textarea
            id="repaymentHistory"
            name="repaymentHistory"
            placeholder="e.g., 10 on-time payments, 2 late payments, 0 defaults."
            className="min-h-[100px]"
          />
           {state.fields?.repaymentHistory && <p className="text-sm text-destructive">{state.fields.repaymentHistory}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="configuredReminderSettings">Reminder Settings</Label>
          <Textarea
            id="configuredReminderSettings"
            name="configuredReminderSettings"
            placeholder="e.g., Send reminders 3 days before due date."
             className="min-h-[100px]"
          />
           {state.fields?.configuredReminderSettings && <p className="text-sm text-destructive">{state.fields.configuredReminderSettings}</p>}
        </div>
        <div className="grid gap-2">
          <Label htmlFor="outstandingBalance">Outstanding Balance (RWF)</Label>
          <Input id="outstandingBalance" name="outstandingBalance" type="number" step="1" placeholder="e.g., 15000" />
          {state.fields?.outstandingBalance && <p className="text-sm text-destructive">{state.fields.outstandingBalance}</p>}
        </div>
        <SubmitButton />
      </form>
      
      <div className="space-y-4">
        <Card className="bg-muted/30">
            <CardHeader>
                <CardTitle>AI Analysis Result</CardTitle>
            </CardHeader>
            <CardContent>
                {state.result ? (
                    <Alert variant={state.result.shouldSendReminder ? 'default' : 'destructive'} className='bg-background'>
                        {state.result.shouldSendReminder ? <CheckCircle className="h-4 w-4" /> : <AlertTriangle className="h-4 w-4" />}
                        <AlertTitle className="flex items-center gap-2">
                            Decision:
                            <Badge variant={state.result.shouldSendReminder ? 'default' : 'destructive'}>
                                {state.result.shouldSendReminder ? 'Send Reminder' : "Don't Send"}
                            </Badge>
                        </AlertTitle>
                        <AlertDescription>
                            <strong>Reason:</strong> {state.result.reason}
                        </AlertDescription>
                    </Alert>
                ) : (
                     <div className="flex flex-col items-center justify-center text-center text-muted-foreground p-8">
                        <Info className="h-8 w-8 mb-2" />
                        <p>Results will be displayed here after analysis.</p>
                     </div>
                )}
            </CardContent>
        </Card>
      </div>
    </div>
  );
}
