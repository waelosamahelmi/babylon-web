// Supabase Edge Function for confirming payment and updating order status
// This is called by the frontend immediately after Stripe confirms payment
// Uses service role key to bypass RLS and update order status

import { serve } from 'https://deno.land/std@0.192.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2.39.0';

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
    const { paymentIntentId, orderId } = await req.json();

    if (!paymentIntentId || !orderId) {
      throw new Error('Missing paymentIntentId or orderId');
    }

    console.log(`🔍 Confirming payment for order ${orderId}, payment intent: ${paymentIntentId}`);

    // Initialize Supabase with service role key
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get Stripe configuration from database
    const { data: settings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .select('stripe_secret_key, stripe_enabled')
      .single();

    if (settingsError) {
      console.error('Error fetching restaurant settings:', settingsError);
      throw new Error('Failed to fetch Stripe configuration');
    }

    const stripeSecretKey = settings?.stripe_secret_key || Deno.env.get('STRIPE_SECRET_KEY');

    if (!stripeSecretKey) {
      throw new Error('Stripe secret key not configured');
    }

    // Initialize Stripe
    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    // Verify the payment intent status with Stripe
    const paymentIntent = await stripe.paymentIntents.retrieve(paymentIntentId);

    if (paymentIntent.status !== 'succeeded') {
      console.error(`Payment intent ${paymentIntentId} has status: ${paymentIntent.status}`);
      return new Response(
        JSON.stringify({ error: 'Payment not successful', status: paymentIntent.status }),
        { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    console.log(`✅ Payment verified as successful: ${paymentIntentId}`);

    // Update order status to 'paid' using service role permissions
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        payment_status: 'paid',
        stripe_payment_intent_id: paymentIntentId,
        updated_at: new Date().toISOString(),
      })
      .eq('id', parseInt(orderId));

    if (updateError) {
      console.error('Error updating order:', updateError);
      throw new Error('Failed to update order status');
    }

    console.log(`✅ Order ${orderId} marked as paid`);

    // Fetch the updated order to return to frontend
    const { data: order, error: fetchError } = await supabase
      .from('orders')
      .select('*')
      .eq('id', parseInt(orderId))
      .single();

    if (fetchError) {
      console.error('Error fetching order:', fetchError);
      throw new Error('Failed to fetch order details');
    }

    return new Response(
      JSON.stringify({
        success: true,
        order: order,
        message: 'Payment confirmed and order updated',
      }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Error confirming payment:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
