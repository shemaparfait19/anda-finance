import { getPaymentLedger } from "@/lib/data-service";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { ArrowDownCircle, ArrowUpCircle, Banknote, RefreshCw } from "lucide-react";

export const dynamic = "force-dynamic";

const TYPE_META: Record<string, { label: string; color: string; icon: React.ReactNode }> = {
  Deposit:           { label: "Deposit",           color: "text-green-600",      icon: <ArrowDownCircle className="h-4 w-4 text-green-600" /> },
  Withdrawal:        { label: "Withdrawal",         color: "text-red-600",        icon: <ArrowUpCircle className="h-4 w-4 text-red-600" /> },
  "Loan Repayment":  { label: "Loan Repayment",     color: "text-blue-600",       icon: <RefreshCw className="h-4 w-4 text-blue-600" /> },
  "Loan Disbursement":{ label: "Loan Disbursement", color: "text-orange-600",     icon: <Banknote className="h-4 w-4 text-orange-600" /> },
};

export default async function PaymentsPage() {
  const transactions = await getPaymentLedger();

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
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Member</TableHead>
                  <TableHead>Type</TableHead>
                  <TableHead className="hidden md:table-cell">Date</TableHead>
                  <TableHead className="hidden md:table-cell">Status</TableHead>
                  <TableHead className="text-right">Amount (RWF)</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {transactions.map((tx) => {
                  const meta = TYPE_META[tx.type] ?? { label: tx.type, color: "", icon: null };
                  return (
                    <TableRow key={tx.id}>
                      <TableCell className="font-medium">{tx.member.name}</TableCell>
                      <TableCell>
                        <span className={`flex items-center gap-1 text-sm ${meta.color}`}>
                          {meta.icon}
                          {meta.label}
                        </span>
                      </TableCell>
                      <TableCell className="hidden md:table-cell text-sm text-muted-foreground">
                        {new Date(tx.date).toLocaleDateString()}
                      </TableCell>
                      <TableCell className="hidden md:table-cell">
                        <Badge variant={tx.status === "Completed" ? "secondary" : "outline"}>
                          {tx.status}
                        </Badge>
                      </TableCell>
                      <TableCell className={`text-right font-medium ${meta.color}`}>
                        {tx.type === "Withdrawal" || tx.type === "Loan Disbursement" ? "-" : "+"}
                        {tx.amount.toLocaleString()}
                      </TableCell>
                    </TableRow>
                  );
                })}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
