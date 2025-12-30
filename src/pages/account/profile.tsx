import { useState } from 'react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { UniversalHeader } from '@/components/universal-header';
import { User, MapPin, Package, Award, Mail, Phone, Save, Trash2, Plus, CheckCircle, Star } from 'lucide-react';
import { useLocation } from 'wouter';

export default function Profile() {
  const [, setLocation] = useLocation();
  const { customer, loading, isAuthenticated, updateProfile, addAddress, deleteAddress, setDefaultAddress, signOut } = useCustomerAuth();
  const { t } = useLanguage();

  const [editMode, setEditMode] = useState(false);
  const [formData, setFormData] = useState({
    first_name: customer?.first_name || '',
    last_name: customer?.last_name || '',
    phone: customer?.phone || '',
  });
  const [success, setSuccess] = useState('');
  const [error, setError] = useState('');

  // Redirect if not authenticated
  if (!loading && !isAuthenticated) {
    setLocation('/auth/login');
    return null;
  }

  if (loading || !customer) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
        <UniversalHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
            <p className="mt-4 text-gray-600 dark:text-gray-400">
              {t('Ladataan...', 'Loading...', 'جاري التحميل...', 'Загрузка...', 'Laddar...')}
            </p>
          </div>
        </div>
      </div>
    );
  }

  const handleSave = async () => {
    try {
      await updateProfile(formData);
      setSuccess(t('Profiili päivitetty!', 'Profile updated!', 'تم تحديث الملف الشخصي!', 'Профиль обновлен!', 'Profil uppdaterad!'));
      setEditMode(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleSignOut = async () => {
    await signOut();
    setLocation('/');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <UniversalHeader />

      <div className="max-w-6xl mx-auto px-4 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-4xl font-black text-gray-900 dark:text-white">
                {t('Oma tili', 'My Account', 'حسابي', 'Мой аккаунт', 'Mitt konto')}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-2">
                {t('Hallitse profiiliasi ja tilauksiasi', 'Manage your profile and orders', 'إدارة ملفك الشخصي وطلباتك', 'Управляйте профилем и заказами', 'Hantera din profil och beställningar')}
              </p>
            </div>
            <Button
              variant="outline"
              onClick={handleSignOut}
              className="hover:bg-red-50 dark:hover:bg-red-950"
            >
              {t('Kirjaudu ulos', 'Sign Out', 'تسجيل الخروج', 'Выйти', 'Logga ut')}
            </Button>
          </div>
        </div>

        {/* Alerts */}
        {success && (
          <Alert className="mb-6 bg-green-50 dark:bg-green-950 border-green-200 dark:border-green-800">
            <CheckCircle className="h-4 w-4 text-green-600 dark:text-green-400" />
            <AlertDescription className="text-green-800 dark:text-green-200">{success}</AlertDescription>
          </Alert>
        )}

        {error && (
          <Alert variant="destructive" className="mb-6">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <Tabs defaultValue="profile" className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              {t('Profiili', 'Profile', 'الملف الشخصي', 'Профиль', 'Profil')}
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="w-4 h-4 mr-2" />
              {t('Osoitteet', 'Addresses', 'العناوين', 'Адреса', 'Adresser')}
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              {t('Tilaukset', 'Orders', 'الطلبات', 'Заказы', 'Beställningar')}
            </TabsTrigger>
            <TabsTrigger value="loyalty">
              <Award className="w-4 h-4 mr-2" />
              {t('Kanta-asiakas', 'Loyalty', 'الولاء', 'Лояльность', 'Lojalitet')}
            </TabsTrigger>
          </TabsList>

          {/* Profile Tab */}
          <TabsContent value="profile">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('Henkilötiedot', 'Personal Information', 'المعلومات الشخصية', 'Личная информация', 'Personuppgifter')}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setEditMode(!editMode)}
                  >
                    {editMode
                      ? t('Peruuta', 'Cancel', 'إلغاء', 'Отмена', 'Avbryt')
                      : t('Muokkaa', 'Edit', 'تعديل', 'Редактировать', 'Redigera')}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="first_name">{t('Etunimi', 'First Name', 'الاسم الأول', 'Имя', 'Förnamn')}</Label>
                    <Input
                      id="first_name"
                      value={editMode ? formData.first_name : customer.first_name}
                      onChange={(e) => setFormData({ ...formData, first_name: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="last_name">{t('Sukunimi', 'Last Name', 'اسم العائلة', 'Фамилия', 'Efternamn')}</Label>
                    <Input
                      id="last_name"
                      value={editMode ? formData.last_name : customer.last_name}
                      onChange={(e) => setFormData({ ...formData, last_name: e.target.value })}
                      disabled={!editMode}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">
                    <Mail className="w-4 h-4 inline mr-2" />
                    {t('Sähköposti', 'Email', 'البريد الإلكتروني', 'Эл. почта', 'E-post')}
                  </Label>
                  <Input id="email" value={customer.email} disabled />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">
                    <Phone className="w-4 h-4 inline mr-2" />
                    {t('Puhelinnumero', 'Phone', 'رقم الهاتف', 'Телефон', 'Telefon')}
                  </Label>
                  <Input
                    id="phone"
                    value={editMode ? formData.phone : customer.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    disabled={!editMode}
                  />
                </div>

                {editMode && (
                  <Button
                    onClick={handleSave}
                    className="w-full bg-gradient-to-r from-red-500 to-orange-500"
                  >
                    <Save className="w-4 h-4 mr-2" />
                    {t('Tallenna muutokset', 'Save Changes', 'حفظ التغييرات', 'Сохранить изменения', 'Spara ändringar')}
                  </Button>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Addresses Tab */}
          <TabsContent value="addresses">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('Osoitekirja', 'Address Book', 'دفتر العناوين', 'Адресная книга', 'Adressbok')}</span>
                  <Button size="sm" className="bg-gradient-to-r from-red-500 to-orange-500">
                    <Plus className="w-4 h-4 mr-2" />
                    {t('Lisää osoite', 'Add Address', 'إضافة عنوان', 'Добавить адрес', 'Lägg till adress')}
                  </Button>
                </CardTitle>
              </CardHeader>
              <CardContent>
                {customer.addresses.length === 0 ? (
                  <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-12 h-12 mx-auto mb-4 opacity-50" />
                    <p>{t('Ei tallennettuja osoitteita', 'No saved addresses', 'لا توجد عناوين محفوظة', 'Нет сохраненных адресов', 'Inga sparade adresser')}</p>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.addresses.map((address: any, index: number) => (
                      <Card key={index} className={index === customer.default_address_index ? 'border-2 border-primary' : ''}>
                        <CardContent className="pt-6">
                          {index === customer.default_address_index && (
                            <div className="flex items-center gap-2 text-primary font-bold mb-2">
                              <Star className="w-4 h-4 fill-current" />
                              {t('Oletussoite', 'Default', 'افتراضي', 'По умолчанию', 'Standard')}
                            </div>
                          )}
                          <p className="font-semibold">{address.street}</p>
                          <p className="text-gray-600 dark:text-gray-400">{address.postalCode} {address.city}</p>
                          <div className="flex gap-2 mt-4">
                            {index !== customer.default_address_index && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => setDefaultAddress(index)}
                              >
                                {t('Aseta oletukseksi', 'Set Default', 'تعيين كافتراضي', 'Установить по умолчанию', 'Ange som standard')}
                              </Button>
                            )}
                            <Button
                              variant="destructive"
                              size="sm"
                              onClick={() => deleteAddress(index)}
                            >
                              <Trash2 className="w-4 h-4" />
                            </Button>
                          </div>
                        </CardContent>
                      </Card>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Orders Tab */}
          <TabsContent value="orders">
            <Card>
              <CardHeader>
                <CardTitle>{t('Tilaushistoria', 'Order History', 'سجل الطلبات', 'История заказов', 'Beställningshistorik')}</CardTitle>
                <CardDescription>
                  {t('Yhteensä', 'Total', 'المجموع', 'Всего', 'Totalt')} {customer.total_orders} {t('tilausta', 'orders', 'طلبات', 'заказов', 'beställningar')} • €{customer.total_spent.toFixed(2)}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center py-12 text-gray-500 dark:text-gray-400">
                  {t('Tilaushistoria tulossa pian', 'Order history coming soon', 'سجل الطلبات قريبًا', 'История заказов скоро', 'Beställningshistorik kommer snart')}
                </p>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Loyalty Tab */}
          <TabsContent value="loyalty">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Award className="w-6 h-6 text-yellow-500" />
                  {t('Kanta-asiakaspisteet', 'Loyalty Points', 'نقاط الولاء', 'Баллы лояльности', 'Lojalitetspoäng')}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-center py-8">
                  <div className="text-6xl font-black text-gradient bg-gradient-to-r from-yellow-500 to-orange-500 bg-clip-text text-transparent mb-4">
                    {customer.loyalty_points}
                  </div>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t('Kanta-asiakaspistettä', 'Loyalty points', 'نقاط الولاء', 'Баллов лояльности', 'Lojalitetspoäng')}
                  </p>
                  <Button className="mt-6 bg-gradient-to-r from-yellow-500 to-orange-500" asChild>
                    <a href="/account/loyalty">
                      {t('Näytä palkinnot', 'View Rewards', 'عرض المكافآت', 'Посмотреть награды', 'Visa belöningar')}
                    </a>
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}
