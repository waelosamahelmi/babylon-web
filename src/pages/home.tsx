import { useState } from "react";
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
import { RestaurantStatusHeader } from "@/components/restaurant-status-header";
import { ServiceHoursSection } from "@/components/service-hours-section";
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <UniversalHeader onCartClick={handleCartOpen} />
      <RestaurantStatusHeader />
      <HeroVideo />

      {/* Service Highlights */}
      <section className="py-12 bg-white dark:bg-stone-800">
        <div className="max-w-7xl mx-auto px-4">
          <h2 className="text-3xl font-bold text-center mb-8 text-gray-900 dark:text-white">
            {t(`${config.name} tarjoaa`, `${config.nameEn} offers`)}
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Link href="/menu">
              <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ 
                      backgroundColor: `${config.theme.primary}20`,
                      color: config.theme.primary 
                    }}
                  >
                    <UtensilsCrossed className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {t("Pizzat & Kebab", "Pizzas & Kebab")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400">
                    {t("Tuoreita pizzoja ja maukkaita kebabeja. Tilaa verkossa tai soita.", "Fresh pizzas and delicious kebabs. Order online or call.")}
                  </p>
                  {config?.theme?.secondary && (
                    <div 
                      className="mt-4 text-sm font-medium"
                      style={{ color: config.theme.secondary }}
                    >
                      {t("Alkaen 10,40€", "From 10,40€")}
                    </div>
                  )}
                </CardContent>
              </Card>
            </Link>

            {config.services.hasLunchBuffet && (
              <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ 
                      backgroundColor: `${config.theme.secondary}20`,
                      color: config.theme.secondary 
                    }}
                  >
                    <Coffee className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {t("Lounasbuffet", "Lunch Buffet")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t("Arkisin 10:00-14:30. Sisältää kahvin ja jälkiruoan.", "Weekdays 10:00-14:30. Includes coffee and dessert.")}
                  </p>
                  <div style={{ color: config.theme.secondary }} className="font-bold text-lg">
                    {t("Kysy hinta", "Ask for price")}
                  </div>
                </CardContent>
              </Card>
            )}

            <a href="tel:+358413152619">
              <Card className="cursor-pointer hover:shadow-xl transition-all duration-300 hover:scale-105">
                <CardContent className="p-8 text-center">
                  <div 
                    className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-6"
                    style={{ 
                      backgroundColor: `${config.theme.success}20`,
                      color: config.theme.success 
                    }}
                  >
                    <Phone className="w-8 h-8" />
                  </div>
                  <h3 className="text-xl font-semibold mb-3">
                    {t("Tilaa puhelimitse", "Order by Phone")}
                  </h3>
                  <p className="text-gray-600 dark:text-gray-400 mb-4">
                    {t("Nopea tilaus suoraan pizzeriaan", "Quick order directly to restaurant")}
                  </p>
                  <div style={{ color: config.theme.success }} className="font-bold text-lg">
                    {config.phone}
                  </div>
                </CardContent>
              </Card>
            </a>
          </div>
        </div>
      </section>

      {/* Featured Items */}
      <section className="py-8 bg-white dark:bg-stone-800">
        <div className="max-w-7xl mx-auto px-4">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white">
              {t("Suositut ruoat", "Popular Dishes")}
            </h3>
            <Link href="/menu">
              <Button variant="outline" size="sm">
                {t("Näytä kaikki", "View All")}
                <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {featuredItems.map((item) => (
              <Card key={item.id} className="overflow-hidden hover:shadow-lg transition-shadow duration-200">
                <div className="aspect-video relative">
                  <img
                    src={item.imageUrl || "/placeholder-food.jpg"}
                    alt={item.name}
                    className="w-full h-full object-cover"
                  />
                  {item.offerPercentage && (
                    <Badge 
                      className="absolute top-2 right-2 text-white"
                      style={{ backgroundColor: config.theme.warning }}
                    >
                      -{item.offerPercentage}%
                    </Badge>
                  )}
                </div>
                
                <CardContent className="p-4">
                  <h4 className="font-semibold text-gray-900 dark:text-white mb-2">
                    {item.name}
                  </h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-3 line-clamp-2">
                    {item.description}
                  </p>
                  <div className="flex items-center justify-between">
                    <span className="text-lg font-bold text-gray-900 dark:text-white">
                      {item.offerPrice ? 
                        `${parseFloat(item.offerPrice).toFixed(2)} €` : 
                        `${parseFloat(item.price).toFixed(2)} €`
                      }
                    </span>
                    <Link href="/menu">
                      <Button size="sm" variant="outline">
                        {t("Tilaa", "Order")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>



      {/* Service Hours Section */}
      <ServiceHoursSection />

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