import { Skeleton } from "@/components/ui/skeleton";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { TablePageSkeleton } from "@/components/ui/page-skeleton";

export default function LoansLoading() {
  return (
    <div className="space-y-4">
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
