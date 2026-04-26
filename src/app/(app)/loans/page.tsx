import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoans, getMembers } from "@/lib/data-service";
import NewLoanDialog from "./new-loan-dialog";
import LoansTable from "./loans-table";
import LoanAmortizationTab from "./loan-amortization-tab";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
  CardContent,
} from "@/components/ui/card";
import type { Loan } from "@/lib/types";

// Force dynamic rendering to access environment variables
export const dynamic = "force-dynamic";

export default async function LoansPage() {
  const loans = await getLoans();
  const members = await getMembers();

  const tabs: {
    value: Loan["status"] | "all";
    label: string;
    isDestructive?: boolean;
  }[] = [
    { value: "all", label: "All" },
    { value: "Pending", label: "Pending" },
    { value: "Active", label: "Active" },
    { value: "Overdue", label: "Overdue", isDestructive: true },
    { value: "Paid", label: "Paid" },
  ];
  // "Amortization" is a special tab, not a loan status filter

  const getLoansByStatus = (status: Loan["status"]) =>
    loans.filter((loan) => loan.status === status);

  return (
    <Tabs defaultValue="all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            {tabs.map((tab) => (
              <TabsTrigger
                key={tab.value}
                value={tab.value}
                className={tab.isDestructive ? "text-destructive" : ""}
              >
                {tab.label}
              </TabsTrigger>
            ))}
            <TabsTrigger value="amortization" className="text-primary font-medium">
              Amortization
            </TabsTrigger>
          </TabsList>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <NewLoanDialog members={members} />
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>All Loans</CardTitle>
            <CardDescription>
              Manage loan applications, approvals, disbursements, and
              repayments.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoansTable loans={loans} />
          </CardContent>
        </Card>
      </TabsContent>

      {tabs
        .filter((t) => t.value !== "all")
        .map((tab) => (
          <TabsContent key={tab.value} value={tab.value}>
            <Card>
              <CardHeader>
                <CardTitle>{tab.label} Loans</CardTitle>
                <CardDescription>
                  A list of all loans with '{tab.label}' status.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <LoansTable
                  loans={getLoansByStatus(tab.value as Loan["status"])}
                />
              </CardContent>
            </Card>
          </TabsContent>
        ))}
      <TabsContent value="amortization">
        <Card>
          <CardHeader>
            <CardTitle>Loan Amortization Calculator</CardTitle>
            <CardDescription>
              Calculate monthly instalments and generate a full repayment schedule.
              Eligible amount (80% of savings) is at 3%/month; excess is at 5%/month.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <LoanAmortizationTab members={members} />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
