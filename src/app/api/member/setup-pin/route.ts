import { NextRequest, NextResponse } from 'next/server';
import {
  consumeInviteToken,
  setMemberPin,
  getMemberById,
  ensureMemberPortalTables,
} from '@/lib/member-data';
import { createMemberToken, setMemberCookieHeader } from '@/lib/member-auth';

export async function POST(req: NextRequest) {
  try {
    const { token, pin } = await req.json();
    if (!token || !pin || pin.length !== 6 || !/^\d+$/.test(pin)) {
      return NextResponse.json({ error: 'A valid 6-digit PIN and invite token are required.' }, { status: 400 });
    }

    const WEAK_PINS = new Set([
      '000000','111111','222222','333333','444444','555555','666666','777777','888888','999999',
      '123456','654321','123123','112233','121212','101010','000001','111000',
    ]);
    if (WEAK_PINS.has(pin)) {
      return NextResponse.json({ error: 'This PIN is too easy to guess. Please choose a less obvious combination.' }, { status: 400 });
    }

    await ensureMemberPortalTables();

    const invite = await consumeInviteToken(token);
    if (!invite) {
      return NextResponse.json({ error: 'This invite link is invalid or has expired.' }, { status: 400 });
    }

    const member = await getMemberById(invite.memberId);
    if (!member) {
      return NextResponse.json({ error: 'Member account not found.' }, { status: 404 });
    }

    await setMemberPin(invite.memberId, pin);

    const sessionToken = createMemberToken({
      memberId: member.id,
      memberCode: member.memberCode,
      groupId: invite.groupId,
      name: member.name,
    });

    const res = NextResponse.json({
      success: true,
      name: member.name,
      groupId: invite.groupId,
      email: member.email,
    });
    res.headers.set('Set-Cookie', setMemberCookieHeader(sessionToken));
    return res;
  } catch (e: any) {
    console.error('[member/setup-pin]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
