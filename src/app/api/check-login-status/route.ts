import { NextResponse } from 'next/server';
import { checkLoginStatus } from '@/lib/auth-service';

export async function POST(request: Request) {
  try {
    const { email } = await request.json();
    if (!email) {
      return NextResponse.json({ status: 'ready' });
    }
    const status = await checkLoginStatus(String(email).toLowerCase().trim());
    return NextResponse.json({ status });
  } catch {
    return NextResponse.json({ status: 'ready' });
  }
}
