/**
 * Payment Recovery Modal
 * Shows when payment fails and offers recovery options
 */

import { useState } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/language-context';
import {
  XCircle,
  RefreshCw,
  CreditCard,
  HelpCircle,
  Mail,
  Phone,
  Loader2,
} from 'lucide-react';
import { retryPayment } from '@/lib/payment-api';
import { useToast } from '@/hooks/use-toast';

interface PaymentRecoveryModalProps {
  isOpen: boolean;
  onClose: () => void;
  orderId?: number;
  orderNumber?: string;
  amount: number;
  errorMessage: string;
  errorCode?: string;
  onRetrySuccess?: (clientSecret: string, paymentIntentId: string) => void;
  onTryDifferentMethod?: () => void;
}

export function PaymentRecoveryModal({
  isOpen,
  onClose,
  orderId,
  orderNumber,
  amount,
  errorMessage,
  errorCode,
  onRetrySuccess,
  onTryDifferentMethod,
}: PaymentRecoveryModalProps) {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [isRetrying, setIsRetrying] = useState(false);

  const handleRetryPayment = async () => {
    if (!orderId) {
      toast({
        title: t('Virhe', 'Error'),
        description: t('Tilausnumeroa ei löytynyt', 'Order ID not found'),
        variant: 'destructive',
      });
      return;
    }

    setIsRetrying(true);

    try {
      const result = await retryPayment(orderId);

      if (result.success && result.clientSecret && result.paymentIntentId) {
        toast({
          title: t('Maksu luotu', 'Payment created'),
          description: t(
            'Voit nyt yrittää maksua uudelleen',
            'You can now retry the payment'
          ),
        });

        if (onRetrySuccess) {
          onRetrySuccess(result.clientSecret, result.paymentIntentId);
        }

        onClose();
      } else {
        throw new Error(result.error || 'Failed to retry payment');
      }
    } catch (error: any) {
      console.error('Error retrying payment:', error);

      toast({
        title: t('Uudelleenyritys epäonnistui', 'Retry failed'),
        description: error.message || t(
          'Maksun uudelleenyritys epäonnistui',
          'Failed to retry payment'
        ),
        variant: 'destructive',
      });
    } finally {
      setIsRetrying(false);
    }
  };

  const getErrorSuggestion = () => {
    switch (errorCode) {
      case 'card_declined':
        return t(
          'Korttisi hylättiin. Tarkista kortin tiedot tai yritä eri maksutapaa.',
          'Your card was declined. Check card details or try a different payment method.'
        );
      case 'insufficient_funds':
        return t(
          'Kortilla ei ole tarpeeksi katetta. Yritä eri kortilla tai maksutavalla.',
          'Insufficient funds on card. Try a different card or payment method.'
        );
      case 'expired_card':
        return t(
          'Korttisi on vanhentunut. Käytä toista korttia.',
          'Your card has expired. Use a different card.'
        );
      case 'incorrect_cvc':
        return t(
          'Turvakoodi on virheellinen. Tarkista CVC-koodi.',
          'Security code is incorrect. Check your CVC code.'
        );
      case 'processing_error':
        return t(
          'Maksun käsittelyssä tapahtui virhe. Yritä hetken kuluttua uudelleen.',
          'Payment processing error. Please try again in a moment.'
        );
      default:
        return t(
          'Voit yrittää maksua uudelleen tai valita toisen maksutavan.',
          'You can retry the payment or choose a different payment method.'
        );
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <div className="flex items-center space-x-3">
            <div className="flex-shrink-0">
              <div className="flex items-center justify-center w-12 h-12 rounded-full bg-red-100 dark:bg-red-900/20">
                <XCircle className="w-6 h-6 text-red-600 dark:text-red-400" />
              </div>
            </div>
            <div>
              <DialogTitle>
                {t('Maksu epäonnistui', 'Payment Failed')}
              </DialogTitle>
              <DialogDescription>
                {orderNumber && (
                  <span className="text-xs">
                    {t('Tilaus', 'Order')} #{orderNumber}
                  </span>
                )}
              </DialogDescription>
            </div>
          </div>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {/* Error message */}
          <Alert variant="destructive">
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">{errorMessage}</p>
                {errorCode && (
                  <p className="text-xs opacity-75">
                    {t('Virhekoodi', 'Error code')}: {errorCode}
                  </p>
                )}
              </div>
            </AlertDescription>
          </Alert>

          {/* Suggestion */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-lg border border-blue-200 dark:border-blue-800">
            <div className="flex items-start space-x-2">
              <HelpCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-blue-800 dark:text-blue-200">
                {getErrorSuggestion()}
              </p>
            </div>
          </div>

          {/* Payment amount reminder */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-lg">
            <div className="flex items-center justify-between">
              <span className="text-sm text-gray-600 dark:text-gray-400">
                {t('Maksettava summa', 'Amount to pay')}
              </span>
              <span className="text-lg font-bold text-gray-900 dark:text-gray-100">
                €{amount.toFixed(2)}
              </span>
            </div>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-col space-y-2">
          {/* Primary action: Retry */}
          <Button
            onClick={handleRetryPayment}
            disabled={isRetrying || !orderId}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white"
          >
            {isRetrying ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                {t('Yritetään uudelleen...', 'Retrying...')}
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                {t('Yritä maksua uudelleen', 'Retry Payment')}
              </>
            )}
          </Button>

          {/* Secondary action: Try different method */}
          {onTryDifferentMethod && (
            <Button
              variant="outline"
              onClick={() => {
                onTryDifferentMethod();
                onClose();
              }}
              disabled={isRetrying}
              className="w-full"
            >
              <CreditCard className="mr-2 h-4 w-4" />
              {t('Kokeile toista maksutapaa', 'Try Different Payment Method')}
            </Button>
          )}

          {/* Tertiary action: Contact support */}
          <div className="w-full pt-2 border-t">
            <p className="text-xs text-center text-gray-500 dark:text-gray-400 mb-2">
              {t('Tarvitsetko apua?', 'Need help?')}
            </p>
            <div className="flex justify-center space-x-4 text-xs">
              <a
                href="mailto:info@ravintolababylon.fi"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Mail className="w-3 h-3" />
                <span>{t('Sähköposti', 'Email')}</span>
              </a>
              <a
                href="tel:+358123456789"
                className="flex items-center space-x-1 text-blue-600 hover:text-blue-700 dark:text-blue-400"
              >
                <Phone className="w-3 h-3" />
                <span>{t('Soita', 'Call')}</span>
              </a>
            </div>
          </div>

          {/* Cancel button */}
          <Button
            variant="ghost"
            onClick={onClose}
            disabled={isRetrying}
            className="w-full"
          >
            {t('Sulje', 'Close')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
