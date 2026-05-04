import { Suspense } from "react";
import { getPaymentLedger, getMembers, getSavingsAccounts } from "@/lib/data-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ArrowDownCircle, ArrowUpCircle, Banknote, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import PaymentsTable from "./payments-table";
import NewDepositDialog from "@/app/(app)/savings/new-deposit-dialog";
import NewWithdrawalDialog from "@/app/(app)/savings/new-withdrawal-dialog";
import LoadMirrorAccountDialog from "./load-mirror-account-dialog";

export const dynamic = "force-dynamic";

export default async function PaymentsPage() {
  const [transactions, members, accounts] = await Promise.all([
    getPaymentLedger(),
    getMembers(),
    getSavingsAccounts(),
  ]);

  const totalDeposits = transactions
    .filter((t) => t.type === "Deposit")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalWithdrawals = transactions
    .filter((t) => t.type === "Withdrawal")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalRepayments = transactions
    .filter((t) => t.type === "Loan Repayment")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalDisbursements = transactions
    .filter((t) => t.type === "Loan Disbursement")
    .reduce((sum, t) => sum + t.amount, 0);

  return (
    <div className="space-y-6">
      {/* Action buttons */}
      <div className="flex items-center gap-2 justify-end">
        <LoadMirrorAccountDialog />
        <NewWithdrawalDialog
          members={members}
          accounts={accounts}
          trigger={
            <Button size="sm" variant="outline" className="h-8 gap-1">
              <ArrowUpCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Withdrawal</span>
            </Button>
          }
        />
        <NewDepositDialog
          members={members}
          accounts={accounts}
          trigger={
            <Button size="sm" className="h-8 gap-1">
              <ArrowDownCircle className="h-3.5 w-3.5" />
              <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">New Deposit</span>
            </Button>
          }
        />
      </div>

      {/* Summary cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ArrowDownCircle className="h-4 w-4 text-green-600" /> Total Deposits
            </CardDescription>
            <CardTitle className="text-2xl font-headline text-green-600">
              RWF {totalDeposits.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <ArrowUpCircle className="h-4 w-4 text-red-600" /> Total Withdrawals
            </CardDescription>
            <CardTitle className="text-2xl font-headline text-red-600">
              RWF {totalWithdrawals.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <RefreshCw className="h-4 w-4 text-blue-600" /> Loan Repayments
            </CardDescription>
            <CardTitle className="text-2xl font-headline text-blue-600">
              RWF {totalRepayments.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription className="flex items-center gap-1">
              <Banknote className="h-4 w-4 text-orange-600" /> Loan Disbursements
            </CardDescription>
            <CardTitle className="text-2xl font-headline text-orange-600">
              RWF {totalDisbursements.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Transaction ledger */}
      <Card>
        <CardHeader>
          <CardTitle>Payment Ledger</CardTitle>
          <CardDescription>
            All financial movements — deposits, withdrawals, loan disbursements and repayments.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {transactions.length === 0 ? (
            <p className="text-sm text-muted-foreground py-8 text-center">
              No transactions recorded yet.
            </p>
          ) : (
            <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
              <PaymentsTable transactions={transactions} />
            </Suspense>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
