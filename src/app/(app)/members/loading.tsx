import { TablePageSkeleton } from "@/components/ui/page-skeleton";
import { Skeleton } from "@/components/ui/skeleton";

export default function MembersLoading() {
  return (
    <div className="space-y-4">
      {/* Tab strip */}
      <div className="flex gap-2">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <Skeleton key={i} className="h-9 w-20 rounded-md" />
        ))}
      </div>
      <TablePageSkeleton rows={10} />
    </div>
  );
}
