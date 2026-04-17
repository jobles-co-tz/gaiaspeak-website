// server/routes/pushPrices.js
// POST /api/push-prices — reads latest supplier price from Supabase and pushes on-chain.
// Also exported as pushPrices() for the cron scheduler to call directly.

import { Router } from 'express';
import { createClient } from '@supabase/supabase-js';
import { ethers } from 'ethers';

export const pushPricesRouter = Router();

const ORACLE_ABI = [
  'function updateSupplierPrice(string calldata supplierId, uint256 goldPrice, uint256 silverPrice, uint256 ts) external',
  'function getBestSupplierPrice(string calldata supplierId) external view returns (tuple(string supplierId, uint256 goldPricePerKg, uint256 silverPricePerKg, uint256 updatedAt))',
];

function toCents(usdAmount) {
  return BigInt(Math.round(usdAmount * 100));
}

export async function pushPrices() {
  const supabaseUrl = process.env.SUPABASE_URL;
  const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const rpcUrl = process.env.L2_RPC_URL;
  const contract = process.env.CONTRACT_ADDRESS;
  const privateKey = process.env.ORACLE_PRIVATE_KEY;

  if (!supabaseUrl || !supabaseKey) throw new Error('Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
  if (!rpcUrl) throw new Error('Missing L2_RPC_URL');
  if (!contract) throw new Error('Missing CONTRACT_ADDRESS');
  if (!privateKey) throw new Error('Missing ORACLE_PRIVATE_KEY');

  const supabase = createClient(supabaseUrl, supabaseKey);

  const { data, error } = await supabase
    .from('supplier_prices')
    .select('*')
    .order('submitted_at', { ascending: false })
    .limit(1)
    .single();

  if (error) throw new Error(`Supabase query failed: ${error.message}`);
  if (!data) throw new Error('No supplier prices found');

  console.log(
    `[oracle] Latest price from "${data.supplier_id}":`,
    `Gold $${data.gold_price_per_kg}/kg, Silver $${data.silver_price_per_kg}/kg`,
    `(submitted ${data.submitted_at})`,
  );

  const provider = new ethers.JsonRpcProvider(rpcUrl);
  const wallet = new ethers.Wallet(privateKey, provider);
  const oracle = new ethers.Contract(contract, ORACLE_ABI, wallet);

  const goldCents = toCents(Number(data.gold_price_per_kg));
  const silverCents = toCents(Number(data.silver_price_per_kg));
  const timestamp = BigInt(Math.floor(new Date(data.submitted_at).getTime() / 1000));

  console.log(
    `[oracle] Pushing on-chain: supplierId=${data.supplier_id}`,
    `gold=${goldCents} silver=${silverCents} ts=${timestamp}`,
  );

  const tx = await oracle.updateSupplierPrice(data.supplier_id, goldCents, silverCents, timestamp);
  console.log(`[oracle] Tx sent: ${tx.hash}`);
  const receipt = await tx.wait();
  console.log(`[oracle] Confirmed in block ${receipt.blockNumber}`);

  return { txHash: tx.hash, blockNumber: receipt.blockNumber };
}

// HTTP route — for manual trigger
pushPricesRouter.post('/push-prices', async (_req, res) => {
  try {
    const result = await pushPrices();
    return res.json({ success: true, ...result });
  } catch (err) {
    console.error('[push-prices] Error:', err);
    return res.status(500).json({ error: err.message });
  }
});
