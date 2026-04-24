import { auth } from '@/auth';
import { redirect } from 'next/navigation';
import type { UserRole } from '@/lib/types';

/**
 * Call at the top of any server page that needs role protection.
 * Redirects to / with a 403-style message if the role isn't allowed.
 */
export async function requireRole(...allowed: UserRole[]): Promise<UserRole> {
  const session = await auth();
  const role    = session?.user?.role as UserRole | undefined;
  if (!role || !allowed.includes(role)) redirect('/');
  return role;
}

/**
 * Returns the session user's role without redirecting.
 * Use when you need the role to conditionally render content.
 */
export async function getSessionRole(): Promise<UserRole | null> {
  const session = await auth();
  return (session?.user?.role as UserRole) ?? null;
}
