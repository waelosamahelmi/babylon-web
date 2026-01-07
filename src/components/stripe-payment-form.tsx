import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/lib/language-context';
import { Loader2, CreditCard, Shield } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

interface StripePaymentFormProps {
  clientSecret: string;
  amount: number;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string) => void;
  onCancel: () => void;
}

export function StripePaymentForm({
  clientSecret,
  amount,
  onSuccess,
  onError,
  onCancel,
}: StripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isProcessing, setIsProcessing] = useState(false);
  const [isReady, setIsReady] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setIsProcessing(true);

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-success',
        },
        redirect: 'if_required',
      });

      if (error) {
        onError(error.message || 'Payment failed');
        toast({
          title: t('Maksu epäonnistui', 'Payment failed'),
          description: error.message,
          variant: 'destructive',
        });
      } else if (paymentIntent && paymentIntent.status === 'succeeded') {
        onSuccess(paymentIntent.id);
        toast({
          title: t('Maksu onnistui', 'Payment successful'),
          description: t('Maksusi on vastaanotettu', 'Your payment has been received'),
        });
      }
    } catch (err: any) {
      onError(err.message || 'An unexpected error occurred');
      toast({
        title: t('Virhe', 'Error'),
        description: err.message,
        variant: 'destructive',
      });
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Payment amount display */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <CreditCard className="w-5 h-5 text-blue-600 dark:text-blue-400" />
            <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
              {t('Maksettava summa', 'Amount to pay')}
            </span>
          </div>
          <span className="text-2xl font-bold text-blue-600 dark:text-blue-400">
            €{amount.toFixed(2)}
          </span>
        </div>
      </div>

      {/* Stripe Payment Element */}
      <div className="min-h-[200px]">
        <PaymentElement
          onReady={() => setIsReady(true)}
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Security badge */}
      <div className="flex items-center justify-center space-x-2 text-xs text-gray-500 dark:text-gray-400">
        <Shield className="w-4 h-4" />
        <span>
          {t(
            'Turvallinen maksu Stripe-palvelun kautta',
            'Secure payment powered by Stripe'
          )}
        </span>
      </div>

      {/* Action buttons */}
      <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-2">
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isProcessing}
          className="w-full sm:flex-1"
        >
          {t('Peruuta', 'Cancel')}
        </Button>
        <Button
          type="submit"
          disabled={!stripe || !isReady || isProcessing}
          className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
        >
          {isProcessing ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              {t('Käsitellään...', 'Processing...')}
            </>
          ) : (
            <>
              <CreditCard className="mr-2 h-4 w-4" />
              {t(`Maksa €${amount.toFixed(2)}`, `Pay €${amount.toFixed(2)}`)}
            </>
          )}
        </Button>
      </div>
    </form>
  );
}
