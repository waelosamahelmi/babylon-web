import { useState } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { supabase } from '@/lib/supabase';
import { Tag, Check, X, AlertCircle } from 'lucide-react';

interface CouponInputProps {
  orderType: 'delivery' | 'pickup';
  branchId: number | null;
  subtotal: number;
  onCouponApplied: (discount: number, couponCode: string, couponId: string) => void;
  onCouponRemoved: () => void;
}

interface CouponData {
  id: string;
  code: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  min_order_amount: number;
  max_discount_amount: number | null;
  usage_limit: number | null;
  usage_count: number;
  allowed_branches: number[] | null;
  order_types: ('delivery' | 'pickup')[] | null;
  is_active: boolean;
  valid_from: string;
  valid_until: string | null;
}

export function CouponInput({
  orderType,
  branchId,
  subtotal,
  onCouponApplied,
  onCouponRemoved,
}: CouponInputProps) {
  const { t } = useLanguage();
  const [couponCode, setCouponCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appliedCoupon, setAppliedCoupon] = useState<{
    code: string;
    discount: number;
    id: string;
  } | null>(null);

  const validateAndApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setError(t(
        'Syötä kuponkikoodi',
        'Enter coupon code',
        'أدخل رمز القسيمة',
        'Введите код купона',
        'Ange kupongkod'
      ));
      return;
    }

    setLoading(true);
    setError('');

    try {
      // Call the validation function from database
      const { data, error: rpcError } = await supabase.rpc('validate_coupon_code', {
        p_code: couponCode.toUpperCase(),
        p_order_type: orderType,
        p_branch_id: branchId,
        p_order_amount: subtotal,
      });

      if (rpcError) {
        throw rpcError;
      }

      if (!data) {
        throw new Error(t(
          'Virheellinen kuponkikoodi',
          'Invalid coupon code',
          'رمز قسيمة غير صالح',
          'Неверный код купона',
          'Ogiltig kupongkod'
        ));
      }

      // Fetch full coupon details
      const { data: coupon, error: fetchError } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .single();

      if (fetchError || !coupon) {
        throw new Error(t(
          'Kupongista ei voitu hakea tietoja',
          'Could not fetch coupon details',
          'تعذر جلب تفاصيل القسيمة',
          'Не удалось получить информацию о купоне',
          'Kunde inte hämta kupongdetaljer'
        ));
      }

      const couponData = coupon as CouponData;

      // Calculate discount
      let discountAmount = 0;
      if (couponData.discount_type === 'percentage') {
        discountAmount = (subtotal * couponData.discount_value) / 100;
        if (couponData.max_discount_amount) {
          discountAmount = Math.min(discountAmount, couponData.max_discount_amount);
        }
      } else {
        discountAmount = couponData.discount_value;
      }

      // Round to 2 decimals
      discountAmount = Math.round(discountAmount * 100) / 100;

      setAppliedCoupon({
        code: couponData.code,
        discount: discountAmount,
        id: couponData.id,
      });

      onCouponApplied(discountAmount, couponData.code, couponData.id);
    } catch (err: any) {
      console.error('Coupon validation error:', err);

      // Parse common error messages
      if (err.message.includes('not found') || err.message.includes('does not exist')) {
        setError(t(
          'Kuponkia ei löytynyt',
          'Coupon not found',
          'لم يتم العثور على القسيمة',
          'Купон не найден',
          'Kupong hittades inte'
        ));
      } else if (err.message.includes('expired') || err.message.includes('not yet valid')) {
        setError(t(
          'Kuponki on vanhentunut tai ei vielä voimassa',
          'Coupon has expired or is not yet valid',
          'انتهت صلاحية القسيمة أو لم تكن سارية بعد',
          'Купон истек или еще не действителен',
          'Kupongen har gått ut eller är inte giltig ännu'
        ));
      } else if (err.message.includes('usage limit')) {
        setError(t(
          'Kupongin käyttöraja ylitetty',
          'Coupon usage limit exceeded',
          'تم تجاوز حد استخدام القسيمة',
          'Превышен лимит использования купона',
          'Kupongens användningsgräns överskriden'
        ));
      } else if (err.message.includes('minimum order')) {
        setError(t(
          `Vähimmäistilaus ei täyty`,
          `Minimum order amount not met`,
          'لم يتم استيفاء الحد الأدنى لمبلغ الطلب',
          'Минимальная сумма заказа не достигнута',
          'Minimiorderbelopp ej uppfyllt'
        ));
      } else if (err.message.includes('not available for')) {
        setError(t(
          'Kuponki ei ole saatavilla tälle toimitustavalle tai ravintolalle',
          'Coupon not available for this delivery type or branch',
          'القسيمة غير متوفرة لنوع التسليم أو الفرع هذا',
          'Купон недоступен для этого типа доставки или филиала',
          'Kupongen är inte tillgänglig för denna leveranstyp eller filial'
        ));
      } else {
        setError(err.message || t(
          'Virhe kupongissa',
          'Error applying coupon',
          'خطأ في تطبيق القسيمة',
          'Ошибка при применении купона',
          'Fel vid tillämpning av kupong'
        ));
      }
    } finally {
      setLoading(false);
    }
  };

  const removeCoupon = () => {
    setAppliedCoupon(null);
    setCouponCode('');
    setError('');
    onCouponRemoved();
  };

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-2">
        <Tag className="w-5 h-5 text-orange-500" />
        <h3 className="font-semibold text-sm">
          {t('Kuponkikoodi', 'Coupon Code', 'رمز القسيمة', 'Код купона', 'Kupongkod')}
        </h3>
      </div>

      {!appliedCoupon ? (
        <>
          <div className="flex gap-2">
            <Input
              value={couponCode}
              onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
              placeholder={t('Syötä koodi', 'Enter code', 'أدخل الرمز', 'Введите код', 'Ange kod')}
              disabled={loading}
              className="flex-1 uppercase"
              onKeyPress={(e) => {
                if (e.key === 'Enter') {
                  validateAndApplyCoupon();
                }
              }}
            />
            <Button
              onClick={validateAndApplyCoupon}
              disabled={loading || !couponCode.trim()}
              className="bg-gradient-to-r from-orange-500 to-red-500"
            >
              {loading ? (
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              ) : (
                t('Käytä', 'Apply', 'تطبيق', 'Применить', 'Tillämpa')
              )}
            </Button>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription className="text-sm">{error}</AlertDescription>
            </Alert>
          )}
        </>
      ) : (
        <div className="bg-green-50 dark:bg-green-950 border-2 border-green-500 dark:border-green-600 rounded-xl p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Check className="w-5 h-5 text-green-600 dark:text-green-400" />
              <div>
                <p className="font-bold text-green-900 dark:text-green-100">
                  {appliedCoupon.code}
                </p>
                <p className="text-sm text-green-700 dark:text-green-300">
                  {t('Säästät', 'You save', 'توفر', 'Вы экономите', 'Du sparar')} €{appliedCoupon.discount.toFixed(2)}
                </p>
              </div>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={removeCoupon}
              className="hover:bg-green-100 dark:hover:bg-green-900"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
