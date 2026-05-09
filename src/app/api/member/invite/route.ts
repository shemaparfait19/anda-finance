import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/auth';
import { createInviteToken, ensureMemberPortalTables } from '@/lib/member-data';
import { neon } from '@neondatabase/serverless';
import nodemailer from 'nodemailer';

const sql = neon(process.env.DATABASE_URL!);
const APP_URL = (
  process.env.NEXTAUTH_URL ??
  (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : 'http://localhost:3000')
).replace(/\/$/, '');

export async function POST(req: NextRequest) {
  try {
    const session = await auth();
    if (!session?.user) return NextResponse.json({ error: 'Not authenticated.' }, { status: 401 });

    const groupId = (session.user as any).groupId as string | null;
    if (!groupId) return NextResponse.json({ error: 'No group context.' }, { status: 403 });

    const { memberId } = await req.json();
    if (!memberId) return NextResponse.json({ error: 'memberId required.' }, { status: 400 });

    await ensureMemberPortalTables();

    // Verify member belongs to this group
    const rows = await sql`SELECT id, name, email FROM members WHERE id = ${memberId} AND group_id = ${groupId} LIMIT 1`;
    if (!rows[0]) return NextResponse.json({ error: 'Member not found in your group.' }, { status: 404 });

    const member = rows[0];
    if (!member.email) return NextResponse.json({ error: 'Member has no email address.' }, { status: 400 });

    const token = await createInviteToken(memberId, groupId);
    const inviteUrl = `${APP_URL}/member/setup?t=${token}`;
    const loginUrl = `${APP_URL}/member/login?g=${encodeURIComponent(groupId)}&email=${encodeURIComponent(member.email)}`;

    const gmailUser = process.env.GMAIL_USER;
    const gmailPass = process.env.GMAIL_APP_PASSWORD;

    if (gmailUser && gmailPass) {
      const transport = nodemailer.createTransport({ service: 'gmail', auth: { user: gmailUser, pass: gmailPass } });
      await transport.sendMail({
        from: `ANDA Finance <${gmailUser}>`,
        to: member.email,
        subject: 'Access your ANDA Finance account',
        html: `
<!DOCTYPE html><html lang="en"><head><meta charset="UTF-8"/><meta name="viewport" content="width=device-width,initial-scale=1"/></head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,sans-serif;">
<table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:40px 16px;">
  <tr><td align="center">
    <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#fff;border:1px solid #e4e7ec;">
      <tr><td style="background:#0d1526;padding:28px 36px;">
        <p style="margin:0;font-size:17px;font-weight:700;color:#fff;">ANDA Finance</p>
        <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.12em;">Member Portal</p>
      </td></tr>
      <tr><td style="padding:36px 36px 28px;">
        <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">Hello, ${member.name}</p>
        <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">
          You can now view your savings, account statement, and apply for loans through the ANDA Finance member portal.
          Tap the button below to set your 6-digit PIN and get started.
        </p>
        <p style="margin:0 0 16px;font-size:12px;color:#94a3b8;">This link expires in 72 hours.</p>
        <table cellpadding="0" cellspacing="0"><tr>
          <td style="background:#0d1526;">
            <a href="${inviteUrl}" style="display:inline-block;padding:12px 28px;font-size:13px;font-weight:600;color:#fff;text-decoration:none;">
              Set up my PIN &rarr;
            </a>
          </td>
        </tr></table>
        <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
          Invite link (expires 72h): <a href="${inviteUrl}" style="color:#0d1526;word-break:break-all;">${inviteUrl}</a>
        </p>
        <p style="margin:8px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
          After setup, sign in at: <a href="${loginUrl}" style="color:#0d1526;word-break:break-all;">${loginUrl}</a>
        </p>
      </td></tr>
      <tr><td style="padding:16px 36px;border-top:1px solid #e4e7ec;">
        <p style="margin:0;font-size:11px;color:#94a3b8;">ANDA Finance &middot; Rwanda &middot; ${new Date().getFullYear()}</p>
      </td></tr>
    </table>
  </td></tr>
</table>
</body></html>`,
      });
    }

    return NextResponse.json({ success: true, inviteUrl, emailSent: !!(gmailUser && gmailPass) });
  } catch (e: any) {
    console.error('[member/invite]', e);
    return NextResponse.json({ error: e.message || 'Server error.' }, { status: 500 });
  }
}
