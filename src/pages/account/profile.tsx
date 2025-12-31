import { useState, useEffect } from 'react';
import { useCustomerAuth } from '@/hooks/use-customer-auth';
import { useLanguage } from '@/lib/language-context';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { UniversalHeader } from '@/components/universal-header';
import { User, MapPin, Package, Award, Mail, Phone, Save, Trash2, Plus, CheckCircle, Star, CreditCard, Home, Building, Briefcase, Edit } from 'lucide-react';
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

  // Address dialog state
  const [showAddressDialog, setShowAddressDialog] = useState(false);
  const [editingAddressIndex, setEditingAddressIndex] = useState<number | null>(null);
  const [addressForm, setAddressForm] = useState({
    label: '',
    streetAddress: '',
    postalCode: '',
    city: '',
    instructions: '',
  });
  const [isSavingAddress, setIsSavingAddress] = useState(false);

  // Payment methods state
  const [savedPaymentMethods, setSavedPaymentMethods] = useState<any[]>([]);

  // Update form when customer data loads
  useEffect(() => {
    if (customer) {
      setFormData({
        first_name: customer.first_name || '',
        last_name: customer.last_name || '',
        phone: customer.phone || '',
      });
    }
  }, [customer]);

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

  // Address handlers
  const handleOpenAddressDialog = (index?: number) => {
    if (index !== undefined && customer?.addresses[index]) {
      const addr = customer.addresses[index];
      setAddressForm({
        label: addr.label || '',
        streetAddress: addr.streetAddress || '',
        postalCode: addr.postalCode || '',
        city: addr.city || '',
        instructions: addr.instructions || '',
      });
      setEditingAddressIndex(index);
    } else {
      setAddressForm({
        label: '',
        streetAddress: '',
        postalCode: '',
        city: '',
        instructions: '',
      });
      setEditingAddressIndex(null);
    }
    setShowAddressDialog(true);
  };

  const handleSaveAddress = async () => {
    if (!addressForm.streetAddress || !addressForm.city) {
      setError(t('Katuosoite ja kaupunki ovat pakollisia', 'Street address and city are required'));
      return;
    }

    setIsSavingAddress(true);
    try {
      if (editingAddressIndex !== null) {
        // Update existing address
        const updatedAddresses = [...customer!.addresses];
        updatedAddresses[editingAddressIndex] = addressForm;
        await updateProfile({ addresses: updatedAddresses });
        setSuccess(t('Osoite päivitetty!', 'Address updated!'));
      } else {
        // Add new address
        await addAddress(addressForm);
        setSuccess(t('Osoite lisätty!', 'Address added!'));
      }
      setShowAddressDialog(false);
      setTimeout(() => setSuccess(''), 3000);
    } catch (err: any) {
      setError(err.message || t('Virhe osoitteen tallentamisessa', 'Error saving address'));
    } finally {
      setIsSavingAddress(false);
    }
  };

  const handleDeleteAddress = async (index: number) => {
    if (window.confirm(t('Haluatko varmasti poistaa tämän osoitteen?', 'Are you sure you want to delete this address?'))) {
      try {
        await deleteAddress(index);
        setSuccess(t('Osoite poistettu!', 'Address deleted!'));
        setTimeout(() => setSuccess(''), 3000);
      } catch (err: any) {
        setError(err.message);
      }
    }
  };

  const getAddressIcon = (label?: string) => {
    const normalized = label?.toLowerCase() || '';
    if (normalized.includes('home') || normalized.includes('koti')) return Home;
    if (normalized.includes('work') || normalized.includes('työ')) return Briefcase;
    if (normalized.includes('office') || normalized.includes('toimisto')) return Building;
    return MapPin;
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
          <TabsList className="grid w-full grid-cols-5 lg:w-auto">
            <TabsTrigger value="profile">
              <User className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('Profiili', 'Profile', 'الملف الشخصي', 'Профиль', 'Profil')}</span>
            </TabsTrigger>
            <TabsTrigger value="addresses">
              <MapPin className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('Osoitteet', 'Addresses', 'العناوين', 'Адреса', 'Adresser')}</span>
            </TabsTrigger>
            <TabsTrigger value="payment">
              <CreditCard className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('Maksutavat', 'Payment', 'الدفع', 'Оплата', 'Betalning')}</span>
            </TabsTrigger>
            <TabsTrigger value="orders">
              <Package className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('Tilaukset', 'Orders', 'الطلبات', 'Заказы', 'Beställningar')}</span>
            </TabsTrigger>
            <TabsTrigger value="loyalty">
              <Award className="w-4 h-4 mr-2" />
              <span className="hidden sm:inline">{t('Pisteet', 'Points', 'النقاط', 'Баллы', 'Poäng')}</span>
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
                  <Button 
                    size="sm" 
                    className="bg-gradient-to-r from-red-500 to-orange-500"
                    onClick={() => handleOpenAddressDialog()}
                  >
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
                    <Button 
                      className="mt-4"
                      variant="outline"
                      onClick={() => handleOpenAddressDialog()}
                    >
                      <Plus className="w-4 h-4 mr-2" />
                      {t('Lisää ensimmäinen osoite', 'Add your first address')}
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {customer.addresses.map((address: any, index: number) => {
                      const AddressIcon = getAddressIcon(address.label);
                      return (
                        <Card key={index} className={index === customer.default_address_index ? 'border-2 border-green-500 dark:border-green-600' : ''}>
                          <CardContent className="pt-6">
                            <div className="flex items-start justify-between mb-2">
                              <div className="flex items-center gap-2">
                                <AddressIcon className="w-5 h-5 text-gray-500" />
                                <span className="font-semibold">
                                  {address.label || t('Osoite', 'Address')} {index + 1}
                                </span>
                              </div>
                              {index === customer.default_address_index && (
                                <span className="flex items-center gap-1 text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-1 rounded-full">
                                  <Star className="w-3 h-3 fill-current" />
                                  {t('Oletus', 'Default')}
                                </span>
                              )}
                            </div>
                            <p className="text-gray-900 dark:text-gray-100">{address.streetAddress}</p>
                            <p className="text-gray-600 dark:text-gray-400">{address.postalCode} {address.city}</p>
                            {address.instructions && (
                              <p className="text-sm text-gray-500 italic mt-1">{address.instructions}</p>
                            )}
                            <div className="flex gap-2 mt-4">
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleOpenAddressDialog(index)}
                              >
                                <Edit className="w-4 h-4 mr-1" />
                                {t('Muokkaa', 'Edit')}
                              </Button>
                              {index !== customer.default_address_index && (
                                <Button
                                  variant="outline"
                                  size="sm"
                                  onClick={() => setDefaultAddress(index)}
                                >
                                  <Star className="w-4 h-4 mr-1" />
                                  {t('Aseta oletukseksi', 'Set Default')}
                                </Button>
                              )}
                              <Button
                                variant="destructive"
                                size="sm"
                                onClick={() => handleDeleteAddress(index)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </CardContent>
                        </Card>
                      );
                    })}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          {/* Payment Methods Tab */}
          <TabsContent value="payment">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  <span>{t('Maksutavat', 'Payment Methods', 'طرق الدفع', 'Способы оплаты', 'Betalningsmetoder')}</span>
                </CardTitle>
                <CardDescription>
                  {t('Hallitse tallennettuja maksutapoja', 'Manage your saved payment methods')}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-center py-12 text-gray-500 dark:text-gray-400">
                  <CreditCard className="w-12 h-12 mx-auto mb-4 opacity-50" />
                  <p className="mb-4">
                    {t(
                      'Maksutapojen tallennus tulee saataville pian',
                      'Payment method saving will be available soon'
                    )}
                  </p>
                  <div className="bg-blue-50 dark:bg-blue-950 border border-blue-200 dark:border-blue-800 rounded-lg p-4 max-w-md mx-auto">
                    <p className="text-sm text-blue-700 dark:text-blue-300">
                      {t(
                        'Voit maksaa turvallisesti kassalla käyttämällä korttia, käteistä tai verkkomaksua.',
                        'You can pay securely at checkout using card, cash, or online payment.'
                      )}
                    </p>
                  </div>
                </div>
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

      {/* Add/Edit Address Dialog */}
      <Dialog open={showAddressDialog} onOpenChange={setShowAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              {editingAddressIndex !== null ? (
                <>
                  <Edit className="w-5 h-5" />
                  {t('Muokkaa osoitetta', 'Edit Address')}
                </>
              ) : (
                <>
                  <Plus className="w-5 h-5" />
                  {t('Lisää uusi osoite', 'Add New Address')}
                </>
              )}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="addressLabel">
                {t('Osoitteen nimi', 'Address Label')}
              </Label>
              <Input
                id="addressLabel"
                value={addressForm.label}
                onChange={(e) => setAddressForm({ ...addressForm, label: e.target.value })}
                placeholder={t('Esim. Koti, Työ', 'E.g. Home, Work')}
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="streetAddress">
                {t('Katuosoite', 'Street Address')} *
              </Label>
              <Input
                id="streetAddress"
                required
                value={addressForm.streetAddress}
                onChange={(e) => setAddressForm({ ...addressForm, streetAddress: e.target.value })}
                placeholder={t('Esim. Mannerheimintie 1 A 5', 'E.g. 123 Main Street Apt 4')}
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="postalCode">
                  {t('Postinumero', 'Postal Code')} *
                </Label>
                <Input
                  id="postalCode"
                  required
                  value={addressForm.postalCode}
                  onChange={(e) => setAddressForm({ ...addressForm, postalCode: e.target.value })}
                  placeholder="00100"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="city">
                  {t('Kaupunki', 'City')} *
                </Label>
                <Input
                  id="city"
                  required
                  value={addressForm.city}
                  onChange={(e) => setAddressForm({ ...addressForm, city: e.target.value })}
                  placeholder={t('Helsinki', 'Helsinki')}
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="instructions">
                {t('Toimitusohjeet', 'Delivery Instructions')}
              </Label>
              <Input
                id="instructions"
                value={addressForm.instructions}
                onChange={(e) => setAddressForm({ ...addressForm, instructions: e.target.value })}
                placeholder={t('Esim. Ovikoodi 1234, soita ovikelloa', 'E.g. Door code 1234, ring doorbell')}
              />
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowAddressDialog(false)}
            >
              {t('Peruuta', 'Cancel')}
            </Button>
            <Button
              type="button"
              onClick={handleSaveAddress}
              disabled={!addressForm.streetAddress || !addressForm.city || isSavingAddress}
              className="bg-gradient-to-r from-red-500 to-orange-500"
            >
              {isSavingAddress
                ? t('Tallennetaan...', 'Saving...')
                : editingAddressIndex !== null
                ? t('Päivitä osoite', 'Update Address')
                : t('Lisää osoite', 'Add Address')
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
