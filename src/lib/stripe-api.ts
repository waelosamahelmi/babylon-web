// Backend API URL - use environment variable or default to localhost
const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

// Supabase URL for Edge Functions
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export interface CreatePaymentIntentRequest {
  amount: number; // Total amount in euros (will be converted to cents)
  currency?: string;
  metadata?: Record<string, string>;
  paymentMethodTypes?: string[]; // Explicit payment method types to enable
}

export interface CreatePaymentIntentResponse {
  clientSecret: string;
  paymentIntentId: string;
}

export interface StripeConfigResponse {
  publishableKey: string;
}

/**
 * Get Stripe configuration (publishable key) from backend database
 */
export async function getStripeConfig(): Promise<StripeConfigResponse> {
  try {
    const response = await fetch(`${API_URL}/api/stripe/config`);

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to fetch Stripe config');
    }

    const data: StripeConfigResponse = await response.json();

    if (!data || !data.publishableKey) {
      throw new Error('Invalid Stripe configuration');
    }

    return data;
  } catch (error) {
    console.error('Error fetching Stripe config:', error);
    throw error;
  }
}

export async function createPaymentIntent(
  params: CreatePaymentIntentRequest
): Promise<CreatePaymentIntentResponse> {
  try {
    // Use Supabase Edge Function for payment intent creation
    // This ensures the payment_intent_id is saved with service role permissions
    const useEdgeFunction = SUPABASE_URL && SUPABASE_ANON_KEY;
    const endpoint = useEdgeFunction
      ? `${SUPABASE_URL}/functions/v1/create-payment-intent`
      : `${API_URL}/api/stripe/create-payment-intent`;

    console.log(`🔧 Using ${useEdgeFunction ? 'Supabase Edge Function' : 'Backend API'} for payment intent`);

    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };

    // Add authorization header for Supabase Edge Functions
    if (useEdgeFunction) {
      headers['Authorization'] = `Bearer ${SUPABASE_ANON_KEY}`;
    }

    const response = await fetch(endpoint, {
      method: 'POST',
      headers,
      body: JSON.stringify({
        amount: useEdgeFunction ? params.amount * 100 : params.amount, // Edge function expects cents
        currency: params.currency || 'eur',
        metadata: params.metadata || {},
        paymentMethodTypes: params.paymentMethodTypes, // Pass explicit payment method types
      }),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to create payment intent');
    }

    const data: CreatePaymentIntentResponse = await response.json();

    if (!data || !data.clientSecret) {
      throw new Error('Invalid response from payment server');
    }

    console.log('✅ Payment intent created:', data.paymentIntentId);
    return data;
  } catch (error) {
    console.error('Error creating payment intent:', error);
    throw error;
  }
}

export interface ConfirmPaymentRequest {
  paymentIntentId: string;
}

export async function confirmPayment(
  params: ConfirmPaymentRequest
): Promise<any> {
  try {
    const response = await fetch(`${API_URL}/api/stripe/confirm-payment`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(params),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.error || errorData.message || 'Failed to confirm payment');
    }

    return await response.json();
  } catch (error) {
    console.error('Error confirming payment:', error);
    throw error;
  }
}
