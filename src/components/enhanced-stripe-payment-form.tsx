/**
 * Enhanced Stripe Payment Form
 * Features: Better loading states, real-time status updates, error recovery, retry mechanism
 */

import { useState, useEffect } from 'react';
import {
  PaymentElement,
  useStripe,
  useElements,
} from '@stripe/react-stripe-js';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/language-context';
import {
  Loader2,
  CreditCard,
  Shield,
  CheckCircle,
  XCircle,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { useToast } from '@/hooks/use-toast';
import { pollPaymentStatus, formatPaymentError } from '@/lib/payment-api';

interface EnhancedStripePaymentFormProps {
  clientSecret: string;
  amount: number;
  orderId?: number;
  paymentIntentId?: string;
  onSuccess: (paymentIntentId: string) => void;
  onError: (error: string, errorCode?: string) => void;
  onCancel: () => void;
  onRetry?: () => void;
}

type PaymentState = 'idle' | 'processing' | 'succeeded' | 'failed' | 'requires_action';

export function EnhancedStripePaymentForm({
  clientSecret,
  amount,
  orderId,
  paymentIntentId,
  onSuccess,
  onError,
  onCancel,
  onRetry,
}: EnhancedStripePaymentFormProps) {
  const stripe = useStripe();
  const elements = useElements();
  const { t } = useLanguage();
  const { toast } = useToast();

  const [paymentState, setPaymentState] = useState<PaymentState>('idle');
  const [isReady, setIsReady] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [errorCode, setErrorCode] = useState<string>('');
  const [retryCount, setRetryCount] = useState(0);
  const [statusMessage, setStatusMessage] = useState<string>('');

  // Poll payment status if paymentIntentId is provided
  useEffect(() => {
    if (paymentIntentId && paymentState === 'processing') {
      pollPaymentStatus(
        paymentIntentId,
        (status) => {
          setStatusMessage(t(
            `Maksu tilassa: ${status}`,
            `Payment status: ${status}`
          ));

          if (status === 'succeeded') {
            setPaymentState('succeeded');
            onSuccess(paymentIntentId);
          } else if (status === 'failed') {
            setPaymentState('failed');
            setErrorMessage(t('Maksu epäonnistui', 'Payment failed'));
          }
        }
      ).catch(error => {
        console.error('Error polling payment status:', error);
      });
    }
  }, [paymentIntentId, paymentState, t, onSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stripe || !elements) {
      return;
    }

    setPaymentState('processing');
    setErrorMessage('');
    setErrorCode('');
    setStatusMessage(t('Käsitellään maksua...', 'Processing payment...'));

    try {
      const { error, paymentIntent } = await stripe.confirmPayment({
        elements,
        confirmParams: {
          return_url: window.location.origin + '/order-success',
        },
        redirect: 'if_required',
      });

      if (error) {
        // Handle error
        setPaymentState('failed');
        const formattedError = formatPaymentError(error);
        setErrorMessage(formattedError);
        setErrorCode(error.code || 'unknown_error');

        onError(formattedError, error.code);

        toast({
          title: t('Maksu epäonnistui', 'Payment failed'),
          description: formattedError,
          variant: 'destructive',
        });
      } else if (paymentIntent) {
        if (paymentIntent.status === 'succeeded') {
          setPaymentState('succeeded');
          setStatusMessage(t('Maksu onnistui!', 'Payment successful!'));

          onSuccess(paymentIntent.id);

          toast({
            title: t('Maksu onnistui', 'Payment successful'),
            description: t('Maksusi on vastaanotettu', 'Your payment has been received'),
          });
        } else if (paymentIntent.status === 'requires_action') {
          setPaymentState('requires_action');
          setStatusMessage(t(
            'Maksu vaatii lisätoimia',
            'Payment requires additional action'
          ));
        } else if (paymentIntent.status === 'processing') {
          setPaymentState('processing');
          setStatusMessage(t('Maksu käsittelyssä...', 'Payment processing...'));
        } else {
          setPaymentState('failed');
          setErrorMessage(t(
            `Odottamaton maksutila: ${paymentIntent.status}`,
            `Unexpected payment status: ${paymentIntent.status}`
          ));
          onError(`Unexpected status: ${paymentIntent.status}`);
        }
      }
    } catch (err: any) {
      setPaymentState('failed');
      const formattedError = formatPaymentError(err);
      setErrorMessage(formattedError);
      setErrorCode('unexpected_error');

      onError(formattedError, 'unexpected_error');

      toast({
        title: t('Virhe', 'Error'),
        description: formattedError,
        variant: 'destructive',
      });
    }
  };

  const handleRetry = () => {
    setRetryCount(prev => prev + 1);
    setPaymentState('idle');
    setErrorMessage('');
    setErrorCode('');
    setStatusMessage('');

    if (onRetry) {
      onRetry();
    }

    toast({
      title: t('Yritetään uudelleen', 'Retrying'),
      description: t('Yritys numero', 'Attempt') + ` ${retryCount + 1}`,
    });
  };

  // Render payment status indicator
  const renderStatusIndicator = () => {
    switch (paymentState) {
      case 'processing':
        return (
          <div className="flex items-center justify-center space-x-2 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-800">
            <Loader2 className="w-5 h-5 text-blue-600 dark:text-blue-400 animate-spin" />
            <span className="text-sm font-medium text-blue-700 dark:text-blue-300">
              {statusMessage || t('Käsitellään maksua...', 'Processing payment...')}
            </span>
          </div>
        );

      case 'succeeded':
        return (
          <div className="flex items-center justify-center space-x-2 p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-800">
            <CheckCircle className="w-5 h-5 text-green-600 dark:text-green-400" />
            <span className="text-sm font-medium text-green-700 dark:text-green-300">
              {t('Maksu onnistui!', 'Payment successful!')}
            </span>
          </div>
        );

      case 'failed':
        return (
          <Alert variant="destructive">
            <XCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-2">
                <p className="font-medium">
                  {t('Maksu epäonnistui', 'Payment failed')}
                </p>
                <p className="text-sm">{errorMessage}</p>
                {errorCode && (
                  <p className="text-xs opacity-75">
                    {t('Virhekoodi', 'Error code')}: {errorCode}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>
        );

      case 'requires_action':
        return (
          <div className="flex items-center justify-center space-x-2 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-800">
            <AlertTriangle className="w-5 h-5 text-yellow-600 dark:text-yellow-400" />
            <span className="text-sm font-medium text-yellow-700 dark:text-yellow-300">
              {t('Seuraa maksulaitteen ohjeita', 'Follow payment device instructions')}
            </span>
          </div>
        );

      default:
        return null;
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

      {/* Status indicator */}
      {paymentState !== 'idle' && renderStatusIndicator()}

      {/* Retry count indicator */}
      {retryCount > 0 && paymentState === 'idle' && (
        <div className="flex items-center justify-center space-x-2 text-sm text-gray-500">
          <RefreshCw className="w-4 h-4" />
          <span>
            {t('Yritys numero', 'Attempt')} {retryCount + 1}
          </span>
        </div>
      )}

      {/* Stripe Payment Element */}
      <div className="min-h-[200px]">
        <PaymentElement
          onReady={() => {
            setIsReady(true);
            console.log('✅ Payment Element ready');
          }}
          options={{
            layout: 'tabs',
          }}
        />
      </div>

      {/* Loading skeleton while not ready */}
      {!isReady && (
        <div className="absolute inset-0 bg-white dark:bg-gray-900 flex items-center justify-center">
          <div className="space-y-3 w-full max-w-md px-4">
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
            <div className="h-12 bg-gray-200 dark:bg-gray-700 rounded animate-pulse" />
          </div>
        </div>
      )}

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
          disabled={paymentState === 'processing' || paymentState === 'succeeded'}
          className="w-full sm:flex-1"
        >
          {t('Peruuta', 'Cancel')}
        </Button>

        {/* Show retry button if failed */}
        {paymentState === 'failed' && onRetry && (
          <Button
            type="button"
            variant="secondary"
            onClick={handleRetry}
            className="w-full sm:flex-1"
          >
            <RefreshCw className="mr-2 h-4 w-4" />
            {t('Yritä uudelleen', 'Try again')}
          </Button>
        )}

        {/* Main submit button */}
        {paymentState !== 'succeeded' && (
          <Button
            type="submit"
            disabled={
              !stripe ||
              !isReady ||
              paymentState === 'processing' ||
              paymentState === 'requires_action'
            }
            className="w-full sm:flex-1 bg-blue-600 hover:bg-blue-700 text-white"
          >
            {paymentState === 'processing' || paymentState === 'requires_action' ? (
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
        )}
      </div>

      {/* Order ID display for reference */}
      {orderId && (
        <div className="text-center text-xs text-gray-400">
          {t('Tilaus', 'Order')} #{orderId}
        </div>
      )}
    </form>
  );
}
