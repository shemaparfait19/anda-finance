'use server';

import { z } from 'zod';
import { neon } from '@neondatabase/serverless';
import { revalidatePath } from 'next/cache';
import { auth } from '@/auth';
import { canApprove } from '@/lib/permissions';
import { addApproval } from '@/lib/pending-actions-service';
import { hashPassword, hashPin } from '@/lib/auth-service';
import { sendWelcomeEmail } from '@/lib/mailer';
import type { UserRole } from '@/lib/types';

const sql = neon(process.env.DATABASE_URL!);

type FormState = { message: string; success?: boolean; fields?: Record<string, string> };

// ── Schemas ──────────────────────────────────────────────────────────────────

const UserSchema = z.object({
  name:              z.string().min(2, 'Name must be at least 2 characters.'),
  email:             z.string().email('Valid email required.'),
  role:              z.enum(['SUPER_ADMIN', 'ADMIN_FULL', 'ADMIN_MAKER', 'ADMIN_CHECKER', 'IT_ADMIN']),
  phoneNumber:       z.string().optional(),
  approvalsRequired: z.coerce.number().int().min(1).max(2).optional(),
});

// ── Create User ───────────────────────────────────────────────────────────────

export async function createUser(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { message: 'Not authenticated.', success: false };

  const parsed = UserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    const fields: Record<string, string> = {};
    for (const [k, v] of Object.entries(parsed.error.format())) {
      if (k !== '_errors') fields[k] = (v as any)._errors?.join(', ') ?? '';
    }
    return { message: 'Please fix the errors below.', fields, success: false };
  }

  const { name, email, role, phoneNumber, approvalsRequired } = parsed.data;
  const creatorGroupId = (session.user as any).groupId as string | null;
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN';

  // SUPER_ADMIN can specify an explicit group_id from the form; others inherit their own
  const groupId = isSuperAdmin
    ? (formData.get('groupId') as string | null) || null
    : creatorGroupId;

  try {
    const existing = await sql`SELECT id FROM users WHERE LOWER(email) = LOWER(${email})`;
    if (existing.length > 0) return { message: 'A user with this email already exists.', success: false };

    // New users set their own credentials on first login
    await sql`
      INSERT INTO users (name, email, role, phone_number, approvals_required, is_active, group_id, must_set_credentials)
      VALUES (${name}, ${email.toLowerCase()}, ${role}, ${phoneNumber ?? null}, ${approvalsRequired ?? 1}, true, ${groupId}, true)
    `;

    revalidatePath('/admin');

    // Send welcome email — best-effort, never block user creation
    sendWelcomeEmail(name, email.toLowerCase()).catch(() => {});

    return { message: `User ${name} created successfully.`, success: true };
  } catch (err: any) {
    return { message: err.message ?? 'Failed to create user.', success: false };
  }
}

// ── Update User ───────────────────────────────────────────────────────────────

const UpdateUserSchema = z.object({
  id:                z.coerce.number().int(),
  name:              z.string().min(2),
  role:              z.enum(['SUPER_ADMIN', 'ADMIN_FULL', 'ADMIN_MAKER', 'ADMIN_CHECKER', 'IT_ADMIN']),
  phoneNumber:       z.string().optional(),
  approvalsRequired: z.coerce.number().int().min(1).max(2).optional(),
  isActive:          z.enum(['true', 'false']).transform((v) => v === 'true'),
  password:          z.string().min(8).or(z.literal('')).optional(),
  pin:               z.string().length(5).regex(/^\d{5}$/).or(z.literal('')).optional(),
});

export async function updateUser(_prevState: FormState, formData: FormData): Promise<FormState> {
  const session = await auth();
  if (!session?.user) return { message: 'Not authenticated.', success: false };

  const parsed = UpdateUserSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) return { message: 'Invalid data.', success: false };

  const { id, name, role, phoneNumber, approvalsRequired, isActive, password, pin } = parsed.data;

  // SUPER_ADMIN can reassign a user to a different group
  const isSuperAdmin = session.user.role === 'SUPER_ADMIN';
  const rawGroupId   = (formData.get('groupId') as string | null)?.trim() || null;
  const newGroupId   = isSuperAdmin ? rawGroupId : undefined;

  // Hash new credentials only if provided (empty string = no change)
  const newPasswordHash = password ? await hashPassword(password) : null;
  const newPinHash      = pin      ? await hashPin(pin)           : null;

  try {
    if (newGroupId !== undefined) {
      await sql`
        UPDATE users
        SET name              = ${name},
            role              = ${role},
            phone_number      = ${phoneNumber ?? null},
            approvals_required= ${approvalsRequired ?? 1},
            is_active         = ${isActive},
            group_id          = ${newGroupId},
            password_hash     = COALESCE(${newPasswordHash}, password_hash),
            pin_hash          = COALESCE(${newPinHash}, pin_hash),
            updated_at        = NOW()
        WHERE id = ${id}
      `;
    } else {
      await sql`
        UPDATE users
        SET name              = ${name},
            role              = ${role},
            phone_number      = ${phoneNumber ?? null},
            approvals_required= ${approvalsRequired ?? 1},
            is_active         = ${isActive},
            password_hash     = COALESCE(${newPasswordHash}, password_hash),
            pin_hash          = COALESCE(${newPinHash}, pin_hash),
            updated_at        = NOW()
        WHERE id = ${id}
      `;
    }
    revalidatePath('/admin');
    return { message: 'User updated successfully.', success: true };
  } catch (err: any) {
    return { message: err.message ?? 'Failed to update user.', success: false };
  }
}

// ── Toggle Active ─────────────────────────────────────────────────────────────

export async function toggleUserActive(userId: number, isActive: boolean): Promise<{ success: boolean; message: string }> {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Not authenticated.' };

  try {
    await sql`UPDATE users SET is_active = ${isActive}, updated_at = NOW() WHERE id = ${userId}`;
    revalidatePath('/admin');
    return { success: true, message: isActive ? 'User activated.' : 'User deactivated.' };
  } catch (err: any) {
    return { success: false, message: err.message ?? 'Operation failed.' };
  }
}

// ── Approve / Reject pending action ──────────────────────────────────────────

export async function processApproval(
  actionId: number,
  decision: 'approved' | 'rejected',
  comment?: string
): Promise<{ success: boolean; message: string; executed?: boolean }> {
  const session = await auth();
  if (!session?.user) return { success: false, message: 'Not authenticated.' };

  const role = session.user.role as UserRole;
  if (!canApprove(role)) {
    return { success: false, message: 'You do not have permission to approve actions.' };
  }

  const result = await addApproval(
    actionId,
    { email: session.user.email!, name: session.user.name! },
    decision,
    comment
  );

  if (result.error) return { success: false, message: result.error };

  revalidatePath('/admin');

  if (result.rejected)  return { success: true, message: 'Action rejected.',  executed: false };
  if (result.executed)  return { success: true, message: 'Action approved and executed.', executed: true };
  return { success: true, message: 'Approval recorded. Waiting for more approvers.', executed: false };
}
