import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

interface BlacklistCheckResult {
  isBlacklisted: boolean;
  reason?: string;
  blockedAt?: string;
  blockedBy?: number;
}

/**
 * Check if a customer email is blacklisted
 */
export function useEmailBlacklistCheck(email: string | null) {
  return useQuery({
    queryKey: ['blacklist-check', 'email', email],
    queryFn: async (): Promise<BlacklistCheckResult> => {
      if (!email) {
        return { isBlacklisted: false };
      }

      const { data, error } = await supabase
        .from('customer_blacklist')
        .select('*')
        .eq('email', email.toLowerCase())
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking email blacklist:', error);
        return { isBlacklisted: false };
      }

      if (data) {
        return {
          isBlacklisted: true,
          reason: data.reason,
          blockedAt: data.blocked_at,
          blockedBy: data.blocked_by,
        };
      }

      return { isBlacklisted: false };
    },
    enabled: !!email,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Check if a customer phone number is blacklisted
 */
export function usePhoneBlacklistCheck(phone: string | null) {
  return useQuery({
    queryKey: ['blacklist-check', 'phone', phone],
    queryFn: async (): Promise<BlacklistCheckResult> => {
      if (!phone) {
        return { isBlacklisted: false };
      }

      // Normalize phone number (remove spaces, dashes, etc.)
      const normalizedPhone = phone.replace(/[\s\-\(\)]/g, '');

      const { data, error } = await supabase
        .from('customer_blacklist')
        .select('*')
        .eq('phone', normalizedPhone)
        .eq('is_active', true)
        .maybeSingle();

      if (error) {
        console.error('Error checking phone blacklist:', error);
        return { isBlacklisted: false };
      }

      if (data) {
        return {
          isBlacklisted: true,
          reason: data.reason,
          blockedAt: data.blocked_at,
          blockedBy: data.blocked_by,
        };
      }

      return { isBlacklisted: false };
    },
    enabled: !!phone,
    staleTime: 1000 * 60 * 5, // Cache for 5 minutes
  });
}

/**
 * Check if either email or phone is blacklisted
 * Returns the first match found
 */
export function useBlacklistCheck(email: string | null, phone: string | null) {
  const emailCheck = useEmailBlacklistCheck(email);
  const phoneCheck = usePhoneBlacklistCheck(phone);

  return {
    isBlacklisted: emailCheck.data?.isBlacklisted || phoneCheck.data?.isBlacklisted || false,
    reason: emailCheck.data?.reason || phoneCheck.data?.reason,
    blockedAt: emailCheck.data?.blockedAt || phoneCheck.data?.blockedAt,
    blockedBy: emailCheck.data?.blockedBy || phoneCheck.data?.blockedBy,
    isLoading: emailCheck.isLoading || phoneCheck.isLoading,
    emailCheck: emailCheck.data,
    phoneCheck: phoneCheck.data,
  };
}

/**
 * Server-side blacklist validation using the database function
 * This should be called before creating an order
 */
export async function validateCustomerNotBlacklisted(
  email: string,
  phone?: string
): Promise<{ valid: boolean; message?: string }> {
  try {
    const { data, error } = await supabase.rpc('is_customer_blacklisted', {
      p_email: email.toLowerCase(),
      p_phone: phone ? phone.replace(/[\s\-\(\)]/g, '') : null,
    });

    if (error) {
      console.error('Error validating blacklist:', error);
      // Allow order if check fails (fail-open for better UX)
      return { valid: true };
    }

    if (data === true) {
      return {
        valid: false,
        message: 'Customer is blacklisted and cannot place orders',
      };
    }

    return { valid: true };
  } catch (err) {
    console.error('Blacklist validation exception:', err);
    // Allow order if check fails (fail-open for better UX)
    return { valid: true };
  }
}
