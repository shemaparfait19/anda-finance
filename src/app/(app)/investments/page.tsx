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
import { PlusCircle, TrendingUp, DollarSign, Zap } from 'lucide-react';
import { investments } from '@/lib/data';
import type { Investment } from '@/lib/types';

export default function InvestmentsPage() {
  const totalInvested = investments.reduce(
    (acc, inv) => acc + inv.amountInvested,
    0
  );
  const totalCurrentValue = investments.reduce(
    (acc, inv) => acc + inv.currentValue,
    0
  );
  const totalReturn = totalCurrentValue - totalInvested;
  const overallReturnPercentage = (totalReturn / totalInvested) * 100;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Invested</CardDescription>
            <CardTitle className="text-4xl font-headline">
              RWF {totalInvested.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Current Value</CardDescription>
            <CardTitle className="text-4xl font-headline text-primary">
              RWF {totalCurrentValue.toLocaleString()}
            </CardTitle>
          </CardHeader>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Overall Return</CardDescription>
            <CardTitle
              className={`text-4xl font-headline ${
                totalReturn >= 0 ? 'text-green-600' : 'text-red-600'
              }`}
            >
              RWF {totalReturn.toLocaleString()} (+
              {overallReturnPercentage.toFixed(2)}%)
            </CardTitle>
          </CardHeader>
        </Card>
      </div>
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
            <div>
                <CardTitle>Investment Portfolio</CardTitle>
                <CardDescription>
                    Track the performance of your group's investments.
                </CardDescription>
            </div>
            <Button size="sm" className="h-8 gap-1">
                <PlusCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                Add Investment
                </span>
            </Button>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Investment</TableHead>
                <TableHead>Type</TableHead>
                <TableHead className="hidden md:table-cell">
                  Purchase Date
                </TableHead>
                <TableHead className="text-right">Amount Invested</TableHead>
                <TableHead className="text-right">Current Value</TableHead>
                <TableHead className="text-right">ROI (%)</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {investments.map((investment) => (
                <TableRow key={investment.id}>
                  <TableCell className="font-medium">
                    {investment.name}
                  </TableCell>
                  <TableCell>{investment.type}</TableCell>
                  <TableCell className="hidden md:table-cell">
                    {investment.purchaseDate}
                  </TableCell>
                  <TableCell className="text-right">
                    RWF {investment.amountInvested.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-right">
                    RWF {investment.currentValue.toLocaleString()}
                  </TableCell>
                  <TableCell
                    className={`text-right font-semibold ${
                      investment.returnOnInvestment >= 0
                        ? 'text-green-600'
                        : 'text-red-600'
                    }`}
                  >
                    {investment.returnOnInvestment.toFixed(2)}%
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
