import { NextRequest, NextResponse } from 'next/server';
import { getUserByEmail, generateOTP, storeOTP } from '@/lib/auth-service';
import { sendOTPEmail } from '@/lib/email';
import { initializeDatabase } from '@/lib/database';

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    const email = typeof body?.email === 'string' ? body.email.toLowerCase().trim() : '';

    if (!email || !email.includes('@')) {
      return NextResponse.json({ success: false, message: 'A valid email address is required.' }, { status: 400 });
    }

    await initializeDatabase();

    const user = await getUserByEmail(email);
    if (!user || !user.isActive) {
      return NextResponse.json({
        success: false,
        message: 'This email is not registered in the system. Contact your administrator.',
      }, { status: 404 });
    }

    const otp = generateOTP();
    await storeOTP(email, otp);
    await sendOTPEmail(email, user.name, otp);

    return NextResponse.json({ success: true, message: 'OTP sent to your email.' });
  } catch (err: any) {
    console.error('send-otp error:', err);
    return NextResponse.json({ success: false, message: 'Server error. Please try again.' }, { status: 500 });
  }
}
