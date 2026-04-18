import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export default function SavingsLoading() {
  return (
    <div className="space-y-6">
      {/* Summary cards */}
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
      {/* Tab strip */}
      <div className="flex gap-2">
        {[1, 2, 3].map((i) => (
          <Skeleton key={i} className="h-9 w-24 rounded-md" />
        ))}
      </div>
      <TablePageSkeleton rows={8} />
    </div>
  );
}
