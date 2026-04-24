import { redirect } from 'next/navigation';
import { auth } from '@/auth';
import { Activity, ArrowUpRight, Landmark, Users, Wallet, AlertTriangle, TrendingUp, TrendingDown, Minus } from "lucide-react";
import Link from "next/link";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getMembers, getTransactions, getDashboardStats, getLoans } from "@/lib/data-service";
import { MemberAvatar } from "@/components/member-avatar";
import SavingsVsLoansChart from "@/components/charts/savings-vs-loans-chart";

export const dynamic = "force-dynamic";

function TrendBadge({ change }: { change: string | null }) {
  if (!change) return <p className="text-xs text-muted-foreground">No data last month</p>;
  const isPositive = change.startsWith("+");
  const isNegative = change.startsWith("-");
  const Icon = isPositive ? TrendingUp : isNegative ? TrendingDown : Minus;
  return (
    <p className={`text-xs flex items-center gap-1 font-medium ${
      isPositive ? "text-green-600 dark:text-green-400" :
      isNegative ? "text-red-500" :
      "text-muted-foreground"
    }`}>
      <Icon className="h-3 w-3" />
      {change} from last month
    </p>
  );
}

export default async function DashboardPage() {
  const session = await auth();
  if (session?.user?.role === 'SUPER_ADMIN' || session?.user?.role === 'IT_ADMIN') {
    redirect('/admin');
  }

  const [members, transactions, stats, loans] = await Promise.all([
    getMembers(),
    getTransactions(),
    getDashboardStats(),
    getLoans(),
  ]);

  const totalSavings = members.reduce((acc, m) => acc + m.savingsBalance, 0);
  const totalLoans = members.reduce((acc, m) => acc + m.loanBalance, 0);
  const activeMembers = members.filter((m) => m.status === "Active").length;

  const overdueLoans = loans.filter((l) => l.status === "Overdue" || l.status === "Defaulted");
  const overdueTotal = overdueLoans.reduce((s, l) => s + l.balance, 0);
  const pendingLoans = loans.filter((l) => l.status === "Pending");

  return (
    <div className="flex min-h-screen w-full flex-col">
      <main className="flex flex-1 flex-col gap-4 md:gap-6">

        {/* ── Alert banners ─────────────────────────────────────── */}
        {overdueLoans.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-orange-200 bg-orange-50 dark:border-orange-900/40 dark:bg-orange-950/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />
              <p className="text-sm text-orange-800 dark:text-orange-300">
                <span className="font-semibold">{overdueLoans.length} loan{overdueLoans.length > 1 ? "s" : ""} overdue</span>
                {" "}— RWF {overdueTotal.toLocaleString()} at risk
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-orange-300 text-orange-700 hover:bg-orange-100 dark:border-orange-800 dark:text-orange-400 shrink-0">
              <Link href="/loans">View Arrears</Link>
            </Button>
          </div>
        )}

        {pendingLoans.length > 0 && (
          <div className="flex items-center justify-between gap-3 rounded-lg border border-yellow-200 bg-yellow-50 dark:border-yellow-900/40 dark:bg-yellow-950/30 px-4 py-3">
            <div className="flex items-center gap-3">
              <Activity className="h-4 w-4 text-yellow-500 shrink-0" />
              <p className="text-sm text-yellow-800 dark:text-yellow-300">
                <span className="font-semibold">{pendingLoans.length} loan application{pendingLoans.length > 1 ? "s" : ""} pending approval</span>
              </p>
            </div>
            <Button asChild size="sm" variant="outline" className="border-yellow-300 text-yellow-700 hover:bg-yellow-100 dark:border-yellow-800 dark:text-yellow-400 shrink-0">
              <Link href="/loans">Review</Link>
            </Button>
          </div>
        )}

        {/* ── KPI Cards ─────────────────────────────────────────── */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-primary">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Savings</CardTitle>
              <Wallet className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">
                RWF {totalSavings.toLocaleString()}
              </div>
              <TrendBadge change={stats.savingsChange} />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-red-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Loans</CardTitle>
              <Landmark className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">
                RWF {totalLoans.toLocaleString()}
              </div>
              <TrendBadge change={stats.loansChange} />
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-400">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Members</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold font-headline">{activeMembers}</div>
              <p className="text-xs text-muted-foreground">
                {stats.membersChange
                  ? `${stats.membersChange} new joins vs last month`
                  : "No new joins last month"}
              </p>
            </CardContent>
          </Card>

          <Card className={`border-l-4 ${
            parseFloat(stats.portfolioRisk) > 10
              ? "border-l-red-500"
              : parseFloat(stats.portfolioRisk) > 5
              ? "border-l-orange-400"
              : "border-l-green-400"
          }`}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Portfolio at Risk</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className={`text-2xl font-bold font-headline ${
                parseFloat(stats.portfolioRisk) > 10 ? "text-red-500" :
                parseFloat(stats.portfolioRisk) > 5 ? "text-orange-500" :
                "text-green-600 dark:text-green-400"
              }`}>
                {stats.portfolioRisk}%
              </div>
              <p className="text-xs text-muted-foreground">
                Overdue &amp; defaulted vs active portfolio
              </p>
            </CardContent>
          </Card>
        </div>

        {/* ── Chart + Transactions ──────────────────────────────── */}
        <div className="grid gap-4 md:gap-6 lg:grid-cols-2 xl:grid-cols-3">
          <Card className="xl:col-span-2">
            <CardHeader className="flex flex-row items-center">
              <div className="grid gap-1">
                <CardTitle>Recent Transactions</CardTitle>
                <CardDescription>Latest financial activity</CardDescription>
              </div>
              <Button asChild size="sm" className="ml-auto gap-1">
                <Link href="/payments">
                  View All
                  <ArrowUpRight className="h-4 w-4" />
                </Link>
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead className="hidden md:table-cell">Type</TableHead>
                    <TableHead className="hidden md:table-cell">Status</TableHead>
                    <TableHead className="hidden md:table-cell">Date</TableHead>
                    <TableHead className="text-right">Amount</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {transactions.slice(0, 8).map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          <div className="flex items-center gap-2">
                            <MemberAvatar name={transaction.member.name} className="hidden h-8 w-8 sm:flex" />
                            <span className="font-medium text-sm">{transaction.member.name}</span>
                          </div>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {transaction.type}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          <Badge className="text-xs" variant={transaction.status === "Completed" ? "secondary" : "outline"}>
                            {transaction.status}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                          {new Date(transaction.date).toLocaleDateString()}
                        </TableCell>
                        <TableCell className="text-right font-medium text-sm">
                          RWF {transaction.amount.toLocaleString()}
                        </TableCell>
                      </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Savings vs Loans</CardTitle>
              <CardDescription>Portfolio overview</CardDescription>
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
