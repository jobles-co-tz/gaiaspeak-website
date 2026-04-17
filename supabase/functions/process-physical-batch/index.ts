// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = Deno.env.get('SUPABASE_URL') || '';
const SUPABASE_SERVICE_ROLE_KEY = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') || '';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

// Oracle service: when a 1kg physical-gold batch fills up, query the
// gold_suppliers directory and pick the verified + active supplier with the
// smallest price_per_gram. That supplier is assigned to the closing batch and
// all queued delivery requests are moved to status = 'supplier_selected'.

async function selectCheapestSupplier(admin: ReturnType<typeof createClient>, collectedGrams: number) {
  // Pull every verified + active supplier, order by price ascending, take top 1.
  // We also filter by min_order_grams so we only match suppliers willing to
  // fulfil this batch size.
  const { data: candidates, error } = await admin
    .from('gold_suppliers')
    .select('id, name, price_per_gram, currency, min_order_grams, lead_time_days, country')
    .eq('verified', true)
    .eq('active', true)
    .lte('min_order_grams', collectedGrams)
    .order('price_per_gram', { ascending: true })
    .order('lead_time_days', { ascending: true });

  if (error) throw error;

  const sorted = candidates || [];
  return {
    selected: sorted[0] || null,
    candidates: sorted,
  };
}

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    if (!SUPABASE_URL || !SUPABASE_SERVICE_ROLE_KEY) {
      return new Response(JSON.stringify({ error: 'Missing Supabase runtime configuration' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const admin = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY);

    const { data: activeBatch, error: activeError } = await admin
      .from('physical_delivery_batches')
      .select('*')
      .eq('status', 'collecting')
      .order('batch_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeError) throw activeError;

    if (!activeBatch) {
      return new Response(JSON.stringify({ success: true, message: 'No active collecting batch' }), {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const collected = Number(activeBatch.collected_grams || 0);
    const target = Number(activeBatch.target_grams || 1000);

    if (collected < target) {
      return new Response(
        JSON.stringify({
          success: true,
          triggered: false,
          message: `Batch below threshold: ${collected}g / ${target}g`,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const { selected: selectedSupplier, candidates } = await selectCheapestSupplier(admin, collected);

    if (!selectedSupplier) {
      // No eligible supplier — leave the batch collecting so the admin can add one.
      return new Response(
        JSON.stringify({
          success: false,
          triggered: false,
          message: 'No verified + active supplier available for this batch size. Batch left open.',
          collected,
          target,
        }),
        {
          status: 200,
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        }
      );
    }

    const competitors = candidates
      .slice(1, 4)
      .map((c) => `${c.name} @ ${Number(c.price_per_gram).toFixed(2)} ${c.currency || 'USD'}/g`)
      .join(', ');

    const oracleNote = [
      `Cheapest verified supplier selected from gold_suppliers directory.`,
      `Winner: ${selectedSupplier.name} @ ${Number(selectedSupplier.price_per_gram).toFixed(2)} ${selectedSupplier.currency || 'USD'}/g.`,
      `Candidates evaluated: ${candidates.length}.`,
      competitors ? `Next best: ${competitors}.` : '',
    ]
      .filter(Boolean)
      .join(' ');

    const { error: closeBatchError } = await admin
      .from('physical_delivery_batches')
      .update({
        status: 'completed',
        supplier_name: selectedSupplier.name,
        supplier_price_per_gram: selectedSupplier.price_per_gram,
        oracle_note: oracleNote,
        closed_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeBatch.id);

    if (closeBatchError) throw closeBatchError;

    const { data: assignedRequests, error: assignError } = await admin
      .from('physical_delivery_requests')
      .update({
        status: 'supplier_selected',
        batch_id: activeBatch.id,
        updated_at: new Date().toISOString(),
      })
      .eq('status', 'queued')
      .is('batch_id', null)
      .select('id');

    if (assignError) throw assignError;

    const nextBatchNumber = Number(activeBatch.batch_number || 0) + 1;

    const { error: nextBatchError } = await admin
      .from('physical_delivery_batches')
      .insert([
        {
          batch_number: nextBatchNumber,
          target_grams: target,
          collected_grams: 0,
          status: 'collecting',
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

    if (nextBatchError) throw nextBatchError;

    return new Response(
      JSON.stringify({
        success: true,
        triggered: true,
        batchId: activeBatch.id,
        supplier: {
          id: selectedSupplier.id,
          name: selectedSupplier.name,
          pricePerGram: Number(selectedSupplier.price_per_gram),
          currency: selectedSupplier.currency || 'USD',
          country: selectedSupplier.country,
          leadTimeDays: selectedSupplier.lead_time_days,
        },
        candidatesConsidered: candidates.length,
        requestCount: assignedRequests?.length || 0,
      }),
      {
        status: 200,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      }
    );
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
