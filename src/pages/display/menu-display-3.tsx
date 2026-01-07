import { useEffect, useState, useMemo } from "react";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { useActivePromotions, calculatePromotionDiscount } from "@/hooks/use-promotions";
import { useRestaurant } from "@/lib/restaurant-context";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Wheat, Heart, Flame, Star, Sparkles, UtensilsCrossed, Coffee } from "lucide-react";
import "@/styles/display.css";

// Menu Display Page 3 - Last third of menu items
// Screen dimensions: 1920x1080 (Full HD Landscape)

interface MenuItemDisplay {
  id: number;
  name: string;
  nameEn: string;
  description: string | null;
  descriptionEn: string | null;
  price: string;
  offerPrice?: string | null;
  offerPercentage?: number | null;
  promotionalPrice?: string;
  promotionPercentage?: number;
  isVegetarian?: boolean;
  isVegan?: boolean;
  isGlutenFree?: boolean;
  imageUrl?: string | null;
  categoryId?: number | null;
}

export default function MenuDisplay3() {
  const { data: categories } = useCategories();
  const { data: menuItems } = useMenuItems();
  const { data: promotions } = useActivePromotions();
  const { config } = useRestaurant();
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
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

  // Get last third of items
  const displayItems = useMemo(() => {
    if (!itemsWithPromotions) return [];
    const availableItems = itemsWithPromotions.filter((item: any) => item.isAvailable);
    const totalItems = availableItems.length;
    const itemsPerPage = Math.ceil(totalItems / 3);
    const startIndex = itemsPerPage * 2;
    return availableItems.slice(startIndex);
  }, [itemsWithPromotions]);

  // Group items by category
  const groupedItems = useMemo(() => {
    const groups: Record<string, MenuItemDisplay[]> = {};
    displayItems.forEach((item: MenuItemDisplay) => {
      const category = categories?.find((c) => c.id === item.categoryId);
      const categoryName = category?.name || "Muut";
      if (!groups[categoryName]) groups[categoryName] = [];
      groups[categoryName].push(item);
    });
    return groups;
  }, [displayItems, categories]);

  const formatPrice = (price: string) => `${parseFloat(price).toFixed(2)} €`;

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: { staggerChildren: 0.08 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, scale: 0.9 },
    visible: {
      opacity: 1,
      scale: 1,
      transition: { duration: 0.4, ease: "easeOut" },
    },
  };

  return (
    <div className="display-container display-container-final">
      {/* Animated Background - Premium Look */}
      <div className="display-background">
        <div className="display-gradient-orb display-gradient-orb-7" />
        <div className="display-gradient-orb display-gradient-orb-8" />
        <div className="display-shimmer-effect" />
        <div className="display-pattern-overlay" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="display-header display-header-final"
      >
        <div className="display-header-content">
          <div className="display-logo-section">
            <motion.div
              animate={{ 
                rotate: [0, 10, -10, 0],
                scale: [1, 1.05, 1]
              }}
              transition={{ duration: 3, repeat: Infinity, ease: "easeInOut" }}
            >
              <UtensilsCrossed className="display-logo-icon" />
            </motion.div>
            <div>
              <h1 className="display-restaurant-name">{config?.name || "Babylon"}</h1>
              <p className="display-tagline">{config?.tagline || "Tuoretta ja maukasta"}</p>
            </div>
          </div>
          <div className="display-page-indicator display-page-indicator-final">
            <Coffee className="w-6 h-6" />
            <span>Ruokalista 3/3</span>
          </div>
          <div className="display-time">
            {currentTime.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}
          </div>
        </div>
      </motion.header>

      {/* Menu Content */}
      <main className="display-main">
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="display-menu-masonry"
        >
          {Object.entries(groupedItems).map(([categoryName, items], categoryIndex) => (
            <motion.section
              key={categoryName}
              variants={itemVariants}
              className="display-category-section display-category-section-final"
            >
              <motion.h2
                initial={{ opacity: 0, y: -20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: categoryIndex * 0.15, duration: 0.5 }}
                className="display-category-title display-category-title-final"
              >
                <motion.span
                  animate={{ rotate: [0, 360] }}
                  transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-8 h-8 text-amber-300" />
                </motion.span>
                {categoryName}
              </motion.h2>

              <div className="display-items-cards">
                <AnimatePresence>
                  {items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: itemIndex * 0.04 }}
                      whileHover={{ 
                        y: -8, 
                        boxShadow: "0 20px 40px rgba(0,0,0,0.3)",
                        transition: { duration: 0.2 }
                      }}
                      className="display-menu-card"
                    >
                      {/* Discount Badge */}
                      {(item.offerPercentage || item.promotionPercentage) && (
                        <motion.div
                          initial={{ scale: 0 }}
                          animate={{ scale: 1 }}
                          transition={{ type: "spring", stiffness: 300, delay: 0.2 }}
                          className="display-card-badge"
                        >
                          <Flame className="w-3 h-3" />
                          <span>-{item.promotionPercentage || item.offerPercentage}%</span>
                        </motion.div>
                      )}

                      {/* Card Image */}
                      {item.imageUrl && (
                        <div className="display-card-image-wrapper">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="display-card-image"
                          />
                          <div className="display-card-image-shine" />
                        </div>
                      )}

                      {/* Card Content */}
                      <div className="display-card-content">
                        <div className="display-card-header">
                          <h3 className="display-card-name">{item.name}</h3>
                          <div className="display-card-badges">
                            {item.isVegetarian && (
                              <span className="display-micro-badge green">
                                <Leaf className="w-3 h-3" />
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="display-micro-badge emerald">
                                <Heart className="w-3 h-3" />
                              </span>
                            )}
                            {item.isGlutenFree && (
                              <span className="display-micro-badge amber">
                                <Wheat className="w-3 h-3" />
                              </span>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className="display-card-description">{item.description}</p>
                        )}

                        <div className="display-card-footer">
                          {parseFloat(item.price) === 0 ? (
                            <span className="display-card-price-request">Hinta pyynnöstä</span>
                          ) : item.promotionalPrice || item.offerPrice ? (
                            <div className="display-card-price-group">
                              <span className="display-card-price-sale">
                                {formatPrice(item.promotionalPrice || item.offerPrice!)}
                              </span>
                              <span className="display-card-price-old">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="display-card-price">{formatPrice(item.price)}</span>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  ))}
                </AnimatePresence>
              </div>
            </motion.section>
          ))}
        </motion.div>
      </main>

      {/* Footer with Call to Action */}
      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="display-footer display-footer-final"
      >
        <div className="display-footer-content">
          <motion.div
            animate={{ 
              scale: [1, 1.05, 1],
              opacity: [0.8, 1, 0.8]
            }}
            transition={{ duration: 2, repeat: Infinity }}
            className="display-footer-cta"
          >
            <Sparkles className="w-6 h-6" />
            <span>Tilaa nyt verkosta tai soita meille!</span>
            <Sparkles className="w-6 h-6" />
          </motion.div>
          <div className="display-footer-info">
            <span>{config?.phone || ""}</span>
            <span className="display-footer-divider">•</span>
            <span>{config?.website || "babylon.fi"}</span>
          </div>
        </div>
      </motion.footer>
    </div>
  );
}
