import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { getLoans, getMembers } from "@/lib/data-service";
import NewLoanDialog from "./new-loan-dialog";
import LoansTable from "./loans-table";
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

  const getLoansByStatus = (status: Loan["status"]) =>
    loans.filter((loan) => loan.status === status);

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          {tabs.map((tab) => (
            <TabsTrigger
              key={tab.value}
              value={tab.value}
              className={tab.isDestructive ? "text-destructive" : ""}
            >
              {tab.label}
            </TabsTrigger>
          ))}
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
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
    </Tabs>
  );
}
