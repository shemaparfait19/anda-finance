import { ArrowDownCircle, ArrowUpCircle } from "lucide-react";

import { getSavingsAccounts, getMembers } from "@/lib/data-service";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import SavingsAccountsTable from "./savings-accounts-table";
import type { SavingsAccount } from "@/lib/types";
import NewDepositDialog from "./new-deposit-dialog";
import NewWithdrawalDialog from "./new-withdrawal-dialog";

// Force dynamic rendering to access environment variables
export const dynamic = "force-dynamic";

export default async function SavingsPage() {
  const savingsAccounts = await getSavingsAccounts();
  const members = await getMembers();

  const compulsoryAccounts = savingsAccounts.filter(
    (a) => a.type === "Compulsory"
  );
  const voluntaryAccounts = savingsAccounts.filter(
    (a) => a.type === "Voluntary"
  );

  return (
    <Tabs defaultValue="all">
      <div className="flex items-center">
        <TabsList>
          <TabsTrigger value="all">All</TabsTrigger>
          <TabsTrigger value="compulsory">Compulsory</TabsTrigger>
          <TabsTrigger value="voluntary">Voluntary</TabsTrigger>
        </TabsList>
        <div className="ml-auto flex items-center gap-2">
          <NewWithdrawalDialog
            members={members}
            trigger={
              <Button size="sm" variant="outline" className="h-8 gap-1">
                <ArrowUpCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Withdrawal
                </span>
              </Button>
            }
          />
          <NewDepositDialog
            members={members}
            trigger={
              <Button size="sm" className="h-8 gap-1">
                <ArrowDownCircle className="h-3.5 w-3.5" />
                <span className="sr-only sm:not-sr-only sm:whitespace-nowrap">
                  New Deposit
                </span>
              </Button>
            }
          />
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>All Savings Accounts</CardTitle>
            <CardDescription>
              Track member contributions, deposits, withdrawals, and balances.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsAccountsTable
              accounts={savingsAccounts}
              members={members}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="compulsory">
        <Card>
          <CardHeader>
            <CardTitle>Compulsory Savings Accounts</CardTitle>
            <CardDescription>
              Accounts for regular, required member contributions.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsAccountsTable
              accounts={compulsoryAccounts}
              members={members}
            />
          </CardContent>
        </Card>
      </TabsContent>
      <TabsContent value="voluntary">
        <Card>
          <CardHeader>
            <CardTitle>Voluntary Savings Accounts</CardTitle>
            <CardDescription>
              Additional, flexible savings accounts for members.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsAccountsTable
              accounts={voluntaryAccounts}
              members={members}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
