import { useLanguage } from "@/lib/language-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { useHeroPromotions } from "@/hooks/use-promotions";
import { Button } from "@/components/ui/button";
import { UtensilsCrossed, Phone, ChevronDown, Sparkles, Tag, Percent, MapPin, ChevronRight } from "lucide-react";
import { Link } from "wouter";
import { useState, useEffect } from "react";

export function HeroVideoWithPromotions() {
  const { t, language } = useLanguage();
  const { config } = useRestaurant();
  const { data: promotions } = useHeroPromotions();
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isPromotion, setIsPromotion] = useState(false);

  // Rotate between restaurant info and promotions every 5 seconds
  useEffect(() => {
    if (!promotions || promotions.length === 0) {
      setIsPromotion(false);
      return;
    }

    const interval = setInterval(() => {
      setIsPromotion((prev) => {
        if (prev) {
          // Currently showing promotion, move to next or back to restaurant info
          setCurrentIndex((idx) => {
            const nextIdx = idx + 1;
            if (nextIdx >= promotions.length) {
              return 0; // Reset to first promotion
            }
            return nextIdx;
          });
          // Show restaurant info after last promotion
          return currentIndex + 1 < promotions.length;
        } else {
          // Currently showing restaurant info, switch to first promotion
          setCurrentIndex(0);
          return true;
        }
      });
    }, 5000); // Change every 5 seconds

    return () => clearInterval(interval);
  }, [promotions, currentIndex]);

  const currentPromotion = promotions?.[currentIndex];

  return (
    <section className="relative h-screen flex items-center justify-center overflow-hidden">
      {/* Video Background */}
      <div className="absolute inset-0 z-0">
        <video
          key={config.hero.videoUrl}
          autoPlay
          muted
          loop
          playsInline
          className="w-full h-full object-cover scale-105 animate-slow-zoom"
          poster={config.hero.backgroundImage}
        >
          {config.hero.videoUrl && (
            <source
              src={config.hero.videoUrl}
              type="video/mp4"
            />
          )}
        </video>

        {/* Modern Gradient Overlay */}
        <div className="absolute inset-0 bg-gradient-to-b from-black/60 via-black/40 to-black/70"></div>
        <div className="absolute inset-0 bg-gradient-to-r from-red-900/20 to-orange-900/20"></div>
      </div>

      {/* Content */}
      <div className="relative z-10 text-center text-white px-4 max-w-5xl mx-auto">
        {/* Animated Container with fade transitions */}
        <div className="animate-fade-in" key={isPromotion ? `promo-${currentIndex}` : 'restaurant'}>
          {!isPromotion ? (
            /* Restaurant Info */
            <>
              {/* Badge */}
              <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-red-500/90 to-orange-500/90 backdrop-blur-md rounded-full mb-8 shadow-2xl animate-slide-down border border-white/20">
                <Sparkles className="w-5 h-5" />
                <span className="font-bold text-sm uppercase tracking-wider">
                  {t("Tervetuloa", "Welcome", "مرحبا")}
                </span>
              </div>

              {/* Main Heading with Shadow */}
              <h1 className="text-5xl md:text-7xl lg:text-8xl font-black mb-6 leading-tight drop-shadow-2xl">
                <span className="bg-gradient-to-r from-white via-orange-100 to-white bg-clip-text text-transparent animate-gradient">
                  {t(config.name, config.nameEn)}
                </span>
              </h1>

              {/* Tagline */}
              <div className="relative inline-block mb-4">
                <div className="absolute inset-0 blur-2xl bg-gradient-to-r from-red-500 to-orange-500 opacity-30"></div>
                <p className="relative text-2xl md:text-3xl lg:text-4xl font-bold bg-gradient-to-r from-orange-200 to-red-200 bg-clip-text text-transparent">
                  {t(config.tagline, config.taglineEn)}
                </p>
              </div>

              {/* Description */}
              <p className="text-lg md:text-xl mb-10 text-gray-200 max-w-3xl mx-auto leading-relaxed font-light">
                {t(config.description, config.descriptionEn)}
              </p>
            </>
          ) : (
            /* Promotion Display */
            currentPromotion && (
              <>
                {/* Promotion Badge */}
                <div className="inline-flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-yellow-500/90 to-orange-500/90 backdrop-blur-md rounded-full mb-8 shadow-2xl animate-slide-down border border-white/20">
                  <Tag className="w-5 h-5" />
                  <span className="font-bold text-sm uppercase tracking-wider">
                    {t("Erikoistarjous", "Special Offer", "عرض خاص")}
                  </span>
                </div>

                {/* Promotion Name */}
                <h1 className="text-4xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight drop-shadow-2xl">
                  <span className="bg-gradient-to-r from-yellow-200 via-orange-200 to-red-200 bg-clip-text text-transparent">
                    {language === 'fi' ? currentPromotion.name : currentPromotion.name_en}
                  </span>
                </h1>

                {/* Discount Badge */}
                <div className="relative inline-block mb-6">
                  <div className="absolute inset-0 blur-3xl bg-gradient-to-r from-yellow-400 to-orange-400 opacity-40"></div>
                  <div className="relative bg-gradient-to-r from-yellow-400 to-orange-500 text-gray-900 px-12 py-6 rounded-3xl shadow-2xl border-4 border-white/30">
                    <div className="flex items-center gap-3">
                      <Percent className="w-10 h-10 font-black" />
                      <span className="text-5xl md:text-6xl font-black">
                        {currentPromotion.discount_type === 'percentage'
                          ? `${currentPromotion.discount_value}%`
                          : `${currentPromotion.discount_value}€`
                        }
                      </span>
                      <span className="text-2xl font-bold uppercase">
                        {t("ALE", "OFF", "خصم")}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Promotion Description */}
                <p className="text-xl md:text-2xl mb-10 text-yellow-100 max-w-3xl mx-auto leading-relaxed font-medium">
                  {language === 'fi' ? currentPromotion.description : currentPromotion.description_en}
                </p>
              </>
            )
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center mb-4">
            <Link href="/menu">
              <Button
                size="lg"
                className="text-lg px-10 py-7 border-none shadow-2xl hover:shadow-red-500/50 transition-all duration-300 hover:scale-105 group"
                style={{
                  background: `linear-gradient(135deg, ${config.theme.primary}, ${config.theme.secondary})`,
                  color: 'white'
                }}
              >
                <UtensilsCrossed className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                {t("Selaa menua", "Browse Menu", "تصفح القائمة")}
              </Button>
            </Link>

            <Button
              size="lg"
              className="text-lg px-10 py-7 bg-white/10 backdrop-blur-md border-2 border-white/40 text-white hover:bg-white hover:text-gray-900 transition-all duration-300 hover:scale-105 shadow-xl group"
              asChild
            >
              <a href={`tel:${config.phone}`}>
                <Phone className="w-6 h-6 mr-3 group-hover:rotate-12 transition-transform" />
                {t("Soita meille", "Call Us", "اتصل بنا")}
              </a>
            </Button>
          </div>

          {/* Lahti redirect — subtle but discoverable */}
          <div className="flex justify-center mb-8">
            <a
              href="https://ravintolababylonlahti.fi"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-full text-sm font-semibold text-white/90 bg-white/10 backdrop-blur-md border border-white/20 hover:bg-gradient-to-r hover:from-orange-500 hover:to-red-500 hover:text-white hover:border-transparent transition-all duration-300 hover:scale-105 shadow-lg group"
            >
              <MapPin className="w-4 h-4 group-hover:animate-bounce" />
              <span>{t("Tilaa Lahdesta", "Order from Lahti")}</span>
              <ChevronRight className="w-4 h-4 opacity-70 group-hover:translate-x-1 transition-transform" />
            </a>
          </div>
        </div>
      </div>

      {/* Modern Scroll indicator */}
      <div className="absolute bottom-32 left-1/2 transform -translate-x-1/2 animate-bounce">
        <div className="flex flex-col items-center gap-2">
          <ChevronDown className="w-8 h-8 text-white/60 animate-pulse" />
          <span className="text-xs text-white/60 uppercase tracking-wider">{t("Vieritä", "Scroll", "انتقل")}</span>
        </div>
      </div>

      {/* Modern Features Strip */}
      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-r from-black/80 via-black/70 to-black/80 backdrop-blur-lg py-6 border-t border-white/10">
        <div className="max-w-7xl mx-auto px-4">
          <div className={`grid grid-cols-1 md:grid-cols-${config.hero.features.length} gap-6 text-center`}>
            {config.hero.features.map((feature, index) => (
              <div key={index} className="group flex items-center justify-center space-x-3 transition-transform hover:scale-105">
                <div
                  className="w-3 h-3 rounded-full shadow-lg group-hover:shadow-xl transition-shadow"
                  style={{
                    backgroundColor: feature.color,
                    boxShadow: `0 0 20px ${feature.color}50`
                  }}
                ></div>
                <span className="text-white font-medium text-sm md:text-base">{t(feature.title, feature.titleEn)}</span>
              </div>
            ))}
          </div>
        </div>
      </div>

      <style dangerouslySetInnerHTML={{__html: `
        @keyframes slow-zoom {
          0%, 100% { transform: scale(1.05); }
          50% { transform: scale(1.1); }
        }
        @keyframes gradient {
          0%, 100% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
        }
        @keyframes fade-in {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        @keyframes slide-down {
          from { opacity: 0; transform: translateY(-20px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .animate-slow-zoom {
          animation: slow-zoom 20s ease-in-out infinite;
        }
        .animate-gradient {
          background-size: 200% auto;
          animation: gradient 3s linear infinite;
        }
        .animate-fade-in {
          animation: fade-in 0.8s ease-out;
        }
        .animate-slide-down {
          animation: slide-down 0.6s ease-out;
        }
      `}} />
    </section>
  );
}
