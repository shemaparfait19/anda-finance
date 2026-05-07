import { NextRequest, NextResponse } from 'next/server';
import {
  getMemberByEmail,
  getMemberByEmailAny,
  verifyMemberPin,
  memberHasPin,
  ensureMemberPortalTables,
} from '@/lib/member-data';
import { createMemberToken, setMemberCookieHeader } from '@/lib/member-auth';

export async function POST(req: NextRequest) {
  try {
    const { email, pin, groupId } = await req.json();
    if (!email || !pin) {
      return NextResponse.json({ error: 'Email and PIN are required.' }, { status: 400 });
    }

    await ensureMemberPortalTables();

    // Look up member — use groupId if provided, otherwise find by email from any group
    const member = groupId
      ? await getMemberByEmail(email, groupId)
      : await getMemberByEmailAny(email);

    if (!member) {
      // If they have no PIN set yet, guide them to the invite
      const noPin = true;
      return NextResponse.json(
        { error: 'No portal access found for this email. Please use your invite link to set up access.', code: 'NO_MEMBER' },
        { status: 404 }
      );
    }

    const hasPin = await memberHasPin(member.id);
    if (!hasPin) {
      return NextResponse.json(
        { error: 'PIN not set up yet. Please use your invite link to create your PIN.', code: 'NO_PIN' },
        { status: 403 }
      );
    }

    const valid = await verifyMemberPin(member.id, pin);
    if (!valid) {
      return NextResponse.json({ error: 'Incorrect PIN.' }, { status: 401 });
    }

    const token = createMemberToken({
      memberId: member.id,
      memberCode: member.memberCode,
      groupId: member.groupId,
      name: member.name,
    });

    const res = NextResponse.json({
      success: true,
      name: member.name,
      groupId: member.groupId,
      email: member.email,
    });
    res.headers.set('Set-Cookie', setMemberCookieHeader(token));
    return res;
  } catch (e: any) {
    console.error('[member/auth]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
