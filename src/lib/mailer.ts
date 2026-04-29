import nodemailer from 'nodemailer';

const APP_URL = (process.env.NEXTAUTH_URL ?? process.env.AUTH_URL ?? 'http://localhost:3000').replace(/\/$/, '');

function createTransport() {
  const user = process.env.GMAIL_USER;
  const pass = process.env.GMAIL_APP_PASSWORD;
  if (!user || !pass) return null;

  return nodemailer.createTransport({
    service: 'gmail',
    auth: { user, pass },
  });
}

export async function sendWelcomeEmail(name: string, email: string) {
  const transport = createTransport();
  if (!transport) {
    console.warn('[mailer] GMAIL_USER / GMAIL_APP_PASSWORD not set — skipping welcome email for', email);
    return;
  }

  const loginUrl = `${APP_URL}/login?email=${encodeURIComponent(email)}`;
  const senderName = `ANDA Finance CBS <${process.env.GMAIL_USER}>`;

  await transport.sendMail({
    from: senderName,
    to: email,
    subject: 'Your ANDA Finance CBS account is ready',
    html: `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>Welcome to ANDA Finance CBS</title>
</head>
<body style="margin:0;padding:0;background:#f5f6f8;font-family:Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f5f6f8;padding:40px 16px;">
    <tr>
      <td align="center">
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width:520px;background:#ffffff;border:1px solid #e4e7ec;">

          <!-- Header -->
          <tr>
            <td style="background:#1e3a6e;padding:28px 36px;">
              <p style="margin:0;font-size:17px;font-weight:700;color:#ffffff;letter-spacing:-0.2px;">
                ANDA Finance CBS
              </p>
              <p style="margin:4px 0 0;font-size:11px;color:rgba(255,255,255,0.45);text-transform:uppercase;letter-spacing:0.12em;">
                Core Banking System
              </p>
            </td>
          </tr>

          <!-- Body -->
          <tr>
            <td style="padding:36px 36px 28px;">
              <p style="margin:0 0 6px;font-size:20px;font-weight:700;color:#0f172a;">
                Welcome, ${name}
              </p>
              <p style="margin:0 0 24px;font-size:13px;color:#64748b;line-height:1.6;">
                An administrator has created your account on <strong>ANDA Finance CBS</strong>.
                Before you can sign in you need to set a password and a 5-digit security PIN.
              </p>
              <p style="margin:0 0 20px;font-size:13px;color:#374151;line-height:1.6;">
                Click the button below — your email address will be filled in automatically.
              </p>

              <!-- CTA button -->
              <table cellpadding="0" cellspacing="0">
                <tr>
                  <td style="background:#1e3a6e;">
                    <a href="${loginUrl}"
                       style="display:inline-block;padding:12px 28px;font-size:13px;font-weight:600;color:#ffffff;text-decoration:none;">
                      Set up my account &rarr;
                    </a>
                  </td>
                </tr>
              </table>

              <p style="margin:24px 0 0;font-size:11px;color:#94a3b8;line-height:1.6;">
                If the button doesn't work, copy this link into your browser:<br/>
                <a href="${loginUrl}" style="color:#1e3a6e;word-break:break-all;">${loginUrl}</a>
              </p>
            </td>
          </tr>

          <!-- Footer -->
          <tr>
            <td style="padding:16px 36px;border-top:1px solid #e4e7ec;">
              <p style="margin:0;font-size:11px;color:#94a3b8;">
                ANDA Finance CBS &middot; Rwanda &middot; ${new Date().getFullYear()}<br/>
                If you did not expect this email, you can ignore it.
              </p>
            </td>
          </tr>

        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  });
}
