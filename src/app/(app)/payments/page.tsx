import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Switch } from '@/components/ui/switch';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Banknote, Smartphone } from 'lucide-react';

export default function PaymentsPage() {
  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Payment Integrations</CardTitle>
          <CardDescription>
            Manage and configure your payment gateways for seamless transactions.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-8">
          <div className="grid gap-6 rounded-lg border p-4 md:grid-cols-3">
            <div className="flex items-center gap-4">
              <Smartphone className="h-8 w-8 text-accent" />
              <h3 className="text-lg font-semibold">MTN Mobile Money</h3>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="momo-api-key">API Key</Label>
              <Input
                id="momo-api-key"
                defaultValue="pk_test_************************"
              />
              <p className="text-xs text-muted-foreground">
                Enter the API key provided by MTN.
              </p>
            </div>
            <div className="flex items-center space-x-2 md:col-start-2 md:col-span-2">
                <Switch id="momo-active" defaultChecked />
                <Label htmlFor="momo-active">Enable MTN Mobile Money</Label>
            </div>
          </div>
          <div className="grid gap-6 rounded-lg border p-4 md:grid-cols-3">
             <div className="flex items-center gap-4">
              <Banknote className="h-8 w-8 text-accent" />
              <h3 className="text-lg font-semibold">Bank of Kigali</h3>
            </div>
            <div className="grid gap-2 md:col-span-2">
              <Label htmlFor="bk-account">Account Number</Label>
              <Input
                id="bk-account"
                defaultValue="00048-00294101-96"
              />
               <Label htmlFor="bk-branch-code">Branch Code</Label>
              <Input
                id="bk-branch-code"
                defaultValue="BKIGRWRW"
              />
            </div>
             <div className="flex items-center space-x-2 md:col-start-2 md:col-span-2">
                <Switch id="bk-active" />
                <Label htmlFor="bk-active">Enable Bank of Kigali Transfers</Label>
            </div>
          </div>
        </CardContent>
         <CardFooter className="border-t px-6 py-4">
          <Button>Save Settings</Button>
        </CardFooter>
      </Card>
    </div>
  );
}
