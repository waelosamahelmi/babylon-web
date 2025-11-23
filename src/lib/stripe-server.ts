// Server-side Stripe utilities
// Note: This needs to run on a backend server, not in the browser
import Stripe from 'stripe';

// Initialize Stripe with secret key from environment
// This should only be used in server-side code
export function getStripeInstance(secretKey: string): Stripe {
  return new Stripe(secretKey, {
    apiVersion: '2025-02-24.acacia',
  });
}

export interface CreatePaymentIntentParams {
  amount: number; // in cents (e.g., 1000 = €10.00)
  currency: string; // e.g., 'eur'
  paymentMethodTypes: string[]; // e.g., ['card', 'link', 'apple_pay']
  metadata?: Record<string, string>;
}

export async function createPaymentIntent(
  stripe: Stripe,
  params: CreatePaymentIntentParams
): Promise<Stripe.PaymentIntent> {
  const paymentIntent = await stripe.paymentIntents.create({
    amount: params.amount,
    currency: params.currency,
    payment_method_types: params.paymentMethodTypes,
    metadata: params.metadata || {},
  });

  return paymentIntent;
}

export async function retrievePaymentIntent(
  stripe: Stripe,
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.retrieve(paymentIntentId);
}

export async function cancelPaymentIntent(
  stripe: Stripe,
  paymentIntentId: string
): Promise<Stripe.PaymentIntent> {
  return await stripe.paymentIntents.cancel(paymentIntentId);
}

export function constructWebhookEvent(
  stripe: Stripe,
  payload: string | Buffer,
  signature: string,
  webhookSecret: string
): Stripe.Event {
  return stripe.webhooks.constructEvent(payload, signature, webhookSecret);
}
