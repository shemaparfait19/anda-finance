import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword, createPreAuthToken } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const normalised = String(email).toLowerCase().trim();
    const user = await getUserByEmail(normalised);
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    // Issue a short-lived token (5 min) — passed to signIn instead of the raw password
    const token = await createPreAuthToken(normalised);
    return NextResponse.json({ success: true, token });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error — please try again.' }, { status: 500 });
  }
}
