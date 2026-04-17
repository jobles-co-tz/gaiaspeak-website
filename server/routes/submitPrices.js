// server/routes/submitPrices.js
// POST /api/submit-supplier-prices — validate and insert a supplier price submission.

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';

export const submitPricesRouter = Router();

const supabase = createClient(
  process.env.SUPABASE_URL || '',
  process.env.SUPABASE_SERVICE_ROLE_KEY || '',
);

submitPricesRouter.post('/submit-supplier-prices', async (req, res) => {
  try {
    const { supplierId, goldPricePerKg, silverPricePerKg, submittedAt } = req.body;

    if (!supplierId || typeof supplierId !== 'string') {
      return res.status(400).json({ error: 'supplierId is required (string)' });
    }
    if (typeof goldPricePerKg !== 'number' || goldPricePerKg <= 0) {
      return res.status(400).json({ error: 'goldPricePerKg must be a positive number' });
    }
    if (typeof silverPricePerKg !== 'number' || silverPricePerKg <= 0) {
      return res.status(400).json({ error: 'silverPricePerKg must be a positive number' });
    }
    if (!submittedAt || isNaN(Date.parse(submittedAt))) {
      return res.status(400).json({ error: 'submittedAt must be a valid ISO timestamp' });
    }

    // Verify supplier exists and is active
    const { data: supplier, error: supplierError } = await supabase
      .from('gold_suppliers')
      .select('id, name')
      .eq('id', supplierId)
      .eq('active', true)
      .single();

    if (supplierError || !supplier) {
      return res.status(404).json({ error: 'Unknown or inactive supplier' });
    }

    // Insert price
    const { data, error } = await supabase
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
      return res.status(500).json({ error: error.message });
    }

    console.log('[submit-supplier-prices] Inserted:', data.id);
    return res.json({ success: true, id: data.id });
  } catch (err) {
    console.error('[submit-supplier-prices] Unhandled:', err);
    return res.status(400).json({ error: 'Invalid request body' });
  }
});
