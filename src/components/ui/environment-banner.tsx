import { Alert, AlertDescription } from "@/components/ui/alert";
import { AlertTriangle } from "lucide-react";

interface EnvironmentBannerProps {
  isReadOnly?: boolean;
}

export function EnvironmentBanner({
  isReadOnly = false,
}: EnvironmentBannerProps) {
  if (!isReadOnly) {
    return null; // Don't show banner in development
  }

  return (
    <Alert className="mb-4 border-amber-200 bg-amber-50 text-amber-800">
      <AlertTriangle className="h-4 w-4" />
      <AlertDescription className="text-sm">
        ⚠️ Demo Mode: Data changes are temporary and will not persist. In
        production, use a database for permanent storage.
      </AlertDescription>
    </Alert>
  );
}
