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
import CreateAccountDialog from "./create-account-dialog";

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
  const internalAccounts = savingsAccounts.filter(
    (a) => a.type === "Internal"
  );

  return (
    <Tabs defaultValue="all">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="overflow-x-auto">
          <TabsList className="w-max">
            <TabsTrigger value="all">All</TabsTrigger>
            <TabsTrigger value="compulsory">Compulsory</TabsTrigger>
            <TabsTrigger value="voluntary">Voluntary</TabsTrigger>
            <TabsTrigger value="internal">Internal</TabsTrigger>
          </TabsList>
        </div>
        <div className="flex items-center gap-2 sm:ml-auto">
          <CreateAccountDialog members={members} trigger={<Button size="sm" variant="secondary">Create Account</Button>} />
        </div>
      </div>
      <TabsContent value="all">
        <Card>
          <CardHeader>
            <CardTitle>All Accounts</CardTitle>
            <CardDescription>
              Overview of all savings and internal accounts.
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
            <CardTitle>Compulsory Saving Account</CardTitle>
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
            <CardTitle>Voluntary Saving Account</CardTitle>
            <CardDescription>
              Additional, flexible voluntary saving accounts for members.
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
      <TabsContent value="internal">
        <Card>
          <CardHeader>
            <CardTitle>Internal Accounts</CardTitle>
            <CardDescription>
              Manage internal organization accounts here (e.g. reserves, admin, etc.).
            </CardDescription>
          </CardHeader>
          <CardContent>
            <SavingsAccountsTable
              accounts={internalAccounts}
              members={members}
            />
          </CardContent>
        </Card>
      </TabsContent>
    </Tabs>
  );
}
