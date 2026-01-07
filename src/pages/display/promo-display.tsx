import { useEffect, useState, useCallback } from "react";
import { useHeroPromotions, type Promotion } from "@/hooks/use-promotions";
import { useRestaurant } from "@/lib/restaurant-context";
import { motion, AnimatePresence } from "framer-motion";
import { Flame, Sparkles, Star, Gift, Percent, Clock, ArrowRight, Zap } from "lucide-react";
import "@/styles/display.css";

// Promo Ads Display Page
// Screen dimensions: 1920x1080 but content rotated -90 degrees (Portrait mode on landscape screen)
// Each promo displays for 10 seconds

export default function PromoDisplay() {
  const { data: promotions, isLoading } = useHeroPromotions();
  const { config } = useRestaurant();
  const [currentPromoIndex, setCurrentPromoIndex] = useState(0);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Update time every minute
  useEffect(() => {
    const interval = setInterval(() => setCurrentTime(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  // Rotate through promotions every 10 seconds
  useEffect(() => {
    if (!promotions || promotions.length === 0) return;

    const interval = setInterval(() => {
      setCurrentPromoIndex((prev) => (prev + 1) % promotions.length);
    }, 10000); // 10 seconds

    return () => clearInterval(interval);
  }, [promotions]);

  const currentPromo = promotions?.[currentPromoIndex];

  // Format discount display
  const formatDiscount = (promo: Promotion) => {
    if (promo.discount_type === "percentage") {
      return `-${promo.discount_value}%`;
    }
    return `-${promo.discount_value}€`;
  };

  // Format date
  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("fi-FI", {
      day: "numeric",
      month: "short",
    });
  };

  // Animation variants for promo transitions
  const promoVariants = {
    enter: {
      opacity: 0,
      scale: 0.8,
      rotateY: 90,
    },
    center: {
      opacity: 1,
      scale: 1,
      rotateY: 0,
      transition: {
        duration: 0.8,
        ease: "easeOut",
      },
    },
    exit: {
      opacity: 0,
      scale: 0.8,
      rotateY: -90,
      transition: {
        duration: 0.5,
      },
    },
  };

  // Floating animation for decorative elements
  const floatVariants = {
    animate: {
      y: [0, -15, 0],
      rotate: [0, 5, -5, 0],
      transition: {
        duration: 4,
        repeat: Infinity,
        ease: "easeInOut",
      },
    },
  };

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

  if (!promotions || promotions.length === 0) {
    return (
      <div className="promo-display-wrapper">
        <div className="promo-display-rotated">
          <div className="promo-no-promos">
            <motion.div
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              <Gift className="w-32 h-32 text-yellow-400 mb-8" />
            </motion.div>
            <h1 className="promo-no-promos-title">{config?.name || "Babylon"}</h1>
            <p className="promo-no-promos-text">Uusia tarjouksia tulossa pian!</p>
            <motion.div
              animate={{ opacity: [0.5, 1, 0.5] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="promo-stay-tuned"
            >
              <Sparkles className="w-8 h-8" />
              <span>Pysy kuulolla</span>
              <Sparkles className="w-8 h-8" />
            </motion.div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="promo-display-wrapper">
      {/* Rotated Content Container (-90 degrees) */}
      <div className="promo-display-rotated">
        {/* Animated Background */}
        <div className="promo-background">
          <div className="promo-gradient-sweep" />
          <div className="promo-particles">
            {[...Array(20)].map((_, i) => (
              <motion.div
                key={i}
                className="promo-particle"
                animate={{
                  y: [0, -100, 0],
                  x: [0, Math.sin(i) * 30, 0],
                  opacity: [0, 1, 0],
                }}
                transition={{
                  duration: 3 + Math.random() * 2,
                  repeat: Infinity,
                  delay: Math.random() * 2,
                }}
                style={{
                  left: `${Math.random() * 100}%`,
                  bottom: 0,
                }}
              />
            ))}
          </div>
          <div className="promo-spotlight" />
        </div>

        {/* Header */}
        <motion.header
          initial={{ y: -50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6 }}
          className="promo-header"
        >
          <div className="promo-header-content">
            <motion.div
              variants={floatVariants}
              animate="animate"
              className="promo-logo"
            >
              <Flame className="w-12 h-12 text-orange-400" />
            </motion.div>
            <div className="promo-brand">
              <h1 className="promo-brand-name">{config?.name || "Babylon"}</h1>
              <p className="promo-brand-tagline">Erikoistarjoukset</p>
            </div>
            <div className="promo-time-display">
              {currentTime.toLocaleTimeString("fi-FI", { hour: "2-digit", minute: "2-digit" })}
            </div>
          </div>
        </motion.header>

        {/* Main Promo Content */}
        <main className="promo-main">
          <AnimatePresence mode="wait">
            {currentPromo && (
              <motion.div
                key={currentPromo.id}
                variants={promoVariants}
                initial="enter"
                animate="center"
                exit="exit"
                className="promo-card"
              >
                {/* Decorative Elements */}
                <motion.div
                  className="promo-decoration promo-decoration-1"
                  animate={{ rotate: 360 }}
                  transition={{ duration: 20, repeat: Infinity, ease: "linear" }}
                >
                  <Star className="w-24 h-24 text-yellow-400/30" />
                </motion.div>
                <motion.div
                  className="promo-decoration promo-decoration-2"
                  animate={{ rotate: -360 }}
                  transition={{ duration: 25, repeat: Infinity, ease: "linear" }}
                >
                  <Sparkles className="w-20 h-20 text-orange-400/20" />
                </motion.div>

                {/* Discount Badge */}
                <motion.div
                  initial={{ scale: 0, rotate: -180 }}
                  animate={{ scale: 1, rotate: 0 }}
                  transition={{ type: "spring", stiffness: 200, delay: 0.3 }}
                  className="promo-discount-badge"
                >
                  <div className="promo-discount-inner">
                    <Percent className="w-10 h-10" />
                    <span className="promo-discount-value">
                      {formatDiscount(currentPromo)}
                    </span>
                  </div>
                  <motion.div
                    className="promo-discount-ring"
                    animate={{ rotate: 360 }}
                    transition={{ duration: 8, repeat: Infinity, ease: "linear" }}
                  />
                </motion.div>

                {/* Promo Content */}
                <div className="promo-content">
                  <motion.h2
                    initial={{ y: 30, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.4, duration: 0.5 }}
                    className="promo-title"
                  >
                    {currentPromo.name}
                  </motion.h2>

                  {currentPromo.description && (
                    <motion.p
                      initial={{ y: 20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.5, duration: 0.5 }}
                      className="promo-description"
                    >
                      {currentPromo.description}
                    </motion.p>
                  )}

                  {/* Promo Details */}
                  <motion.div
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.6, duration: 0.5 }}
                    className="promo-details"
                  >
                    <div className="promo-detail-item">
                      <Clock className="w-6 h-6" />
                      <span>
                        Voimassa {formatDate(currentPromo.start_date)} - {formatDate(currentPromo.end_date)}
                      </span>
                    </div>

                    {currentPromo.min_order_amount && parseFloat(String(currentPromo.min_order_amount)) > 0 && (
                      <div className="promo-detail-item">
                        <Zap className="w-6 h-6" />
                        <span>Min. tilaus {currentPromo.min_order_amount}€</span>
                      </div>
                    )}

                    {(currentPromo.pickup_only || currentPromo.delivery_only || currentPromo.dine_in_only) && (
                      <div className="promo-detail-item">
                        <ArrowRight className="w-6 h-6" />
                        <span>
                          {currentPromo.pickup_only && "Vain nouto"}
                          {currentPromo.delivery_only && "Vain kotiinkuljetus"}
                          {currentPromo.dine_in_only && "Vain ravintolassa"}
                        </span>
                      </div>
                    )}
                  </motion.div>

                  {/* Call to Action */}
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    transition={{ delay: 0.7, duration: 0.5 }}
                    className="promo-cta"
                  >
                    <motion.button
                      whileHover={{ scale: 1.05 }}
                      whileTap={{ scale: 0.95 }}
                      animate={{ 
                        boxShadow: [
                          "0 0 20px rgba(251, 146, 60, 0.5)",
                          "0 0 40px rgba(251, 146, 60, 0.8)",
                          "0 0 20px rgba(251, 146, 60, 0.5)",
                        ]
                      }}
                      transition={{ duration: 2, repeat: Infinity }}
                      className="promo-cta-button"
                    >
                      <Flame className="w-8 h-8" />
                      <span>Tilaa Nyt!</span>
                      <ArrowRight className="w-8 h-8" />
                    </motion.button>
                  </motion.div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </main>

        {/* Progress Indicators */}
        <div className="promo-progress">
          {promotions.map((_, index) => (
            <motion.div
              key={index}
              className={`promo-progress-dot ${index === currentPromoIndex ? "active" : ""}`}
              animate={index === currentPromoIndex ? { scale: [1, 1.3, 1] } : {}}
              transition={{ duration: 0.5 }}
            />
          ))}
        </div>

        {/* Footer */}
        <motion.footer
          initial={{ y: 50, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="promo-footer"
        >
          <motion.div
            animate={{ opacity: [0.6, 1, 0.6] }}
            transition={{ duration: 3, repeat: Infinity }}
            className="promo-footer-content"
          >
            <Sparkles className="w-6 h-6" />
            <span>Tilaa verkosta tai soita {config?.phone || ""}</span>
            <Sparkles className="w-6 h-6" />
          </motion.div>
        </motion.footer>
      </div>
    </div>
  );
}
