// server/routes/processBatch.js
// POST /api/process-physical-batch — when a 1 kg batch fills up, select the
// cheapest verified supplier and close the batch.

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const processBatchRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

async function selectCheapestSupplier(collectedGrams) {
  const { data: candidates, error } = await supabase
    .from('gold_suppliers')
    .select('id, name, price_per_gram, currency, min_order_grams, lead_time_days, country')
    .eq('verified', true)
    .eq('active', true)
    .lte('min_order_grams', collectedGrams)
    .order('price_per_gram', { ascending: true })
    .order('lead_time_days', { ascending: true });

  if (error) throw error;
  const sorted = candidates || [];
  return { selected: sorted[0] || null, candidates: sorted };
}

processBatchRouter.post('/process-physical-batch', async (_req, res) => {
  try {
    const { data: activeBatch, error: activeError } = await supabase
      .from('physical_delivery_batches')
      .select('*')
      .eq('status', 'collecting')
      .order('batch_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (activeError) throw activeError;

    if (!activeBatch) {
      return res.json({ success: true, message: 'No active collecting batch' });
    }

    const collected = Number(activeBatch.collected_grams || 0);
    const target = Number(activeBatch.target_grams || 1000);

    if (collected < target) {
      return res.json({
        success: true,
        triggered: false,
        message: `Batch below threshold: ${collected}g / ${target}g`,
      });
    }

    const { selected: selectedSupplier, candidates } = await selectCheapestSupplier(collected);

    if (!selectedSupplier) {
      return res.json({
        success: false,
        triggered: false,
        message: 'No verified + active supplier available for this batch size. Batch left open.',
        collected,
        target,
      });
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

    const { error: closeBatchError } = await supabase
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

    const { data: assignedRequests, error: assignError } = await supabase
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

    const { error: nextBatchError } = await supabase
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

    return res.json({
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
    });
  } catch (err) {
    console.error('[process-physical-batch] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});
