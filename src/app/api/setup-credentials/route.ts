import { NextResponse } from 'next/server';
import { setupCredentials } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { email, password, pin } = await request.json();

    if (!email || !password || !pin) {
      return NextResponse.json({ success: false, message: 'All fields are required.' }, { status: 400 });
    }
    if (String(password).length < 8) {
      return NextResponse.json({ success: false, message: 'Password must be at least 8 characters.' }, { status: 400 });
    }
    if (!/^\d{5}$/.test(String(pin))) {
      return NextResponse.json({ success: false, message: 'PIN must be exactly 5 digits.' }, { status: 400 });
    }

    const ok = await setupCredentials(
      String(email).toLowerCase().trim(),
      String(password),
      String(pin),
    );

    if (!ok) {
      return NextResponse.json({ success: false, message: 'Setup link is invalid or already used.' }, { status: 400 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error — please try again.' }, { status: 500 });
  }
}
