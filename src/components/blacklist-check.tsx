import { useLanguage } from '@/lib/language-context';
import { useBlacklistCheck } from '@/hooks/use-blacklist';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface BlacklistCheckProps {
  email: string;
  phone?: string;
  onBlacklistDetected?: () => void;
}

export function BlacklistCheck({ email, phone, onBlacklistDetected }: BlacklistCheckProps) {
  const { t } = useLanguage();
  const { isBlacklisted, reason, isLoading } = useBlacklistCheck(email || null, phone || null);

  // Notify parent component when blacklist is detected
  if (isBlacklisted && onBlacklistDetected) {
    onBlacklistDetected();
  }

  if (isLoading) {
    return (
      <div className="flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
        <Loader2 className="w-4 h-4 animate-spin" />
        <span>{t('Tarkistetaan...', 'Checking...', 'جاري التحقق...', 'Проверка...', 'Kontrollerar...')}</span>
      </div>
    );
  }

  if (!isBlacklisted) {
    return null;
  }

  return (
    <Alert variant="destructive" className="border-2 border-red-500 dark:border-red-600">
      <ShieldAlert className="h-5 w-5" />
      <AlertDescription className="font-medium">
        <p className="font-bold mb-1">
          {t(
            'Tilaaminen estetty',
            'Ordering blocked',
            'الطلب محظور',
            'Заказ заблокирован',
            'Beställning blockerad'
          )}
        </p>
        <p className="text-sm">
          {reason || t(
            'Tiliäsi ei voi käyttää tilausten tekemiseen. Ota yhteyttä asiakaspalveluun.',
            'Your account cannot be used to place orders. Please contact customer service.',
            'لا يمكن استخدام حسابك لتقديم الطلبات. يرجى الاتصال بخدمة العملاء.',
            'Ваш аккаунт не может быть использован для размещения заказов. Пожалуйста, свяжитесь со службой поддержки.',
            'Ditt konto kan inte användas för att lägga beställningar. Kontakta kundservice.'
          )}
        </p>
      </AlertDescription>
    </Alert>
  );
}

/**
 * Inline blacklist indicator for forms
 * Shows a small warning without blocking the entire UI
 */
export function BlacklistIndicator({ email, phone }: { email?: string; phone?: string }) {
  const { t } = useLanguage();
  const { isBlacklisted, isLoading } = useBlacklistCheck(email || null, phone || null);

  if (isLoading || !isBlacklisted) {
    return null;
  }

  return (
    <div className="flex items-center gap-2 text-xs text-red-600 dark:text-red-400 font-medium">
      <ShieldAlert className="w-3 h-3" />
      <span>
        {t(
          'Tili estetty',
          'Account blocked',
          'الحساب محظور',
          'Аккаунт заблокирован',
          'Konto blockerat'
        )}
      </span>
    </div>
  );
}
