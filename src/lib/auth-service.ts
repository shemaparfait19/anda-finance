import { neon } from '@neondatabase/serverless';
import type { AuthUser } from '@/lib/types';

const sql = neon(process.env.DATABASE_URL!);

export function generateOTP(): string {
  return Math.floor(100000 + Math.random() * 900000).toString();
}

export async function storeOTP(email: string, otp: string): Promise<void> {
  // Remove any existing unused OTPs for this email before issuing a new one
  await sql`DELETE FROM otp_codes WHERE email = ${email}`;
  await sql`
    INSERT INTO otp_codes (email, code, expires_at)
    VALUES (${email}, ${otp}, NOW() + INTERVAL '5 minutes')
  `;
}

export async function validateOTP(email: string, otp: string): Promise<boolean> {
  const rows = await sql`
    SELECT id FROM otp_codes
    WHERE email = ${email}
      AND code  = ${otp}
      AND expires_at > NOW()
      AND used = false
    LIMIT 1
  `;
  if (rows.length === 0) return false;
  await sql`UPDATE otp_codes SET used = true WHERE id = ${rows[0].id}`;
  return true;
}

export async function getUserByEmail(email: string): Promise<AuthUser | null> {
  const rows = await sql`
    SELECT u.id, u.name, u.email, u.role, u.is_active, u.approvals_required,
           u.group_id, u.last_login, u.phone_number, u.created_at,
           g.name AS group_name
    FROM users u
    LEFT JOIN groups g ON g.id = u.group_id
    WHERE LOWER(u.email) = LOWER(${email})
    LIMIT 1
  `;
  if (rows.length === 0) return null;
  const r = rows[0];
  return {
    id:                 r.id,
    name:               r.name,
    email:              r.email,
    role:               r.role,
    isActive:           r.is_active ?? true,
    approvalsRequired:  r.approvals_required ?? 1,
    groupId:            r.group_id ?? null,
    groupName:          r.group_name ?? null,
    lastLogin:          r.last_login ?? undefined,
    phoneNumber:        r.phone_number ?? undefined,
    createdAt:          r.created_at,
  };
}

export async function updateUserLastLogin(userId: number): Promise<void> {
  await sql`UPDATE users SET last_login = NOW() WHERE id = ${userId}`;
}
