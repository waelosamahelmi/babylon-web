import { useEffect, useState, useMemo } from "react";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { useActivePromotions, calculatePromotionDiscount } from "@/hooks/use-promotions";
import { useRestaurant } from "@/lib/restaurant-context";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Wheat, Heart, Flame, Star, Sparkles, Pizza } from "lucide-react";
import "@/styles/display.css";

// Menu Display Page 2 - Second third of menu items
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

export default function MenuDisplay2() {
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

  // Get second third of items
  const displayItems = useMemo(() => {
    if (!itemsWithPromotions) return [];
    const availableItems = itemsWithPromotions.filter((item: any) => item.isAvailable);
    const totalItems = availableItems.length;
    const itemsPerPage = Math.ceil(totalItems / 3);
    const startIndex = itemsPerPage;
    const endIndex = itemsPerPage * 2;
    return availableItems.slice(startIndex, endIndex);
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
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, x: -30 },
    visible: {
      opacity: 1,
      x: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="display-container display-container-alt">
      {/* Animated Background - Different Pattern */}
      <div className="display-background">
        <div className="display-gradient-orb display-gradient-orb-4" />
        <div className="display-gradient-orb display-gradient-orb-5" />
        <div className="display-gradient-orb display-gradient-orb-6" />
        <div className="display-floating-shapes">
          {[...Array(6)].map((_, i) => (
            <motion.div
              key={i}
              className="display-floating-shape"
              animate={{
                y: [0, -20, 0],
                rotate: [0, 180, 360],
              }}
              transition={{
                duration: 5 + i,
                repeat: Infinity,
                ease: "easeInOut",
                delay: i * 0.5,
              }}
              style={{
                left: `${15 + i * 15}%`,
                top: `${20 + (i % 3) * 25}%`,
              }}
            />
          ))}
        </div>
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="display-header display-header-alt"
      >
        <div className="display-header-content">
          <div className="display-logo-section">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, ease: "easeInOut" }}
            >
              <Pizza className="display-logo-icon" />
            </motion.div>
            <div>
              <h1 className="display-restaurant-name">{config?.name || "Babylon"}</h1>
              <p className="display-tagline">{config?.tagline || "Tuoretta ja maukasta"}</p>
            </div>
          </div>
          <div className="display-page-indicator display-page-indicator-alt">
            <Sparkles className="w-6 h-6" />
            <span>Ruokalista 2/3</span>
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
          className="display-menu-grid display-menu-grid-alt"
        >
          {Object.entries(groupedItems).map(([categoryName, items], categoryIndex) => (
            <motion.section
              key={categoryName}
              variants={itemVariants}
              className="display-category-section"
            >
              <motion.h2
                initial={{ scale: 0.8, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                transition={{ delay: categoryIndex * 0.2, duration: 0.5 }}
                className="display-category-title display-category-title-alt"
              >
                <Star className="w-8 h-8 text-orange-400" />
                {categoryName}
              </motion.h2>

              <div className="display-items-list">
                <AnimatePresence>
                  {items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: itemIndex * 0.05 }}
                      whileHover={{ x: 10, backgroundColor: "rgba(255,255,255,0.1)" }}
                      className="display-menu-item-row"
                    >
                      {/* Item Image Thumbnail */}
                      {item.imageUrl && (
                        <div className="display-item-thumbnail">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="display-thumbnail-image"
                          />
                        </div>
                      )}

                      {/* Item Details */}
                      <div className="display-item-row-content">
                        <div className="display-item-row-header">
                          <h3 className="display-item-name-row">
                            {item.name}
                            {/* Badges inline */}
                            <span className="display-inline-badges">
                              {item.isVegetarian && (
                                <Leaf className="w-4 h-4 text-green-400" />
                              )}
                              {item.isVegan && (
                                <Heart className="w-4 h-4 text-green-500" />
                              )}
                              {item.isGlutenFree && (
                                <Wheat className="w-4 h-4 text-amber-400" />
                              )}
                            </span>
                          </h3>
                          {item.description && (
                            <p className="display-item-description-row">{item.description}</p>
                          )}
                        </div>

                        <div className="display-item-row-price">
                          {(item.offerPercentage || item.promotionPercentage) && (
                            <motion.span
                              animate={{ scale: [1, 1.1, 1] }}
                              transition={{ duration: 1.5, repeat: Infinity }}
                              className="display-discount-tag"
                            >
                              -{item.promotionPercentage || item.offerPercentage}%
                            </motion.span>
                          )}
                          
                          {parseFloat(item.price) === 0 ? (
                            <span className="display-price-request-small">Hinta pyynnöstä</span>
                          ) : item.promotionalPrice || item.offerPrice ? (
                            <div className="display-price-row-group">
                              <span className="display-price-row-current">
                                {formatPrice(item.promotionalPrice || item.offerPrice!)}
                              </span>
                              <span className="display-price-row-original">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="display-price-row-normal">{formatPrice(item.price)}</span>
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

      {/* Footer */}
      <motion.footer
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, delay: 0.5 }}
        className="display-footer display-footer-alt"
      >
        <div className="display-footer-content">
          <motion.div
            animate={{ x: [0, 10, 0] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="display-footer-hint"
          >
            <Flame className="w-5 h-5" />
            <span>Jatkuu seuraavalla näytöllä →</span>
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
