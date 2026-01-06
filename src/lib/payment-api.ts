/**
 * Improved Payment API Client
 * Clean interface for all payment operations with proper error handling and retry logic
 */

// Backend API URL
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

export interface PaymentConfig {
  publishableKey: string;
  success: boolean;
}

export interface PaymentIntentParams {
  amount: number; // Amount in euros
  currency?: string;
  metadata?: {
    orderId?: string;
    orderNumber?: string;
    customerEmail?: string;
    customerName?: string;
    customerPhone?: string;
    orderType?: 'delivery' | 'pickup';
    branchId?: string;
    [key: string]: string | undefined;
  };
  paymentMethodTypes?: string[];
  customerId?: string;
  savePaymentMethod?: boolean;
}

export interface PaymentResult {
  success: boolean;
  paymentIntentId?: string;
  clientSecret?: string;
  status?: string;
  error?: string;
  errorCode?: string;
  requiresAction?: boolean;
  nextActionType?: string;
  order?: any;
}

export interface RefundParams {
  paymentIntentId: string;
  amount?: number; // Amount in euros, undefined for full refund
  reason?: 'duplicate' | 'fraudulent' | 'requested_by_customer';
  metadata?: Record<string, string>;
}

export interface CustomerParams {
  email: string;
  name?: string;
  phone?: string;
  metadata?: Record<string, string>;
}

export interface SavedPaymentMethod {
  id: string;
  type: string;
  card?: {
    brand: string;
    last4: string;
    expMonth: number;
    expYear: number;
  };
}

/**
 * Payment API Error Class
 */
export class PaymentAPIError extends Error {
  constructor(
    message: string,
    public code?: string,
    public statusCode?: number
  ) {
    super(message);
    this.name = 'PaymentAPIError';
  }
}

/**
 * Retry configuration
 */
const MAX_RETRIES = 3;
const RETRY_DELAY = 1000; // 1 second

/**
 * Delay helper for retries
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Fetch with retry logic
 */
async function fetchWithRetry(
  url: string,
  options: RequestInit,
  retries = MAX_RETRIES
): Promise<Response> {
  try {
    const response = await fetch(url, options);
    return response;
  } catch (error) {
    if (retries > 0) {
      console.log(`Retrying request... (${MAX_RETRIES - retries + 1}/${MAX_RETRIES})`);
      await delay(RETRY_DELAY * (MAX_RETRIES - retries + 1)); // Exponential backoff
      return fetchWithRetry(url, options, retries - 1);
    }
    throw error;
  }
}

/**
 * Handle API response
 */
async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new PaymentAPIError(
      errorData.error || errorData.message || 'Request failed',
      errorData.errorCode,
      response.status
    );
  }

  return await response.json();
}

/**
 * Get Stripe configuration
 */
export async function getPaymentConfig(): Promise<PaymentConfig> {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/payment/config`, {
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
      },
    });

    return await handleResponse<PaymentConfig>(response);
  } catch (error: any) {
    console.error('Error fetching payment config:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to fetch payment configuration',
      error.code
    );
  }
}

/**
 * Create payment intent
 */
export async function createPaymentIntent(
  params: PaymentIntentParams
): Promise<PaymentResult> {
  try {
    if (!params.amount || params.amount <= 0) {
      throw new PaymentAPIError('Invalid amount', 'invalid_amount');
    }

    const response = await fetchWithRetry(
      `${API_URL}/api/payment/create-payment-intent`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          amount: params.amount,
          currency: params.currency || 'eur',
          metadata: params.metadata || {},
          paymentMethodTypes: params.paymentMethodTypes,
          customerId: params.customerId,
          savePaymentMethod: params.savePaymentMethod || false,
        }),
      }
    );

    const result = await handleResponse<PaymentResult>(response);

    console.log('✅ Payment intent created:', result.paymentIntentId);
    return result;
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to create payment intent',
      error.code
    );
  }
}

/**
 * Get payment intent status
 */
export async function getPaymentStatus(paymentIntentId: string): Promise<PaymentResult> {
  try {
    const response = await fetchWithRetry(
      `${API_URL}/api/payment/payment-intent/${paymentIntentId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return await handleResponse<PaymentResult>(response);
  } catch (error: any) {
    console.error('Error fetching payment status:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to fetch payment status',
      error.code
    );
  }
}

/**
 * Confirm payment
 */
export async function confirmPayment(
  paymentIntentId: string,
  orderId?: number
): Promise<PaymentResult> {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/payment/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
        orderId,
      }),
    });

    const result = await handleResponse<PaymentResult>(response);

    console.log('✅ Payment confirmed:', paymentIntentId);
    return result;
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to confirm payment',
      error.code
    );
  }
}

/**
 * Cancel payment
 */
export async function cancelPayment(paymentIntentId: string): Promise<PaymentResult> {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/payment/cancel-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        paymentIntentId,
      }),
    });

    const result = await handleResponse<PaymentResult>(response);

    console.log('✅ Payment canceled:', paymentIntentId);
    return result;
  } catch (error: any) {
    console.error('Error canceling payment:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to cancel payment',
      error.code
    );
  }
}

/**
 * Retry failed payment
 */
export async function retryPayment(orderId: number): Promise<PaymentResult> {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/payment/retry-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        orderId,
      }),
    });

    const result = await handleResponse<PaymentResult>(response);

    console.log('✅ Payment retry initiated for order:', orderId);
    return result;
  } catch (error: any) {
    console.error('Error retrying payment:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to retry payment',
      error.code
    );
  }
}

/**
 * Process refund
 */
export async function processRefund(params: RefundParams): Promise<PaymentResult> {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/payment/refund`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await handleResponse<PaymentResult>(response);

    console.log('✅ Refund processed:', params.paymentIntentId);
    return result;
  } catch (error: any) {
    console.error('Error processing refund:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to process refund',
      error.code
    );
  }
}

/**
 * Create Stripe customer
 */
export async function createCustomer(
  params: CustomerParams
): Promise<{ success: boolean; customerId?: string; error?: string }> {
  try {
    const response = await fetchWithRetry(`${API_URL}/api/payment/create-customer`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    const result = await handleResponse<{
      success: boolean;
      customerId?: string;
      error?: string;
    }>(response);

    if (result.success) {
      console.log('✅ Customer created:', result.customerId);
    }

    return result;
  } catch (error: any) {
    console.error('Error creating customer:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to create customer',
      error.code
    );
  }
}

/**
 * List saved payment methods
 */
export async function listSavedPaymentMethods(
  customerId: string
): Promise<{ success: boolean; paymentMethods?: SavedPaymentMethod[]; error?: string }> {
  try {
    const response = await fetchWithRetry(
      `${API_URL}/api/payment/payment-methods/${customerId}`,
      {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      }
    );

    return await handleResponse<{
      success: boolean;
      paymentMethods?: SavedPaymentMethod[];
      error?: string;
    }>(response);
  } catch (error: any) {
    console.error('Error listing payment methods:', error);
    throw new PaymentAPIError(
      error.message || 'Failed to list payment methods',
      error.code
    );
  }
}

/**
 * Poll payment status until completion
 * Useful for tracking payment status in real-time
 */
export async function pollPaymentStatus(
  paymentIntentId: string,
  onUpdate?: (status: string) => void,
  maxAttempts = 60,
  interval = 2000
): Promise<PaymentResult> {
  let attempts = 0;

  while (attempts < maxAttempts) {
    try {
      const result = await getPaymentStatus(paymentIntentId);

      if (onUpdate && result.status) {
        onUpdate(result.status);
      }

      // Terminal statuses
      if (
        result.status === 'succeeded' ||
        result.status === 'failed' ||
        result.status === 'canceled'
      ) {
        return result;
      }

      // Wait before next poll
      await delay(interval);
      attempts++;
    } catch (error) {
      console.error('Error polling payment status:', error);
      attempts++;
      await delay(interval);
    }
  }

  throw new PaymentAPIError('Payment status polling timeout', 'timeout');
}

/**
 * Format payment error for user display
 */
export function formatPaymentError(error: any): string {
  if (error instanceof PaymentAPIError) {
    switch (error.code) {
      case 'invalid_amount':
        return 'Invalid payment amount';
      case 'invalid_status':
        return 'Payment is not in a valid state';
      case 'requires_action':
        return 'Payment requires additional action';
      case 'card_declined':
        return 'Your card was declined';
      case 'insufficient_funds':
        return 'Insufficient funds';
      case 'expired_card':
        return 'Your card has expired';
      case 'incorrect_cvc':
        return 'Incorrect security code';
      case 'processing_error':
        return 'An error occurred while processing your payment';
      case 'timeout':
        return 'Payment processing timeout. Please check your order status';
      default:
        return error.message || 'Payment failed. Please try again';
    }
  }

  return 'An unexpected error occurred. Please try again';
}
