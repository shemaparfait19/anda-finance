import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';

export default function SettingsPage() {
  return (
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
  );
}
