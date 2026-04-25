import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPin } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { email, pin } = await request.json();
    if (!email || !pin) {
      return NextResponse.json({ success: false, message: 'Incorrect PIN.' }, { status: 401 });
    }
    const user = await getUserByEmail(String(email).toLowerCase().trim());
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Incorrect PIN.' }, { status: 401 });
    }
    const ok = await verifyPin(String(pin), user.pinHash);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Incorrect PIN. Please try again.' }, { status: 401 });
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error — please try again.' }, { status: 500 });
  }
}
