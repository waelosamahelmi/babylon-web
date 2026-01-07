import { useEffect, useState, useMemo } from "react";
import { useCategories, useMenuItems } from "@/hooks/use-menu";
import { useActivePromotions, calculatePromotionDiscount } from "@/hooks/use-promotions";
import { useRestaurant } from "@/lib/restaurant-context";
import { motion, AnimatePresence } from "framer-motion";
import { Leaf, Wheat, Heart, Flame, Star, Sparkles } from "lucide-react";
import "@/styles/display.css";

// Menu Display Page 1 - First third of menu items
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

export default function MenuDisplay1() {
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

  // Get first third of items (sorted by category and display order)
  const displayItems = useMemo(() => {
    if (!itemsWithPromotions) return [];
    const availableItems = itemsWithPromotions.filter((item: any) => item.isAvailable);
    const totalItems = availableItems.length;
    const itemsPerPage = Math.ceil(totalItems / 3);
    return availableItems.slice(0, itemsPerPage);
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
    hidden: { opacity: 0, y: 20 },
    visible: {
      opacity: 1,
      y: 0,
      transition: { duration: 0.5, ease: "easeOut" },
    },
  };

  return (
    <div className="display-container">
      {/* Animated Background */}
      <div className="display-background">
        <div className="display-gradient-orb display-gradient-orb-1" />
        <div className="display-gradient-orb display-gradient-orb-2" />
        <div className="display-gradient-orb display-gradient-orb-3" />
      </div>

      {/* Header */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: "easeOut" }}
        className="display-header"
      >
        <div className="display-header-content">
          <div className="display-logo-section">
            <motion.div
              animate={{ rotate: [0, 5, -5, 0] }}
              transition={{ duration: 4, repeat: Infinity, ease: "easeInOut" }}
            >
              <Flame className="display-logo-icon" />
            </motion.div>
            <div>
              <h1 className="display-restaurant-name">{config?.name || "Babylon"}</h1>
              <p className="display-tagline">{config?.tagline || "Tuoretta ja maukasta"}</p>
            </div>
          </div>
          <div className="display-page-indicator">
            <Sparkles className="w-6 h-6" />
            <span>Ruokalista 1/3</span>
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
          className="display-menu-grid"
        >
          {Object.entries(groupedItems).map(([categoryName, items], categoryIndex) => (
            <motion.section
              key={categoryName}
              variants={itemVariants}
              className="display-category-section"
            >
              <motion.h2
                initial={{ x: -50, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                transition={{ delay: categoryIndex * 0.2, duration: 0.5 }}
                className="display-category-title"
              >
                <Star className="w-8 h-8 text-yellow-400" />
                {categoryName}
              </motion.h2>

              <div className="display-items-grid">
                <AnimatePresence>
                  {items.map((item, itemIndex) => (
                    <motion.div
                      key={item.id}
                      variants={itemVariants}
                      initial="hidden"
                      animate="visible"
                      transition={{ delay: itemIndex * 0.05 }}
                      whileHover={{ scale: 1.02, y: -5 }}
                      className="display-menu-item"
                    >
                      {/* Discount Badge */}
                      {(item.offerPercentage || item.promotionPercentage) && (
                        <motion.div
                          initial={{ scale: 0, rotate: -180 }}
                          animate={{ scale: 1, rotate: 0 }}
                          transition={{ type: "spring", stiffness: 200 }}
                          className="display-discount-badge"
                        >
                          <Flame className="w-4 h-4" />
                          -{item.promotionPercentage || item.offerPercentage}%
                        </motion.div>
                      )}

                      {/* Item Image */}
                      {item.imageUrl && (
                        <div className="display-item-image-container">
                          <img
                            src={item.imageUrl}
                            alt={item.name}
                            className="display-item-image"
                          />
                          <div className="display-item-image-overlay" />
                        </div>
                      )}

                      {/* Item Details */}
                      <div className="display-item-content">
                        <div className="display-item-header">
                          <h3 className="display-item-name">{item.name}</h3>
                          <div className="display-item-badges">
                            {item.isVegetarian && (
                              <span className="display-badge display-badge-vegetarian">
                                <Leaf className="w-4 h-4" />
                              </span>
                            )}
                            {item.isVegan && (
                              <span className="display-badge display-badge-vegan">
                                <Heart className="w-4 h-4" />
                              </span>
                            )}
                            {item.isGlutenFree && (
                              <span className="display-badge display-badge-glutenfree">
                                <Wheat className="w-4 h-4" />
                              </span>
                            )}
                          </div>
                        </div>

                        {item.description && (
                          <p className="display-item-description">{item.description}</p>
                        )}

                        <div className="display-item-price-section">
                          {parseFloat(item.price) === 0 ? (
                            <span className="display-price-request">Hinta pyynnöstä</span>
                          ) : item.promotionalPrice || item.offerPrice ? (
                            <div className="display-price-group">
                              <span className="display-price-current">
                                {formatPrice(item.promotionalPrice || item.offerPrice!)}
                              </span>
                              <span className="display-price-original">
                                {formatPrice(item.price)}
                              </span>
                            </div>
                          ) : (
                            <span className="display-price-normal">{formatPrice(item.price)}</span>
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
        className="display-footer"
      >
        <div className="display-footer-content">
          <motion.div
            animate={{ opacity: [0.5, 1, 0.5] }}
            transition={{ duration: 2, repeat: Infinity }}
            className="display-footer-hint"
          >
            <Sparkles className="w-5 h-5" />
            <span>Lisää vaihtoehtoja seuraavilla näytöillä</span>
            <Sparkles className="w-5 h-5" />
          </motion.div>
        </div>
      </motion.footer>
    </div>
  );
}
