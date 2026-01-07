import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/lib/language-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { Check, X, Loader2, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { sendOrderConfirmationEmail, OrderEmailData } from '@/lib/email-service';

export default function OrderSuccess() {
  const { t, language } = useLanguage();
  const [, setLocation] = useLocation();
  const { clearCart } = useCart();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [orderNumber, setOrderNumber] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const processPaymentResult = async () => {
      // Parse URL parameters
      const params = new URLSearchParams(window.location.search);
      const redirectStatus = params.get('redirect_status');
      const paymentIntentId = params.get('payment_intent');
      
      // Also check sessionStorage for backup order ID (in case stripe_payment_intent_id wasn't saved)
      const backupOrderId = sessionStorage.getItem('pending_order_id');
      const backupOrderNumber = sessionStorage.getItem('pending_order_number');
      
      console.log('Order success page loaded:', { redirectStatus, paymentIntentId, backupOrderId });

      if (redirectStatus === 'failed') {
        setStatus('failed');
        setErrorMessage(t('Maksu epäonnistui', 'Payment failed'));
        // If payment failed, mark the order as failed
        if (paymentIntentId) {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('stripe_payment_intent_id', paymentIntentId);
        } else if (backupOrderId) {
          await supabase
            .from('orders')
            .update({ payment_status: 'failed' })
            .eq('id', parseInt(backupOrderId));
        }
        // Clear backup data
        sessionStorage.removeItem('pending_order_id');
        sessionStorage.removeItem('pending_order_number');
        return;
      }

      if (redirectStatus === 'succeeded' && paymentIntentId) {
        try {
          // Look up the existing order - prioritize sessionStorage backup due to potential timing issues
          let order = null;
          
          console.log('🔍 Looking for order with payment_intent:', paymentIntentId);
          
          const apiUrl = import.meta.env.VITE_API_URL || 'https://babylon-admin.fly.dev';
          
          // Try backup order ID from sessionStorage FIRST (more reliable)
          if (backupOrderId) {
            console.log('Trying backup order ID first:', backupOrderId);
            
            try {
              const response = await fetch(`${apiUrl}/api/orders/${backupOrderId}`);
              if (response.ok) {
                order = await response.json();
                console.log('✅ Found order by backup ID:', order.id);
              }
            } catch (apiError) {
              console.error('Backup API error:', apiError);
            }
          }
          
          // Fallback: try payment intent lookup
          if (!order) {
            try {
              const response = await fetch(`${apiUrl}/api/orders/by-payment-intent/${paymentIntentId}`);
              if (response.ok) {
                order = await response.json();
                console.log('✅ Found order by payment intent ID:', order.id);
              } else {
                console.log('❌ Order not found by payment intent');
              }
            } catch (apiError) {
              console.error('Payment intent API error:', apiError);
            }
          }

          if (!order) {
            console.error('Order not found for payment intent:', paymentIntentId);
            setStatus('failed');
            setErrorMessage(t('Tilausta ei löytynyt', 'Order not found'));
            sessionStorage.removeItem('pending_order_id');
            sessionStorage.removeItem('pending_order_number');
            return;
          }

          console.log('Found order:', order);

          // Update payment status to paid if it's still pending (pending_payment or pending)
          if (order.payment_status === 'pending_payment' || order.payment_status === 'pending') {
            const { error: updateError } = await supabase
              .from('orders')
              .update({ payment_status: 'paid' })
              .eq('id', order.id);

            if (updateError) {
              console.error('Error updating payment status:', updateError);
              // Still show success since payment succeeded
            } else {
              console.log('Order payment status updated to paid');
              
              // Send order confirmation email
              if (order.customer_email) {
                try {
                  // Fetch order items for the email
                  const { data: orderItems } = await supabase
                    .from('order_items')
                    .select(`
                      *,
                      menu_item:menu_items(name, name_en)
                    `)
                    .eq('order_id', order.id);
                  
                  // Fetch branch info if available
                  let branchInfo = null;
                  if (order.branch_id) {
                    const { data: branch } = await supabase
                      .from('branches')
                      .select('name, name_en, phone, address')
                      .eq('id', order.branch_id)
                      .single();
                    branchInfo = branch;
                  }
                  
                  const emailData: OrderEmailData = {
                    customerName: order.customer_name,
                    customerEmail: order.customer_email,
                    orderNumber: order.order_number,
                    orderItems: (orderItems || []).map((item: any) => ({
                      name: language === 'en' && item.menu_item?.name_en 
                        ? item.menu_item.name_en 
                        : item.menu_item?.name || 'Item',
                      quantity: item.quantity,
                      price: parseFloat(item.total_price),
                      toppings: item.selected_toppings || []
                    })),
                    subtotal: parseFloat(order.subtotal),
                    deliveryFee: parseFloat(order.delivery_fee || '0'),
                    smallOrderFee: order.small_order_fee ? parseFloat(order.small_order_fee) : undefined,
                    serviceFee: order.service_fee ? parseFloat(order.service_fee) : undefined,
                    totalAmount: parseFloat(order.total_amount),
                    orderType: order.order_type as 'delivery' | 'pickup' | 'dine-in',
                    deliveryAddress: order.delivery_address || undefined,
                    branchName: branchInfo ? (language === 'en' && branchInfo.name_en ? branchInfo.name_en : branchInfo.name) : undefined,
                    branchPhone: branchInfo?.phone,
                    branchAddress: branchInfo?.address,
                    specialInstructions: order.special_instructions || undefined,
                    paymentMethod: order.payment_method || 'online'
                  };
                  
                  const emailResult = await sendOrderConfirmationEmail(emailData, language === 'en' ? 'en' : 'fi');
                  if (emailResult.success) {
                    console.log('Order confirmation email sent successfully');
                  } else {
                    console.error('Failed to send order confirmation email:', emailResult.error);
                  }
                } catch (emailError) {
                  console.error('Error sending order confirmation email:', emailError);
                  // Don't fail the order success flow if email fails
                }
              }
            }
          }

          // Clear cart and sessionStorage backup
          clearCart();
          sessionStorage.removeItem('pending_order_id');
          sessionStorage.removeItem('pending_order_number');

          setOrderNumber(order.order_number || order.id?.toString());
          setStatus('success');
        } catch (err) {
          console.error('Error processing payment result:', err);
          setStatus('failed');
          setErrorMessage(t('Tilauksen käsittely epäonnistui', 'Failed to process order'));
        }
      } else {
        // Unknown state
        setStatus('failed');
        setErrorMessage(t('Tuntematon maksun tila', 'Unknown payment status'));
      }
    };

    processPaymentResult();
  }, [clearCart, t]);

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 flex items-center justify-center p-4">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          {status === 'loading' && (
            <>
              <div className="mx-auto w-16 h-16 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4">
                <Loader2 className="w-8 h-8 text-blue-600 animate-spin" />
              </div>
              <CardTitle className="text-xl">
                {t("Vahvistetaan maksua...", "Confirming payment...")}
              </CardTitle>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-700 dark:text-green-400">
                {t("Tilaus vastaanotettu!", "Order Received!")}
              </CardTitle>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">
                {t("Jotain meni pieleen", "Something went wrong")}
              </CardTitle>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <>
              <p className="text-gray-600 dark:text-gray-300">
                {t(
                  "Kiitos tilauksestasi! Tilauksesi on vastaanotettu ja sitä aletaan valmistaa.",
                  "Thank you for your order! Your order has been received and will be prepared shortly."
                )}
              </p>
              {orderNumber && (
                <p className="text-lg font-bold text-primary">
                  {t("Tilausnumero", "Order number")}: #{orderNumber}
                </p>
              )}
            </>
          )}
          
          {status === 'failed' && (
            <p className="text-gray-600 dark:text-gray-300">
              {errorMessage || t(
                "Maksusi ei onnistunut. Yritä uudelleen tai valitse toinen maksutapa.",
                "Your payment was not successful. Please try again or choose a different payment method."
              )}
            </p>
          )}
          
          <div className="flex flex-col sm:flex-row gap-3 pt-4">
            <Button
              variant="outline"
              className="flex-1"
              onClick={() => setLocation('/menu')}
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {t("Takaisin menuun", "Back to Menu")}
            </Button>
            <Button
              className="flex-1"
              onClick={() => setLocation('/')}
            >
              <Home className="w-4 h-4 mr-2" />
              {t("Etusivulle", "Go to Home")}
            </Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
