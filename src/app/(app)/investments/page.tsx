import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getInvestments } from "@/lib/data-service";
import AddInvestmentDialog from "./add-investment-dialog";
import InvestmentsTable from "./investments-table";

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
          <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
            <InvestmentsTable investments={investments} />
          </Suspense>
        </CardContent>
      </Card>
    </div>
  );
}
