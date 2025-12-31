import { useState, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { usePageVariant } from "@/hooks/use-page-variant";
import { useThemeColors } from "@/hooks/use-theme-colors";
import { cn } from "@/lib/utils";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { CartModal } from "@/components/cart-modal";
import { CheckoutModal } from "@/components/checkout-modal";
import { UniversalHeader } from "@/components/universal-header";
import { MobileNav } from "@/components/mobile-nav";
import { HeroVideoWithPromotions } from "@/components/hero-video-with-promotions";
import { MultiBranchStatusHeaderV2 } from "@/components/multi-branch-status-header-v2";
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
  const variant = usePageVariant('home');
  const theme = useThemeColors();
  
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
      <MultiBranchStatusHeaderV2 />
      <HeroVideoWithPromotions />

      {/* Featured Items */}
      <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-stone-900 dark:to-stone-800 overflow-hidden">
        <div className="max-w-7xl mx-auto px-4">
          <div className="text-center mb-16 animate-fade-in">
            <div className="inline-block px-6 py-2 text-white rounded-full text-sm font-bold mb-6 shadow-lg" style={{ background: theme.getGradient(theme.secondary, theme.accent) }}>
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
                className="text-white font-bold px-8 py-6 text-lg rounded-full shadow-xl hover:shadow-2xl transition-all duration-300 group"
                style={{ background: theme.getPrimaryGradient() }}
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
                      <div className="absolute top-4 right-4 w-16 h-16 rounded-full flex items-center justify-center shadow-2xl animate-pulse" style={{ background: theme.getPrimaryGradient() }}>
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
                          <span className="text-3xl font-black" style={{ color: theme.primary }}>
                            {parseFloat(item.offerPrice).toFixed(2)}€
                          </span>
                          <span className="text-lg text-gray-400 line-through">
                            {parseFloat(item.price).toFixed(2)}€
                          </span>
                        </div>
                      ) : (
                        <span className="text-3xl font-black" style={{ color: theme.primary }}>
                          {parseFloat(item.price).toFixed(2)}€
                        </span>
                      )}
                    </div>
                    <Link href="/menu">
                      <Button 
                        size="lg"
                        className="rounded-full text-white font-bold shadow-lg group-hover:shadow-xl transition-all px-6"
                        style={{ background: theme.getPrimaryGradient() }}
                      >
                        {t("Tilaa", "Order")}
                      </Button>
                    </Link>
                  </div>
                </CardContent>
                <div className="absolute top-4 left-4 w-2 h-2 rounded-full animate-pulse shadow-lg" style={{ backgroundColor: theme.success }}></div>
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