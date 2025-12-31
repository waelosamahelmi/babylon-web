import { useEffect, useState } from 'react';
import { useLocation } from 'wouter';
import { useLanguage } from '@/lib/language-context';
import { Check, X, Loader2, Home, ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function OrderSuccess() {
  const { t } = useLanguage();
  const [, setLocation] = useLocation();
  const [status, setStatus] = useState<'loading' | 'success' | 'failed'>('loading');
  const [paymentIntentId, setPaymentIntentId] = useState<string | null>(null);

  useEffect(() => {
    // Parse URL parameters
    const params = new URLSearchParams(window.location.search);
    const redirectStatus = params.get('redirect_status');
    const piId = params.get('payment_intent');
    
    setPaymentIntentId(piId);
    
    if (redirectStatus === 'succeeded') {
      setStatus('success');
    } else if (redirectStatus === 'failed') {
      setStatus('failed');
    } else {
      // Check payment intent status if no redirect_status
      setStatus('loading');
      // After a brief delay, assume success if we have a payment_intent
      setTimeout(() => {
        if (piId) {
          setStatus('success');
        } else {
          setStatus('failed');
        }
      }, 2000);
    }
  }, []);

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
                {t("Käsitellään maksua...", "Processing payment...")}
              </CardTitle>
            </>
          )}
          
          {status === 'success' && (
            <>
              <div className="mx-auto w-16 h-16 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mb-4">
                <Check className="w-8 h-8 text-green-600" />
              </div>
              <CardTitle className="text-xl text-green-700 dark:text-green-400">
                {t("Maksu onnistui!", "Payment Successful!")}
              </CardTitle>
            </>
          )}
          
          {status === 'failed' && (
            <>
              <div className="mx-auto w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-4">
                <X className="w-8 h-8 text-red-600" />
              </div>
              <CardTitle className="text-xl text-red-700 dark:text-red-400">
                {t("Maksu epäonnistui", "Payment Failed")}
              </CardTitle>
            </>
          )}
        </CardHeader>
        
        <CardContent className="text-center space-y-4">
          {status === 'success' && (
            <>
              <p className="text-gray-600 dark:text-gray-300">
                {t(
                  "Kiitos tilauksestasi! Saat vahvistuksen sähköpostiisi.",
                  "Thank you for your order! You will receive a confirmation email."
                )}
              </p>
              <p className="text-sm text-gray-500">
                {t("Tilausnumero", "Order reference")}: {paymentIntentId?.slice(-8).toUpperCase()}
              </p>
            </>
          )}
          
          {status === 'failed' && (
            <p className="text-gray-600 dark:text-gray-300">
              {t(
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
