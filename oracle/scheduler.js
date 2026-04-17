// oracle/scheduler.js
// Every 4 hours: fetches active suppliers from Supabase, sends their data
// to the Node email server which emails each one, logs results back to
// Supabase, then pushes the latest prices on-chain.
//
// Manual trigger: node oracle/scheduler.js --run-now

import cron from 'node-cron';
import { createClient } from '@supabase/supabase-js';
import { pushPrices } from './pushPrices.js';

const SCHEDULE = '0 */4 * * *'; // every 4 hours on the hour

function getSupabaseAdmin() {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  return createClient(url, key);
}

async function notifySuppliers() {
  const admin = getSupabaseAdmin();
  const emailServerUrl = process.env.EMAIL_SERVER_URL || 'http://localhost:3001';

  // 1. Fetch active suppliers from Supabase
  const { data: suppliers, error } = await admin
    .from('gold_suppliers')
    .select('id, name, contact_email')
    .eq('active', true)
    .not('contact_email', 'is', null);

  if (error) throw error;
  if (!suppliers || suppliers.length === 0) {
    return { sent: 0, total: 0, message: 'No active suppliers with email found' };
  }

  // 2. Send suppliers to the email server (email-only)
  const res = await fetch(`${emailServerUrl}/api/notify-supplier-prices`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ suppliers }),
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Notify failed (${res.status})`);

  // 3. Log each result back to Supabase
  if (body.results) {
    for (const r of body.results) {
      const { error: logErr } = await admin
        .from('supplier_notifications')
        .insert({
          supplier_id: r.id,
          email: r.email,
          status: r.status === 'sent' ? 'sent' : 'failed',
          error_message: r.error || null,
        });
      if (logErr) {
        console.error(`[scheduler] Failed to log notification for ${r.name}:`, logErr.message);
      }
    }
  }

  return body;
}

async function run() {
  const now = new Date().toISOString();

  // 1. Email suppliers their unique update link
  console.log(`[scheduler] ${now} — Sending price-update emails to suppliers…`);
  try {
    const notify = await notifySuppliers();
    console.log(`[scheduler] Emails sent: ${notify.sent}/${notify.total}`);
  } catch (err) {
    console.error('[scheduler] Email notify failed:', err.message);
  }

  // 2. Push latest on-chain (from most recent submission)
  console.log('[scheduler] Pushing latest prices on-chain…');
  try {
    const result = await pushPrices();
    console.log('[scheduler] On-chain push succeeded:', result);
  } catch (err) {
    console.error('[scheduler] On-chain push failed:', err.message);
  }
}

// ── --run-now flag: execute once and exit ─────────────────────────────
if (process.argv.includes('--run-now')) {
  run().then(() => process.exit(0));
} else {
  // ── Cron loop ────────────────────────────────────────────────────
  console.log(`[scheduler] Starting cron: "${SCHEDULE}" (every 4 h)`);
  cron.schedule(SCHEDULE, run);
}
