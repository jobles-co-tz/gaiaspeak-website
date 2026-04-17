// server/routes/notifySuppliers.js
// POST /api/notify-supplier-prices — email all active suppliers a link to update prices.
// Also exported as notifySuppliers() for the cron scheduler to call directly.

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const notifyRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

const RESEND_API_KEY = process.env.RESEND_API_KEY || '';
const SITE_URL = process.env.SITE_URL || 'https://gaiaspeak.io';

async function sendEmail(to, supplierName, submitUrl) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${RESEND_API_KEY}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: 'GaiaSpeak Protocol <noreply@gaiaspeak.io>',
      to: [to],
      subject: 'GaiaSpeak — Please update your gold & silver prices',
      html: `
        <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
          <h2 style="color: #f59e0b;">GaiaSpeak Price Update Request</h2>
          <p>Hello <strong>${supplierName}</strong>,</p>
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
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Resend API error (${res.status}): ${err}`);
  }
  return res.json();
}

// Core logic — used by both the route handler and the cron scheduler.
export async function notifySuppliers() {
  if (!RESEND_API_KEY) throw new Error('RESEND_API_KEY not configured');

  const { data: suppliers, error } = await supabase
    .from('gold_suppliers')
    .select('id, name, contact_email')
    .eq('active', true)
    .not('contact_email', 'is', null);

  if (error) throw error;
  if (!suppliers || suppliers.length === 0) {
    return { success: true, message: 'No active suppliers with email found', sent: 0, total: 0, results: [] };
  }

  const results = [];

  for (const s of suppliers) {
    if (!s.contact_email) continue;
    const submitUrl = `${SITE_URL}/supplier/submit/${s.id}`;
    let status = 'sent';
    let errorMessage = null;

    try {
      await sendEmail(s.contact_email, s.name, submitUrl);
      results.push({ id: s.id, name: s.name, email: s.contact_email, status: 'sent' });
      console.log(`[notify] Sent to ${s.name} (${s.contact_email})`);
    } catch (err) {
      status = 'failed';
      errorMessage = err.message || 'Unknown error';
      results.push({ id: s.id, name: s.name, email: s.contact_email, status: `failed: ${errorMessage}` });
      console.error(`[notify] Failed for ${s.name}:`, errorMessage);
    }

    // Log to supplier_notifications
    const { error: logErr } = await supabase
      .from('supplier_notifications')
      .insert({
        supplier_id: s.id,
        email: s.contact_email,
        status,
        error_message: errorMessage,
      });
    if (logErr) {
      console.error(`[notify] Failed to log notification for ${s.name}:`, logErr.message);
    }
  }

  return {
    success: true,
    sent: results.filter((r) => r.status === 'sent').length,
    total: results.length,
    results,
  };
}

// HTTP route
notifyRouter.post('/notify-supplier-prices', async (_req, res) => {
  try {
    const result = await notifySuppliers();
    return res.json(result);
  } catch (err) {
    console.error('[notify] Unhandled:', err);
    return res.status(500).json({ error: err.message || 'Internal error' });
  }
});
