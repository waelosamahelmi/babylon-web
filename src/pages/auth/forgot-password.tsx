import { useState } from 'react';
import { useLocation } from 'wouter';
import { supabase } from '@/lib/supabase';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UniversalHeader } from '@/components/universal-header';
import { KeyRound, Mail, AlertCircle, CheckCircle, ArrowLeft } from 'lucide-react';
import { Link } from 'wouter';

export default function ForgotPassword() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const validateEmail = () => {
    if (!email) {
      setError(t(
        'Sähköpostiosoite vaaditaan',
        'Email address is required',
        'عنوان البريد الإلكتروني مطلوب',
        'Требуется адрес электронной почты',
        'E-postadress krävs'
      ));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      setError(t(
        'Virheellinen sähköpostiosoite',
        'Invalid email address',
        'عنوان بريد إلكتروني غير صالح',
        'Неверный адрес электронной почты',
        'Ogiltig e-postadress'
      ));
      return false;
    }

    return true;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess(false);

    if (!validateEmail()) {
      return;
    }

    setLoading(true);

    try {
      const { error: resetError } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/auth/reset-password`,
      });

      if (resetError) throw resetError;

      setSuccess(true);
      setEmail('');
    } catch (err: any) {
      setError(err.message || t(
        'Salasanan palautus epäonnistui. Yritä uudelleen.',
        'Password reset failed. Please try again.',
        'فشل إعادة تعيين كلمة المرور. حاول مرة أخرى.',
        'Сброс пароля не удался. Попробуйте снова.',
        'Återställning av lösenord misslyckades. Försök igen.'
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <UniversalHeader />

      <div className="flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-md shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-blue-500 to-purple-500 rounded-full flex items-center justify-center mb-4">
              <KeyRound className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black">
              {t('Unohtuiko salasana?', 'Forgot Password?', 'نسيت كلمة المرور؟', 'Забыли пароль?', 'Glömt lösenord?')}
            </CardTitle>
            <CardDescription>
              {t(
                'Syötä sähköpostiosoitteesi niin lähetämme sinulle linkin salasanan vaihtamiseen',
                'Enter your email address and we\'ll send you a link to reset your password',
                'أدخل عنوان بريدك الإلكتروني وسنرسل لك رابطًا لإعادة تعيين كلمة المرور',
                'Введите свой адрес электронной почты, и мы отправим вам ссылку для сброса пароля',
                'Ange din e-postadress så skickar vi dig en länk för att återställa ditt lösenord'
              )}
            </CardDescription>
          </CardHeader>

          <form onSubmit={handleSubmit}>
            <CardContent className="space-y-4">
              {error && (
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
                      'Salasanan palautuslinkki lähetetty! Tarkista sähköpostisi.',
                      'Password reset link sent! Check your email.',
                      'تم إرسال رابط إعادة تعيين كلمة المرور! تحقق من بريدك الإلكتروني.',
                      'Ссылка для сброса пароля отправлена! Проверьте свою почту.',
                      'Länk för återställning av lösenord skickad! Kontrollera din e-post.'
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('Sähköposti', 'Email', 'البريد الإلكتروني', 'Эл. почта', 'E-post')}
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-10"
                    placeholder={t('esimerkki@email.com', 'example@email.com', 'مثال@email.com', 'пример@email.com', 'exempel@email.com')}
                    required
                    disabled={loading || success}
                  />
                </div>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-blue-500 to-purple-500 hover:from-blue-600 hover:to-purple-600"
                disabled={loading || success}
              >
                {loading
                  ? t('Lähetetään...', 'Sending...', 'جاري الإرسال...', 'Отправка...', 'Skickar...')
                  : t('Lähetä palautuslinkki', 'Send Reset Link', 'إرسال رابط إعادة التعيين', 'Отправить ссылку', 'Skicka återställningslänk')}
              </Button>

              <Link href="/auth/login">
                <a className="flex items-center justify-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-primary">
                  <ArrowLeft className="w-4 h-4" />
                  {t('Takaisin kirjautumiseen', 'Back to Login', 'العودة إلى تسجيل الدخول', 'Вернуться к входу', 'Tillbaka till inloggning')}
                </a>
              </Link>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
