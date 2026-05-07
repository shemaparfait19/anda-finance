import { NextRequest, NextResponse } from 'next/server';
import { getMemberSession } from '@/lib/member-auth';
import { savePushSubscription } from '@/lib/member-data';

export async function POST(req: NextRequest) {
  try {
    const session = await getMemberSession();
    if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { endpoint, keys } = await req.json();
    if (!endpoint || !keys?.p256dh || !keys?.auth) {
      return NextResponse.json({ error: 'Invalid subscription object.' }, { status: 400 });
    }

    await savePushSubscription(session.memberId, endpoint, keys.p256dh, keys.auth);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[push/subscribe]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
