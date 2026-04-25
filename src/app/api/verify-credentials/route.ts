import { NextResponse } from 'next/server';
import { getUserByEmail, verifyPassword } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { email, password } = await request.json();

    if (!email || !password) {
      return NextResponse.json({ success: false, message: 'Email and password are required.' }, { status: 400 });
    }

    const user = await getUserByEmail(String(email).toLowerCase().trim());
    if (!user || !user.isActive) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    const ok = await verifyPassword(String(password), user.passwordHash);
    if (!ok) {
      return NextResponse.json({ success: false, message: 'Invalid email or password.' }, { status: 401 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false, message: 'Server error — please try again.' }, { status: 500 });
  }
}
