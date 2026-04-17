// @ts-nocheck
// Supabase Edge Function: notify-supplier-prices
// Called every 4 hours by cron / scheduler.
// Sends an email to each active supplier with a unique link to submit prices.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';
const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY') || '';
// The public site URL where the supplier form lives
const SITE_URL = Deno.env.get('SITE_URL') || 'https://gaiaspeak.io';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

function jsonResponse(body: Record<string, unknown>, status = 200) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { ...corsHeaders, 'Content-Type': 'application/json' },
  });
}

async function sendEmail(to: string, supplierName: string, submitUrl: string) {
  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${RESEND_API_KEY}`,
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

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Missing Supabase runtime configuration' }, 500);
    }
    if (!RESEND_API_KEY) {
      return jsonResponse({ error: 'RESEND_API_KEY not configured' }, 500);
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    // Fetch all active suppliers that have an email
    const { data: suppliers, error } = await admin
      .from('gold_suppliers')
      .select('id, name, contact_email')
      .eq('active', true)
      .not('contact_email', 'is', null);

    if (error) throw error;
    if (!suppliers || suppliers.length === 0) {
      return jsonResponse({ success: true, message: 'No active suppliers with email found', sent: 0 });
    }

    const results: { id: string; name: string; email: string; status: string }[] = [];

    for (const s of suppliers) {
      if (!s.contact_email) continue;
      const submitUrl = `${SITE_URL}/supplier/submit/${s.id}`;
      let status = 'sent';
      let errorMessage: string | null = null;
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

      // Log the notification attempt to supplier_notifications
      const { error: logErr } = await admin
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

    return jsonResponse({
      success: true,
      sent: results.filter((r) => r.status === 'sent').length,
      total: results.length,
      results,
    });
  } catch (err) {
    console.error('[notify] Unhandled:', err);
    return jsonResponse({ error: err.message || 'Internal error' }, 500);
  }
});
