// @ts-nocheck
// Supabase Edge Function: submit-supplier-prices
// POST — validates a supplier price submission and inserts into supplier_prices.

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

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

serve(async (req) => {
  // CORS preflight
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  if (req.method !== 'POST') {
    return jsonResponse({ error: 'Method not allowed' }, 405);
  }

  try {
    // ── Runtime config check ──────────────────────────────────────────
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return jsonResponse({ error: 'Missing Supabase runtime configuration' }, 500);
    }

    // ── Parse & validate body ─────────────────────────────────────────
    const body = await req.json();
    const { supplierId, goldPricePerKg, silverPricePerKg, submittedAt } = body;

    if (!supplierId || typeof supplierId !== 'string') {
      return jsonResponse({ error: 'supplierId is required (string)' }, 400);
    }
    if (typeof goldPricePerKg !== 'number' || goldPricePerKg <= 0) {
      return jsonResponse({ error: 'goldPricePerKg must be a positive number' }, 400);
    }
    if (typeof silverPricePerKg !== 'number' || silverPricePerKg <= 0) {
      return jsonResponse({ error: 'silverPricePerKg must be a positive number' }, 400);
    }
    if (!submittedAt || isNaN(Date.parse(submittedAt))) {
      return jsonResponse({ error: 'submittedAt must be a valid ISO timestamp' }, 400);
    }

    // ── Verify supplier exists in gold_suppliers ──────────────────────
    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: supplier, error: supplierError } = await admin
      .from('gold_suppliers')
      .select('id, name')
      .eq('id', supplierId)
      .eq('active', true)
      .single();

    if (supplierError || !supplier) {
      return jsonResponse({ error: 'Unknown or inactive supplier' }, 404);
    }

    // ── Insert into Supabase ──────────────────────────────────────────

    const { data, error } = await admin
      .from('supplier_prices')
      .insert({
        supplier_id: supplierId,
        gold_price_per_kg: goldPricePerKg,
        silver_price_per_kg: silverPricePerKg,
        submitted_at: submittedAt,
      })
      .select('id')
      .single();

    if (error) {
      console.error('[submit-supplier-prices] Insert error:', error);
      return jsonResponse({ error: error.message }, 500);
    }

    console.log('[submit-supplier-prices] Inserted:', data.id);
    return jsonResponse({ success: true, id: data.id });
  } catch (err) {
    console.error('[submit-supplier-prices] Unhandled:', err);
    return jsonResponse({ error: 'Invalid request body' }, 400);
  }
});
