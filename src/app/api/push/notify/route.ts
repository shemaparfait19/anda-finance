import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { sendMemberPushNotification } from '@/lib/push-notifications';

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const { memberId, title, body, url } = await req.json();
    if (!memberId || !title) return NextResponse.json({ error: 'memberId and title required.' }, { status: 400 });

    await sendMemberPushNotification(memberId, title, body ?? '', url);
    return NextResponse.json({ success: true });
  } catch (e: any) {
    console.error('[push/notify]', e);
    return NextResponse.json({ error: 'Server error.' }, { status: 500 });
  }
}
