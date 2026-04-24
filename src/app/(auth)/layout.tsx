import type { ReactNode } from 'react';

/** Clean full-screen layout for auth pages — no sidebar, no header */
export default function AuthLayout({ children }: { children: ReactNode }) {
  return <>{children}</>;
}
