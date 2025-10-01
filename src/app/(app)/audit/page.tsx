import { GanttChartSquare } from "lucide-react";

export default function AuditPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <GanttChartSquare className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight font-headline">
          Audit Trail Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground">
          This feature is part of Phase 3. Full transaction logs, security, and compliance features will be available here.
        </p>
      </div>
    </div>
  );
}
