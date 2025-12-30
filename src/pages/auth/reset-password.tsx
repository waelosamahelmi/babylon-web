import { useState, useEffect } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UniversalHeader } from '@/components/universal-header';
import { Lock, AlertCircle, CheckCircle } from 'lucide-react';

export default function ResetPassword() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [validToken, setValidToken] = useState(false);

  useEffect(() => {
    // Check if we have a valid recovery token
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session) {
        setValidToken(true);
      } else {
        setError(t(
          'Virheellinen tai vanhentunut linkki',
          'Invalid or expired link',
          'رابط غير صالح أو منتهي الصلاحية',
          'Недействительная или устаревшая ссылка',
          'Ogiltig eller utgången länk'
        ));
      }
    });
  }, []);

  const validateForm = () => {
    if (!password) {
      setError(t(
        'Salasana vaaditaan',
        'Password is required',
        'كلمة المرور مطلوبة',
        'Требуется пароль',
        'Lösenord krävs'
      ));
      return false;
    }

    if (password.length < 6) {
      setError(t(
        'Salasanan tulee olla vähintään 6 merkkiä',
        'Password must be at least 6 characters',
        'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        'Пароль должен содержать не менее 6 символов',
        'Lösenordet måste vara minst 6 tecken'
      ));
      return false;
    }

    if (password !== confirmPassword) {
      setError(t(
        'Salasanat eivät täsmää',
        'Passwords do not match',
        'كلمات المرور غير متطابقة',
        'Пароли не совпадают',
        'Lösenorden matchar inte'
      ));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      const { error: updateError } = await supabase.auth.updateUser({
        password: password,
      });

      if (updateError) throw updateError;

      setSuccess(true);

      // Redirect to login after 2 seconds
      setTimeout(() => {
        setLocation('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t(
        'Salasanan vaihto epäonnistui. Yritä uudelleen.',
        'Password reset failed. Please try again.',
        'فشل إعادة تعيين كلمة المرور. حاول مرة أخرى.',
        'Сброс пароля не удался. Попробуйте снова.',
        'Återställning av lösenord misslyckades. Försök igen.'
      ));
    } finally {
      setLoading(false);
    }
  };

  if (!validToken && error) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
        <UniversalHeader />
        <div className="flex items-center justify-center py-16 px-4">
          <Card className="w-full max-w-md shadow-2xl">
            <CardHeader className="text-center">
              <CardTitle className="text-2xl font-black text-red-600">
                {t('Virhe', 'Error', 'خطأ', 'Ошибка', 'Fel')}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>{error}</AlertDescription>
              </Alert>
              <p className="text-sm text-gray-600 dark:text-gray-400 mt-4 text-center">
                {t(
                  'Pyydä uusi salasanan palautuslinkki',
                  'Please request a new password reset link',
                  'يرجى طلب رابط جديد لإعادة تعيين كلمة المرور',
                  'Пожалуйста, запросите новую ссылку для сброса пароля',
                  'Vänligen begär en ny länk för återställning av lösenord'
                )}
              </p>
            </CardContent>
            <CardFooter>
              <Button
                className="w-full"
                onClick={() => setLocation('/auth/forgot-password')}
              >
                {t('Pyydä uusi linkki', 'Request New Link', 'طلب رابط جديد', 'Запросить новую ссылку', 'Begär ny länk')}
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <UniversalHeader />

      <div className="flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-green-500 to-teal-500 rounded-full flex items-center justify-center mb-4">
              <Lock className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black">
              {t('Vaihda salasana', 'Reset Password', 'إعادة تعيين كلمة المرور', 'Сбросить пароль', 'Återställ lösenord')}
            </CardTitle>
            <CardDescription>
              {t(
                'Syötä uusi salasanasi',
                'Enter your new password',
                'أدخل كلمة المرور الجديدة',
                'Введите новый пароль',
                'Ange ditt nya lösenord'
              )}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && !success && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              {success && (
                <Alert className="bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
                  <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
                  <AlertDescription className="text-green-800 dark:text-green-200">
                    {t(
                      'Salasana vaihdettu! Ohjataan kirjautumissivulle...',
                      'Password reset successful! Redirecting to login...',
                      'تم إعادة تعيين كلمة المرور! إعادة التوجيه إلى تسجيل الدخول...',
                      'Пароль успешно сброшен! Перенаправление на вход...',
                      'Lösenordet har återställts! Omdirigerar till inloggning...'
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('Uusi salasana', 'New Password', 'كلمة المرور الجديدة', 'Новый пароль', 'Nytt lösenord')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading || success}
                    minLength={6}
                  />
                </div>
                <p className="text-xs text-gray-500 dark:text-gray-400">
                  {t('Vähintään 6 merkkiä', 'At least 6 characters', 'على الأقل 6 أحرف', 'Минимум 6 символов', 'Minst 6 tecken')}
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="confirmPassword">
                  {t('Vahvista salasana', 'Confirm Password', 'تأكيد كلمة المرور', 'Подтвердите пароль', 'Bekräfta lösenord')}
                </Label>
                <div className="relative">
                  <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="confirmPassword"
                    type="password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-10"
                    required
                    disabled={loading || success}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter>
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-green-500 to-teal-500 hover:from-green-600 hover:to-teal-600"
                disabled={loading || success}
              >
                {loading
                  ? t('Vaihdetaan...', 'Resetting...', 'جاري إعادة التعيين...', 'Сброс...', 'Återställer...')
                  : t('Vaihda salasana', 'Reset Password', 'إعادة تعيين كلمة المرور', 'Сбросить пароль', 'Återställ lösenord')}
              </Button>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
