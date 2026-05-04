'use client';

import { useState } from 'react';
import { Loader2, Trash2, DatabaseZap } from 'lucide-react';
import { Button }  from '@/components/ui/button';
import {
  Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle,
} from '@/components/ui/card';
import {
  Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle,
} from '@/components/ui/dialog';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import { Input }   from '@/components/ui/input';
import { Label }   from '@/components/ui/label';
import { Badge }   from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { clearDemoData, configureGeneralPool } from './data-actions';
import type { SavingsAccount } from '@/lib/types';

interface SettingsPageProps {
  canClearData?: boolean;
  internalAccounts?: SavingsAccount[];
  currentPoolAccountId?: string | null;
}

export default function SettingsPage({
  canClearData = false,
  internalAccounts = [],
  currentPoolAccountId = null,
}: SettingsPageProps) {
  const { toast }  = useToast();
  const [open,     setOpen]     = useState(false);
  const [confirm,  setConfirm]  = useState('');
  const [loading,  setLoading]  = useState(false);
  const [poolId,   setPoolId]   = useState<string>(currentPoolAccountId ?? 'none');
  const [poolSaving, setPoolSaving] = useState(false);

  const handleClear = async () => {
    setLoading(true);
    const result = await clearDemoData();
    setLoading(false);
    setOpen(false);
    setConfirm('');
    toast({
      title:       result.success ? 'Cleared' : 'Error',
      description: result.message,
      variant:     result.success ? 'default' : 'destructive',
    });
  };

  const handleSavePool = async () => {
    setPoolSaving(true);
    const result = await configureGeneralPool(poolId === 'none' ? null : poolId);
    setPoolSaving(false);
    toast({
      title: result.success ? 'Saved' : 'Error',
      description: result.message,
      variant: result.success ? 'default' : 'destructive',
    });
  };

  return (
    <div className="space-y-6">
      {/* General Pool Account */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <DatabaseZap className="h-4 w-4 text-primary" />
            General Pool Account
          </CardTitle>
          <CardDescription>
            Designate one Internal savings account as the General Pool. Its balance will appear
            as <strong>Total Savings</strong> on the dashboard and will be automatically credited
            or debited whenever a member deposit or withdrawal is recorded.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {internalAccounts.length === 0 ? (
            <p className="text-sm text-muted-foreground">
              No Internal savings accounts found. Create an account of type&nbsp;
              <Badge variant="outline">Internal</Badge> in the Savings section first.
            </p>
          ) : (
            <div className="grid gap-2 max-w-sm">
              <Label>Select Internal Account</Label>
              <Select value={poolId} onValueChange={setPoolId}>
                <SelectTrigger>
                  <SelectValue placeholder="Choose account…" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">— None —</SelectItem>
                  {internalAccounts.map(a => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.accountNumber}{a.accountName ? ` — ${a.accountName}` : ''}
                      {' '}(RWF {a.balance.toLocaleString()})
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-xs text-muted-foreground">
                Only <Badge variant="outline" className="text-[10px] px-1 py-0">Internal</Badge> accounts are eligible.
              </p>
            </div>
          )}
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button onClick={handleSavePool} disabled={poolSaving || internalAccounts.length === 0}>
            {poolSaving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            Save Pool Configuration
          </Button>
        </CardFooter>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>System Settings</CardTitle>
          <CardDescription>
            Configure interest rates, penalties, repayment schedules, and other system-wide rules.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-6 md:grid-cols-2">
            <div className="grid gap-2">
              <Label htmlFor="loan-interest-rate">Default Loan Interest Rate (%)</Label>
              <Input id="loan-interest-rate" type="number" defaultValue="10" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="savings-interest-rate">Default Savings Interest Rate (%)</Label>
              <Input id="savings-interest-rate" type="number" defaultValue="2" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="late-penalty-fee">Late Payment Penalty Fee (RWF)</Label>
              <Input id="late-penalty-fee" type="number" defaultValue="5000" />
            </div>
            <div className="grid gap-2">
              <Label htmlFor="reminder-days">Reminder Days Before Due</Label>
              <Input id="reminder-days" type="number" defaultValue="3" />
            </div>
          </div>
        </CardContent>
        <CardFooter className="border-t px-6 py-4">
          <Button>Save Settings</Button>
        </CardFooter>
      </Card>

      {canClearData && (
        <Card className="border-destructive/40">
          <CardHeader>
            <CardTitle className="text-destructive">Danger Zone</CardTitle>
            <CardDescription>
              Irreversible actions. Proceed with caution.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-start justify-between gap-4 rounded-lg border border-destructive/30 p-4">
              <div>
                <p className="text-sm font-medium">Clear all demo data</p>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Permanently deletes all members, transactions, loans, savings accounts, and
                  related records. User accounts are preserved. This cannot be undone.
                </p>
              </div>
              <Button
                variant="destructive"
                size="sm"
                className="shrink-0"
                onClick={() => setOpen(true)}
              >
                <Trash2 className="mr-1.5 h-3.5 w-3.5" />
                Clear Data
              </Button>
            </div>
          </CardContent>
        </Card>
      )}

      <Dialog open={open} onOpenChange={(v) => { setOpen(v); if (!v) setConfirm(''); }}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Clear all demo data?</DialogTitle>
            <DialogDescription>
              This will permanently delete every member, transaction, loan, savings account,
              cashbook entry, investment, and journal entry. User accounts will not be affected.
              <br /><br />
              Type <span className="font-semibold text-foreground">CLEAR</span> to confirm.
            </DialogDescription>
          </DialogHeader>
          <Input
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            placeholder="CLEAR"
            autoComplete="off"
          />
          <DialogFooter>
            <Button variant="outline" onClick={() => { setOpen(false); setConfirm(''); }}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              disabled={confirm !== 'CLEAR' || loading}
              onClick={handleClear}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {loading ? 'Clearing…' : 'Yes, clear everything'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
