import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/lib/language-context';
import { useCart } from '@/lib/cart-context';
import { supabase } from '@/lib/supabase';
import { Check, X, Loader2, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderSuccess() {
  const { t } = useLanguage();
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
      
      console.log('Order success page loaded:', { redirectStatus, paymentIntentId });

      if (redirectStatus === 'failed') {
        setStatus('failed');
        setErrorMessage(t('Maksu epäonnistui', 'Payment failed'));
        // If payment failed, mark the order as payment_failed
        if (paymentIntentId) {
          await supabase
            .from('orders')
            .update({ payment_status: 'payment_failed' })
            .eq('stripe_payment_intent_id', paymentIntentId);
        }
        return;
      }

      if (redirectStatus === 'succeeded' && paymentIntentId) {
        try {
          // Look up the existing order by payment_intent_id
          // The order was already created with pending_payment status before Stripe redirect
          const { data: order, error: fetchError } = await supabase
            .from('orders')
            .select('*')
            .eq('stripe_payment_intent_id', paymentIntentId)
            .single();

          if (fetchError || !order) {
            console.error('Order not found for payment intent:', paymentIntentId, fetchError);
            setStatus('failed');
            setErrorMessage(t('Tilausta ei löytynyt', 'Order not found'));
            return;
          }

          console.log('Found order:', order);

          // Update payment status to paid if it's still pending_payment
          if (order.payment_status === 'pending_payment') {
            const { error: updateError } = await supabase
              .from('orders')
              .update({ payment_status: 'paid' })
              .eq('id', order.id);

            if (updateError) {
              console.error('Error updating payment status:', updateError);
              // Still show success since payment succeeded
            } else {
              console.log('Order payment status updated to paid');
            }
          }

          // Clear cart
          clearCart();

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
