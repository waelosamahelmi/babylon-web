import { useEffect, useState, useCallback } from "react";
import { supabase } from "@/lib/supabase";
import "@/styles/display.css";

// Detect if browser is a smart TV (Samsung, LG, etc.) - they have limited JS support
const isSmartTV = typeof navigator !== 'undefined' && (
  /SmartTV|SMART-TV|Tizen|WebOS|NetCast/i.test(navigator.userAgent) ||
  /Samsung|LG|Hisense|Philips|Sony/i.test(navigator.userAgent)
);

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
// Smart TV Compatible: Uses CSS animations instead of framer-motion for better compatibility

export default function PromoDisplay() {
  const [displayItems, setDisplayItems] = useState<DisplayItem[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [categoryImages, setCategoryImages] = useState<Record<number, string[]>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [loadingTimeout, setLoadingTimeout] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Timeout to prevent infinite loading - show empty state after 10 seconds
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Promo display loading timeout, showing fallback');
        setLoadingTimeout(true);
        setIsLoading(false);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  // Fetch menu items with offers and promotions
  const fetchData = useCallback(async () => {
    try {
      setError(null);
      const now = new Date().toISOString();

      // Fetch menu items with offers
      const menuResult = await supabase
        .from('menu_items')
        .select('*')
        .eq('is_available', true)
        .not('offer_price', 'is', null);

      if (menuResult.error) throw menuResult.error;
      const menuItems = menuResult.data || [];

      // Fetch active promotions
      const promoResult = await supabase
        .from('promotions')
        .select('*')
        .eq('is_active', true)
        .lte('start_date', now)
        .gte('end_date', now);

      if (promoResult.error) throw promoResult.error;
      const promotions = promoResult.data || [];

      // Fetch all menu items for category images (for promotions)
      const allMenuResult = await supabase
        .from('menu_items')
        .select('category_id, image_url')
        .eq('is_available', true)
        .not('image_url', 'is', null);

      if (allMenuResult.error) throw allMenuResult.error;
      const allMenuItems = allMenuResult.data || [];

      // Build category images map
      const catImages: Record<number, string[]> = {};
      for (let i = 0; i < allMenuItems.length; i++) {
        const item = allMenuItems[i];
        if (item.category_id && item.image_url) {
          if (!catImages[item.category_id]) {
            catImages[item.category_id] = [];
          }
          catImages[item.category_id].push(item.image_url);
        }
      }
      setCategoryImages(catImages);

      // Convert menu items with offers to display items
      const offerItems: DisplayItem[] = [];
      for (let i = 0; i < menuItems.length; i++) {
        const item = menuItems[i] as MenuItem;
        const originalPrice = parseFloat(item.price);
        const offerPrice = item.offer_price ? parseFloat(item.offer_price) : 0;
        const discountAmount = originalPrice - offerPrice;
        
        offerItems.push({
          type: 'offer',
          id: 'offer-' + item.id,
          title: item.name,
          description: item.description || '',
          discount: item.offer_percentage ? ('-' + item.offer_percentage + '%') : ('-' + discountAmount.toFixed(0) + '€'),
          discountValue: item.offer_percentage || Math.round(discountAmount),
          imageUrl: item.image_url,
          categoryId: item.category_id,
          originalPrice: item.price,
          offerPrice: item.offer_price || undefined,
        });
      }

      // Convert promotions to display items
      const promoItems: DisplayItem[] = [];
      for (let i = 0; i < promotions.length; i++) {
        const promo = promotions[i] as Promotion;
        // Pick random image from category if available
        let imageUrl: string | null = null;
        if (promo.category_id && catImages[promo.category_id] && catImages[promo.category_id].length > 0) {
          const images = catImages[promo.category_id];
          imageUrl = images[Math.floor(Math.random() * images.length)];
        }

        promoItems.push({
          type: 'promotion',
          id: 'promo-' + promo.id,
          title: promo.name,
          description: promo.description || '',
          discount: promo.discount_type === 'percentage' ? ('-' + promo.discount_value + '%') : ('-' + promo.discount_value + '€'),
          discountValue: promo.discount_value,
          imageUrl: imageUrl,
          validUntil: promo.end_date,
          categoryId: promo.category_id,
        });
      }

      // Combine and sort by discount value (highest first)
      const allItems = offerItems.concat(promoItems);
      allItems.sort(function(a, b) { return b.discountValue - a.discountValue; });
      setDisplayItems(allItems);
      setIsLoading(false);
    } catch (err) {
      console.error('Error fetching promo data:', err);
      setError(err instanceof Error ? err.message : 'Unknown error');
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

  // Format date - Samsung TV compatible
  const formatDate = function(dateString: string) {
    try {
      const date = new Date(dateString);
      const day = date.getDate();
      const months = ['tammi', 'helmi', 'maalis', 'huhti', 'touko', 'kesä', 'heinä', 'elo', 'syys', 'loka', 'marras', 'joulu'];
      return day + '. ' + months[date.getMonth()];
    } catch (e) {
      return dateString;
    }
  };

  // Format time - Samsung TV compatible
  const formatTime = function(date: Date) {
    const hours = date.getHours().toString().padStart(2, '0');
    const minutes = date.getMinutes().toString().padStart(2, '0');
    return hours + ':' + minutes;
  };

  // Loading state - CSS only, no framer-motion
  if (isLoading) {
    return (
      <div className="promo-display-wrapper">
        <div className="promo-display-rotated">
          <div className="promo-loading">
            <div className="promo-loading-spinner">⭐</div>
            <p>Ladataan tarjouksia...</p>
          </div>
        </div>
      </div>
    );
  }

  // Error state
  if (error) {
    return (
      <div className="promo-display-wrapper">
        <div className="promo-display-rotated">
          <div className="promo-empty-state">
            <img src="https://ravintolababylon.fi/logo.png" alt="Babylon" className="promo-empty-logo" />
            <p className="promo-empty-text">Yhteysvirhe. Ladataan uudelleen...</p>
          </div>
        </div>
      </div>
    );
  }

  // No items state - CSS only
  if (displayItems.length === 0) {
    return (
      <div className="promo-display-wrapper">
        <div className="promo-display-rotated">
          <div className="promo-empty-state">
            <img src="https://ravintolababylon.fi/logo.png" alt="Babylon" className="promo-empty-logo" />
            <div className="promo-empty-icon">🎁</div>
            <p className="promo-empty-text">Uusia tarjouksia tulossa pian!</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-display-wrapper">
      <div className="promo-display-rotated">
        {/* Animated Background - CSS only */}
        <div className="promo-centered-bg">
          <div className="promo-centered-gradient"></div>
          {/* Animated rings - CSS animations */}
          <div className="promo-bg-ring promo-bg-ring-1 promo-spin-slow"></div>
          <div className="promo-bg-ring promo-bg-ring-2 promo-spin-slow-reverse"></div>
        </div>

        {/* Big Logo at Top */}
        <header className="promo-centered-header">
          <img 
            src="https://ravintolababylon.fi/logo.png" 
            alt="Babylon" 
            className="promo-big-logo promo-fade-in"
          />
        </header>

        {/* Main Content - Centered Layout */}
        <main className="promo-centered-main">
          {currentItem && (
            <div key={currentItem.id} className="promo-centered-card promo-fade-in">
              {/* Circular Image Container */}
              <div className="promo-circle-container">
                {/* Animated glow ring - CSS */}
                <div className="promo-circle-glow promo-pulse-glow"></div>
                
                {/* Rotating border - CSS */}
                <div className="promo-circle-border promo-spin-slow"></div>

                {/* Image */}
                <div className="promo-circle-image">
                  {currentItem.imageUrl ? (
                    <img
                      src={currentItem.imageUrl}
                      alt={currentItem.title}
                      className="promo-circle-img"
                    />
                  ) : (
                    <div className="promo-circle-placeholder">
                      🔥
                    </div>
                  )}
                </div>

                {/* Animated Discount Badge - orbiting the circle */}
                <div className="promo-orbiting-discount promo-orbit">
                  <div className="promo-discount-bubble promo-pulse promo-orbit-reverse">
                    <span className="promo-discount-text">{currentItem.discount}</span>
                  </div>
                </div>
              </div>

              {/* Type Badge */}
              <div className={'promo-type-pill ' + currentItem.type}>
                {currentItem.type === 'offer' ? (
                  <span>🏷️ TARJOUS</span>
                ) : (
                  <span>⭐ KAMPANJA</span>
                )}
              </div>

              {/* Info Section */}
              <div className="promo-info-section">
                <h2 className="promo-centered-title">{currentItem.title}</h2>
                
                {currentItem.description && (
                  <p className="promo-centered-desc">{currentItem.description}</p>
                )}

                {/* Price display for offers */}
                {currentItem.type === 'offer' && currentItem.originalPrice && currentItem.offerPrice && (
                  <div className="promo-centered-prices">
                    <span className="promo-old-price">{parseFloat(currentItem.originalPrice).toFixed(2)}€</span>
                    <span className="promo-new-price promo-glow-text">
                      {parseFloat(currentItem.offerPrice).toFixed(2)}€
                    </span>
                  </div>
                )}

                {currentItem.validUntil && (
                  <div className="promo-centered-validity">
                    <span>🕐 Voimassa {formatDate(currentItem.validUntil)} asti</span>
                  </div>
                )}
              </div>

              {/* Animated CTA */}
              <div className="promo-centered-cta">
                <div className="promo-cta-pulse promo-pulse">
                  <span>🔥 TILAA NYT!</span>
                </div>
              </div>
            </div>
          )}
        </main>

        {/* Progress Indicators */}
        <div className="promo-centered-progress">
          {displayItems.map(function(_, index) {
            return (
              <div
                key={index}
                className={'promo-progress-pip ' + (index === currentIndex ? 'active' : '')}
              ></div>
            );
          })}
        </div>

        {/* Footer with time */}
        <footer className="promo-centered-footer">
          <div className="promo-footer-time">
            {formatTime(currentTime)}
          </div>
        </footer>
      </div>
    </div>
  );
}
