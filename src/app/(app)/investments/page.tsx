import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { LineChart } from "lucide-react";

export default function InvestmentsPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <LineChart className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight font-headline">
          Investments Module Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground">
          This feature is part of Phase 2. You'll be able to track group investments and profit-sharing here.
        </p>
      </div>
    </div>
  );
}
