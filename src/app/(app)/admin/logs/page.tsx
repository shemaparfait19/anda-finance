import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  getSuperAdminAuditLogs,
  getSuperAdminTransactions,
  getSuperAdminGroups,
} from "@/lib/data-service";
import LogsTable from "./logs-table";

export const dynamic = "force-dynamic";

export default async function LogsPage() {
  const session = await auth();
  if ((session?.user as any)?.role !== "SUPER_ADMIN") redirect("/");

  const [auditLogs, transactions, groups] = await Promise.all([
    getSuperAdminAuditLogs(),
    getSuperAdminTransactions(),
    getSuperAdminGroups(),
  ]);

  return (
    <div className="space-y-1 pb-8">
      <h1 className="text-xl font-semibold">Activity Logs</h1>
      <p className="text-sm text-muted-foreground mb-4">
        Full audit trail and transaction history across all groups.
      </p>
      <LogsTable
        auditLogs={auditLogs as any}
        transactions={transactions as any}
        groups={groups}
      />
    </div>
  );
}
