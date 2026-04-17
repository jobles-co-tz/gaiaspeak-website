// oracle/scheduler.js
// Every 4 hours: calls the notify-supplier-prices edge function to email
// all active suppliers a link to update their prices, then pushes the
// latest prices on-chain.
//
// Manual trigger: node oracle/scheduler.js --run-now

import cron from 'node-cron';
import { pushPrices } from './pushPrices.js';

const SCHEDULE = '0 */4 * * *'; // every 4 hours on the hour

async function notifySuppliers() {
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const serviceKey  = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!supabaseUrl || !serviceKey) throw new Error('Missing VITE_SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');

  const res = await fetch(`${supabaseUrl}/functions/v1/notify-supplier-prices`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${serviceKey}`,
    },
  });

  const body = await res.json();
  if (!res.ok) throw new Error(body.error || `Notify failed (${res.status})`);
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
