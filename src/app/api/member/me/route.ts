import { NextRequest, NextResponse } from 'next/server';
import { getMemberSession } from '@/lib/member-auth';
import { getMemberById, getMemberAccounts, getMemberLoans, getMemberTransactions, getGroupName } from '@/lib/member-data';

export async function GET(req: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const [member, accounts, loans, groupName] = await Promise.all([
      getMemberById(session.memberId),
      getMemberAccounts(session.memberId),
      getMemberLoans(session.memberId),
      getGroupName(session.groupId),
    ]);

    if (!member) return NextResponse.json({ error: 'Member not found.' }, { status: 404 });

    const transactions = await getMemberTransactions(session.memberId, undefined, 20);

    return NextResponse.json({
      member: { ...member, groupName },
      accounts,
      loans,
      transactions,
    });
  } catch (e: any) {
    console.error('[member/me]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
