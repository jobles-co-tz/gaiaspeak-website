import cron from 'node-cron';
import { getSupabaseAdmin } from './supabase.js';
import { sendSupplierInviteEmail } from './mailer.js';

const DEFAULT_CRON = '0 */4 * * *'; // every 4 hours, on the hour

// Loops every supplier in the directory and sends them the price-submission invite.
// Results are written to the audit_logs table (best-effort — a missing table is logged but not fatal).
export async function runSupplierEmailBatch({ trigger = 'scheduler' } = {}) {
  const startedAt = new Date();
  const admin = getSupabaseAdmin();

  const { data: suppliers, error: fetchError } = await admin
    .from('suppliers')
    .select('id, name, contact_email, active, verified')
    .order('created_at', { ascending: false });

  if (fetchError) {
    console.error(`[scheduler] failed to fetch suppliers:`, fetchError.message);
    return { success: false, error: fetchError.message, trigger };
  }

  const eligible = (suppliers || []).filter(
    (s) => s && s.contact_email && s.active !== false
  );

  if (eligible.length === 0) {
    console.log(`[scheduler] no eligible suppliers to email (trigger=${trigger})`);
    return { success: true, trigger, total: 0, sent: 0, failed: 0, results: [] };
  }

  console.log(`[scheduler] sending supplier invites to ${eligible.length} recipients (trigger=${trigger})`);

  const results = await Promise.allSettled(
    eligible.map(async (supplier) => {
      const entry = {
        supplier_id: supplier.id,
        status: false,
        message: '',
      };
      try {
        const info = await sendSupplierInviteEmail({
          id: supplier.id,
          name: supplier.name,
          email: supplier.contact_email,
        });
        entry.status = true;
        entry.message = `Sent · messageId=${info.messageId}`;
      } catch (err) {
        entry.status = false;
        entry.message = err?.message || 'Failed to send email';
      }

      try {
        const { error: logError } = await admin.from('audit_logs').insert(entry);
        if (logError) {
          console.warn(`[scheduler] could not write to audit_logs:`, logError.message);
        }
      } catch (logErr) {
        console.warn(`[scheduler] audit insert threw:`, logErr?.message || logErr);
      }
      return entry;
    })
  );

  const flattened = results.map((r) =>
    r.status === 'fulfilled' ? r.value : { status: false, message: r.reason?.message || 'rejected' }
  );
  const sent = flattened.filter((r) => r.status === true).length;
  const failed = flattened.length - sent;
  const durationMs = Date.now() - startedAt.getTime();

  console.log(
    `[scheduler] batch done · sent=${sent} · failed=${failed} · duration=${durationMs}ms · trigger=${trigger}`
  );

  return { success: true, trigger, total: flattened.length, sent, failed, results: flattened };
}

let scheduledTask = null;

// Schedules runSupplierEmailBatch on a cron timer. Returns the task handle (or null if disabled).
export function startSupplierEmailScheduler() {
  if (scheduledTask) return scheduledTask;

  const enabled = String(process.env.SCHEDULE_ENABLED ?? 'true').toLowerCase() === 'true';
  if (!enabled) {
    console.log('[scheduler] disabled (SCHEDULE_ENABLED=false)');
    return null;
  }

  const expression = process.env.SCHEDULE_CRON || DEFAULT_CRON;
  if (!cron.validate(expression)) {
    console.error(`[scheduler] invalid SCHEDULE_CRON expression: "${expression}"`);
    return null;
  }

  const timezone = process.env.SCHEDULE_TZ || undefined;
  scheduledTask = cron.schedule(
    expression,
    async () => {
      try {
        await runSupplierEmailBatch({ trigger: 'cron' });
      } catch (err) {
        console.error('[scheduler] cron run threw:', err?.message || err);
      }
    },
    timezone ? { timezone } : undefined
  );

  console.log(
    `[scheduler] started · expression="${expression}"${timezone ? ` · tz=${timezone}` : ''}`
  );

  if (String(process.env.SCHEDULE_RUN_ON_START || 'false').toLowerCase() === 'true') {
    runSupplierEmailBatch({ trigger: 'startup' }).catch((err) =>
      console.error('[scheduler] startup run threw:', err?.message || err)
    );
  }

  return scheduledTask;
}

export function stopSupplierEmailScheduler() {
  if (scheduledTask) {
    scheduledTask.stop();
    scheduledTask = null;
  }
}

