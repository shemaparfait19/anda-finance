import { CreditCard } from "lucide-react";

export default function PaymentsPage() {
  return (
    <div className="flex flex-1 items-center justify-center rounded-lg border border-dashed shadow-sm">
      <div className="flex flex-col items-center gap-1 text-center">
        <CreditCard className="h-12 w-12 text-muted-foreground" />
        <h3 className="text-2xl font-bold tracking-tight font-headline">
          Payments Module Coming Soon
        </h3>
        <p className="text-sm text-muted-foreground">
          This feature is part of Phase 2. Direct mobile money and bank integrations will be managed here.
        </p>
      </div>
    </div>
  );
}
