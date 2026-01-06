/**
 * Saved Payment Methods Component
 * Allows users to view, select, and manage their saved payment methods
 */

import { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { useLanguage } from '@/lib/language-context';
import {
  CreditCard,
  Plus,
  Check,
  Trash2,
  Loader2,
  AlertCircle,
} from 'lucide-react';
import { listSavedPaymentMethods, type SavedPaymentMethod } from '@/lib/payment-api';
import { useToast } from '@/hooks/use-toast';

interface SavedPaymentMethodsProps {
  customerId?: string;
  onSelectMethod?: (methodId: string) => void;
  selectedMethodId?: string;
  showAddNew?: boolean;
  onAddNew?: () => void;
}

// Card brand icons/logos
const getCardBrandIcon = (brand?: string) => {
  const brandUpper = brand?.toUpperCase();
  switch (brandUpper) {
    case 'VISA':
      return '💳 Visa';
    case 'MASTERCARD':
      return '💳 Mastercard';
    case 'AMEX':
      return '💳 American Express';
    case 'DISCOVER':
      return '💳 Discover';
    default:
      return '💳';
  }
};

const getCardBrandColor = (brand?: string) => {
  const brandUpper = brand?.toUpperCase();
  switch (brandUpper) {
    case 'VISA':
      return 'bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800';
    case 'MASTERCARD':
      return 'bg-orange-50 dark:bg-orange-900/20 border-orange-200 dark:border-orange-800';
    case 'AMEX':
      return 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-800';
    default:
      return 'bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700';
  }
};

export function SavedPaymentMethods({
  customerId,
  onSelectMethod,
  selectedMethodId,
  showAddNew = true,
  onAddNew,
}: SavedPaymentMethodsProps) {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [paymentMethods, setPaymentMethods] = useState<SavedPaymentMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string>('');

  // Load saved payment methods
  useEffect(() => {
    if (customerId) {
      loadPaymentMethods();
    }
  }, [customerId]);

  const loadPaymentMethods = async () => {
    if (!customerId) return;

    setIsLoading(true);
    setError('');

    try {
      const result = await listSavedPaymentMethods(customerId);

      if (result.success && result.paymentMethods) {
        setPaymentMethods(result.paymentMethods);
      } else {
        throw new Error(result.error || 'Failed to load payment methods');
      }
    } catch (err: any) {
      console.error('Error loading payment methods:', err);
      setError(err.message || 'Failed to load saved payment methods');

      toast({
        title: t('Virhe', 'Error'),
        description: t(
          'Tallennettujen maksutapojen lataaminen epäonnistui',
          'Failed to load saved payment methods'
        ),
        variant: 'destructive',
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleSelectMethod = (methodId: string) => {
    if (onSelectMethod) {
      onSelectMethod(methodId);
    }
  };

  const handleDeleteMethod = async (methodId: string) => {
    // TODO: Implement delete functionality
    toast({
      title: t('Tulossa pian', 'Coming soon'),
      description: t(
        'Maksutavan poisto-ominaisuus on tulossa pian',
        'Payment method deletion feature is coming soon'
      ),
    });
  };

  if (!customerId) {
    return (
      <Alert>
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>
          {t(
            'Kirjaudu sisään nähdäksesi tallennetut maksutavat',
            'Sign in to view saved payment methods'
          )}
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <div className="flex items-center justify-center py-8">
            <Loader2 className="w-6 h-6 animate-spin text-gray-400" />
          </div>
        </CardContent>
      </Card>
    );
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircle className="h-4 w-4" />
        <AlertDescription>{error}</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="space-y-4">
      <CardHeader className="px-0 pt-0">
        <CardTitle className="text-lg">
          {t('Tallennetut maksutavat', 'Saved Payment Methods')}
        </CardTitle>
      </CardHeader>

      {paymentMethods.length === 0 ? (
        <div className="text-center py-8 bg-gray-50 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700">
          <CreditCard className="w-12 h-12 mx-auto mb-3 text-gray-400" />
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {t(
              'Ei tallennettuja maksutapoja',
              'No saved payment methods'
            )}
          </p>
          {showAddNew && onAddNew && (
            <Button onClick={onAddNew} variant="outline" size="sm">
              <Plus className="w-4 h-4 mr-2" />
              {t('Lisää maksutapa', 'Add Payment Method')}
            </Button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {paymentMethods.map((method) => (
            <Card
              key={method.id}
              className={`cursor-pointer transition-all hover:shadow-md ${
                selectedMethodId === method.id
                  ? 'ring-2 ring-blue-500 dark:ring-blue-400'
                  : ''
              } ${getCardBrandColor(method.card?.brand)}`}
              onClick={() => handleSelectMethod(method.id)}
            >
              <CardContent className="p-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-3 flex-1">
                    {/* Card brand icon */}
                    <div className="text-2xl">
                      {getCardBrandIcon(method.card?.brand)}
                    </div>

                    {/* Card details */}
                    <div className="flex-1">
                      <div className="flex items-center space-x-2">
                        <span className="font-medium text-gray-900 dark:text-gray-100">
                          {method.card?.brand?.toUpperCase() || 'Card'}
                        </span>
                        <span className="text-gray-600 dark:text-gray-400">
                          •••• {method.card?.last4}
                        </span>
                      </div>
                      {method.card?.expMonth && method.card?.expYear && (
                        <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                          {t('Voimassa', 'Expires')}{' '}
                          {String(method.card.expMonth).padStart(2, '0')}/
                          {method.card.expYear}
                        </div>
                      )}
                    </div>

                    {/* Selection indicator */}
                    {selectedMethodId === method.id && (
                      <div className="flex items-center justify-center w-6 h-6 rounded-full bg-blue-600 text-white">
                        <Check className="w-4 h-4" />
                      </div>
                    )}
                  </div>

                  {/* Delete button */}
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteMethod(method.id);
                    }}
                    className="ml-2"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </CardContent>
            </Card>
          ))}

          {/* Add new button */}
          {showAddNew && onAddNew && (
            <>
              <Separator className="my-4" />
              <Button
                onClick={onAddNew}
                variant="outline"
                className="w-full"
              >
                <Plus className="w-4 h-4 mr-2" />
                {t('Lisää uusi maksutapa', 'Add New Payment Method')}
              </Button>
            </>
          )}
        </div>
      )}
    </div>
  );
}
