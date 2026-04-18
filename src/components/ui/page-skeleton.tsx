import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";

export function TablePageSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <Card>
      <CardHeader className="space-y-2 pb-4">
        <Skeleton className="h-5 w-32" />
        <Skeleton className="h-4 w-64" />
        <Skeleton className="h-9 w-64 mt-2" />
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {/* Header row */}
          <div className="flex gap-4 pb-2 border-b">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-4 w-24 ml-auto" />
            <Skeleton className="h-4 w-24" />
            <Skeleton className="h-4 w-20" />
          </div>
          {/* Data rows */}
          {Array.from({ length: rows }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 py-1">
              <Skeleton className="h-4 w-36" />
              <Skeleton className="h-4 w-24 ml-auto" />
              <Skeleton className="h-4 w-24" />
              <Skeleton className="h-6 w-6 rounded-full" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

export function StatsAndTableSkeleton({ rows = 8 }: { rows?: number }) {
  return (
    <div className="space-y-6">
      {/* Stat cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2 space-y-2">
              <Skeleton className="h-4 w-28" />
              <Skeleton className="h-7 w-36" />
            </CardHeader>
          </Card>
        ))}
      </div>
      <TablePageSkeleton rows={rows} />
    </div>
  );
}
