import { createHmac, timingSafeEqual } from 'crypto';
import { cookies } from 'next/headers';

const COOKIE = 'af_member';
const EXPIRES_IN = 7 * 24 * 60 * 60 * 1000; // 7 days

function getSecret(): string {
  const s = process.env.MEMBER_JWT_SECRET;
  if (!s) throw new Error('MEMBER_JWT_SECRET environment variable is not set');
  return s;
}

export type MemberSession = {
  memberId: string;   // DB UUID
  memberCode: string; // e.g. M001
  groupId: string;
  name: string;
};

function sign(payload: string): string {
  return createHmac('sha256', getSecret()).update(payload).digest('base64url');
}

export function createMemberToken(session: MemberSession): string {
  const exp = Date.now() + EXPIRES_IN;
  const payload = Buffer.from(JSON.stringify({ ...session, exp })).toString('base64url');
  const sig = sign(payload);
  return `${payload}.${sig}`;
}

export function verifyMemberToken(token: string): MemberSession | null {
  try {
    const [payload, sig] = token.split('.');
    if (!payload || !sig) return null;
    const expected = sign(payload);
    const a = Buffer.from(sig);
    const b = Buffer.from(expected);
    if (a.length !== b.length) return null;
    if (!timingSafeEqual(a, b)) return null;
    const data = JSON.parse(Buffer.from(payload, 'base64url').toString());
    if (data.exp < Date.now()) return null;
    const { exp: _, ...session } = data;
    return session as MemberSession;
  } catch {
    return null;
  }
}

export async function getMemberSession(): Promise<MemberSession | null> {
  try {
    const cookieStore = await cookies();
    const token = cookieStore.get(COOKIE)?.value;
    if (!token) return null;
    return verifyMemberToken(token);
  } catch {
    return null;
  }
}

export function setMemberCookieHeader(token: string): string {
  const maxAge = Math.floor(EXPIRES_IN / 1000);
  const secure = process.env.NODE_ENV === 'production' ? '; Secure' : '';
  return `${COOKIE}=${token}; Path=/; HttpOnly; SameSite=Lax; Max-Age=${maxAge}${secure}`;
}

export function clearMemberCookieHeader(): string {
  return `${COOKIE}=; Path=/; HttpOnly; SameSite=Lax; Max-Age=0`;
}
