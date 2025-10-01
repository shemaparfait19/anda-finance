import {
  ArrowDownCircle,
  ArrowUpCircle
} from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

import { getSavingsAccounts } from '@/lib/data-service';

export default async function SavingsPage() {
    const savingsAccounts = await getSavingsAccounts();
  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="compulsory">Compulsory</TabsTrigger>
          <TabsTrigger value="voluntary">Voluntary</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <Button size="sm" variant="outline" className="h-8 gap-1">
            <ArrowUpCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              New Withdrawal
            </span>
          </Button>
          <Button size="sm" className="h-8 gap-1">
            <ArrowDownCircle className="h-3.5 w-3.5" />
            <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
              New Deposit
            </span>
          </Button>
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>Savings Accounts</CardTitle>
            <CardDescription>
              Track member contributions, deposits, withdrawals, and balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member Name</TableHead>
                  <TableHead>Account No.</TableHead>
                  <TableHead className="hidden md:table-cell">
                    Account Type
                  </TableHead>
                  <TableHead className="hidden md:table-cell">
                    Open Date
                  </TableHead>
                  <TableHead className="text-right">Balance</TableHead>
                  <TableHead>
                    <span className="sr-only">Actions</span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {savingsAccounts.map((account) => (
                  <TableRow key={account.id}>
                    <TableCell className="font-medium">{account.memberName}</TableCell>
                    <TableCell>{account.accountNumber}</TableCell>
                    <TableCell className="hidden md:table-cell">
                      <Badge variant="outline">{account.type}</Badge>
                    </TableCell>
                    <TableCell className="hidden md:table-cell">
                      {account.openDate}
                    </TableCell>
                    <TableCell className="text-right">
                      RWF {account.balance.toLocaleString()}
                    </TableCell>
                    <TableCell>
                      {/* Actions Dropdown Here */}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
          <CardFooter>
            <div className="text-xs text-muted-foreground">
              Showing <strong>1-{savingsAccounts.length}</strong> of <strong>{savingsAccounts.length}</strong> accounts
            </div>
          </CardFooter>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
