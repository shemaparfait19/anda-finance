import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { getMembers } from "@/lib/data-service";
import ReportGenerator from "./report-generator";
import SkippedSavingsReport from "./skipped-savings-report";

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

      <Card>
        <CardHeader>
          <CardTitle>Skipped Savings</CardTitle>
          <CardDescription>
            Members who have not made their savings contribution for a selected month.
            Use this list to send payment reminders.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <SkippedSavingsReport />
        </CardContent>
      </Card>
    </div>
  );
}
