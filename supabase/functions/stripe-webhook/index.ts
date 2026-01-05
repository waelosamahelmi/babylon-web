// Supabase Edge Function for Stripe webhooks
// Deploy this to: supabase/functions/stripe-webhook/index.ts

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import Stripe from 'https://esm.sh/stripe@14.10.0?target=deno';
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type, stripe-signature',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

    if (!supabaseUrl || !supabaseServiceKey) {
      throw new Error('Supabase configuration missing');
    }

    // Initialize Supabase client first to fetch Stripe keys from database
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Fetch Stripe configuration from restaurant_settings table
    const { data: settings, error: settingsError } = await supabase
      .from('restaurant_settings')
      .select('stripe_secret_key, stripe_webhook_secret, stripe_enabled')
      .single();

    if (settingsError) {
      console.error('Error fetching restaurant settings:', settingsError);
      throw new Error('Failed to fetch Stripe configuration from database');
    }

    // Fall back to environment variables if database values are not set
    const stripeSecretKey = settings?.stripe_secret_key || Deno.env.get('STRIPE_SECRET_KEY');
    const webhookSecret = settings?.stripe_webhook_secret || Deno.env.get('STRIPE_WEBHOOK_SECRET');

    if (!stripeSecretKey || !webhookSecret) {
      throw new Error('Stripe configuration missing - check restaurant_settings table or environment variables');
    }

    if (settings && !settings.stripe_enabled) {
      console.log('Stripe is disabled in restaurant settings');
      return new Response(
        JSON.stringify({ received: true, message: 'Stripe disabled' }),
        { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
      );
    }

    const stripe = new Stripe(stripeSecretKey, {
      apiVersion: '2024-11-20.acacia',
      httpClient: Stripe.createFetchHttpClient(),
    });

    const signature = req.headers.get('stripe-signature');
    if (!signature) {
      return new Response('No signature', { status: 400 });
    }

    const body = await req.text();
    const event = await stripe.webhooks.constructEventAsync(
      body,
      signature,
      webhookSecret
    );

    // Handle different event types
    switch (event.type) {
      case 'payment_intent.succeeded': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // First, fetch the order to check current status
        const { data: existingOrder } = await supabase
          .from('orders')
          .select('*')
          .eq('stripe_payment_intent_id', paymentIntent.id)
          .single();
        
        // Only update if not already paid (to avoid duplicate email sends)
        if (existingOrder && existingOrder.payment_status !== 'paid') {
          // Update order payment status
          const { error } = await supabase
            .from('orders')
            .update({
              payment_status: 'paid',
              stripe_payment_intent_id: paymentIntent.id,
            })
            .eq('stripe_payment_intent_id', paymentIntent.id);

          if (error) {
            console.error('Error updating order:', error);
          } else {
            console.log('Order payment status updated to paid via webhook');
            
            // Send order confirmation email if customer has email
            if (existingOrder.customer_email) {
              try {
                const emailApiUrl = Deno.env.get('EMAIL_API_URL');
                if (emailApiUrl) {
                  // Fetch order items
                  const { data: orderItems } = await supabase
                    .from('order_items')
                    .select(`*, menu_item:menu_items(name, name_en)`)
                    .eq('order_id', existingOrder.id);
                  
                  // Fetch branch info
                  let branchInfo = null;
                  if (existingOrder.branch_id) {
                    const { data: branch } = await supabase
                      .from('branches')
                      .select('name, name_en, phone, address')
                      .eq('id', existingOrder.branch_id)
                      .single();
                    branchInfo = branch;
                  }
                  
                  // Call email API
                  const emailResponse = await fetch(`${emailApiUrl}/api/send-order-confirmation`, {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                      customerName: existingOrder.customer_name,
                      customerEmail: existingOrder.customer_email,
                      orderNumber: existingOrder.order_number,
                      orderItems: (orderItems || []).map((item: any) => ({
                        name: item.menu_item?.name || 'Item',
                        quantity: item.quantity,
                        price: parseFloat(item.total_price),
                      })),
                      subtotal: parseFloat(existingOrder.subtotal),
                      deliveryFee: parseFloat(existingOrder.delivery_fee || '0'),
                      totalAmount: parseFloat(existingOrder.total_amount),
                      orderType: existingOrder.order_type,
                      deliveryAddress: existingOrder.delivery_address,
                      branchName: branchInfo?.name,
                      branchPhone: branchInfo?.phone,
                      branchAddress: branchInfo?.address,
                      paymentMethod: existingOrder.payment_method || 'online',
                      language: 'fi'
                    })
                  });
                  
                  if (emailResponse.ok) {
                    console.log('Order confirmation email sent successfully via webhook');
                  } else {
                    console.error('Failed to send email via webhook:', await emailResponse.text());
                  }
                }
              } catch (emailError) {
                console.error('Error sending confirmation email from webhook:', emailError);
              }
            }
          }
        } else if (existingOrder) {
          console.log('Order already marked as paid, skipping update');
        }
        break;
      }

      case 'payment_intent.payment_failed': {
        const paymentIntent = event.data.object as Stripe.PaymentIntent;
        
        // Update order payment status
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'failed',
          })
          .eq('stripe_payment_intent_id', paymentIntent.id);

        if (error) {
          console.error('Error updating order:', error);
        }
        break;
      }

      case 'charge.refunded': {
        const charge = event.data.object as Stripe.Charge;
        
        // Update order payment status
        const { error } = await supabase
          .from('orders')
          .update({
            payment_status: 'refunded',
          })
          .eq('stripe_payment_intent_id', charge.payment_intent as string);

        if (error) {
          console.error('Error updating order:', error);
        }
        break;
      }
    }

    return new Response(
      JSON.stringify({ received: true }),
      { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('Webhook error:', error);
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
