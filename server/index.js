// server/index.js
// Node.js Express backend for GaiaSpeak Protocol
// Replaces all Supabase Deno Edge Functions with a single Node.js server.

import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cron from 'node-cron';

import { submitPricesRouter } from './routes/submitPrices.js';
import { notifyRouter } from './routes/notifySuppliers.js';
import { orderNotificationRouter } from './routes/orderNotification.js';
import { processBatchRouter } from './routes/processBatch.js';
import { pushPricesRouter, pushPrices } from './routes/pushPrices.js';
import { notifySuppliers } from './routes/notifySuppliers.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors());
app.use(express.json());

// ── Routes ────────────────────────────────────────────────────────────
app.use('/api', submitPricesRouter);
app.use('/api', notifyRouter);
app.use('/api', orderNotificationRouter);
app.use('/api', processBatchRouter);
app.use('/api', pushPricesRouter);

// Health check
app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', time: new Date().toISOString() });
});

// ── 4-hour cron: email suppliers + push prices on-chain ───────────────
const SCHEDULE = process.env.CRON_SCHEDULE || '0 */4 * * *';

cron.schedule(SCHEDULE, async () => {
  const now = new Date().toISOString();
  console.log(`[cron] ${now} — Running scheduled tasks…`);

  try {
    const notifyResult = await notifySuppliers();
    console.log(`[cron] Emails sent: ${notifyResult.sent}/${notifyResult.total}`);
  } catch (err) {
    console.error('[cron] Email notify failed:', err.message);
  }

  try {
    const priceResult = await pushPrices();
    console.log('[cron] On-chain push succeeded:', priceResult);
  } catch (err) {
    console.error('[cron] On-chain push failed:', err.message);
  }
});

// ── Start ─────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`[server] GaiaSpeak API running on http://localhost:${PORT}`);
  console.log(`[server] Cron schedule: "${SCHEDULE}"`);
});
