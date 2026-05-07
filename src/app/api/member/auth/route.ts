import { NextRequest, NextResponse } from 'next/server';
import {
  getMemberByEmail,
  verifyMemberPin,
  memberHasPin,
  ensureMemberPortalTables,
  getGroupName,
} from '@/lib/member-data';
import { createMemberToken, setMemberCookieHeader } from '@/lib/member-auth';

export async function POST(req: NextRequest) {
  try {
    const { email, pin, groupId } = await req.json();
    if (!email || !pin || !groupId) {
      return NextResponse.json({ error: 'Email, PIN, and group are required.' }, { status: 400 });
    }

    await ensureMemberPortalTables();

    const member = await getMemberByEmail(email, groupId);
    if (!member) {
      return NextResponse.json({ error: 'Member not found.' }, { status: 404 });
    }

    const hasPin = await memberHasPin(member.id);
    if (!hasPin) {
      return NextResponse.json({ error: 'PIN not set. Please use your invite link to set up access.', code: 'NO_PIN' }, { status: 403 });
    }

    const valid = await verifyMemberPin(member.id, pin);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    const token = createMemberToken({
      memberId: member.id,
      memberCode: member.memberCode,
      groupId,
      name: member.name,
    });

    const res = NextResponse.json({ success: true, name: member.name });
    res.headers.set('Set-Cookie', setMemberCookieHeader(token));
    return res;
  } catch (e: any) {
    console.error('[member/auth]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
