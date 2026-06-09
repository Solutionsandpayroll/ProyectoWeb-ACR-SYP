import nodemailer from 'nodemailer';

/**
 * Nodemailer transporter using configurable SMTP (Outlook by default).
 *
 * Required env vars:
 *   OUTLOOK_SMTP_USER           — SMTP account user/email
 *   OUTLOOK_SMTP_PASS           — SMTP password/credential
 *
 * Optional env vars:
 *   OUTLOOK_SMTP_HOST           — default: smtp.office365.com
 *   OUTLOOK_SMTP_PORT           — default: 587
 *   OUTLOOK_SMTP_SECURE         — default: false (STARTTLS)
 *   OUTLOOK_SMTP_FROM_NAME      — default: Solutions & Payroll
 *   OUTLOOK_SMTP_FROM_ADDRESS   — default: OUTLOOK_SMTP_USER
 *
 * Backward compatibility:
 *   EMAIL_USER / EMAIL_PASS / EMAIL_FROM are still supported as fallback.
 */

const parseBoolean = (value: string | undefined, fallback: boolean) => {
  if (value == null) return fallback;
  const normalized = value.trim().toLowerCase();
  return normalized === '1' || normalized === 'true' || normalized === 'yes';
};

const SMTP_HOST = process.env.OUTLOOK_SMTP_HOST ?? 'smtp.office365.com';
const SMTP_PORT = Number(process.env.OUTLOOK_SMTP_PORT ?? 587);
const SMTP_SECURE = parseBoolean(process.env.OUTLOOK_SMTP_SECURE, false);

const SMTP_USER = process.env.OUTLOOK_SMTP_USER ?? process.env.EMAIL_USER;
const SMTP_PASS = process.env.OUTLOOK_SMTP_PASS ?? process.env.EMAIL_PASS;

const FROM_NAME = process.env.OUTLOOK_SMTP_FROM_NAME ?? 'Solutions & Payroll';
const FROM_ADDRESS = process.env.OUTLOOK_SMTP_FROM_ADDRESS ?? SMTP_USER;

export const transporter = nodemailer.createTransport({
  host: SMTP_HOST,
  port: Number.isFinite(SMTP_PORT) ? SMTP_PORT : 587,
  secure: SMTP_SECURE,
  auth: {
    user: SMTP_USER,
    pass: SMTP_PASS,
  },
});

export const EMAIL_FROM =
  process.env.OUTLOOK_SMTP_FROM ??
  process.env.EMAIL_FROM ??
  `${FROM_NAME} <${FROM_ADDRESS}>`;
