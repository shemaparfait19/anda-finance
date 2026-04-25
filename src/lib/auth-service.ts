import { neon } from '@neondatabase/serverless';
import bcrypt from 'bcryptjs';
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
           u.password_hash, u.pin_hash,
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
    passwordHash:       r.password_hash ?? null,
    pinHash:            r.pin_hash ?? null,
    lastLogin:          r.last_login ?? undefined,
    phoneNumber:        r.phone_number ?? undefined,
    createdAt:          r.created_at,
  };
}

export async function verifyPassword(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export async function verifyPin(plain: string, hash: string | null): Promise<boolean> {
  if (!hash) return false;
  return bcrypt.compare(plain, hash);
}

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 12);
}

export async function hashPin(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function updateUserLastLogin(userId: number): Promise<void> {
  await sql`UPDATE users SET last_login = NOW() WHERE id = ${userId}`;
}

export async function checkLoginStatus(email: string): Promise<'needs_setup' | 'inactive' | 'ready'> {
  const rows = await sql`
    SELECT must_set_credentials, is_active, password_hash FROM users
    WHERE LOWER(email) = LOWER(${email})
    LIMIT 1
  `;
  if (rows.length === 0) return 'ready'; // don't reveal whether email exists
  if (!rows[0].is_active) return 'inactive';
  // No password yet (existing account before password auth was added) → setup flow
  if (!rows[0].password_hash || rows[0].must_set_credentials) return 'needs_setup';
  return 'ready';
}

export async function setupCredentials(email: string, password: string, pin: string): Promise<boolean> {
  const rows = await sql`
    SELECT id FROM users
    WHERE LOWER(email) = LOWER(${email})
      AND (must_set_credentials = true OR password_hash IS NULL)
      AND is_active = true
    LIMIT 1
  `;
  if (rows.length === 0) return false;

  const [passwordHash, pinHash] = await Promise.all([
    bcrypt.hash(password, 12),
    bcrypt.hash(pin, 10),
  ]);

  await sql`
    UPDATE users
    SET password_hash = ${passwordHash},
        pin_hash      = ${pinHash},
        must_set_credentials = false,
        updated_at    = NOW()
    WHERE id = ${rows[0].id}
  `;
  return true;
}
