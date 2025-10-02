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
import { getInvestments } from "@/lib/data-service";
import AddInvestmentDialog from "./add-investment-dialog";

// Force dynamic rendering to access environment variables
export const dynamic = "force-dynamic";

export default async function InvestmentsPage() {
  const investments = await getInvestments();
  const totalInvested = investments.reduce(
    (acc, inv) => acc + inv.amountInvested,
    0
  );
  const totalCurrentValue = investments.reduce(
    (acc, inv) => acc + inv.currentValue,
    0
  );
  const totalReturn = totalCurrentValue - totalInvested;
  const overallReturnPercentage =
    totalInvested > 0 ? (totalReturn / totalInvested) * 100 : 0;

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
                totalReturn >= 0 ? "text-green-600" : "text-red-600"
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
          <AddInvestmentDialog />
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
                    {new Date(investment.purchaseDate).toLocaleDateString()}
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
                        ? "text-green-600"
                        : "text-red-600"
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
