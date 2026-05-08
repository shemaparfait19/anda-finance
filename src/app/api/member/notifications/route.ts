import { NextRequest, NextResponse } from 'next/server';
import { getMemberSession } from '@/lib/member-auth';
import {
  getMemberNotifications,
  getUnreadNotificationCount,
  markNotificationsRead,
  clearMemberNotifications,
} from '@/lib/member-data';

// GET — fetch notifications + unread count
export async function GET() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const [notifications, unread] = await Promise.all([
    getMemberNotifications(session.memberId),
    getUnreadNotificationCount(session.memberId),
  ]);

  return NextResponse.json({ notifications, unread });
}

// PATCH — mark read (body: { ids?: number[] } — omit ids to mark all)
export async function PATCH(req: NextRequest) {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  const body = await req.json().catch(() => ({}));
  await markNotificationsRead(session.memberId, body.ids);
  return NextResponse.json({ success: true });
}

// DELETE — clear all notifications
export async function DELETE() {
  const session = await getMemberSession();
  if (!session) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

  await clearMemberNotifications(session.memberId);
  return NextResponse.json({ success: true });
}
