import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMembers } from "@/lib/data-service";
import ReportGenerator from "./report-generator";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const members = await getMembers();

  return (
    <div className="grid gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate Report</CardTitle>
          <CardDescription>
            Select a report type and set parameters to generate and download reports.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ReportGenerator members={members} />
        </CardContent>
      </Card>
    </div>
  );
}
