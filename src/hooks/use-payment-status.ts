/**
 * Real-time Payment Status Hook
 * Subscribes to payment status changes and provides real-time updates
 */

import { useEffect, useState, useCallback } from 'react';
import { supabase } from '@/lib/supabase';
import { getPaymentStatus } from '@/lib/payment-api';

interface PaymentStatusHookOptions {
  orderId?: number;
  paymentIntentId?: string;
  enabled?: boolean;
  onStatusChange?: (status: string) => void;
}

interface PaymentStatusResult {
  status: string | null;
  isLoading: boolean;
  error: string | null;
  paymentDetails: any | null;
  refresh: () => Promise<void>;
}

/**
 * Hook to track payment status in real-time
 *
 * @example
 * const { status, isLoading, refresh } = usePaymentStatus({
 *   orderId: 123,
 *   enabled: true,
 *   onStatusChange: (status) => {
 *     if (status === 'paid') {
 *       showSuccessMessage();
 *     }
 *   }
 * });
 */
export function usePaymentStatus({
  orderId,
  paymentIntentId,
  enabled = true,
  onStatusChange,
}: PaymentStatusHookOptions): PaymentStatusResult {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any | null>(null);

  // Fetch payment status from API
  const fetchPaymentStatus = useCallback(async () => {
    if (!paymentIntentId && !orderId) return;

    setIsLoading(true);
    setError(null);

    try {
      if (paymentIntentId) {
        // Fetch from Stripe API
        const result = await getPaymentStatus(paymentIntentId);

        if (result.success && result.status) {
          setStatus(result.status);
          setPaymentDetails(result);

          if (onStatusChange) {
            onStatusChange(result.status);
          }
        } else {
          throw new Error(result.error || 'Failed to fetch payment status');
        }
      } else if (orderId) {
        // Fetch from database
        const { data, error: dbError } = await supabase
          .from('orders')
          .select('payment_status, stripe_payment_intent_id, payment_method_details, last_payment_error')
          .eq('id', orderId)
          .single();

        if (dbError) throw dbError;

        if (data) {
          setStatus(data.payment_status);
          setPaymentDetails(data);

          if (onStatusChange) {
            onStatusChange(data.payment_status);
          }
        }
      }
    } catch (err: any) {
      console.error('Error fetching payment status:', err);
      setError(err.message || 'Failed to fetch payment status');
    } finally {
      setIsLoading(false);
    }
  }, [orderId, paymentIntentId, onStatusChange]);

  // Subscribe to real-time updates via Supabase
  useEffect(() => {
    if (!enabled || !orderId) return;

    console.log('📡 Subscribing to payment status updates for order:', orderId);

    // Initial fetch
    fetchPaymentStatus();

    // Set up real-time subscription
    const channel = supabase
      .channel(`payment-status-${orderId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'orders',
          filter: `id=eq.${orderId}`,
        },
        (payload) => {
          console.log('🔔 Payment status update received:', payload);

          const newStatus = payload.new.payment_status;

          if (newStatus && newStatus !== status) {
            setStatus(newStatus);
            setPaymentDetails(payload.new);

            if (onStatusChange) {
              onStatusChange(newStatus);
            }
          }
        }
      )
      .subscribe((status) => {
        console.log('📡 Subscription status:', status);
      });

    // Cleanup subscription on unmount
    return () => {
      console.log('🔌 Unsubscribing from payment status updates');
      supabase.removeChannel(channel);
    };
  }, [orderId, enabled, status, onStatusChange, fetchPaymentStatus]);

  // Manual refresh function
  const refresh = useCallback(async () => {
    await fetchPaymentStatus();
  }, [fetchPaymentStatus]);

  return {
    status,
    isLoading,
    error,
    paymentDetails,
    refresh,
  };
}

/**
 * Simpler hook for just monitoring payment status without Supabase realtime
 * Useful for polling-based updates
 */
export function usePaymentStatusPolling({
  paymentIntentId,
  interval = 3000,
  enabled = true,
  maxAttempts = 60,
  onStatusChange,
}: {
  paymentIntentId?: string;
  interval?: number;
  enabled?: boolean;
  maxAttempts?: number;
  onStatusChange?: (status: string) => void;
}): PaymentStatusResult {
  const [status, setStatus] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paymentDetails, setPaymentDetails] = useState<any | null>(null);
  const [attempts, setAttempts] = useState(0);

  useEffect(() => {
    if (!enabled || !paymentIntentId || attempts >= maxAttempts) return;

    const poll = async () => {
      try {
        setIsLoading(true);
        const result = await getPaymentStatus(paymentIntentId);

        if (result.success && result.status) {
          setStatus(result.status);
          setPaymentDetails(result);
          setAttempts((prev) => prev + 1);

          if (onStatusChange) {
            onStatusChange(result.status);
          }

          // Stop polling if terminal status reached
          if (['succeeded', 'failed', 'canceled'].includes(result.status)) {
            return;
          }
        }
      } catch (err: any) {
        console.error('Error polling payment status:', err);
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };

    // Initial poll
    poll();

    // Set up polling interval
    const intervalId = setInterval(poll, interval);

    return () => {
      clearInterval(intervalId);
    };
  }, [paymentIntentId, enabled, interval, maxAttempts, attempts, onStatusChange]);

  const refresh = useCallback(async () => {
    if (!paymentIntentId) return;

    try {
      setIsLoading(true);
      const result = await getPaymentStatus(paymentIntentId);

      if (result.success && result.status) {
        setStatus(result.status);
        setPaymentDetails(result);
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [paymentIntentId]);

  return {
    status,
    isLoading,
    error,
    paymentDetails,
    refresh,
  };
}
