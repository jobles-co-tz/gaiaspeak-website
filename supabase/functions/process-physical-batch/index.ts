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

const suppliers = [
  { name: 'Atlas Bullion', verified: true, pricePerGram: 73.8 },
  { name: 'Auric Trust Metals', verified: true, pricePerGram: 72.9 },
  { name: 'NovaMint Cooperative', verified: true, pricePerGram: 74.1 },
];

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

    const verifiedSuppliers = suppliers.filter((supplier) => supplier.verified);
    const selectedSupplier = verifiedSuppliers.sort((a, b) => a.pricePerGram - b.pricePerGram)[0];

    const { error: closeBatchError } = await admin
      .from('physical_delivery_batches')
      .update({
        status: 'completed',
        supplier_name: selectedSupplier.name,
        supplier_price_per_gram: selectedSupplier.pricePerGram,
        oracle_note: 'Mock oracle selected cheapest verified supplier automatically at 1kg threshold.',
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
        supplier: selectedSupplier,
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
