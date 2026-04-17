import nodemailer from 'nodemailer';
import { buildSupplierEmail } from './template.js';

let cachedTransporter = null;

function getTransporter() {
  if (cachedTransporter) return cachedTransporter;

  const host = process.env.SMTP_HOST;
  const port = Number(process.env.SMTP_PORT || 465);
  const secure = String(process.env.SMTP_SECURE || 'true').toLowerCase() === 'true';
  const user = process.env.SMTP_USER;
  const pass = process.env.SMTP_PASS;

  if (!host || !user || !pass) {
    throw new Error(
      'SMTP transport is not configured. Set SMTP_HOST, SMTP_USER and SMTP_PASS in the environment.'
    );
  }

  cachedTransporter = nodemailer.createTransport({
    host,
    port,
    secure,
    auth: { user, pass },
  });

  return cachedTransporter;
}

export async function verifyMailer() {
  const transporter = getTransporter();
  await transporter.verify();
}

export async function sendSupplierInviteEmail({ id, name, email }) {
  if (!id || !name || !email) {
    throw new Error('Missing required fields: id, name, email');
  }

  const frontendUrl = (process.env.FRONTEND_URL || 'http://localhost:5173').replace(/\/$/, '');
  const submissionUrl = `${frontendUrl}/suppliers/${encodeURIComponent(id)}/submit-prices`;

  const fromName = process.env.MAIL_FROM_NAME || 'GaiaSpeak';
  const fromEmail = process.env.MAIL_FROM_EMAIL || process.env.SMTP_USER;
  const from = `"${fromName}" <${fromEmail}>`;

  const { subject, text, html } = buildSupplierEmail({
    name,
    submissionUrl,
    brandName: fromName,
  });

  const transporter = getTransporter();
  const info = await transporter.sendMail({
    from,
    to: email,
    subject,
    text,
    html,
  });

  return {
    messageId: info.messageId,
    accepted: info.accepted,
    rejected: info.rejected,
    submissionUrl,
  };
}

