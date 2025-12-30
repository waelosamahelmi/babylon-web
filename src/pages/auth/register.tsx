import { useState } from 'react';
import { useLocation } from 'wouter';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Checkbox } from '@/components/ui/checkbox';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { UniversalHeader } from '@/components/universal-header';
import { UserPlus, Mail, Lock, User, Phone, AlertCircle, CheckCircle } from 'lucide-react';
import { Link } from 'wouter';

export default function Register() {
  const [, setLocation] = useLocation();
  const { signUp } = useCustomerAuth();
  const { t } = useLanguage();

  const [formData, setFormData] = useState({
    email: '',
    password: '',
    confirmPassword: '',
    firstName: '',
    lastName: '',
    phone: '',
    marketingEmails: false,
  });

  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);

  const handleChange = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const validateForm = () => {
    if (!formData.email || !formData.password || !formData.firstName || !formData.lastName) {
      setError(t(
        'Täytä kaikki pakolliset kentät',
        'Please fill in all required fields',
        'يرجى ملء جميع الحقول المطلوبة',
        'Пожалуйста, заполните все обязательные поля',
        'Vänligen fyll i alla obligatoriska fält'
      ));
      return false;
    }

    if (formData.password.length < 6) {
      setError(t(
        'Salasanan tulee olla vähintään 6 merkkiä',
        'Password must be at least 6 characters',
        'يجب أن تكون كلمة المرور 6 أحرف على الأقل',
        'Пароль должен содержать не менее 6 символов',
        'Lösenordet måste vara minst 6 tecken'
      ));
      return false;
    }

    if (formData.password !== formData.confirmPassword) {
      setError(t(
        'Salasanat eivät täsmää',
        'Passwords do not match',
        'كلمات المرور غير متطابقة',
        'Пароли не совпадают',
        'Lösenorden matchar inte'
      ));
      return false;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(formData.email)) {
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

    if (!validateForm()) {
      return;
    }

    setLoading(true);

    try {
      await signUp({
        email: formData.email,
        password: formData.password,
        first_name: formData.firstName,
        last_name: formData.lastName,
        phone: formData.phone,
        marketing_emails: formData.marketingEmails,
      });

      setSuccess(true);
      setTimeout(() => {
        setLocation('/auth/login');
      }, 2000);
    } catch (err: any) {
      setError(err.message || t(
        'Rekisteröinti epäonnistui. Yritä uudelleen.',
        'Registration failed. Please try again.',
        'فشل التسجيل. حاول مرة أخرى.',
        'Регистрация не удалась. Попробуйте снова.',
        'Registrering misslyckades. Försök igen.'
      ));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <UniversalHeader />

      <div className="flex items-center justify-center py-16 px-4">
        <Card className="w-full max-w-2xl shadow-2xl">
          <CardHeader className="text-center">
            <div className="mx-auto w-16 h-16 bg-gradient-to-br from-red-500 to-orange-500 rounded-full flex items-center justify-center mb-4">
              <UserPlus className="w-8 h-8 text-white" />
            </div>
            <CardTitle className="text-3xl font-black">
              {t('Luo tili', 'Create Account', 'إنشاء حساب', 'Создать аккаунт', 'Skapa konto')}
            </CardTitle>
            <CardDescription>
              {t(
                'Rekisteröidy saadaksesi parhaan kokemuksen',
                'Register to get the best experience',
                'سجل للحصول على أفضل تجربة',
                'Зарегистрируйтесь для лучшего опыта',
                'Registrera dig för bästa upplevelse'
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
                      'Tili luotu! Ohjataan kirjautumissivulle...',
                      'Account created! Redirecting to login...',
                      'تم إنشاء الحساب! إعادة التوجيه إلى تسجيل الدخول...',
                      'Аккаунт создан! Перенаправление на вход...',
                      'Konto skapat! Omdirigerar till inloggning...'
                    )}
                  </AlertDescription>
                </Alert>
              )}

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="firstName">
                    {t('Etunimi', 'First Name', 'الاسم الأول', 'Имя', 'Förnamn')} *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="firstName"
                      type="text"
                      value={formData.firstName}
                      onChange={(e) => handleChange('firstName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="lastName">
                    {t('Sukunimi', 'Last Name', 'اسم العائلة', 'Фамилия', 'Efternamn')} *
                  </Label>
                  <div className="relative">
                    <User className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="lastName"
                      type="text"
                      value={formData.lastName}
                      onChange={(e) => handleChange('lastName', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">
                  {t('Sähköposti', 'Email', 'البريد الإلكتروني', 'Эл. почта', 'E-post')} *
                </Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => handleChange('email', e.target.value)}
                    className="pl-10"
                    placeholder={t('esimerkki@email.com', 'example@email.com', 'مثال@email.com', 'пример@email.com', 'exempel@email.com')}
                    required
                  />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">
                  {t('Puhelinnumero', 'Phone Number', 'رقم الهاتف', 'Номер телефона', 'Telefonnummer')}
                </Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <Input
                    id="phone"
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => handleChange('phone', e.target.value)}
                    className="pl-10"
                    placeholder="+358 40 123 4567"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="password">
                    {t('Salasana', 'Password', 'كلمة المرور', 'Пароль', 'Lösenord')} *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="password"
                      type="password"
                      value={formData.password}
                      onChange={(e) => handleChange('password', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">
                    {t('Vahvista salasana', 'Confirm Password', 'تأكيد كلمة المرور', 'Подтвердите пароль', 'Bekräfta lösenord')} *
                  </Label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                    <Input
                      id="confirmPassword"
                      type="password"
                      value={formData.confirmPassword}
                      onChange={(e) => handleChange('confirmPassword', e.target.value)}
                      className="pl-10"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="flex items-center space-x-2">
                <Checkbox
                  id="marketing"
                  checked={formData.marketingEmails}
                  onCheckedChange={(checked) => handleChange('marketingEmails', checked)}
                />
                <Label
                  htmlFor="marketing"
                  className="text-sm font-normal cursor-pointer"
                >
                  {t(
                    'Haluan vastaanottaa tarjouksia ja uutiskirjeitä',
                    'I want to receive offers and newsletters',
                    'أريد تلقي العروض والنشرات الإخبارية',
                    'Я хочу получать предложения и рассылки',
                    'Jag vill ta emot erbjudanden och nyhetsbrev'
                  )}
                </Label>
              </div>
            </CardContent>

            <CardFooter className="flex flex-col space-y-4">
              <Button
                type="submit"
                className="w-full bg-gradient-to-r from-red-500 to-orange-500 hover:from-red-600 hover:to-orange-600"
                disabled={loading || success}
              >
                {loading
                  ? t('Luodaan tiliä...', 'Creating account...', 'جاري إنشاء الحساب...', 'Создание аккаунта...', 'Skapar konto...')
                  : t('Luo tili', 'Create Account', 'إنشاء حساب', 'Создать аккаунт', 'Skapa konto')}
              </Button>

              <div className="text-center text-sm text-gray-600 dark:text-gray-400">
                {t('Onko sinulla jo tili?', 'Already have an account?', 'هل لديك حساب؟', 'Уже есть аккаунт?', 'Har du redan ett konto?')}{' '}
                <Link href="/auth/login">
                  <a className="text-primary font-bold hover:underline">
                    {t('Kirjaudu sisään', 'Sign In', 'تسجيل الدخول', 'Войти', 'Logga in')}
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
