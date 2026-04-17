import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { sendSupplierInviteEmail, verifyMailer } from './lib/mailer.js';
import { runSupplierEmailBatch, startSupplierEmailScheduler } from './lib/scheduler.js';

const app = express();
const PORT = Number(process.env.PORT || 4000);

// CORS — honour CORS_ORIGIN (comma-separated) or allow all in development.
const corsOrigins = (process.env.CORS_ORIGIN || '')
  .split(',')
  .map((o) => o.trim())
  .filter(Boolean);

app.use(
  cors({
    origin: corsOrigins.length ? corsOrigins : true,
    methods: ['POST', 'GET', 'OPTIONS'],
  })
);
app.use(express.json({ limit: '32kb' }));

// Optional API-key gate. Active only when API_KEY env is set.
app.use((req, res, next) => {
  const required = process.env.API_KEY;
  if (!required) return next();
  if (req.method === 'OPTIONS' || req.path === '/health') return next();
  const provided = req.header('x-api-key');
  if (provided !== required) {
    return res.status(401).json({ success: false, error: 'Unauthorized' });
  }
  return next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true, service: 'gaiaspeak-server', uptime: process.uptime() });
});

// Single route — send supplier price-submission invite.
// Payload: { id: string, name: string, email: string }
app.post('/send-supplier-email', async (req, res) => {
  const { id, name, email } = req.body || {};

  if (!id || !name || !email) {
    return res.status(400).json({
      success: false,
      error: 'Missing required fields. Expected payload: { id, name, email }.',
    });
  }

  if (!isValidEmail(email)) {
    return res.status(400).json({ success: false, error: 'Invalid email address.' });
  }

  try {
    const result = await sendSupplierInviteEmail({ id, name, email });
    return res.json({
      success: true,
      message: `Invitation email sent to ${email}`,
      ...result,
    });
  } catch (error) {
    console.error('[send-supplier-email] failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to send email',
    });
  }
});

// Manual trigger for the periodic supplier-email batch. Useful for testing
// without waiting for the next cron tick.
app.get('/now', async (_req, res) => {
  try {
    const result = await runSupplierEmailBatch({ trigger: 'manual' });
    return res.json(result);
  } catch (error) {
    console.error('[send-supplier-emails/run-now] failed:', error);
    return res.status(500).json({
      success: false,
      error: error.message || 'Failed to run batch',
    });
  }
});

app.use((_req, res) => {
  res.status(404).json({ success: false, error: 'Route not found' });
});

function isValidEmail(email) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(String(email));
}

app.listen(PORT, async () => {
  console.log(`[gaiaspeak-server] listening on http://localhost:${PORT}`);
  try {
    await verifyMailer();
    console.log('[gaiaspeak-server] SMTP transport verified');
  } catch (err) {
    console.warn('[gaiaspeak-server] SMTP not ready:', err.message);
  }
  try {
    startSupplierEmailScheduler();
  } catch (err) {
    console.warn('[gaiaspeak-server] scheduler not started:', err.message);
  }
});

