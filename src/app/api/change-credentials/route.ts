import { NextResponse } from 'next/server';
import { auth } from '@/auth';
import { getUserByEmail, verifyPassword, hashPassword, hashPin } from '@/lib/auth-service';
import { neon } from '@neondatabase/serverless';

const sql = neon(process.env.DATABASE_URL!);

export async function POST(request: Request) {
  try {
    const session = await auth();
    if (!session?.user?.email) {
      return NextResponse.json({ success: false, message: 'Not authenticated.' }, { status: 401 });
    }

    const { currentPassword, newPassword, newPin } = await request.json();

    if (!currentPassword) {
      return NextResponse.json({ success: false, message: 'Current password is required.' }, { status: 400 });
    }
    if (!newPassword && !newPin) {
      return NextResponse.json({ success: false, message: 'Provide a new password or PIN to update.' }, { status: 400 });
    }
    if (newPassword && newPassword.length < 8) {
      return NextResponse.json({ success: false, message: 'New password must be at least 8 characters.' }, { status: 400 });
    }
    if (newPin && !/^\d{5}$/.test(newPin)) {
      return NextResponse.json({ success: false, message: 'PIN must be exactly 5 digits.' }, { status: 400 });
    }

    const user = await getUserByEmail(session.user.email);
    if (!user) {
      return NextResponse.json({ success: false, message: 'User not found.' }, { status: 404 });
    }

    const passwordOk = await verifyPassword(currentPassword, user.passwordHash);
    if (!passwordOk) {
      return NextResponse.json({ success: false, message: 'Current password is incorrect.' }, { status: 401 });
    }

    const newPasswordHash = newPassword ? await hashPassword(newPassword) : null;
    const newPinHash      = newPin      ? await hashPin(newPin)           : null;

    await sql`
      UPDATE users
      SET password_hash = COALESCE(${newPasswordHash}, password_hash),
          pin_hash      = COALESCE(${newPinHash},      pin_hash),
          updated_at    = NOW()
      WHERE id = ${user.id}
    `;

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error — please try again.' }, { status: 500 });
  }
}
