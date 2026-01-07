import { useEffect, useState, useCallback, useMemo } from "react";
import { supabase } from "@/lib/supabase";
import { useRestaurant } from "@/lib/restaurant-context";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, Star, Gift, Percent, Clock, Zap, Tag } from "lucide-react";
import "@/styles/display.css";

// Types
interface Promotion {
  id: number;
  name: string;
  name_en: string;
  description: string;
  description_en: string;
  discount_type: 'percentage' | 'fixed';
  discount_value: number;
  category_id: number | null;
  start_date: string;
  end_date: string;
  is_active: boolean;
}

interface MenuItem {
  id: number;
  name: string;
  description: string | null;
  price: string;
  offer_price: string | null;
  offer_percentage: number | null;
  image_url: string | null;
  category_id: number | null;
  is_available: boolean;
}

interface DisplayItem {
  type: 'offer' | 'promotion';
  id: string;
  title: string;
  description: string;
  discount: string;
  discountValue: number;
  imageUrl: string | null;
  validUntil?: string;
  categoryId?: number | null;
  originalPrice?: string;
  offerPrice?: string;
}

// Promo Ads Display Page - REALTIME
// Screen dimensions: 1920x1080 but content rotated -90 degrees (Portrait mode)
// Cycles through: products with offers + active promotions

export default function PromoDisplay() {
  const { config } = useRestaurant();
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [categoryImages, setCategoryImages] = useState<Record<number, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);

  // Fetch menu items with offers and promotions
  const fetchData = useCallback(async () => {
    try {
      const now = new Date().toISOString();

      // Fetch menu items with offers
      const { data: menuItems, error: menuError } = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .not('offer_price', 'is', null);

      if (menuError) throw menuError;

      // Fetch active promotions
      const { data: promotions, error: promoError } = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (promoError) throw promoError;

      // Fetch all menu items for category images (for promotions)
      const { data: allMenuItems, error: allMenuError } = await supabase
        .from('menu_items')
        .select('category_id, image_url')
        .eq('is_available', true)
        .not('image_url', 'is', null);

      if (allMenuError) throw allMenuError;

      // Build category images map
      const catImages: Record<number, string[]> = {};
      (allMenuItems || []).forEach((item: any) => {
        if (item.category_id && item.image_url) {
          if (!catImages[item.category_id]) {
            catImages[item.category_id] = [];
          }
          catImages[item.category_id].push(item.image_url);
        }
      });
      setCategoryImages(catImages);

      // Convert menu items with offers to display items
      const offerItems: DisplayItem[] = (menuItems || []).map((item: MenuItem) => ({
        type: 'offer' as const,
        id: `offer-${item.id}`,
        title: item.name,
        description: item.description || '',
        discount: item.offer_percentage ? `-${item.offer_percentage}%` : `-${(parseFloat(item.price) - parseFloat(item.offer_price || '0')).toFixed(0)}€`,
        discountValue: item.offer_percentage || Math.round((parseFloat(item.price) - parseFloat(item.offer_price || '0'))),
        imageUrl: item.image_url,
        categoryId: item.category_id,
        originalPrice: item.price,
        offerPrice: item.offer_price || undefined,
      }));

      // Convert promotions to display items
      const promoItems: DisplayItem[] = (promotions || []).map((promo: Promotion) => {
        // Pick random image from category if available
        let imageUrl: string | null = null;
        if (promo.category_id && catImages[promo.category_id]?.length > 0) {
          const images = catImages[promo.category_id];
          imageUrl = images[Math.floor(Math.random() * images.length)];
        }

        return {
          type: 'promotion' as const,
          id: `promo-${promo.id}`,
          title: promo.name,
          description: promo.description || '',
          discount: promo.discount_type === 'percentage' ? `-${promo.discount_value}%` : `-${promo.discount_value}€`,
          discountValue: promo.discount_value,
          imageUrl,
          validUntil: promo.end_date,
          categoryId: promo.category_id,
        };
      });

      // Combine and sort by discount value (highest first)
      const allItems = [...offerItems, ...promoItems].sort((a, b) => b.discountValue - a.discountValue);
      setDisplayItems(allItems);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching promo data:', err);
      setIsLoading(false);
    }
  }, []);

  // Initial fetch and realtime subscriptions
  useEffect(() => {
    fetchData();

    // Subscribe to menu_items changes
    const menuChannel = supabase
      .channel('promo-menu-items')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'menu_items' }, () => {
        console.log('🔔 Menu items changed, refreshing promo display');
        fetchData();
      })
      .subscribe();

    // Subscribe to promotions changes
    const promoChannel = supabase
      .channel('promo-promotions')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'promotions' }, () => {
        console.log('🔔 Promotions changed, refreshing promo display');
        fetchData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(menuChannel);
      supabase.removeChannel(promoChannel);
    };
  }, [fetchData]);

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through items every 10 seconds
  useEffect(() => {
    if (displayItems.length === 0) return;

    const interval = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % displayItems.length);
    }, 10000);

    return () => clearInterval(interval);
  }, [displayItems]);

  const currentItem = displayItems[currentIndex];

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fi-FI", { day: "numeric", month: "short" });
  };

  // Loading state
  if (isLoading) {
    return (
      <div className="promo-display-wrapper">
        <div className="promo-display-rotated">
          <div className="promo-loading">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
            >
              <Sparkles className="w-20 h-20 text-yellow-400" />
            </motion.div>
            <p>Ladataan tarjouksia...</p>
          </div>
        </div>
      </div>
    );
  }

  // No items state
  if (displayItems.length === 0) {
    return (
      <div className="promo-display-wrapper">
        <div className="promo-display-rotated">
          <div className="promo-no-promos">
            <img src="https://ravintolababylon.fi/logo.png" alt="Babylon" className="promo-logo-img-large" />
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Gift className="w-24 h-24 text-yellow-400 mb-6" />
            </motion.div>
            <h1 className="promo-no-promos-title">{config?.name || "Babylon"}</h1>
            <p className="promo-no-promos-text">Uusia tarjouksia tulossa pian!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-display-wrapper">
      <div className="promo-display-rotated">
        {/* Animated Background */}
        <div className="promo-bg-animated">
          <div className="promo-bg-gradient" />
          <div className="promo-bg-orb promo-bg-orb-1" />
          <div className="promo-bg-orb promo-bg-orb-2" />
          <div className="promo-bg-orb promo-bg-orb-3" />
          {/* Floating particles */}
          {[...Array(15)].map((_, i) => (
            <motion.div
              key={i}
              className="promo-particle"
              animate={{
                y: [0, -150, 0],
                opacity: [0, 0.8, 0],
              }}
              transition={{
                duration: 4 + Math.random() * 3,
                repeat: Infinity,
                delay: Math.random() * 3,
              }}
              style={{ left: `${5 + Math.random() * 90}%`, bottom: 0 }}
            />
          ))}
        </div>

        {/* Header with Logo */}
        <header className="promo-header-new">
          <div className="promo-header-inner">
            <img 
              src="https://ravintolababylon.fi/logo.png" 
              alt="Babylon" 
              className="promo-logo-img" 
            />
            <div className="promo-header-title">
              <h1>{config?.name || "Babylon"}</h1>
              <span>Erikoistarjoukset</span>
            </div>
            <div className="promo-header-time">
              {currentTime.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </header>

        {/* Main Content */}
        <main className="promo-main-new">
          <AnimatePresence mode="wait">
            {currentItem && (
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, scale: 0.9, y: 50 }}
                animate={{ opacity: 1, scale: 1, y: 0 }}
                exit={{ opacity: 0, scale: 0.9, y: -50 }}
                transition={{ duration: 0.6, ease: "easeOut" }}
                className="promo-card-new"
              >
                {/* Image Section */}
                <div className="promo-image-section">
                  {currentItem.imageUrl ? (
                    <motion.img
                      src={currentItem.imageUrl}
                      alt={currentItem.title}
                      className="promo-image"
                      initial={{ scale: 1.1 }}
                      animate={{ scale: 1 }}
                      transition={{ duration: 0.8 }}
                    />
                  ) : (
                    <div className="promo-image-placeholder">
                      <motion.div
                        animate={{ rotate: [0, 10, -10, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Flame className="w-32 h-32 text-orange-400" />
                      </motion.div>
                    </div>
                  )}
                  <div className="promo-image-overlay" />
                  
                  {/* Discount Badge */}
                  <motion.div
                    initial={{ scale: 0, rotate: -30 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                    className="promo-discount-badge-new"
                  >
                    <Percent className="w-8 h-8" />
                    <span>{currentItem.discount}</span>
                  </motion.div>

                  {/* Type Badge */}
                  <div className={`promo-type-badge ${currentItem.type}`}>
                    {currentItem.type === 'offer' ? (
                      <>
                        <Tag className="w-5 h-5" />
                        <span>Tarjous</span>
                      </>
                    ) : (
                      <>
                        <Star className="w-5 h-5" />
                        <span>Kampanja</span>
                      </>
                    )}
                  </div>
                </div>

                {/* Content Section */}
                <div className="promo-content-section">
                  <motion.h2
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.2 }}
                    className="promo-item-title"
                  >
                    {currentItem.title}
                  </motion.h2>

                  {currentItem.description && (
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.3 }}
                      className="promo-item-desc"
                    >
                      {currentItem.description}
                    </motion.p>
                  )}

                  {/* Price display for offers */}
                  {currentItem.type === 'offer' && currentItem.originalPrice && currentItem.offerPrice && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.35 }}
                      className="promo-price-display"
                    >
                      <span className="promo-original-price">{parseFloat(currentItem.originalPrice).toFixed(2)}€</span>
                      <span className="promo-arrow">→</span>
                      <span className="promo-offer-price">{parseFloat(currentItem.offerPrice).toFixed(2)}€</span>
                    </motion.div>
                  )}

                  {currentItem.validUntil && (
                    <motion.div
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.4 }}
                      className="promo-valid-until"
                    >
                      <Clock className="w-6 h-6" />
                      <span>Voimassa {formatDate(currentItem.validUntil)} asti</span>
                    </motion.div>
                  )}

                  {/* CTA */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.5 }}
                    className="promo-cta-new"
                  >
                    <motion.div
                      animate={{ 
                        boxShadow: [
                          "0 0 20px rgba(251, 146, 60, 0.4)",
                          "0 0 40px rgba(251, 146, 60, 0.7)",
                          "0 0 20px rgba(251, 146, 60, 0.4)",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="promo-cta-button-new"
                    >
                      <Flame className="w-8 h-8" />
                      <span>Tilaa Nyt!</span>
                    </motion.div>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Progress Indicators */}
        <div className="promo-progress-new">
          {displayItems.map((_, index) => (
            <motion.div
              key={index}
              className={`promo-progress-item ${index === currentIndex ? "active" : ""}`}
              initial={false}
              animate={{
                width: index === currentIndex ? 40 : 12,
                backgroundColor: index === currentIndex ? "#f97316" : "rgba(255,255,255,0.3)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Footer */}
        <footer className="promo-footer-new">
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="promo-footer-content"
          >
            <Sparkles className="w-5 h-5" />
            <span>{config?.website || "ravintolababylon.fi"}</span>
            <span className="promo-footer-divider">|</span>
            <span>{config?.phone || ""}</span>
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </footer>
      </div>
    </div>
  );
}
