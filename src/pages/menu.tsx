import { useState, useEffect } from "react";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { useBranches } from "@/hooks/use-branches";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ItemDetailModal } from "@/components/item-detail-modal";
import { CartModal } from "@/components/cart-modal";
import { CheckoutModal } from "@/components/checkout-modal";
import { RestaurantClosedModal } from "@/components/restaurant-closed-modal";
import { UniversalHeader } from "@/components/universal-header";
import { MobileNav } from "@/components/mobile-nav";
import { MultiBranchStatusHeader } from "@/components/multi-branch-status-header";
import { 
  Search, 
  Leaf, 
  Wheat, 
  Heart, 
  Pizza,
  UtensilsCrossed,
  Beef,
  Fish,
  Coffee,
  Beer,
  IceCream,
  Salad,
  ChefHat,
  Sandwich,
  AlertTriangle,
  Store,
  MapPin
} from "lucide-react";
import { Link } from "wouter";
import { Input } from "@/components/ui/input";
import { isOnlineOrderingAvailable, getRestaurantStatus } from "@/lib/business-hours";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";

export default function Menu() {
  const { t, language } = useLanguage();
  const { data: categories } = useCategories();
  const { data: menuItems, isLoading } = useMenuItems();
  const { data: branches } = useBranches();
  const { addItem } = useCart();
  const { config } = useRestaurantSettings();
  
  const [selectedBranch, setSelectedBranch] = useState<number | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedItem, setSelectedItem] = useState<any>(null);
  const [showItemModal, setShowItemModal] = useState(false);
  const [isCartOpen, setIsCartOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [showClosedModal, setShowClosedModal] = useState(false);
  const [isOrderingAvailable, setIsOrderingAvailable] = useState(true); // Start optimistic

  // Check ordering availability
  useEffect(() => {
    const checkOrderingStatus = () => {
      if (config) {
        console.log('🔍 Menu: Checking ordering status', {
          isBusy: config.isBusy,
          isOnlineOrderingAvailable: isOnlineOrderingAvailable(config)
        });
        
        // Check if restaurant is busy
        if (config.isBusy) {
          console.log('⚠️ Menu: Restaurant is BUSY - disabling orders');
          setIsOrderingAvailable(false);
          if (!showClosedModal) {
            setShowClosedModal(true);
          }
          return;
        }
        
        const available = isOnlineOrderingAvailable(config);
        setIsOrderingAvailable(available);
        
        // Show closed modal only if we have config and it's definitely closed
        if (!available && !showClosedModal) {
          setShowClosedModal(true);
        }
      }
    };

    checkOrderingStatus();
    
    // Check every minute
    const interval = setInterval(checkOrderingStatus, 60000);
    
    return () => clearInterval(interval);
  }, [showClosedModal, config]);

  const handleCartOpen = () => {
    if (!isOrderingAvailable) {
      setShowClosedModal(true);
      return;
    }
    setIsCartOpen(true);
  };
  
  const handleCartClose = () => setIsCartOpen(false);
  const handleCheckoutOpen = () => {
    if (!isOrderingAvailable) {
      setShowClosedModal(true);
      return;
    }
    setIsCheckoutOpen(true);
  };
  
  const handleCheckoutClose = () => setIsCheckoutOpen(false);
  const handleBackToCart = () => {
    setIsCheckoutOpen(false);
    setIsCartOpen(true);
  };

  const filteredItems = menuItems?.filter(item => {
    const matchesCategory = selectedCategory === "all" || item.categoryId?.toString() === selectedCategory;
    const matchesSearch = searchTerm === "" || 
      item.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      item.nameEn.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesBranch = selectedBranch === null || item.branch_id === null || item.branch_id === selectedBranch;
    return matchesCategory && matchesSearch && matchesBranch && item.isAvailable;
  }) || [];

  const handleItemClick = (item: any) => {
    if (!isOrderingAvailable) {
      setShowClosedModal(true);
      return;
    }
    setSelectedItem(item);
    setShowItemModal(true);
  };

  const handleAddToCart = (item: any, quantity: number, size?: string, toppings?: string[], specialInstructions?: string, toppingsPrice?: number, sizePrice?: number) => {
    if (!isOrderingAvailable) {
      setShowClosedModal(true);
      return;
    }
    addItem(item, quantity, size, toppings, specialInstructions, toppingsPrice, sizePrice);
    setShowItemModal(false);
  };

  const formatPrice = (price: string) => {
    return `${parseFloat(price).toFixed(2)} €`;
  };

  const isPizza = (categoryId: number | null) => {
    if (!categoryId) return false;
    const category = categories?.find(cat => cat.id === categoryId);
    return category?.name.toLowerCase().includes('pizza') || false;
  };

  // Category icon mapping
  const getCategoryIcon = (categoryName: string) => {
    const name = categoryName.toLowerCase();
    if (name.includes('pizza')) return Pizza;
    if (name.includes('kebab')) return Beef;
    if (name.includes('kana') || name.includes('chicken')) return ChefHat;
    if (name.includes('burger')) return Sandwich;
    if (name.includes('salaatti') || name.includes('salad')) return Salad;
    if (name.includes('juomat') || name.includes('drink')) return Coffee;
    if (name.includes('olut') || name.includes('beer')) return Beer;
    if (name.includes('jälkiruoka') || name.includes('dessert')) return IceCream;
    if (name.includes('kala') || name.includes('fish')) return Fish;
    return UtensilsCrossed;
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
        <MobileNav />
        <div className="max-w-7xl mx-auto px-4 py-6">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 12 }).map((_, i) => (
              <Card key={i} className="overflow-hidden">
                <Skeleton className="h-48 w-full" />
                <CardContent className="p-4">
                  <Skeleton className="h-4 w-3/4 mb-2" />
                  <Skeleton className="h-3 w-full mb-2" />
                  <Skeleton className="h-6 w-20" />
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-red-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <UniversalHeader onCartClick={handleCartOpen} />
      
      {/* Modern Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-orange-600 to-red-600 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-4">
                {t("Tuoretta ja maukasta", "Fresh & Delicious")}
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight drop-shadow-lg">
                {t("Ruokalista", "Our Menu")}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                {t("Löydä suosikkisi yli", "Find your favorite from over")} {filteredItems.length}+ {t("tuotteen valikoimasta", "products")}
              </p>
            </div>
            <div className="relative animate-slide-up">
              <div className="absolute -inset-4 bg-white/10 blur-3xl rounded-full"></div>
              <div className="relative bg-white dark:bg-stone-800 rounded-2xl shadow-2xl p-2">
                <div className="relative">
                  <Search className="absolute left-6 top-1/2 transform -translate-y-1/2 w-6 h-6 text-gray-400" />
                  <Input
                    type="text"
                    placeholder={t("Etsi ruokia...", "Search menu items...")}
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-16 pr-6 py-7 text-lg border-0 bg-transparent focus:ring-2 focus:ring-red-500 rounded-xl"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Restaurant Status */}
      <MultiBranchStatusHeader />

      {/* Branch Selection */}
      {branches && branches.length > 1 && (
        <div className="bg-white dark:bg-stone-800 border-b border-gray-200 dark:border-stone-700">
          <div className="max-w-7xl mx-auto px-4 py-4">
            <div className="flex items-center gap-3 flex-wrap">
              <Store className="w-5 h-5 text-gray-600 dark:text-gray-400" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t("Valitse toimipiste:", "Select branch:")}
              </span>
              <div className="flex gap-2 flex-wrap">
                <Button
                  variant={selectedBranch === null ? "default" : "outline"}
                  size="sm"
                  onClick={() => setSelectedBranch(null)}
                  className={selectedBranch === null ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700" : ""}
                >
                  {t("Kaikki", "All")}
                </Button>
                {branches.map((branch) => (
                  <Button
                    key={branch.id}
                    variant={selectedBranch === branch.id ? "default" : "outline"}
                    size="sm"
                    onClick={() => setSelectedBranch(branch.id)}
                    className={selectedBranch === branch.id ? "bg-gradient-to-r from-red-600 to-orange-600 hover:from-red-700 hover:to-orange-700" : ""}
                  >
                    <MapPin className="w-3.5 h-3.5 mr-1.5" />
                    {language === 'en' ? branch.name_en : branch.name}
                  </Button>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content - Sidebar Layout */}
      <div className="max-w-7xl mx-auto px-4 py-10">
        <div className="flex flex-col lg:flex-row gap-8">
          {/* Sidebar Categories */}
          <aside className="lg:w-72 flex-shrink-0">
            <div className="lg:sticky lg:top-4 space-y-6">
              <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-xl p-6 animate-slide-up">
                <h2 className="text-2xl font-black mb-6 text-gray-900 dark:text-white flex items-center gap-3">
                  <div className="w-1 h-8 bg-gradient-to-b from-red-600 to-orange-600 rounded-full"></div>
                  {t("Kategoriat", "Categories")}
                </h2>
                <div className="space-y-2 max-h-[600px] overflow-y-auto pr-2 scrollbar-thin scrollbar-thumb-red-500 scrollbar-track-gray-100 dark:scrollbar-track-stone-700">
                  <button
                    onClick={() => setSelectedCategory("all")}
                    className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-between group ${
                      selectedCategory === "all"
                        ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg transform scale-105'
                        : 'bg-gray-50 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-stone-600'
                    }`}
                  >
                    <span className="flex items-center gap-3">
                      <UtensilsCrossed className="w-5 h-5" />
                      {t("Kaikki tuotteet", "All Items")}
                    </span>
                    <span className={`text-sm font-black px-3 py-1 rounded-full ${
                      selectedCategory === "all" 
                        ? 'bg-white/20' 
                        : 'bg-gray-200 dark:bg-stone-600'
                    }`}>
                      {menuItems?.length || 0}
                    </span>
                  </button>
                  
                  {categories?.map((cat) => {
                    const IconComponent = getCategoryIcon(cat.name);
                    const categoryItems = menuItems?.filter(item => item.categoryId === cat.id) || [];
                    return (
                      <button
                        key={cat.id}
                        onClick={() => setSelectedCategory(cat.id.toString())}
                        className={`w-full text-left px-6 py-4 rounded-xl font-bold transition-all duration-300 flex items-center justify-between group ${
                          selectedCategory === cat.id.toString()
                            ? 'bg-gradient-to-r from-red-600 to-orange-600 text-white shadow-lg transform scale-105'
                            : 'bg-gray-50 dark:bg-stone-700 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-stone-600'
                        }`}
                      >
                        <span className="flex items-center gap-3">
                          <IconComponent className="w-5 h-5" />
                          {cat.name.replace(/🍕😍|🥗|🍗|🍔|🥤/, '').trim()}
                        </span>
                        <span className={`text-sm font-black px-3 py-1 rounded-full ${
                          selectedCategory === cat.id.toString() 
                            ? 'bg-white/20' 
                            : 'bg-gray-200 dark:bg-stone-600'
                        }`}>
                          {categoryItems.length}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
              
              {/* Stats Card */}
              <div className="bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl shadow-xl p-6 text-white animate-scale-in">
                <div className="text-5xl font-black mb-2">{filteredItems.length}</div>
                <div className="text-white/90 font-bold">{t("tuotetta löytyi", "items found")}</div>
              </div>
            </div>
          </aside>

          {/* Menu Items Grid */}
          <div className="flex-1">
            {filteredItems.length === 0 ? (
              <div className="text-center py-20 animate-fade-in bg-white dark:bg-stone-800 rounded-2xl shadow-xl">
                <div className="w-24 h-24 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-stone-700 dark:to-stone-600 flex items-center justify-center">
                  <Search className="w-12 h-12 text-gray-400" />
                </div>
                <p className="text-2xl font-bold text-gray-600 dark:text-gray-400 mb-2">
                  {t("Ei tuloksia", "No results found")}
                </p>
                <p className="text-gray-500 dark:text-gray-500">
                  {t("Kokeile toista hakusanaa", "Try a different search term")}
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
                {filteredItems.map((item) => (
                  <Card 
                    key={item.id}
                    className={`group overflow-hidden border-0 bg-white dark:bg-stone-800 hover:shadow-2xl transition-all duration-500 animate-scale-in relative ${
                      isOrderingAvailable 
                        ? 'cursor-pointer' 
                        : 'opacity-60 cursor-not-allowed'
                    }`}
                    onClick={() => handleItemClick(item)}
                  >
                    <div className="absolute top-4 left-4 z-10 flex gap-2">
                      {item.isVegetarian && (
                        <div className="bg-green-500 text-white rounded-full p-2 shadow-lg">
                          <Leaf className="w-4 h-4" />
                        </div>
                      )}
                      {item.isVegan && (
                        <div className="bg-green-600 text-white rounded-full p-2 shadow-lg">
                          <Heart className="w-4 h-4" />
                        </div>
                      )}
                      {item.isGlutenFree && (
                        <div className="bg-amber-500 text-white rounded-full p-2 shadow-lg">
                          <Wheat className="w-4 h-4" />
                        </div>
                      )}
                    </div>

                    {item.offerPercentage && (
                      <div className="absolute top-4 right-4 z-10 bg-gradient-to-r from-red-500 to-orange-600 text-white px-4 py-2 rounded-full font-black text-sm shadow-xl animate-pulse">
                        🔥 -{item.offerPercentage}% OFF
                      </div>
                    )}
                    
                    <div className="aspect-[16/11] relative overflow-hidden bg-gray-100 dark:bg-stone-700">
                      <img
                        src={item.imageUrl || "/placeholder-food.jpg"}
                        alt={item.name}
                        className={`w-full h-full object-cover transition-transform duration-700 ${
                          !isOrderingAvailable ? 'grayscale' : 'group-hover:scale-110 group-hover:rotate-1'
                        }`}
                        loading="lazy"
                      />
                      <div className={`absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent ${
                        isOrderingAvailable ? 'opacity-0 group-hover:opacity-100' : 'opacity-100'
                      } transition-opacity duration-500`}></div>
                      
                      {!isOrderingAvailable && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center">
                          <div className="text-white text-center">
                            <AlertTriangle className="w-10 h-10 mx-auto mb-3" />
                            <span className="text-base font-bold">
                              {t("Tilaukset suljettu", "Orders closed")}
                            </span>
                          </div>
                        </div>
                      )}
                    </div>
                    
                    <CardContent className="p-6">
                      <div className="mb-4">
                        <h3 className="text-xl font-black text-gray-900 dark:text-white mb-2 group-hover:text-red-600 transition-colors line-clamp-1">
                          {item.name}
                        </h3>
                        <p className="text-sm text-gray-600 dark:text-gray-400 line-clamp-2">
                          {item.description}
                        </p>
                      </div>
                      
                      <div className="flex items-center justify-between pt-4 border-t border-gray-100 dark:border-stone-700">
                        <div>
                          {item.offerPrice ? (
                            <div>
                              <div className="text-3xl font-black text-red-600 mb-1">
                                {formatPrice(item.offerPrice)}
                              </div>
                              <div className="text-sm text-gray-400 line-through">
                                {formatPrice(item.price)}
                              </div>
                            </div>
                          ) : (
                            <div className="text-3xl font-black bg-gradient-to-r from-gray-900 to-gray-700 dark:from-white dark:to-gray-300 bg-clip-text text-transparent">
                              {formatPrice(item.price)}
                            </div>
                          )}
                        </div>
                        {isOrderingAvailable && (
                          <div className="w-12 h-12 rounded-full bg-gradient-to-r from-red-600 to-orange-600 flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:shadow-xl transition-all">
                            <ChefHat className="w-6 h-6 text-white" />
                          </div>
                        )}
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Item Detail Modal */}
      <ItemDetailModal
        item={selectedItem}
        isOpen={showItemModal}
        onClose={() => setShowItemModal(false)}
        onAddToCart={handleAddToCart}
      />

      {/* Cart and Checkout Modals */}
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

      {/* Closed Restaurant Modal */}
      <RestaurantClosedModal
        isOpen={showClosedModal}
        onClose={() => setShowClosedModal(false)}
      />
    </div>
  );
}