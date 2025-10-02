// Environment detection utilities

export function isReadOnlyEnvironment(): boolean {
  // Check if we're in a read-only environment (like Vercel production)
  return process.env.VERCEL === "1" || process.env.NODE_ENV === "production";
}

export function getEnvironmentInfo() {
  return {
    isReadOnly: isReadOnlyEnvironment(),
    isProduction: process.env.NODE_ENV === "production",
    isVercel: process.env.VERCEL === "1",
    platform: process.env.VERCEL ? "Vercel" : "Local",
  };
}

export function getDataPersistenceMessage(): string {
  if (isReadOnlyEnvironment()) {
    return "⚠️ Demo Mode: Data changes are temporary and will not persist. In production, use a database for permanent storage.";
  }
  return "✅ Development Mode: Data changes are saved locally.";
}
