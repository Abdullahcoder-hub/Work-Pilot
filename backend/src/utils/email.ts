import { env } from '../config/env';
import { logger } from './logger';

interface SendEmailInput {
  to: string;
  subject: string;
  html: string;
}

/**
 * Sends transactional email via the Brevo API (https://brevo.com).
 * If BREVO_API_KEY isn't configured (e.g. local development), the email
 * is logged to the console instead of failing the request — auth flows
 * (register/invite/forgot-password) should never break just because email
 * isn't wired up yet.
 */
export async function sendEmail({ to, subject, html }: SendEmailInput): Promise<void> {
  if (!env.brevoApiKey) {
    logger.warn(`[email:console-fallback] BREVO_API_KEY not set. Would have sent to ${to}: "${subject}"`);
    // eslint-disable-next-line no-console
    console.log(`\n--- EMAIL (dev fallback) ---\nTo: ${to}\nSubject: ${subject}\n${html}\n----------------------------\n`);
    return;
  }

  try {
    const response = await fetch("https://api.brevo.com/v3/smtp/email", {
  method: "POST",
  headers: {
    "accept": "application/json",
    "api-key": env.brevoApiKey!,
    "content-type": "application/json",
  },
  body: JSON.stringify({
    sender: {
      name: env.emailFromName,
      email: env.emailFrom,
    },
    to: [
      {
        email: to,
      },
    ],
    subject,
    htmlContent: html,
  }),
});

    if (!response.ok) {
      const body = await response.text();
      logger.error(`Failed to send email to ${to}: ${response.status} ${body}`);
    }
  } catch (err) {
    // Email delivery failures should never crash the calling request (e.g.
    // registration or invite) — just log it so it can be investigated.
    logger.error(`Error sending email to ${to}: ${(err as Error).message}`);
  }
}

function wrapper(title: string, bodyHtml: string, ctaLabel: string, ctaUrl: string): string {
  return `
  <div style="font-family: -apple-system, Segoe UI, Roboto, Arial, sans-serif; max-width: 480px; margin: 0 auto; padding: 32px 24px; color: #1e293b;">
    <div style="width: 40px; height: 40px; border-radius: 10px; background: #6366f1; color: #fff; display: flex; align-items: center; justify-content: center; font-weight: 700; margin-bottom: 20px;">W</div>
    <h1 style="font-size: 18px; margin: 0 0 12px;">${title}</h1>
    <div style="font-size: 14px; line-height: 1.6; color: #475569;">${bodyHtml}</div>
    <a href="${ctaUrl}" style="display: inline-block; margin-top: 20px; background: #6366f1; color: #fff; text-decoration: none; padding: 10px 20px; border-radius: 8px; font-size: 14px; font-weight: 600;">${ctaLabel}</a>
    <p style="margin-top: 20px; font-size: 12px; color: #94a3b8; word-break: break-all;">Or copy this link: ${ctaUrl}</p>
  </div>`;
}

export async function sendVerificationEmail(to: string, name: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Verify your WorkPilot email address',
    html: wrapper(
      `Hi ${name}, please verify your email`,
      `Thanks for creating a WorkPilot workspace. Click the button below to verify <strong>${to}</strong> and activate your account.`,
      'Verify email',
      link
    ),
  });
}

export async function sendInviteEmail(to: string, name: string, companyName: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: `You've been added to ${companyName} on WorkPilot`,
    html: wrapper(
      `Hi ${name}, you've been invited`,
      `You've been added to <strong>${companyName}</strong>'s workspace on WorkPilot. Click below to verify your email and set your own password.`,
      'Set my password',
      link
    ),
  });
}

export async function sendPasswordResetEmail(to: string, name: string, link: string): Promise<void> {
  await sendEmail({
    to,
    subject: 'Reset your WorkPilot password',
    html: wrapper(
      `Hi ${name}, reset your password`,
      `We received a request to reset your WorkPilot password. This link expires in 1 hour. If you didn't request this, you can safely ignore this email.`,
      'Reset password',
      link
    ),
  });
}
