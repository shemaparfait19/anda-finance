import {
  Activity,
  ArrowUpRight,
  Landmark,
  Users,
  Wallet,
} from 'lucide-react';
import Link from 'next/link';

import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
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
import { getMembers, getTransactions } from '@/lib/data-service';

import { getPlaceholderImage } from '@/lib/placeholder-images';
import SavingsVsLoansChart from '@/components/charts/savings-vs-loans-chart';

export default async function DashboardPage() {
    const members = await getMembers();
    const transactions = await getTransactions();
    const totalSavings = members.reduce((acc, member) => acc + member.savingsBalance, 0);
    const totalLoans = members.reduce((acc, member) => acc + member.loanBalance, 0);
    const activeMembers = members.filter(m => m.status === 'Active').length;

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 md:gap-8">
        <div className="grid gap-4 md:grid-cols-2 md:gap-8 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">
                Total Savings
              </CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">
                RWF {totalSavings.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +20.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">
                Total Loans
              </CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">
                RWF {totalLoans.toLocaleString()}
              </div>
              <p className="text-xs text-muted-foreground">
                +180.1% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">+{activeMembers}</div>
              <p className="text-xs text-muted-foreground">
                +19% from last month
              </p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium font-body">Portfolio at Risk</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">5.2%</div>
              <p className="text-xs text-muted-foreground">
                +2% from last month
              </p>
            </CardContent>
          </Card>
        </div>
        <div className="grid gap-4 md:gap-8 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-2">
                <CardTitle>Transactions</CardTitle>
                <CardDescription>
                  Recent transactions from your group.
                </CardDescription>
              </div>
              <Link href="#" passHref legacyBehavior>
                <Button asChild size="sm" className="ml-auto gap-1">
                  <a>
                    View All
                    <ArrowUpRight className="h-4 w-4" />
                  </a>
                </Button>
              </Link>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Customer</TableHead>
                    <TableHead className="hidden xl:table-column">
                      Type
                    </TableHead>
                    <TableHead className="hidden xl:table-column">
                      Status
                    </TableHead>
                    <TableHead className="hidden md:table-cell">
                      Date
                    </TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.map((transaction) => {
                    const image = getPlaceholderImage(transaction.member.avatarId);
                    return (
                    <TableRow key={transaction.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Avatar className="hidden h-9 w-9 sm:flex">
                            <AvatarImage
                              src={image.imageUrl}
                              alt={`Avatar of ${transaction.member.name}`}
                              data-ai-hint={image.imageHint}
                            />
                            <AvatarFallback>
                              {transaction.member.name.charAt(0)}
                            </AvatarFallback>
                          </Avatar>
                          <div className="font-medium">{transaction.member.name}</div>
                        </div>
                      </TableCell>
                      <TableCell className="hidden xl:table-column">
                        {transaction.type}
                      </TableCell>
                      <TableCell className="hidden xl:table-column">
                        <Badge className="text-xs" variant="outline">
                          {transaction.status}
                        </Badge>
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        {transaction.date}
                      </TableCell>
                      <TableCell className="text-right">
                        RWF {transaction.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  )})}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <CardTitle>Savings vs Loans</CardTitle>
              <CardDescription>January - July 2024</CardDescription>
            </CardHeader>
            <CardContent>
               <SavingsVsLoansChart />
            </CardContent>
          </Card>
        </div>
      </main>
    </div>
  );
}
