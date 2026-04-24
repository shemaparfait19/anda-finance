'use server';

import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import type { UserRole } from '@/lib/types';

const sql = neon(process.env.DATABASE_URL!);

export async function clearDemoData(): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  const role    = session?.user?.role as UserRole | undefined;
  const groupId = (session?.user as any)?.groupId as string | null;

  if (role !== 'ADMIN_FULL' && role !== 'SUPER_ADMIN') {
    return { success: false, message: 'Unauthorized.' };
  }
  if (!groupId) {
    return { success: false, message: 'No group assigned — nothing to clear.' };
  }

  try {
    // Delete in FK-safe order, scoped to this group only
    await sql`DELETE FROM action_approvals WHERE action_id IN (SELECT id FROM pending_actions WHERE group_id = ${groupId})`;
    await sql`DELETE FROM pending_actions  WHERE group_id = ${groupId}`;
    await sql`DELETE FROM audit_logs       WHERE group_id = ${groupId}`;
    await sql`DELETE FROM reports          WHERE group_id = ${groupId}`;
    await sql`DELETE FROM journal_entries  WHERE group_id = ${groupId}`;
    await sql`DELETE FROM cashbook_entries WHERE group_id = ${groupId}`;
    await sql`DELETE FROM investments      WHERE group_id = ${groupId}`;
    await sql`DELETE FROM transactions     WHERE group_id = ${groupId}`;
    await sql`DELETE FROM payments         WHERE group_id = ${groupId}`;
    await sql`DELETE FROM accounts         WHERE group_id = ${groupId}`;
    await sql`DELETE FROM loans            WHERE group_id = ${groupId}`;
    await sql`DELETE FROM savings_accounts WHERE group_id = ${groupId}`;
    await sql`DELETE FROM members          WHERE group_id = ${groupId}`;

    revalidatePath('/');
    return { success: true, message: 'All data for your group has been cleared.' };
  } catch (error: any) {
    return { success: false, message: error?.message ?? 'Failed to clear data.' };
  }
}
