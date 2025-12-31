import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { useTheme } from "@/lib/theme-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Logo } from "@/components/logo";
import { PhoneNumbersModal } from "@/components/phone-numbers-modal";
import { ShoppingCart, Moon, Sun, Menu, Globe, X, Phone, User, LogIn } from "lucide-react";
import { Link, useLocation } from "wouter";

interface UniversalHeaderProps {
  onCartClick?: () => void;
}

export function UniversalHeader({ onCartClick }: UniversalHeaderProps) {
  const { language, setLanguage, t } = useLanguage();
  const { totalItems } = useCart();
  const { theme, setTheme } = useTheme();
  const { isAuthenticated, customer, loading: authLoading } = useCustomerAuth();

  const toggleTheme = () => {
    setTheme(theme === "dark" ? "light" : "dark");
  };
  const { config } = useRestaurant();
  const [location] = useLocation();
  const [isLanguageMenuOpen, setIsLanguageMenuOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isPhoneModalOpen, setIsPhoneModalOpen] = useState(false);

  // Close mobile menu when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (isMobileMenuOpen) {
        setIsMobileMenuOpen(false);
      }
      if (isLanguageMenuOpen) {
        setIsLanguageMenuOpen(false);
      }
    };

    document.addEventListener('click', handleClickOutside);
    return () => document.removeEventListener('click', handleClickOutside);
  }, [isMobileMenuOpen, isLanguageMenuOpen]);

  const navigationItems = [
    { href: "/", label: t("Etusivu", "Home", "الصفحة الرئيسية", "Главная", "Hem") },
    { href: "/menu", label: t("Menu", "Menu", "القائمة", "Меню", "Meny") },
    { href: "/lounas", label: t("Lounas", "Lunch", "غداء", "Обед", "Lunch") },
    { href: "/about", label: t("Meistä", "About", "معلومات عنا", "О нас", "Om oss") },
    { href: "/branches", label: t("Ravintolat", "Branches", "الفروع", "Филиалы", "Filialer") },
    { href: "/locations", label: t("Ruokapisteet", "Locations", "المواقع", "Местоположения", "Platser") },
  ];

  return (
    <>
      <header className="sticky top-0 z-50 bg-white/95 dark:bg-stone-900/95 backdrop-blur-md shadow-lg border-b border-gray-200/50 dark:border-stone-700/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-20">
            {/* Logo */}
            <Link href="/">
              <div className="transform transition-transform hover:scale-105">
                <Logo />
              </div>
            </Link>

            {/* Desktop Navigation */}
            <nav className="hidden lg:flex space-x-2">
              {navigationItems.map((item) => (
                <Link key={item.href} href={item.href}>
                  <Button
                    variant="ghost"
                    className={`text-gray-700 dark:text-gray-300 transition-all font-semibold px-6 py-5 rounded-xl relative group ${
                      location === item.href ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg' : ''
                    }`}
                  >
                    {item.label}
                    {location === item.href && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-white rounded-full"></div>
                    )}
                    {location !== item.href && (
                      <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-0 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full group-hover:w-8 transition-all duration-300"></div>
                    )}
                  </Button>
                </Link>
              ))}
            </nav>

            {/* Desktop Actions */}
            <div className="hidden md:flex items-center space-x-3">
              {/* Call Us Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setIsPhoneModalOpen(true)}
                className="px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800 transition-all hover:scale-105 flex items-center space-x-2"
                title={t("Soita meille", "Call us", "اتصل بنا", "Позвоните нам", "Ring oss")}
              >
                <Phone className="w-5 h-5 text-green-600 dark:text-green-400" />
                <span className="text-sm font-semibold hidden lg:inline">
                  {t("Soita", "Call", "اتصل", "Позвонить", "Ring")}
                </span>
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={toggleTheme}
                className="px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800 transition-all hover:scale-105"
              >
                {theme === "dark" ? <Sun className="w-5 h-5 text-yellow-400" /> : <Moon className="w-5 h-5 text-blue-600" />}
              </Button>
              
              {/* Desktop Language Selection */}
              <div className="relative">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLanguageMenuOpen(!isLanguageMenuOpen);
                  }}
                  className="px-3 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800 flex items-center space-x-2 transition-all hover:scale-105"
                  title={t("Vaihda kieli", "Change language", "تغيير اللغة", "Изменить язык", "Byt språk")}
                >
                  <Globe className="w-5 h-5" />
                  <span className="text-sm font-bold hidden sm:inline">
                    {language === "fi" ? "FI" : language === "en" ? "EN" : language === "ar" ? "AR" : language === "ru" ? "RU" : "SV"}
                  </span>
                </Button>
                
                {isLanguageMenuOpen && (
                  <div className="absolute right-0 mt-2 w-40 bg-white dark:bg-stone-800 rounded-2xl shadow-2xl border border-gray-200 dark:border-stone-700 z-50 overflow-hidden">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage("fi");
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950 dark:hover:to-orange-950 transition-all text-sm font-medium ${
                        language === "fi" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : ""
                      }`}
                    >
                      🇫🇮 Suomi
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage("en");
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950 dark:hover:to-orange-950 transition-all text-sm font-medium ${
                        language === "en" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : ""
                      }`}
                    >
                      🇺🇸 English
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage("ar");
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950 dark:hover:to-orange-950 transition-all text-sm font-medium ${
                        language === "ar" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : ""
                      }`}
                    >
                      🇸🇦 العربية
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage("ru");
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950 dark:hover:to-orange-950 transition-all text-sm font-medium ${
                        language === "ru" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : ""
                      }`}
                    >
                      🇷🇺 Русский
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setLanguage("sv");
                        setIsLanguageMenuOpen(false);
                      }}
                      className={`w-full px-4 py-3 text-left hover:bg-gradient-to-r hover:from-red-50 hover:to-orange-50 dark:hover:from-red-950 dark:hover:to-orange-950 transition-all text-sm font-medium ${
                        language === "sv" ? "bg-gradient-to-r from-red-500 to-orange-500 text-white" : ""
                      }`}
                    >
                      🇸🇪 Svenska
                    </button>
                  </div>
                )}
              </div>

              {/* Login/Account Button */}
              {!authLoading && (
                <Link href={isAuthenticated ? "/account/profile" : "/auth/login"}>
                  <Button
                    variant="ghost"
                    size="sm"
                    className="px-4 py-3 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800 transition-all hover:scale-105 flex items-center space-x-2"
                    title={isAuthenticated 
                      ? t("Oma tili", "My Account", "حسابي", "Мой аккаунт", "Mitt konto")
                      : t("Kirjaudu", "Login", "تسجيل الدخول", "Войти", "Logga in")
                    }
                  >
                    {isAuthenticated ? (
                      <>
                        <User className="w-5 h-5 text-green-600 dark:text-green-400" />
                        <span className="text-sm font-semibold hidden lg:inline">
                          {customer?.first_name || t("Tili", "Account", "الحساب", "Аккаунт", "Konto")}
                        </span>
                      </>
                    ) : (
                      <>
                        <LogIn className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                        <span className="text-sm font-semibold hidden lg:inline">
                          {t("Kirjaudu", "Login", "تسجيل الدخول", "Войти", "Logga in")}
                        </span>
                      </>
                    )}
                  </Button>
                </Link>
              )}

              {onCartClick && (
                <Button
                  onClick={onCartClick}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white px-5 py-5 flex items-center justify-center relative rounded-xl shadow-lg hover:shadow-xl hover:scale-105 transition-all group"
                  title={t("Kori", "Cart", "عربة التسوق", "Корзина", "Varukorg")}
                >
                  <ShoppingCart className="w-5 h-5 group-hover:rotate-12 transition-transform" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-2 -right-2 bg-yellow-400 text-gray-900 text-xs w-6 h-6 rounded-full flex items-center justify-center font-bold animate-bounce shadow-lg">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              )}
            </div>

            {/* Mobile Actions */}
            <div className="flex md:hidden items-center space-x-2">
              {/* Mobile Cart Button */}
              {onCartClick && (
                <Button
                  onClick={onCartClick}
                  className="bg-gradient-to-r from-red-500 to-orange-500 text-white p-3 flex items-center justify-center relative rounded-xl shadow-lg"
                  size="sm"
                  title={t("Kori", "Cart", "عربة التسوق", "Корзина", "Varukorg")}
                >
                  <ShoppingCart className="w-5 h-5" />
                  {totalItems > 0 && (
                    <Badge className="absolute -top-1 -right-1 bg-yellow-400 text-gray-900 text-xs w-5 h-5 rounded-full flex items-center justify-center font-bold animate-bounce">
                      {totalItems}
                    </Badge>
                  )}
                </Button>
              )}

              {/* Mobile Menu Button */}
              <Button
                variant="ghost"
                size="sm"
                onClick={(e) => {
                  e.stopPropagation();
                  setIsMobileMenuOpen(!isMobileMenuOpen);
                }}
                className="p-3 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800"
                title={t("Valikko", "Menu", "القائمة", "Меню", "Meny")}
              >
                {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 md:hidden">
          <div className="fixed inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setIsMobileMenuOpen(false)}></div>
          <div className="fixed top-20 right-0 w-80 h-[calc(100vh-5rem)] bg-white dark:bg-stone-900 shadow-2xl overflow-y-auto rounded-l-3xl">
            <div className="p-6 space-y-6">
              {/* Mobile Navigation Links */}
              <div className="space-y-2">
                <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider mb-3">
                  {t("Navigaatio", "Navigation", "التنقل", "Навигация", "Navigation")}
                </p>
                {navigationItems.map((item) => (
                  <Link key={item.href} href={item.href}>
                    <Button
                      variant="ghost"
                      className={`w-full justify-start text-left py-4 rounded-xl font-semibold transition-all ${
                        location === item.href 
                          ? 'bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg' 
                          : 'hover:bg-gray-100 dark:hover:bg-stone-800'
                      }`}
                      onClick={() => setIsMobileMenuOpen(false)}
                    >
                      {item.label}
                    </Button>
                  </Link>
                ))}
              </div>

              <div className="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
                {/* Mobile Login/Account Button */}
                {!authLoading && (
                  <Link href={isAuthenticated ? "/account/profile" : "/auth/login"}>
                    <Button
                      variant="ghost"
                      onClick={() => setIsMobileMenuOpen(false)}
                      className="w-full justify-start py-4 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800 font-medium"
                    >
                      {isAuthenticated ? (
                        <>
                          <User className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
                          {customer?.first_name || t("Oma tili", "My Account", "حسابي", "Мой аккаунт", "Mitt konto")}
                        </>
                      ) : (
                        <>
                          <LogIn className="w-5 h-5 mr-3 text-blue-600 dark:text-blue-400" />
                          {t("Kirjaudu sisään", "Sign In", "تسجيل الدخول", "Войти", "Logga in")}
                        </>
                      )}
                    </Button>
                  </Link>
                )}

                {/* Mobile Call Us Button */}
                <Button
                  variant="ghost"
                  onClick={() => {
                    setIsPhoneModalOpen(true);
                    setIsMobileMenuOpen(false);
                  }}
                  className="w-full justify-start py-4 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800 font-medium"
                >
                  <Phone className="w-5 h-5 mr-3 text-green-600 dark:text-green-400" />
                  {t("Soita meille", "Call us", "اتصل بنا", "Позвоните нам", "Ring oss")}
                </Button>

                {/* Mobile Theme Toggle */}
                <Button
                  variant="ghost"
                  onClick={toggleTheme}
                  className="w-full justify-start py-4 rounded-xl hover:bg-gray-100 dark:hover:bg-stone-800 font-medium"
                >
                  {theme === "dark" ? (
                    <>
                      <Sun className="w-5 h-5 mr-3 text-yellow-400" />
                      {t("Vaalea teema", "Light theme", "مظهر فاتح", "Светлая тема", "Ljust tema")}
                    </>
                  ) : (
                    <>
                      <Moon className="w-5 h-5 mr-3 text-blue-600" />
                      {t("Tumma teema", "Dark theme", "مظهر داكن", "Тёмная тема", "Mörkt tema")}
                    </>
                  )}
                </Button>

                {/* Mobile Language Selection */}
                <div className="space-y-3">
                  <p className="text-xs font-bold text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    {t("Kieli", "Language", "اللغة", "Язык", "Språk")}
                  </p>
                  <div className="space-y-2">
                    <button
                      onClick={() => {
                        setLanguage("fi");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        language === "fi" 
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg" 
                          : "hover:bg-gray-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      🇫🇮 Suomi
                    </button>
                    <button
                      onClick={() => {
                        setLanguage("en");
                        setIsMobileMenuOpen(false);
                      }}
                      className={`w-full text-left px-4 py-3 rounded-xl text-sm font-medium transition-all ${
                        language === "en" 
                          ? "bg-gradient-to-r from-red-500 to-orange-500 text-white shadow-lg" 
                          : "hover:bg-gray-100 dark:hover:bg-stone-800"
                      }`}
                    >
                      🇺🇸 English
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Phone Numbers Modal */}
      <PhoneNumbersModal
        open={isPhoneModalOpen}
        onOpenChange={setIsPhoneModalOpen}
      />
    </>
  );
}