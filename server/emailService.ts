// Lightweight transactional email service — no extra npm dependencies.
// Uses fetch() (built into Node 18+) to call a REST-based email provider.
//
// Supported providers (auto-detected from env vars, checked in this order):
//   1. Resend      — RESEND_API_KEY
//   2. SendGrid    — SENDGRID_API_KEY
//   3. Postmark    — POSTMARK_SERVER_TOKEN
//
// If no provider is configured, emails are logged to the console so the app
// keeps working in dev/test environments without crashing.

const FROM_EMAIL = process.env.EMAIL_FROM || "W.A.R. Coaching <noreply@warcoaching.app>";
const APP_URL = process.env.APP_URL || process.env.PUBLIC_URL || "http://localhost:3000";

export type SendEmailInput = {
  to: string;
  subject: string;
  html: string;
  text?: string;
};

async function sendViaResend(input: SendEmailInput, apiKey: string) {
  const resp = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: FROM_EMAIL,
      to: [input.to],
      subject: input.subject,
      html: input.html,
      text: input.text,
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Resend send failed (${resp.status}): ${body}`);
  }
  return true;
}

async function sendViaSendGrid(input: SendEmailInput, apiKey: string) {
  const resp = await fetch("https://api.sendgrid.com/v3/mail/send", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${apiKey}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      personalizations: [{ to: [{ email: input.to }] }],
      from: { email: FROM_EMAIL.replace(/.*<(.+)>.*/, "$1") || FROM_EMAIL },
      subject: input.subject,
      content: [
        { type: "text/plain", value: input.text || input.html.replace(/<[^>]+>/g, " ") },
        { type: "text/html", value: input.html },
      ],
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`SendGrid send failed (${resp.status}): ${body}`);
  }
  return true;
}

async function sendViaPostmark(input: SendEmailInput, token: string) {
  const resp = await fetch("https://api.postmarkapp.com/email", {
    method: "POST",
    headers: {
      "X-Postmark-Server-Token": token,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
    body: JSON.stringify({
      From: FROM_EMAIL,
      To: input.to,
      Subject: input.subject,
      HtmlBody: input.html,
      TextBody: input.text || input.html.replace(/<[^>]+>/g, " "),
      MessageStream: "outbound",
    }),
  });
  if (!resp.ok) {
    const body = await resp.text().catch(() => "");
    throw new Error(`Postmark send failed (${resp.status}): ${body}`);
  }
  return true;
}

/**
 * Sends a transactional email via whichever provider is configured.
 * Never throws — failures are logged and swallowed so a flaky email
 * provider can never break a user-facing flow (signup, password reset, etc).
 * Returns true if an email was actually dispatched, false if it was only logged.
 */
export async function sendEmail(input: SendEmailInput): Promise<boolean> {
  try {
    if (process.env.RESEND_API_KEY) {
      await sendViaResend(input, process.env.RESEND_API_KEY);
      return true;
    }
    if (process.env.SENDGRID_API_KEY) {
      await sendViaSendGrid(input, process.env.SENDGRID_API_KEY);
      return true;
    }
    if (process.env.POSTMARK_SERVER_TOKEN) {
      await sendViaPostmark(input, process.env.POSTMARK_SERVER_TOKEN);
      return true;
    }
    // Dev fallback — no provider configured
    console.log(`[EmailService] (no provider configured — logging only)\nTo: ${input.to}\nSubject: ${input.subject}\n${input.text || input.html.replace(/<[^>]+>/g, " ")}`);
    return false;
  } catch (err) {
    console.error("[EmailService] Failed to send email:", err);
    return false;
  }
}

function emailShell(title: string, bodyHtml: string, ctaLabel?: string, ctaUrl?: string) {
  return `<!DOCTYPE html><html><body style="margin:0;padding:0;background:#0a0a0a;font-family:Arial,Helvetica,sans-serif;">
  <div style="max-width:560px;margin:0 auto;padding:32px 24px;">
    <div style="text-align:center;margin-bottom:24px;">
      <span style="font-size:28px;font-weight:bold;letter-spacing:2px;color:#d4af37;">W.A.R. COACHING</span>
    </div>
    <div style="background:#171717;border:1px solid #d4af37;border-radius:8px;padding:28px;color:#e5e5e5;">
      <h1 style="font-size:20px;color:#d4af37;margin:0 0 16px;letter-spacing:1px;">${title}</h1>
      <div style="font-size:15px;line-height:1.6;color:#cfcfcf;">${bodyHtml}</div>
      ${ctaLabel && ctaUrl ? `<div style="text-align:center;margin-top:28px;">
        <a href="${ctaUrl}" style="display:inline-block;background:#d4af37;color:#000;font-weight:bold;text-decoration:none;padding:12px 28px;border-radius:6px;letter-spacing:1px;text-transform:uppercase;font-size:13px;">${ctaLabel}</a>
      </div>` : ""}
    </div>
    <p style="text-align:center;color:#666;font-size:12px;margin-top:24px;">W.A.R. Coaching OS — Justin Watson</p>
  </div>
  </body></html>`;
}

export async function sendPasswordResetEmail(to: string, name: string, token: string) {
  const resetUrl = `${APP_URL}/reset-password?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Reset your W.A.R. Coaching password",
    html: emailShell(
      "PASSWORD RESET REQUESTED",
      `<p>Hi ${name || "there"},</p>
       <p>We received a request to reset your W.A.R. Coaching password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.</p>`,
      "Reset Password",
      resetUrl
    ),
    text: `Reset your password: ${resetUrl} (expires in 1 hour)`,
  });
}

export async function sendVerificationEmail(to: string, name: string, token: string) {
  const verifyUrl = `${APP_URL}/verify-email?token=${encodeURIComponent(token)}`;
  return sendEmail({
    to,
    subject: "Verify your W.A.R. Coaching account",
    html: emailShell(
      "VERIFY YOUR EMAIL",
      `<p>Hi ${name || "there"},</p>
       <p>Welcome to W.A.R. Coaching! Please confirm your email address to finish setting up your account.</p>`,
      "Verify Email",
      verifyUrl
    ),
    text: `Verify your email: ${verifyUrl}`,
  });
}

export async function sendNewMessageEmail(to: string, name: string, fromName: string, preview: string) {
  return sendEmail({
    to,
    subject: `New message from ${fromName} — W.A.R. Coaching`,
    html: emailShell(
      "NEW MESSAGE",
      `<p>Hi ${name || "there"},</p>
       <p><strong>${fromName}</strong> sent you a message:</p>
       <p style="background:#0a0a0a;border-left:3px solid #d4af37;padding:10px 14px;border-radius:4px;color:#aaa;">${preview}</p>`,
      "Open Messages",
      `${APP_URL}/messaging`
    ),
    text: `${fromName} sent you a message: ${preview}`,
  });
}
