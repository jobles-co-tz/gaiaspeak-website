import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import {
  PHYSICAL_BATCH_TARGET_GRAMS,
  getCurrentPhysicalBatch,
  getQueueRequests,
  getUserQueueStatus,
  requestPhysicalDelivery,
  supabase,
} from '../config/supabase';

function formatEta(hours) {
  if (hours <= 1) return 'within ~1 hour';
  if (hours < 24) return `~${Math.ceil(hours)} hours`;
  return `~${Math.ceil(hours / 24)} days`;
}

export function usePhysicalDeliveryQueue() {
  const { address, isConnected } = useAccount();

  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [lastMessage, setLastMessage] = useState('');

  const [batch, setBatch] = useState(null);
  const [queueRequests, setQueueRequests] = useState([]);
  const [userQueue, setUserQueue] = useState({
    inQueue: false,
    queuePosition: null,
    request: null,
  });

  const refresh = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      const [batchResult, queueResult, userResult] = await Promise.all([
        getCurrentPhysicalBatch(),
        getQueueRequests(),
        address ? getUserQueueStatus(address) : Promise.resolve({ success: true, inQueue: false, queuePosition: null, request: null }),
      ]);

      if (!batchResult.success) {
        throw new Error(batchResult.error || 'Unable to load active batch');
      }

      if (!queueResult.success) {
        throw new Error(queueResult.error || 'Unable to load queue');
      }

      setBatch(batchResult.batch);
      setQueueRequests(queueResult.requests || []);

      if (userResult.success) {
        setUserQueue({
          inQueue: userResult.inQueue,
          queuePosition: userResult.queuePosition,
          request: userResult.request,
        });
      }
    } catch (err) {
      setError(err.message || 'Failed to load physical delivery queue');
    } finally {
      setIsLoading(false);
    }
  }, [address]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  useEffect(() => {
    if (!supabase) return undefined;

    const channel = supabase
      .channel('physical-delivery-live')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_delivery_requests' }, refresh)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'physical_delivery_batches' }, refresh)
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [refresh]);

  const submitRequest = useCallback(async (payload) => {
    if (!isConnected || !address) {
      return { success: false, error: 'Connect your wallet first' };
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const result = await requestPhysicalDelivery({
        ...payload,
        walletAddress: address,
      });

      if (!result.success) {
        throw new Error(result.error || 'Failed to submit request');
      }

      setLastMessage('Your order is in queue. We will auto-batch at 1kg and route to the cheapest verified supplier.');
      await refresh();
      return result;
    } catch (err) {
      const msg = err.message || 'Failed to submit physical delivery request';
      setError(msg);
      return { success: false, error: msg };
    } finally {
      setIsSubmitting(false);
    }
  }, [address, isConnected, refresh]);

  const collectedGrams = useMemo(() => {
    const fromBatch = Number(batch?.collected_grams || 0);
    if (Number.isFinite(fromBatch) && fromBatch > 0) return fromBatch;
    return queueRequests.reduce((sum, req) => sum + Number(req.grams || 0), 0);
  }, [batch, queueRequests]);

  const targetGrams = Number(batch?.target_grams || PHYSICAL_BATCH_TARGET_GRAMS);
  const remainingGrams = Math.max(0, targetGrams - collectedGrams);
  const progressPercent = Math.min(100, (collectedGrams / targetGrams) * 100);

  // Mock ETA model: ~150g/day community inflow
  const estimatedHours = remainingGrams / (150 / 24);

  return {
    isLoading,
    isSubmitting,
    error,
    lastMessage,
    batch,
    queueRequests,
    userQueue,
    collectedGrams,
    targetGrams,
    remainingGrams,
    progressPercent,
    estimatedTimeLabel: formatEta(estimatedHours),
    submitRequest,
    refresh,
  };
}
