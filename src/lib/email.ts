'use server';

import { Resend } from 'resend';

const resend = process.env.RESEND_API_KEY && !process.env.RESEND_API_KEY.startsWith('re_placeholder')
  ? new Resend(process.env.RESEND_API_KEY)
  : null;

const FROM_ADDRESS = process.env.EMAIL_FROM ?? 'ANDA Finance <onboarding@resend.dev>';

function buildOTPEmail(name: string, otp: string): string {
  return `<!DOCTYPE html>
<html>
<head><meta charset="UTF-8"><title>Your ANDA Finance Sign-In Code</title></head>
<body style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f1f5f9;padding:40px 20px;">
    <tr><td align="center">
      <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 4px 24px rgba(0,0,0,0.08);">
        <tr>
          <td style="background:linear-gradient(135deg,#1e2d5a 0%,#2d3f8a 100%);padding:32px;text-align:center;">
            <div style="display:inline-block;background:rgba(255,255,255,0.12);border-radius:10px;padding:10px 24px;">
              <span style="color:white;font-size:22px;font-weight:bold;letter-spacing:1px;">ANDA Finance</span>
            </div>
            <p style="color:rgba(255,255,255,0.65);margin:14px 0 0;font-size:14px;">Admin Portal — Sign-In Code</p>
          </td>
        </tr>
        <tr>
          <td style="padding:40px 48px;">
            <h2 style="color:#1e2d5a;margin:0 0 10px;font-size:20px;">Hello, ${name}</h2>
            <p style="color:#64748b;margin:0 0 30px;line-height:1.65;">Use the code below to sign in to your ANDA Finance admin account. It is valid for <strong>5 minutes</strong>.</p>
            <div style="text-align:center;margin:0 0 30px;">
              <div style="display:inline-block;background:#eff4ff;border:2px solid #2d3f8a;border-radius:14px;padding:22px 44px;">
                <span style="font-size:40px;font-weight:900;letter-spacing:14px;color:#1e2d5a;font-family:'Courier New',monospace;">${otp}</span>
              </div>
            </div>
            <p style="color:#94a3b8;font-size:13px;margin:0;line-height:1.6;">If you did not request this code, please ignore this email. ANDA Finance will never ask you to share your sign-in code.</p>
          </td>
        </tr>
        <tr>
          <td style="background:#f8fafc;padding:18px 48px;border-top:1px solid #e2e8f0;">
            <p style="color:#94a3b8;font-size:12px;margin:0;text-align:center;">© ${new Date().getFullYear()} ANDA Finance · Rwanda Microfinance Platform</p>
          </td>
        </tr>
      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

export async function sendOTPEmail(
  to: string,
  name: string,
  otp: string,
): Promise<{ devOtp?: string }> {
  if (!resend) {
    if (process.env.NODE_ENV === 'production') {
      throw new Error('Email service is not configured. Set RESEND_API_KEY in your environment variables.');
    }
    // Dev fallback: log OTP so developer can log in without real email
    console.log(`\n📧 OTP (dev) → ${to}  CODE: ${otp}\n`);
    return { devOtp: otp };
  }

  await resend.emails.send({
    from: FROM_ADDRESS,
    to,
    subject: `${otp} — Your ANDA Finance Sign-In Code`,
    html: buildOTPEmail(name, otp),
  });

  return {};
}
