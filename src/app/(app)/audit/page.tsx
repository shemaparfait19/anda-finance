import { Suspense } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getAuditLogs } from "@/lib/data-service";
import AuditTable from "./audit-table";

// Force dynamic rendering to access environment variables
export const dynamic = "force-dynamic";

export default async function AuditPage() {
  const auditLogs = await getAuditLogs();
  return (
    <Card>
      <CardHeader>
        <CardTitle>Audit Trail</CardTitle>
        <CardDescription>
          A chronological log of all actions and events in the system.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Suspense fallback={<p className="text-sm text-muted-foreground">Loading…</p>}>
          <AuditTable logs={auditLogs} />
        </Suspense>
      </CardContent>
    </Card>
  );
}
