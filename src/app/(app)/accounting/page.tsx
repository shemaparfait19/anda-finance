import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getCashbook } from "@/lib/data-service";
import AddEntryDialog from "./add-entry-dialog";
import CashbookTable from "./cashbook-table";
import ExpenseBreakdownChart from "./expense-breakdown-chart";

// Force dynamic rendering to access environment variables
export const dynamic = "force-dynamic";

export default async function AccountingPage() {
  const { income, expenses } = await getCashbook();
  const totalIncome = income.reduce((acc, entry) => acc + entry.amount, 0);
  const totalExpenses = expenses.reduce((acc, entry) => acc + entry.amount, 0);
  const netBalance = totalIncome - totalExpenses;

  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Income</CardDescription>
            <CardTitle className="text-4xl font-headline text-green-600">
              RWF {totalIncome.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">All income recorded</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Total Expenses</CardDescription>
            <CardTitle className="text-4xl font-headline text-red-600">
              RWF {totalExpenses.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              All expenses recorded
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardDescription>Net Balance</CardDescription>
            <CardTitle
              className={`text-4xl font-headline ${
                netBalance >= 0 ? "text-primary" : "text-destructive"
              }`}
            >
              RWF {netBalance.toLocaleString()}
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-xs text-muted-foreground">
              Operating surplus or deficit
            </p>
          </CardContent>
        </Card>
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle>Expense Breakdown</CardTitle>
            <CardDescription>Spending by category</CardDescription>
          </CardHeader>
          <CardContent>
            <ExpenseBreakdownChart expenses={expenses} />
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="income">
        <div className="flex items-center">
          <TabsList>
            <TabsTrigger value="income">Income</TabsTrigger>
            <TabsTrigger value="expenses">Expenses</TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <AddEntryDialog />
          </div>
        </div>
        <TabsContent value="income">
          <CashbookTable data={income} type="Income" />
        </TabsContent>
        <TabsContent value="expenses">
          <CashbookTable data={expenses} type="Expenses" />
        </TabsContent>
      </Tabs>
    </div>
  );
}
