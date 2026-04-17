// server/emailServer.js
// Node.js backend for sending emails via Resend.
// This server handles ONLY email delivery — no database logic.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import config from './config.js';

const app = express();
app.use(cors());
app.use(express.json());

// ── Helpers ─────────────────────────────────────────────────────────
async function sendViaResend({ from, to, subject, html }) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${config.resendApiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ from, to, subject, html }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error (${res.status}): ${err}`);
  }
  return res.json();
}

// ── POST /api/send-order-notification ───────────────────────────────
app.post('/api/send-order-notification', async (req, res) => {
  try {
    if (!config.resendApiKey) {
      return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    }

    const { reservation, adminEmail } = req.body;
    if (!reservation || !adminEmail) {
      return res.status(400).json({ error: 'reservation and adminEmail are required' });
    }

    const emailHtml = `
      <h2>🎉 New WHITE Bracelet Pre-Order!</h2>
      <p>A new reservation has been placed on GaiaSpeak.</p>

      <h3>Order Details</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Order ID</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.id}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Date</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${new Date(reservation.created_at).toLocaleString()}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Quantity</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.quantity}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Size</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.size || 'Not specified'}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Color</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.color || 'Not specified'}</td></tr>
        ${reservation.tx_hash ? `<tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>TX Hash</strong></td><td style="padding: 8px; border: 1px solid #ddd;"><a href="https://amoy.polygonscan.com/tx/${reservation.tx_hash}">${reservation.tx_hash.slice(0, 10)}…</a></td></tr>` : ''}
      </table>

      <h3>Customer Information</h3>
      <table style="border-collapse: collapse; width: 100%; max-width: 600px;">
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Name</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.full_name}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Email</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.email}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Phone</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.phone}</td></tr>
        <tr><td style="padding: 8px; border: 1px solid #ddd;"><strong>Wallet</strong></td><td style="padding: 8px; border: 1px solid #ddd;">${reservation.wallet_address}</td></tr>
      </table>

      <h3>Shipping Address</h3>
      <p>
        ${reservation.street_address}<br>
        ${reservation.city}, ${reservation.postal_code}<br>
        ${reservation.country}
      </p>

      ${reservation.notes ? `<h3>Notes</h3><p>${reservation.notes}</p>` : ''}

      <hr style="margin: 20px 0;">
      <p style="color: #666; font-size: 12px;">
        This is an automated notification from GaiaSpeak Protocol.
      </p>
    `;

    const data = await sendViaResend({
      from: config.fromOrder,
      to: [adminEmail],
      subject: `🎉 New WHITE Bracelet Order - ${reservation.full_name}`,
      html: emailHtml,
    });

    return res.json({ success: true, emailId: data.id });
  } catch (err) {
    console.error('[send-order-notification] Error:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// ── POST /api/notify-supplier-prices ────────────────────────────────
// Expects { suppliers: [{ id, name, contact_email }] } in the request body.
// The caller is responsible for fetching suppliers from Supabase and logging results.
app.post('/api/notify-supplier-prices', async (req, res) => {
  try {
    if (!config.resendApiKey) {
      return res.status(500).json({ error: 'RESEND_API_KEY not configured' });
    }

    const { suppliers } = req.body;
    if (!Array.isArray(suppliers) || suppliers.length === 0) {
      return res.status(400).json({ error: 'suppliers array is required' });
    }

    const results = [];

    for (const s of suppliers) {
      if (!s.contact_email) continue;

      const submitUrl = `${config.siteUrl}/supplier/submit/${s.id}`;

      try {
        await sendViaResend({
          from: config.fromSupplier,
          to: [s.contact_email],
          subject: 'GaiaSpeak — Please update your gold & silver prices',
          html: `
            <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
              <h2 style="color: #f59e0b;">GaiaSpeak Price Update Request</h2>
              <p>Hello <strong>${s.name}</strong>,</p>
              <p>
                It's time to submit your latest gold and silver prices for the
                GaiaSpeak Protocol oracle.
              </p>
              <p style="margin: 24px 0;">
                <a href="${submitUrl}"
                   style="display: inline-block; padding: 12px 24px; background: #f59e0b;
                          color: #0f172a; text-decoration: none; border-radius: 8px;
                          font-weight: 600;">
                  Update Prices
                </a>
              </p>
              <p style="font-size: 13px; color: #94a3b8;">
                This link is unique to your account. If you did not expect this
                email, you can safely ignore it.
              </p>
            </div>
          `,
        });
        results.push({ id: s.id, name: s.name, email: s.contact_email, status: 'sent' });
        console.log(`[notify] Sent to ${s.name} (${s.contact_email})`);
      } catch (err) {
        const errorMessage = err.message || 'Unknown error';
        results.push({ id: s.id, name: s.name, email: s.contact_email, status: 'failed', error: errorMessage });
        console.error(`[notify] Failed for ${s.name}:`, errorMessage);
      }
    }

    return res.json({
      success: true,
      sent: results.filter((r) => r.status === 'sent').length,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error('[notify-supplier-prices] Unhandled:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});

// ── Health check ────────────────────────────────────────────────────
app.get('/api/health', (_req, res) => {
  res.json({ ok: true });
});

// ── Start ───────────────────────────────────────────────────────────
app.listen(config.port, () => {
  console.log(`[email-server] Listening on http://localhost:${config.port}`);
});
