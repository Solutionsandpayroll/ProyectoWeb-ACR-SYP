import nodemailer from 'nodemailer';

/**
 * Nodemailer transporter using Gmail SMTP.
 *
 * Required env vars:
 *   EMAIL_USER  — Gmail address (e.g. notificaciones@solutionsandpayroll.com)
 *   EMAIL_PASS  — App Password generated in Google Account → Security → App Passwords
 *   EMAIL_FROM  — Display string, e.g. "Solutions & Payroll <notificaciones@solutionsandpayroll.com>"
 *                 Can also be an alias already added in Gmail → Settings → Accounts → "Send mail as"
 */
export const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false, // STARTTLS
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS, // App Password, NOT the regular Gmail password
  },
});

export const EMAIL_FROM =
  process.env.EMAIL_FROM ?? `Solutions & Payroll <${process.env.EMAIL_USER}>`;
