import { useLanguage } from "@/lib/language-context";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { ExternalLink, MapPin, Truck } from "lucide-react";
import type { ReactNode } from "react";

const LAHTI_URL = "https://ravintolababylonlahti.fi";

export function LahtiOrderCard({ variant = "banner" }: { variant?: "banner" | "card" }) {
  const { t } = useLanguage();

  const title = t("Tilaa Lahdesta", "Order from Lahti", "اطلب من لاهتي", "Заказ из Лахти", "Beställ från Lahti");
  const subtitle = t(
    "Siirry Lahden omaan verkkokauppaan ja tilaa suosikkiruokasi",
    "Go to Lahti's own webshop and order your favorite food",
    "انتقل إلى متجر لاهتي الإلكتروني واطلب طعامك المفضل",
    "Перейдите в собственный интернет-магазин Лахти и закажите любимую еду",
    "Gå till Låtis egen webbutik och beställ din favoritmat"
  );
  const cta = t("Tilaa nyt", "Order now", "اطلب الآن", "Заказать сейчас", "Beställ nu");
  const badge = t("Lahti", "Lahti", "لاهتي", "Лахти", "Lahti");

  if (variant === "banner") {
    return (
      <div className="max-w-7xl mx-auto px-4 mb-16">
        <Card className="bg-gradient-to-br from-red-600 via-orange-600 to-amber-600 border-0 shadow-2xl overflow-hidden relative group">
          <div className="absolute inset-0 opacity-10">
            <div className="absolute top-0 right-0 w-72 h-72 bg-white rounded-full blur-3xl animate-pulse"></div>
            <div className="absolute bottom-0 left-0 w-48 h-48 bg-yellow-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: "1s" }}></div>
          </div>
          <CardContent className="p-8 md:p-12 relative">
            <div className="flex flex-col md:flex-row items-center justify-between gap-6">
              <div className="flex-1">
                <div className="inline-flex items-center gap-2 px-4 py-1.5 bg-white/20 backdrop-blur-sm rounded-full text-white text-sm font-bold mb-4">
                  <MapPin className="w-4 h-4" />
                  {badge}
                </div>
                <h3 className="text-3xl md:text-4xl font-black text-white mb-3">
                  {title}
                </h3>
                <p className="text-white/90 text-lg max-w-xl leading-relaxed">
                  {subtitle}
                </p>
              </div>
              <a
                href={LAHTI_URL}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0"
              >
                <Button
                  size="lg"
                  className="bg-white text-red-600 hover:bg-gray-50 font-black text-lg px-8 py-6 rounded-2xl shadow-xl hover:shadow-2xl transition-all group/btn"
                >
                  <Truck className="w-6 h-6 mr-2" />
                  {cta}
                  <ExternalLink className="w-5 h-5 ml-2 group-hover/btn:translate-x-1 transition-transform" />
                </Button>
              </a>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  // compact card variant
  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500 dark:border-stone-700 dark:bg-stone-800 bg-gradient-to-br from-red-50 to-orange-50 dark:from-red-950/30 dark:to-orange-950/30 relative overflow-hidden group">
      <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-red-500/10 to-orange-500/10 rounded-full blur-2xl"></div>
      <CardContent className="p-6 relative">
        <div className="flex items-start gap-4 mb-4">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-br from-red-500 to-orange-600 flex items-center justify-center flex-shrink-0 shadow-lg group-hover:scale-110 transition-transform">
            <MapPin className="w-7 h-7 text-white" />
          </div>
          <div>
            <BadgeInline>{badge}</BadgeInline>
            <h3 className="text-2xl font-bold text-gray-900 dark:text-white mt-1">
              {title}
            </h3>
          </div>
        </div>
        <p className="text-gray-600 dark:text-gray-400 mb-5 leading-relaxed">
          {subtitle}
        </p>
        <a
          href={LAHTI_URL}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center justify-center w-full text-center py-3 px-6 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-xl font-bold shadow-lg hover:shadow-xl hover:scale-[1.02] transition-all group/btn"
        >
          <Truck className="w-5 h-5 mr-2" />
          {cta}
          <ExternalLink className="w-4 h-4 ml-2 group-hover/btn:translate-x-1 transition-transform" />
        </a>
      </CardContent>
    </Card>
  );
}

function BadgeInline({ children }: { children: React.ReactNode }) {
  return (
    <span className="inline-flex items-center px-2.5 py-0.5 rounded-md text-xs font-bold bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300">
      {children}
    </span>
  );
}
