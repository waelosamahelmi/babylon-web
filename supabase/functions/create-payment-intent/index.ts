// Supabase Edge Function for creating Stripe Payment Intents
// Deploy this to: supabase/functions/create-payment-intent/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    // Initialize Supabase client first to fetch Stripe keys from database
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Stripe configuration from restaurant_settings table
    const { data: settings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .select('stripe_secret_key, stripe_enabled')
      .single();

    if (settingsError) {
      console.error('Error fetching restaurant settings:', settingsError);
      throw new Error('Failed to fetch Stripe configuration from database');
    }

    // Fall back to environment variables if database values are not set
    const stripeSecretKey = settings?.stripe_secret_key || Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured - check restaurant_settings table or environment variables');
    }

    if (settings && !settings.stripe_enabled) {
      console.log('Stripe is disabled in restaurant settings');
      return new Response(
        JSON.stringify({ error: 'Stripe is disabled' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const { amount, currency = 'eur', paymentMethodTypes = ['card'], metadata = {} } = await req.json();

    if (!amount || amount <= 0) {
      return new Response(
        JSON.stringify({ error: 'Invalid amount' }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    // Create payment intent
    // Note: Use either payment_method_types OR automatic_payment_methods, not both
    const paymentIntentParams: Stripe.PaymentIntentCreateParams = {
      amount: Math.round(amount), // Amount in cents
      currency,
      metadata,
    };

    // If specific payment methods are requested, use payment_method_types
    // Otherwise, enable automatic payment methods
    if (paymentMethodTypes && paymentMethodTypes.length > 0) {
      paymentIntentParams.payment_method_types = paymentMethodTypes;
    } else {
      paymentIntentParams.automatic_payment_methods = {
        enabled: true,
        allow_redirects: 'never', // Keep it embedded
      };
    }

    const paymentIntent = await stripe.paymentIntents.create(paymentIntentParams);

    // CRITICAL: Update the order with payment intent ID immediately
    // This ensures the webhook can find the order later
    if (metadata.orderId) {
      try {
        const { error: updateError } = await supabase
          .from('orders')
          .update({ stripe_payment_intent_id: paymentIntent.id })
          .eq('id', parseInt(metadata.orderId as string));

        if (updateError) {
          console.error('Failed to update order with payment intent ID:', updateError);
          // Don't fail the request - webhook will handle it as fallback
        } else {
          console.log(`✅ Order ${metadata.orderId} updated with payment intent ${paymentIntent.id}`);
        }
      } catch (error) {
        console.error('Error updating order:', error);
        // Don't fail - webhook will handle it as fallback
      }
    }

    return new Response(
      JSON.stringify({
        clientSecret: paymentIntent.client_secret,
        paymentIntentId: paymentIntent.id,
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error creating payment intent:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
