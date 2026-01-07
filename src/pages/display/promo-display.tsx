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
// NEW LAYOUT: Centered circular image with info below and animated discount badge

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
          <div className="promo-empty-state">
            <img src="https://ravintolababylon.fi/logo.png" alt="Babylon" className="promo-empty-logo" />
            <motion.div animate={{ scale: [1, 1.1, 1] }} transition={{ duration: 2, repeat: Infinity }}>
              <Gift className="w-20 h-20 text-yellow-400" />
            </motion.div>
            <p className="promo-empty-text">Uusia tarjouksia tulossa pian!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-display-wrapper">
      <div className="promo-display-rotated">
        {/* Animated Background */}
        <div className="promo-centered-bg">
          <div className="promo-centered-gradient" />
          {/* Animated rings */}
          <motion.div 
            className="promo-bg-ring promo-bg-ring-1"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          />
          <motion.div 
            className="promo-bg-ring promo-bg-ring-2"
            animate={{ rotate: -360 }}
            transition={{ duration: 80, repeat: Infinity, ease: "linear" }}
          />
          {/* Floating particles */}
          {[...Array(20)].map((_, i) => (
            <motion.div
              key={i}
              className="promo-floating-particle"
              animate={{
                y: [0, -200, 0],
                x: [0, Math.sin(i * 0.5) * 50, 0],
                opacity: [0, 0.6, 0],
                scale: [0.5, 1, 0.5],
              }}
              transition={{
                duration: 5 + Math.random() * 4,
                repeat: Infinity,
                delay: Math.random() * 4,
              }}
              style={{ 
                left: `${5 + Math.random() * 90}%`, 
                bottom: '-20px',
              }}
            />
          ))}
        </div>

        {/* Big Logo at Top */}
        <header className="promo-centered-header">
          <motion.img 
            src="https://ravintolababylon.fi/logo.png" 
            alt="Babylon" 
            className="promo-big-logo"
            initial={{ y: -20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.6 }}
          />
        </header>

        {/* Main Content - Centered Layout */}
        <main className="promo-centered-main">
          <AnimatePresence mode="wait">
            {currentItem && (
              <motion.div
                key={currentItem.id}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.8 }}
                transition={{ duration: 0.5, ease: "easeOut" }}
                className="promo-centered-card"
              >
                {/* Circular Image Container */}
                <div className="promo-circle-container">
                  {/* Animated glow ring */}
                  <motion.div 
                    className="promo-circle-glow"
                    animate={{ 
                      boxShadow: [
                        "0 0 40px rgba(249, 115, 22, 0.4), 0 0 80px rgba(249, 115, 22, 0.2)",
                        "0 0 60px rgba(249, 115, 22, 0.6), 0 0 120px rgba(249, 115, 22, 0.3)",
                        "0 0 40px rgba(249, 115, 22, 0.4), 0 0 80px rgba(249, 115, 22, 0.2)",
                      ]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                  />
                  
                  {/* Rotating border */}
                  <motion.div 
                    className="promo-circle-border"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                  />

                  {/* Image */}
                  <div className="promo-circle-image">
                    {currentItem.imageUrl ? (
                      <motion.img
                        src={currentItem.imageUrl}
                        alt={currentItem.title}
                        initial={{ scale: 1.2 }}
                        animate={{ scale: 1 }}
                        transition={{ duration: 0.6 }}
                      />
                    ) : (
                      <motion.div 
                        className="promo-circle-placeholder"
                        animate={{ rotate: [0, 5, -5, 0] }}
                        transition={{ duration: 4, repeat: Infinity }}
                      >
                        <Flame className="w-24 h-24 text-orange-400" />
                      </motion.div>
                    )}
                  </div>

                  {/* Animated Discount Badge - orbiting the circle */}
                  <motion.div
                    className="promo-orbiting-discount"
                    animate={{ 
                      rotate: [0, 360],
                    }}
                    transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
                  >
                    <motion.div 
                      className="promo-discount-bubble"
                      animate={{ 
                        scale: [1, 1.1, 1],
                        rotate: [0, -360], // Counter-rotate to keep text upright
                      }}
                      transition={{ 
                        scale: { duration: 1, repeat: Infinity },
                        rotate: { duration: 10, repeat: Infinity, ease: "linear" }
                      }}
                    >
                      <span className="promo-discount-text">{currentItem.discount}</span>
                    </motion.div>
                  </motion.div>
                </div>

                {/* Type Badge */}
                <motion.div 
                  className={`promo-type-pill ${currentItem.type}`}
                  initial={{ y: 10, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2 }}
                >
                  {currentItem.type === 'offer' ? (
                    <>
                      <Tag className="w-4 h-4" />
                      <span>TARJOUS</span>
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      <span>KAMPANJA</span>
                    </>
                  )}
                </motion.div>

                {/* Info Section */}
                <motion.div 
                  className="promo-info-section"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  <h2 className="promo-centered-title">{currentItem.title}</h2>
                  
                  {currentItem.description && (
                    <p className="promo-centered-desc">{currentItem.description}</p>
                  )}

                  {/* Price display for offers */}
                  {currentItem.type === 'offer' && currentItem.originalPrice && currentItem.offerPrice && (
                    <motion.div 
                      className="promo-centered-prices"
                      initial={{ scale: 0.9 }}
                      animate={{ scale: 1 }}
                      transition={{ delay: 0.4 }}
                    >
                      <span className="promo-old-price">{parseFloat(currentItem.originalPrice).toFixed(2)}€</span>
                      <motion.span 
                        className="promo-new-price"
                        animate={{ 
                          textShadow: [
                            "0 0 10px rgba(34, 197, 94, 0.5)",
                            "0 0 30px rgba(34, 197, 94, 0.8)",
                            "0 0 10px rgba(34, 197, 94, 0.5)",
                          ]
                        }}
                        transition={{ duration: 1.5, repeat: Infinity }}
                      >
                        {parseFloat(currentItem.offerPrice).toFixed(2)}€
                      </motion.span>
                    </motion.div>
                  )}

                  {currentItem.validUntil && (
                    <div className="promo-centered-validity">
                      <Clock className="w-5 h-5" />
                      <span>Voimassa {formatDate(currentItem.validUntil)} asti</span>
                    </div>
                  )}
                </motion.div>

                {/* Animated CTA */}
                <motion.div
                  className="promo-centered-cta"
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.5 }}
                >
                  <motion.div
                    className="promo-cta-pulse"
                    animate={{ 
                      scale: [1, 1.05, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(249, 115, 22, 0.4)",
                        "0 0 0 20px rgba(249, 115, 22, 0)",
                      ]
                    }}
                    transition={{ duration: 1.5, repeat: Infinity }}
                  >
                    <Flame className="w-6 h-6" />
                    <span>TILAA NYT!</span>
                  </motion.div>
                </motion.div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Progress Indicators */}
        <div className="promo-centered-progress">
          {displayItems.map((_, index) => (
            <motion.div
              key={index}
              className="promo-progress-pip"
              animate={{
                width: index === currentIndex ? 32 : 10,
                backgroundColor: index === currentIndex ? "#f97316" : "rgba(255,255,255,0.3)",
              }}
              transition={{ duration: 0.3 }}
            />
          ))}
        </div>

        {/* Footer with time */}
        <footer className="promo-centered-footer">
          <div className="promo-footer-time">
            {currentTime.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </footer>
      </div>
    </div>
  );
}
