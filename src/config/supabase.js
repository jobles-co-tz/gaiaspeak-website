import { createClient } from '@supabase/supabase-js';

// Supabase configuration
// These should be set in environment variables for production
const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

// Create Supabase client (will be null if not configured)
export const supabase = supabaseUrl && supabaseAnonKey 
  ? createClient(supabaseUrl, supabaseAnonKey)
  : null;

// Check if Supabase is configured
export const isSupabaseConfigured = () => {
  return supabase !== null;
};

// Admin email for order notifications
const ADMIN_EMAIL = 'spancial@gmail.com';
// gaialilith60@gmail.com

export const PHYSICAL_BATCH_TARGET_GRAMS = 1000;

const MOCK_ACTIVE_BATCH = {
  id: 'mock-batch-1',
  batch_number: 1,
  target_grams: PHYSICAL_BATCH_TARGET_GRAMS,
  collected_grams: 0,
  status: 'collecting',
};

/**
 * Contract-ready API boundary:
 * - requestPhysicalDelivery() can later call smart contract + oracle relayer.
 * - getCurrentPhysicalBatch() and getUserQueueStatus() can later read on-chain events/subgraph.
 */

export async function ensureCurrentPhysicalBatch() {
  if (!supabase) {
    return { success: true, batch: MOCK_ACTIVE_BATCH, mock: true };
  }

  try {
    const { data: existingBatch, error: findError } = await supabase
      .from('physical_delivery_batches')
      .select('*')
      .eq('status', 'collecting')
      .order('batch_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (findError) throw findError;

    if (existingBatch) {
      return { success: true, batch: existingBatch };
    }

    const { data: lastBatch } = await supabase
      .from('physical_delivery_batches')
      .select('batch_number')
      .order('batch_number', { ascending: false })
      .limit(1)
      .maybeSingle();

    const nextBatchNumber = (lastBatch?.batch_number || 0) + 1;

    const { data: createdBatch, error: createError } = await supabase
      .from('physical_delivery_batches')
      .insert([
        {
          batch_number: nextBatchNumber,
          target_grams: PHYSICAL_BATCH_TARGET_GRAMS,
          collected_grams: 0,
          status: 'collecting',
          supplier_name: null,
          supplier_price_per_gram: null,
        },
      ])
      .select('*')
      .single();

    if (createError) throw createError;

    return { success: true, batch: createdBatch };
  } catch (error) {
    console.error('Error ensuring current physical batch:', error);
    return { success: false, error: error.message };
  }
}

export async function getCurrentPhysicalBatch() {
  const batchResult = await ensureCurrentPhysicalBatch();
  if (!batchResult.success) return batchResult;

  if (!supabase) {
    return {
      success: true,
      batch: MOCK_ACTIVE_BATCH,
      queuedCount: 0,
      mock: true,
    };
  }

  try {
    const { count, error: countError } = await supabase
      .from('physical_delivery_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued')
      .is('batch_id', null);

    if (countError) throw countError;

    return {
      success: true,
      batch: batchResult.batch,
      queuedCount: count || 0,
    };
  } catch (error) {
    console.error('Error fetching current batch queue count:', error);
    return {
      success: false,
      error: error.message,
      batch: batchResult.batch,
      queuedCount: 0,
    };
  }
}

export async function getUserQueueStatus(walletAddress) {
  if (!walletAddress) {
    return { success: true, inQueue: false, queuePosition: null, request: null };
  }

  if (!supabase) {
    return {
      success: true,
      inQueue: false,
      queuePosition: null,
      request: null,
      mock: true,
    };
  }

  try {
    const { data: request, error: requestError } = await supabase
      .from('physical_delivery_requests')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .eq('status', 'queued')
      .is('batch_id', null)
      .order('created_at', { ascending: true })
      .limit(1)
      .maybeSingle();

    if (requestError) throw requestError;

    if (!request) {
      return { success: true, inQueue: false, queuePosition: null, request: null };
    }

    const { count, error: queueError } = await supabase
      .from('physical_delivery_requests')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'queued')
      .is('batch_id', null)
      .lt('created_at', request.created_at);

    if (queueError) throw queueError;

    return {
      success: true,
      inQueue: true,
      queuePosition: (count || 0) + 1,
      request,
    };
  } catch (error) {
    console.error('Error fetching user queue status:', error);
    return {
      success: false,
      error: error.message,
      inQueue: false,
      queuePosition: null,
      request: null,
    };
  }
}

export async function requestPhysicalDelivery(data) {
  if (!data?.walletAddress) {
    return { success: false, error: 'Wallet address is required' };
  }

  if (!data?.grams || Number(data.grams) < 1) {
    return { success: false, error: 'Minimum withdraw amount is 1g' };
  }

  if (!supabase) {
    return {
      success: true,
      mock: true,
      request: {
        id: `mock-physical-${Date.now()}`,
        grams: Number(data.grams),
        token_type: data.tokenType,
        status: 'queued',
      },
    };
  }

  try {
    const ensureResult = await ensureCurrentPhysicalBatch();
    if (!ensureResult.success) {
      return { success: false, error: ensureResult.error || 'Failed to load active batch' };
    }

    const activeBatch = ensureResult.batch;

    const { data: request, error: insertError } = await supabase
      .from('physical_delivery_requests')
      .insert([
        {
          wallet_address: data.walletAddress.toLowerCase(),
          token_type: data.tokenType,
          grams: Number(data.grams),
          country: data.country,
          city: data.city,
          street: data.street,
          postal_code: data.postalCode,
          status: 'queued',
          batch_id: null,
          created_at: new Date().toISOString(),
        },
      ])
      .select('*')
      .single();

    if (insertError) throw insertError;

    const nextCollectedGrams = Number(activeBatch?.collected_grams || 0) + Number(data.grams);

    await supabase
      .from('physical_delivery_batches')
      .update({
        collected_grams: nextCollectedGrams,
        updated_at: new Date().toISOString(),
      })
      .eq('id', activeBatch.id);

    // Mock oracle processing entry point. Replace with on-chain keeper/oracle trigger later.
    await supabase.functions.invoke('process-physical-batch', {
      body: {
        source: 'frontend-request',
        triggerRequestId: request.id,
      },
    });

    return { success: true, request };
  } catch (error) {
    console.error('Error creating physical delivery request:', error);
    return { success: false, error: error.message };
  }
}

export async function getQueueRequests() {
  if (!supabase) {
    return { success: true, requests: [], mock: true };
  }

  try {
    const { data, error } = await supabase
      .from('physical_delivery_requests')
      .select('*')
      .eq('status', 'queued')
      .is('batch_id', null)
      .order('created_at', { ascending: true });

    if (error) throw error;

    return { success: true, requests: data || [] };
  } catch (error) {
    console.error('Error fetching queue requests:', error);
    return { success: false, error: error.message, requests: [] };
  }
}

export async function getCompletedPhysicalBatches() {
  if (!supabase) {
    return { success: true, batches: [], mock: true };
  }

  try {
    const { data, error } = await supabase
      .from('physical_delivery_batches')
      .select('*')
      .eq('status', 'completed')
      .order('closed_at', { ascending: false, nullsFirst: false });

    if (error) throw error;

    return { success: true, batches: data || [] };
  } catch (error) {
    console.error('Error fetching completed physical batches:', error);
    return { success: false, error: error.message, batches: [] };
  }
}

export async function getAllPhysicalRequests() {
  if (!supabase) {
    return { success: true, requests: [], mock: true };
  }

  try {
    const { data, error } = await supabase
      .from('physical_delivery_requests')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, requests: data || [] };
  } catch (error) {
    console.error('Error fetching physical requests history:', error);
    return { success: false, error: error.message, requests: [] };
  }
}

// Save reservation data to Supabase and send admin notification
export async function saveReservation(data) {
  if (!supabase) {
    console.warn('Supabase not configured. Reservation data not saved off-chain.');
    // Return a mock response for development
    return {
      success: true,
      mock: true,
      id: `mock-${Date.now()}`,
      message: 'Reservation recorded (Supabase not configured - development mode)'
    };
  }

  try {
    const { data: result, error } = await supabase
      .from('bracelet_reservations')
      .insert([{
        wallet_address: data.walletAddress,
        full_name: data.fullName,
        email: data.email,
        phone: data.phone,
        country: data.country,
        city: data.city,
        street_address: data.streetAddress,
        postal_code: data.postalCode,
        quantity: data.quantity,
        size: data.size || null,
        color: data.color || null,
        notes: data.notes || null,
        tx_hash: data.txHash || null,
        nft_id: data.nftId || null,
        created_at: new Date().toISOString(),
      }])
      .select()
      .single();

    if (error) throw error;

    // Send admin notification email via Edge Function
    try {
      await supabase.functions.invoke('send-order-notification', {
        body: {
          reservation: result,
          adminEmail: ADMIN_EMAIL
        }
      });
    } catch (emailError) {
      // Don't fail the reservation if email fails - just log it
      console.error('Failed to send admin notification:', emailError);
    }

    return { success: true, id: result.id };
  } catch (error) {
    console.error('Error saving reservation:', error);
    return { success: false, error: error.message };
  }
}

// Get user's reservations
export async function getUserReservations(walletAddress) {
  if (!supabase) {
    return { success: true, reservations: [], mock: true };
  }

  try {
    const { data, error } = await supabase
      .from('bracelet_reservations')
      .select('*')
      .eq('wallet_address', walletAddress.toLowerCase())
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, reservations: data };
  } catch (error) {
    console.error('Error fetching reservations:', error);
    return { success: false, error: error.message, reservations: [] };
  }
}

// Get total reservation count (for public display)
export async function getReservationCount() {
  if (!supabase) {
    return { success: true, count: 0, mock: true };
  }

  try {
    const { count, error } = await supabase
      .from('bracelet_reservations')
      .select('*', { count: 'exact', head: true });

    if (error) throw error;

    return { success: true, count: count || 0 };
  } catch (error) {
    console.error('Error fetching count:', error);
    return { success: false, count: 0, error: error.message };
  }
}

// Get all reservations (for admin)
export async function getAllReservations() {
  if (!supabase) {
    return { success: true, reservations: [], mock: true };
  }

  try {
    const { data, error } = await supabase
      .from('bracelet_reservations')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;

    return { success: true, reservations: data || [] };
  } catch (error) {
    console.error('Error fetching all reservations:', error);
    return { success: false, error: error.message, reservations: [] };
  }
}

/*
Supabase Table Schema (run this in Supabase SQL Editor):

CREATE TABLE bracelet_reservations (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  nft_id TEXT,
  full_name TEXT NOT NULL,
  email TEXT NOT NULL,
  phone TEXT NOT NULL,
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  street_address TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  size TEXT,
  color TEXT,
  notes TEXT,
  tx_hash TEXT,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Enable RLS
ALTER TABLE bracelet_reservations ENABLE ROW LEVEL SECURITY;

-- Policy: Users can insert their own reservations
CREATE POLICY "Users can insert reservations" ON bracelet_reservations
  FOR INSERT WITH CHECK (true);

-- Policy: Users can view their own reservations
CREATE POLICY "Users can view own reservations" ON bracelet_reservations
  FOR SELECT USING (wallet_address = current_setting('request.jwt.claims')::json->>'wallet_address');

-- Physical delivery batches (1kg pooling)
CREATE TABLE physical_delivery_batches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  batch_number INTEGER NOT NULL UNIQUE,
  target_grams NUMERIC NOT NULL DEFAULT 1000,
  collected_grams NUMERIC NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'collecting', -- collecting | completed
  supplier_name TEXT,
  supplier_price_per_gram NUMERIC,
  oracle_note TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  closed_at TIMESTAMPTZ,
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Physical delivery requests queue
CREATE TABLE physical_delivery_requests (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  wallet_address TEXT NOT NULL,
  token_type TEXT NOT NULL CHECK (token_type IN ('GSG', 'GSS')),
  grams NUMERIC NOT NULL CHECK (grams >= 1),
  country TEXT NOT NULL,
  city TEXT NOT NULL,
  street TEXT NOT NULL,
  postal_code TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'queued', -- queued | batched | supplier_selected | shipped
  batch_id UUID REFERENCES physical_delivery_batches(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE physical_delivery_batches ENABLE ROW LEVEL SECURITY;
ALTER TABLE physical_delivery_requests ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Public read active physical batches" ON physical_delivery_batches
  FOR SELECT USING (true);

CREATE POLICY "Public read physical requests" ON physical_delivery_requests
  FOR SELECT USING (true);

CREATE POLICY "Users insert physical requests" ON physical_delivery_requests
  FOR INSERT WITH CHECK (true);
*/

