import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartModal } from "@/components/cart-modal";
import { CheckoutModal } from "@/components/checkout-modal";
import { UniversalHeader } from "@/components/universal-header";
import { MobileNav } from "@/components/mobile-nav";
import { HeroVideo } from "@/components/hero-video";
import { MultiBranchStatusHeader } from "@/components/multi-branch-status-header";
import { AboutSection } from "@/components/about-section";
import { Footer } from "@/components/footer";
import { 
  UtensilsCrossed, 
  Phone, 
  MapPin, 
  Clock, 
  Star,
  ChevronRight,
  User,
  Coffee
} from "lucide-react";
import { Link } from "wouter";

export default function Home() {
  const { t } = useLanguage();
  const { config } = useRestaurant();
  const { data: categories } = useCategories();
  const { data: menuItems } = useMenuItems();
  
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const handleCartOpen = () => setIsCartOpen(true);
  const handleCartClose = () => setIsCartOpen(false);
  const handleCheckoutOpen = () => setIsCheckoutOpen(true);
  const handleCheckoutClose = () => setIsCheckoutOpen(false);
  const handleBackToCart = () => {
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  };

  // Get featured items (first 6 available items)
  const featuredItems = menuItems?.filter(item => item.isAvailable).slice(0, 6) || [];
  
  // Get random menu item images for backgrounds
  const pizzaKebabBg = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return '';
    const itemsWithImages = menuItems.filter(item => item.imageUrl && item.imageUrl.trim() !== '');
    if (itemsWithImages.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * itemsWithImages.length);
    console.log('Pizza/Kebab BG:', itemsWithImages[randomIndex].imageUrl);
    return itemsWithImages[randomIndex].imageUrl;
  }, [menuItems]);
  
  const quickOrderBg = useMemo(() => {
    if (!menuItems || menuItems.length === 0) return '';
    const itemsWithImages = menuItems.filter(item => item.imageUrl && item.imageUrl.trim() !== '');
    if (itemsWithImages.length === 0) return '';
    const randomIndex = Math.floor(Math.random() * itemsWithImages.length);
    console.log('Quick Order BG:', itemsWithImages[randomIndex].imageUrl);
    return itemsWithImages[randomIndex].imageUrl;
  }, [menuItems]);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <UniversalHeader onCartClick={handleCartOpen} />
      <MultiBranchStatusHeader />
      <HeroVideo />

      {/* Service Highlights */}
      <section className="py-20 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-50 via-orange-50 to-amber-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900"></div>
        <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width="60" height="60" viewBox="0 0 60 60" xmlns="http://www.w3.org/2000/svg"%3E%3Cg fill="none" fill-rule="evenodd"%3E%3Cg fill="%23000000" fill-opacity="0.4"%3E%3Cpath d="M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z"/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
        <div className="max-w-7xl mx-auto px-4 relative z-10">
          <div className="text-left md:text-center mb-16 animate-fade-in">
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-red-500 to-orange-500 text-white rounded-full text-sm font-bold mb-6 shadow-lg">
              {t("Mitä tarjoamme", "What We Offer")}
            </div>
            <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white leading-tight">
              {t(`Tervetuloa ${config.name}`, `Welcome to ${config.nameEn}`)}
            </h2>
            <p className="text-xl text-gray-600 dark:text-gray-300 max-w-3xl mx-auto font-medium">
              {t("Nauti tuoreista ruoista, nopeasta palvelusta ja unohtumattomista makuelämyksistä", "Enjoy fresh food, fast service and unforgettable taste experiences")}
            </p>
          </div>
          <div className="space-y-6">
            <Link href="/menu">
              <Card className="group cursor-pointer transition-all duration-700 hover:shadow-2xl border-0 overflow-hidden relative animate-slide-up bg-white dark:bg-stone-800">
                <div className="absolute inset-0 bg-gradient-to-r from-red-600 to-orange-600 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                <CardContent className="p-0 relative z-10">
                  <div className="flex flex-col md:flex-row items-center md:min-h-[280px]">
                    <div className="w-full md:w-1/3 h-48 md:h-[280px] relative overflow-hidden bg-gray-900">
                      {pizzaKebabBg ? (
                        <>
                          <img 
                            src={pizzaKebabBg} 
                            alt="Featured food" 
                            className="absolute inset-0 w-full h-full object-cover z-0"
                            onError={(e) => {
                              console.error('Failed to load Pizza/Kebab image:', pizzaKebabBg);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => console.log('Pizza/Kebab image loaded successfully')}
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-red-500/50 to-orange-600/50 z-10"></div>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-red-500 to-orange-600 z-0"></div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <UtensilsCrossed className="w-20 h-20 text-white transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500" />
                      </div>
                    </div>
                    <div className="flex-1 p-8 md:p-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-1 bg-gradient-to-r from-red-500 to-orange-500 rounded-full"></div>
                        <span className="text-red-600 dark:text-red-400 font-bold text-sm uppercase tracking-wider">Featured</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white group-hover:text-white transition-colors">
                        {t("Pizzat & Kebab", "Pizzas & Kebab")}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg group-hover:text-white/90 transition-colors">
                        {t("Tuoreita pizzoja ja maukkaita kebabeja. Tilaa verkossa tai soita.", "Fresh pizzas and delicious kebabs. Order online or call.")}
                      </p>
                      <div className="flex items-center gap-4">
                        <div className="text-3xl font-black text-gray-900 dark:text-white group-hover:text-white transition-colors">
                          {t("Alkaen", "From")} <span className="text-red-600 group-hover:text-yellow-300">10,40€</span>
                        </div>
                        <ChevronRight className="w-8 h-8 text-red-600 group-hover:text-white group-hover:translate-x-2 transition-all" />
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>

            {config.services.hasLunchBuffet && (
              <Card className="group cursor-pointer transition-all duration-700 hover:shadow-2xl border-0 overflow-hidden relative animate-slide-up bg-white dark:bg-stone-800">
                <div className="absolute inset-0 bg-gradient-to-r from-amber-600 to-orange-600 transform -translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                <CardContent className="p-0 relative z-10">
                  <div className="flex flex-col md:flex-row-reverse items-center">
                    <div className="w-full md:w-1/3 h-48 md:h-full relative overflow-hidden">
                      <div className="absolute inset-0 bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center">
                        <Coffee className="w-20 h-20 text-white transform group-hover:-rotate-12 group-hover:scale-110 transition-all duration-500" />
                      </div>
                    </div>
                    <div className="flex-1 p-8 md:p-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-1 bg-gradient-to-r from-amber-500 to-orange-500 rounded-full"></div>
                        <span className="text-amber-600 dark:text-amber-400 font-bold text-sm uppercase tracking-wider">Daily Special</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white group-hover:text-white transition-colors">
                        {t("Lounasbuffet", "Lunch Buffet")}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg group-hover:text-white/90 transition-colors">
                        {t("Arkisin 10:00-14:30. Sisältää kahvin ja jälkiruoan.", "Weekdays 10:00-14:30. Includes coffee and dessert.")}
                      </p>
                      <div className="inline-flex items-center gap-2 px-6 py-3 bg-amber-100 dark:bg-amber-900 rounded-full group-hover:bg-white transition-colors">
                        <Clock className="w-5 h-5 text-amber-600" />
                        <span className="text-amber-900 dark:text-amber-100 font-bold">{t("Kysy hinta", "Ask for price")}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            <a href="tel:+358413152619">
              <Card className="group cursor-pointer transition-all duration-700 hover:shadow-2xl border-0 overflow-hidden relative animate-slide-up bg-white dark:bg-stone-800">
                <div className="absolute inset-0 bg-gradient-to-r from-green-600 to-emerald-600 transform translate-x-full group-hover:translate-x-0 transition-transform duration-700"></div>
                <CardContent className="p-0 relative z-10">
                  <div className="flex flex-col md:flex-row items-center md:min-h-[280px]">
                    <div className="w-full md:w-1/3 h-48 md:h-[280px] relative overflow-hidden bg-gray-900">
                      {quickOrderBg ? (
                        <>
                          <img 
                            src={quickOrderBg} 
                            alt="Quick order" 
                            className="absolute inset-0 w-full h-full object-cover z-0"
                            onError={(e) => {
                              console.error('Failed to load Quick Order image:', quickOrderBg);
                              e.currentTarget.style.display = 'none';
                            }}
                            onLoad={() => console.log('Quick Order image loaded successfully')}
                          />
                          <div className="absolute inset-0 bg-gradient-to-br from-green-500/50 to-emerald-600/50 z-10"></div>
                        </>
                      ) : (
                        <div className="absolute inset-0 bg-gradient-to-br from-green-500 to-emerald-600 z-0"></div>
                      )}
                      <div className="absolute inset-0 flex items-center justify-center z-20">
                        <Phone className="w-20 h-20 text-white transform group-hover:rotate-12 group-hover:scale-110 transition-all duration-500 animate-pulse" />
                      </div>
                    </div>
                    <div className="flex-1 p-8 md:p-10">
                      <div className="flex items-center gap-3 mb-4">
                        <div className="w-12 h-1 bg-gradient-to-r from-green-500 to-emerald-500 rounded-full"></div>
                        <span className="text-green-600 dark:text-green-400 font-bold text-sm uppercase tracking-wider">Quick Order</span>
                      </div>
                      <h3 className="text-3xl md:text-4xl font-black mb-4 text-gray-900 dark:text-white group-hover:text-white transition-colors">
                        {t("Tilaa puhelimitse", "Order by Phone")}
                      </h3>
                      <p className="text-gray-600 dark:text-gray-300 leading-relaxed mb-6 text-lg group-hover:text-white/90 transition-colors">
                        {t("Nopea tilaus suoraan ravintolaan", "Quick order directly to restaurant")}
                      </p>
                      <div className="flex items-center gap-3">
                        <div className="text-2xl font-black text-green-600 dark:text-green-400 group-hover:text-white transition-colors">
                          {config.phone}
                        </div>
                        <div className="w-12 h-12 rounded-full bg-green-100 dark:bg-green-900 flex items-center justify-center group-hover:bg-white transition-colors">
                          <Phone className="w-6 h-6 text-green-600" />
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-stone-900 dark:to-stone-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block px-6 py-2 bg-gradient-to-r from-purple-500 to-pink-500 text-white rounded-full text-sm font-bold mb-6 shadow-lg">
              {t("Suositut", "Popular")}
            </div>
            <h3 className="text-5xl md:text-6xl font-black mb-4 text-gray-900 dark:text-white">
              {t("Asiakkaidemme suosikit", "Customer Favorites")}
            </h3>
            <p className="text-xl text-gray-600 dark:text-gray-300 mb-8">
              {t("Kokeile näitä uskomattomia makuja", "Try these amazing flavors")}
            </p>
            <Link href="/menu">
              <Button 
                size="lg"
                className="bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold px-8 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
              >
                {t("Näytä koko menu", "View Full Menu")}
                <ChevronRight className="w-6 h-6 ml-2 group-hover:translate-x-2 transition-transform" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <Card 
                key={item.id} 
                className="group overflow-hidden border-0 shadow-xl hover:shadow-2xl transition-all duration-500 bg-white dark:bg-stone-800 animate-scale-in relative"
              >
                <div className="relative">
                  <div className="aspect-[4/3] relative overflow-hidden rounded-t-xl">
                    <img
                      src={item.imageUrl || "/placeholder-food.jpg"}
                      alt={item.name}
                      className="w-full h-full object-cover transition-transform duration-700 group-hover:scale-125 group-hover:rotate-3"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-black via-transparent to-transparent"></div>
                    {item.offerPercentage && (
                      <div className="absolute top-4 right-4 w-16 h-16 rounded-full bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center shadow-2xl animate-pulse">
                        <div className="text-center">
                          <div className="text-white font-black text-lg leading-none">-{item.offerPercentage}%</div>
                          <div className="text-white text-xs font-bold">OFF</div>
                        </div>
                      </div>
                    )}
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <h4 className="font-black text-2xl text-white mb-1 drop-shadow-lg">
                        {item.name}
                      </h4>
                    </div>
                  </div>
                </div>
                
                <CardContent className="p-6 relative">
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-4 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <div>
                      {item.offerPrice ? (
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-black text-red-600">
                            {parseFloat(item.offerPrice).toFixed(2)}€
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            {parseFloat(item.price).toFixed(2)}€
                          </span>
                        </div>
                      ) : (
                        <span className="text-3xl font-black bg-gradient-to-r from-red-600 to-orange-600 bg-clip-text text-transparent">
                          {parseFloat(item.price).toFixed(2)}€
                        </span>
                      )}
                    </div>
                    <Link href="/menu">
                      <Button 
                        size="lg"
                        className="rounded-full bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700 text-white font-bold shadow-lg group-hover:shadow-xl transition-all px-6"
                      >
                        {t("Tilaa", "Order")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
                <div className="absolute top-4 left-4 w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-lg"></div>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* About Section */}
      <AboutSection />

      {/* Footer */}
      <Footer />
      
      <CartModal
        isOpen={isCartOpen}
        onClose={handleCartClose}
        onCheckout={handleCheckoutOpen}
      />
      
      <CheckoutModal
        isOpen={isCheckoutOpen}
        onClose={handleCheckoutClose}
        onBack={handleBackToCart}
      />
    </div>
  );
}