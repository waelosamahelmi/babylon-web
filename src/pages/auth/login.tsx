import { useState } from 'react';
import { useLocation } from 'wouter';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UniversalHeader } from '@/components/universal-header';
import { LogIn, Mail, Lock, AlertCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function Login() {
  const [, setLocation] = useLocation();
  const { signIn } = useCustomerAuth();
  const { t } = useLanguage();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      await signIn(email, password);
      setLocation('/account');
    } catch (err: any) {
      setError(err.message || t(
        'Kirjautuminen epäonnistui. Tarkista sähköposti ja salasana.',
        'Login failed. Please check your email and password.',
        'فشل تسجيل الدخول. يرجى التحقق من بريدك الإلكتروني وكلمة المرور.',
        'Не удалось войти. Проверьте адрес электронной почты и пароль.',
        'Inloggning misslyckades. Kontrollera din e-post och lösenord.'
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
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <LogIn className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black">
              {t('Kirjaudu sisään', 'Sign In', 'تسجيل الدخول', 'Войти', 'Logga in')}
            </CardTitle>
            <CardDescription>
              {t(
                'Kirjaudu sisään tilillesi jatkaaksesi',
                'Sign in to your account to continue',
                'قم بتسجيل الدخول إلى حسابك للمتابعة',
                'Войдите в свой аккаунт, чтобы продолжить',
                'Logga in på ditt konto för att fortsätta'
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
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="password">
                  {t('Salasana', 'Password', 'كلمة المرور', 'Пароль', 'Lösenord')}
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
                  />
                </div>
              </div>

              <div className="flex items-center justify-between">
                <Link href="/auth/forgot-password">
                  <a className="text-sm text-primary hover:underline">
                    {t('Unohditko salasanan?', 'Forgot password?', 'نسيت كلمة المرور؟', 'Забыли пароль?', 'Glömt lösenord?')}
                  </a>
                </Link>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                disabled={loading}
              >
                {loading
                  ? t('Kirjaudutaan...', 'Signing in...', 'جاري تسجيل الدخول...', 'Вход...', 'Loggar in...')
                  : t('Kirjaudu sisään', 'Sign In', 'تسجيل الدخول', 'Войти', 'Logga in')}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {t('Eikö sinulla ole tiliä?', "Don't have an account?", 'ليس لديك حساب؟', 'Нет аккаунта?', 'Har du inget konto?')}{' '}
                <Link href="/auth/register">
                  <a className="text-primary font-bold hover:underline">
                    {t('Rekisteröidy', 'Register', 'سجل', 'Зарегистрироваться', 'Registrera')}
                  </a>
                </Link>
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
