import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import type { PendingAction, ActionApproval } from '@/lib/types';
import {
  getMemberById,
  updateMember,
  updateSavingsAccount,
  addTransaction,
  createSavingsAccount,
} from '@/lib/data-service';

const sql = neon(process.env.DATABASE_URL!);

async function getGroupId(): Promise<string | null> {
  try {
    const session = await auth();
    return (session?.user as any)?.groupId ?? null;
  } catch {
    return null;
  }
}

// ─── Create ────────────────────────────────────────────────────────────────

export async function createPendingAction(
  actionType: string,
  actionData: Record<string, any>,
  initiatedBy: { email: string; name: string; approvalsRequired?: number }
): Promise<number> {
  const groupId = await getGroupId();
  const rows = await sql`
    INSERT INTO pending_actions
      (action_type, action_data, initiated_by_email, initiated_by_name, required_approvals, group_id)
    VALUES
      (${actionType}, ${JSON.stringify(actionData)}, ${initiatedBy.email}, ${initiatedBy.name},
       ${initiatedBy.approvalsRequired ?? 1}, ${groupId})
    RETURNING id
  `;
  return rows[0].id as number;
}

// ─── Read ───────────────────────────────────────────────────────────────────

function mapAction(row: any, approvals: ActionApproval[]): PendingAction {
  return {
    id:                row.id,
    actionType:        row.action_type,
    actionData:        typeof row.action_data === 'string' ? JSON.parse(row.action_data) : row.action_data,
    initiatedByEmail:  row.initiated_by_email,
    initiatedByName:   row.initiated_by_name,
    initiatedAt:       row.initiated_at,
    status:            row.status,
    requiredApprovals: row.required_approvals,
    executedAt:        row.executed_at ?? undefined,
    notes:             row.notes ?? undefined,
    approvals,
  };
}

function mapApproval(row: any): ActionApproval {
  return {
    id:            row.id,
    actionId:      row.action_id,
    approverEmail: row.approver_email,
    approverName:  row.approver_name,
    decision:      row.decision,
    comment:       row.comment ?? undefined,
    decidedAt:     row.decided_at,
  };
}

export async function getPendingActions(status?: 'pending' | 'approved' | 'rejected'): Promise<PendingAction[]> {
  const groupId = await getGroupId();
  const rows = status
    ? await sql`SELECT * FROM pending_actions WHERE status = ${status} AND group_id = ${groupId} ORDER BY initiated_at DESC`
    : await sql`SELECT * FROM pending_actions WHERE group_id = ${groupId} ORDER BY initiated_at DESC`;

  if (rows.length === 0) return [];

  // Use a JOIN instead of ANY(array) for Neon driver compatibility
  const approvalRows = status
    ? await sql`
        SELECT aa.* FROM action_approvals aa
        INNER JOIN pending_actions pa ON pa.id = aa.action_id
        WHERE pa.group_id = ${groupId} AND pa.status = ${status}
      `
    : await sql`
        SELECT aa.* FROM action_approvals aa
        INNER JOIN pending_actions pa ON pa.id = aa.action_id
        WHERE pa.group_id = ${groupId}
      `;

  const approvalsByAction = new Map<number, ActionApproval[]>();
  for (const row of approvalRows) {
    const key = Number(row.action_id);
    const list = approvalsByAction.get(key) ?? [];
    list.push(mapApproval(row));
    approvalsByAction.set(key, list);
  }

  return rows.map((r: any) => mapAction(r, approvalsByAction.get(Number(r.id)) ?? []));
}

export async function getPendingActionById(id: number): Promise<PendingAction | null> {
  const groupId = await getGroupId();
  const rows = await sql`SELECT * FROM pending_actions WHERE id = ${id} AND group_id = ${groupId}`;
  if (rows.length === 0) return null;
  const approvals = await sql`SELECT * FROM action_approvals WHERE action_id = ${id}`;
  return mapAction(rows[0], approvals.map(mapApproval));
}

// ─── Approve / Reject ──────────────────────────────────────────────────────

export async function addApproval(
  actionId: number,
  approver: { email: string; name: string },
  decision: 'approved' | 'rejected',
  comment?: string
): Promise<{ executed: boolean; rejected: boolean; error?: string }> {
  // Verify action exists and is still pending
  const [action] = await sql`SELECT * FROM pending_actions WHERE id = ${actionId} AND status = 'pending'`;
  if (!action) return { executed: false, rejected: false, error: 'Action not found or already processed.' };

  // Prevent self-approval
  if (action.initiated_by_email === approver.email) {
    return { executed: false, rejected: false, error: 'You cannot approve your own action.' };
  }

  // Prevent duplicate approval from same person
  const existing = await sql`
    SELECT id FROM action_approvals WHERE action_id = ${actionId} AND approver_email = ${approver.email}
  `;
  if (existing.length > 0) return { executed: false, rejected: false, error: 'You have already reviewed this action.' };

  await sql`
    INSERT INTO action_approvals (action_id, approver_email, approver_name, decision, comment)
    VALUES (${actionId}, ${approver.email}, ${approver.name}, ${decision}, ${comment ?? null})
  `;

  if (decision === 'rejected') {
    await sql`UPDATE pending_actions SET status = 'rejected' WHERE id = ${actionId}`;
    return { executed: false, rejected: true };
  }

  // Count approvals
  const [{ count }] = await sql`
    SELECT COUNT(*) as count FROM action_approvals WHERE action_id = ${actionId} AND decision = 'approved'
  `;

  if (Number(count) >= action.required_approvals) {
    try {
      await executePendingAction(mapAction(action, []));
      await sql`UPDATE pending_actions SET status = 'approved', executed_at = NOW() WHERE id = ${actionId}`;
      return { executed: true, rejected: false };
    } catch (err: any) {
      await sql`UPDATE pending_actions SET notes = ${err.message ?? 'Execution failed'} WHERE id = ${actionId}`;
      return { executed: false, rejected: false, error: err.message ?? 'Execution failed' };
    }
  }

  return { executed: false, rejected: false };
}

// ─── Action Executors ──────────────────────────────────────────────────────

async function executePendingAction(action: PendingAction): Promise<void> {
  const d = action.actionData;

  switch (action.actionType) {

    case 'CASH_WITHDRAWAL': {
      const member = await getMemberById(d.memberId);
      if (!member) throw new Error(`Member '${d.memberId}' not found.`);
      const amount = Number(d.amount);
      if (member.savingsBalance < amount) throw new Error('Insufficient savings balance.');
      await updateSavingsAccount(member.id, -amount, d.account);
      await updateMember(member.id, { savingsBalance: member.savingsBalance - amount });
      await addTransaction(
        { member: { name: member.name, avatarId: member.avatarId }, type: 'Withdrawal', amount, date: new Date().toISOString().split('T')[0] },
        d.account ?? undefined,
        d.reason ?? undefined
      );
      revalidatePath('/savings');
      revalidatePath('/');
      break;
    }

    case 'INTERNAL_ACCOUNT_CREATE': {
      await createSavingsAccount(d.memberId ?? null, 'Internal', d.accountName ?? 'Internal Account');
      revalidatePath('/savings');
      break;
    }

    case 'MEMBER_SECOND_ACCOUNT': {
      await createSavingsAccount(d.memberId, d.type ?? 'Voluntary', d.accountName ?? 'Savings Account');
      revalidatePath('/savings');
      revalidatePath('/members');
      break;
    }

    default:
      // Framework is in place; other action types can be wired up here
      console.log(`[pending-actions] No executor for action type: ${action.actionType}`, d);
  }
}
