import { useEffect, useState, useMemo } from "react";
import { useRealtimeMenu } from "@/hooks/use-realtime-menu";
import { useActivePromotions, calculatePromotionDiscount } from "@/hooks/use-promotions";
import { useRestaurant } from "@/lib/restaurant-context";
import { motion } from "framer-motion";
import { Leaf, Wheat, Heart, Flame, Star } from "lucide-react";
import "@/styles/display.css";

// Menu Display Page 2 - Second third of menu items
// Screen dimensions: 1280x720 (HD 720p)
// Category-grouped layout with category headers
// REALTIME: Auto-updates when prices/items change in database

const PIZZA_CATEGORY_ID = 1; // Pizzas category
const PERHE_EXTRA = 8; // Family size costs +8€

export default function MenuDisplay2() {
  const { menuItems, categories, isLoading } = useRealtimeMenu();
  const { data: promotions } = useActivePromotions();
  const { config } = useRestaurant();
  const [currentTime, setCurrentTime] = useState(new Date());
  const [loadingTimeout, setLoadingTimeout] = useState(false);

  // Timeout to prevent infinite loading
  useEffect(() => {
    const timeout = setTimeout(() => {
      if (isLoading) {
        console.warn('Menu display 2 loading timeout');
        setLoadingTimeout(true);
      }
    }, 10000);
    return () => clearTimeout(timeout);
  }, [isLoading]);

  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Apply promotions to menu items
  const itemsWithPromotions = useMemo(() => {
    if (!menuItems || !promotions) return menuItems || [];

    return menuItems.map((item: any) => {
      const applicablePromotions = promotions.filter((promo: any) => {
        const categoryMatch = !promo.category_id || promo.category_id === item.categoryId;
        return categoryMatch;
      });

      if (applicablePromotions.length === 0) return item;

      const bestPromotion = applicablePromotions[0];
      const itemPrice = parseFloat(item.offerPrice || item.price);
      const discount = calculatePromotionDiscount(itemPrice, bestPromotion);

      if (discount > 0) {
        const promotionalPrice = itemPrice - discount;
        const discountPercentage = Math.round((discount / itemPrice) * 100);

        return {
          ...item,
          promotionalPrice: promotionalPrice.toFixed(2),
          promotionPercentage: discountPercentage,
        };
      }

      return item;
    });
  }, [menuItems, promotions]);

  // First, sort all items by category order, then split into pages
  const groupedItems = useMemo(() => {
    if (!itemsWithPromotions || !categories) return [];
    
    const availableItems = itemsWithPromotions.filter((item: any) => item.isAvailable);
    
    // Sort items by category display order first
    const categoryOrderMap = new Map(categories.map((cat: any, idx: number) => [cat.id, idx]));
    const sortedItems = [...availableItems].sort((a: any, b: any) => {
      const catOrderA = categoryOrderMap.get(a.categoryId) ?? 999;
      const catOrderB = categoryOrderMap.get(b.categoryId) ?? 999;
      if (catOrderA !== catOrderB) return catOrderA - catOrderB;
      return (a.displayOrder || 0) - (b.displayOrder || 0);
    });
    
    // Split into pages after sorting by category - get second third
    const totalItems = sortedItems.length;
    const itemsPerPage = Math.ceil(totalItems / 3);
    const pageItems = sortedItems.slice(itemsPerPage, itemsPerPage * 2);
    
    // Group by category while preserving order
    const grouped: { category: any; items: any[] }[] = [];
    const categoryMap = new Map<number, any[]>();
    
    pageItems.forEach((item: any) => {
      const catId = item.categoryId || 0;
      if (!categoryMap.has(catId)) {
        categoryMap.set(catId, []);
      }
      categoryMap.get(catId)!.push(item);
    });
    
    // Build result in category order
    categories.forEach((cat: any) => {
      if (categoryMap.has(cat.id)) {
        grouped.push({ category: cat, items: categoryMap.get(cat.id)! });
      }
    });
    
    return grouped;
  }, [itemsWithPromotions, categories]);

  // Split grouped items into 3 columns
  const columns = useMemo(() => {
    const cols: { category: any; items: any[] }[][] = [[], [], []];
    let colIdx = 0;
    
    groupedItems.forEach((group) => {
      cols[colIdx % 3].push(group);
      colIdx++;
    });
    
    return cols;
  }, [groupedItems]);

  const formatPrice = (price: string | number) => `${parseFloat(String(price)).toFixed(2)}€`;

  const isPizzaCategory = (categoryId: number | null | undefined) => categoryId === PIZZA_CATEGORY_ID;

  return (
    <div className="menu-display-page page-2">
      {/* Animated Background */}
      <div className="menu-display-bg">
        <div className="menu-display-orb menu-display-orb-1" />
        <div className="menu-display-orb menu-display-orb-2" />
        <div className="menu-display-orb menu-display-orb-3" />
      </div>

      {/* Header */}
      <header className="menu-display-header">
        <div className="menu-display-header-inner">
          <div className="menu-display-logo">
            <img src="https://ravintolababylon.fi/logo.png" alt="Logo" className="menu-display-logo-img" />
            <span className="menu-display-name">{config?.name || "Babylon"}</span>
          </div>
          <div className="menu-display-page-num page-2">
            <Star className="w-5 h-5" />
            <span>2 / 3</span>
          </div>
          <div className="menu-display-time">
            {currentTime.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </header>

      {/* Menu Content - 3 Column Layout */}
      <main className="menu-display-main">
        <div className="menu-display-grid">
          {columns.map((column, colIdx) => (
            <div key={colIdx} className="menu-display-column">
              {column.map((group) => (
                <div key={group.category.id} className="menu-category-group">
                  {/* Category Header */}
                  <div className="menu-category-header">
                    <span className="menu-category-name">{group.category.name}</span>
                    {isPizzaCategory(group.category.id) && (
                      <div className="menu-category-prices">
                        <span className="menu-price-label">Norm</span>
                        <span className="menu-price-label">Perhe</span>
                      </div>
                    )}
                  </div>
                  
                  {/* Category Items */}
                  {group.items.map((item: any, itemIdx: number) => (
                    <motion.div
                      key={item.id}
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: itemIdx * 0.02 }}
                      className={`menu-item-row ${isPizzaCategory(item.categoryId) ? 'has-perhe' : ''}`}
                    >
                      {/* Item Info */}
                      <div className="menu-item-info">
                        <div className="menu-item-name">
                          {item.name}
                          {item.isVegetarian && <Leaf className="menu-badge green" />}
                          {item.isVegan && <Heart className="menu-badge emerald" />}
                          {item.isGlutenFree && <Wheat className="menu-badge amber" />}
                          {(item.offerPercentage || item.promotionPercentage) && (
                            <span className="menu-discount-badge">
                              <Flame className="w-3 h-3" />
                              -{item.promotionPercentage || item.offerPercentage}%
                            </span>
                          )}
                        </div>
                        {item.description && (
                          <div className="menu-item-desc">{item.description}</div>
                        )}
                      </div>

                      {/* Price Column(s) */}
                      <div className="menu-item-prices">
                        {parseFloat(item.price) === 0 ? (
                          <span className="menu-price-ask">Kysy</span>
                        ) : item.promotionalPrice || item.offerPrice ? (
                          <>
                            <span className="menu-price-offer">
                              {formatPrice(item.promotionalPrice || item.offerPrice!)}
                            </span>
                            {isPizzaCategory(item.categoryId) && (
                              <span className="menu-price-perhe">
                                {formatPrice(parseFloat(item.promotionalPrice || item.offerPrice!) + PERHE_EXTRA)}
                              </span>
                            )}
                          </>
                        ) : (
                          <>
                            <span className="menu-price-normal">
                              {formatPrice(item.price)}
                            </span>
                            {isPizzaCategory(item.categoryId) && (
                              <span className="menu-price-perhe">
                                {formatPrice(parseFloat(item.price) + PERHE_EXTRA)}
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </motion.div>
                  ))}
                </div>
              ))}
            </div>
          ))}
        </div>
      </main>
    </div>
  );
}
