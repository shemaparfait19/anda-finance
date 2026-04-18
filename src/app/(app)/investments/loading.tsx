import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";

export default function InvestmentsLoading() {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-3">
        {[1, 2, 3].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-8 w-40" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <TablePageSkeleton rows={6} />
    </div>
  );
}
