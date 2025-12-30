import { useLanguage } from "@/lib/language-context";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Car,
  Truck,
  Coffee
} from "lucide-react";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { isRestaurantOpen } from "@/lib/business-hours";

export function ServiceHoursSection() {
  const { t } = useLanguage();
  const { config, isOpen: dbIsOpen } = useRestaurantSettings();

  // Calculate if restaurant is open based on hours, but override with database setting if available
  const isOpenByHours = config ? isRestaurantOpen(config) : false;
  const effectiveIsOpen = dbIsOpen !== undefined ? dbIsOpen : isOpenByHours;

  // Don't render if no config available
  if (!config || !config.services) {
    return null;
  }

  return (
    <section className="py-20 relative overflow-hidden bg-white dark:bg-stone-800">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold mb-6 shadow-lg">
            {t("Palvelut", "Services")}
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white">
            {t("Palveluajat", "Service Hours")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t("Olemme täällä palvelemassa sinua parhaaseen aikaan", "We're here to serve you at the best time")}
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
          {/* Pickup Service */}
          {config.services.hasPickup && (
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-blue-200 dark:bg-blue-800 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Car className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {t("Nouto", "Pickup")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t("Hae tilauksesi suoraan ravintolastamme", "Pick up your order directly from our restaurant")}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-xl">
                    <Clock className="w-5 h-5 text-blue-600" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white">
                      {config.hours.pickup.monday.open} - {config.hours.pickup.monday.close}
                    </span>
                  </div>
                  <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Päivittäin", "Daily")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Delivery Service */}
          {config.services.hasDelivery && (
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-orange-200 dark:bg-orange-800 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Truck className="w-8 h-8 text-white" />
                  </div>
                  <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {t("Kotiinkuljetus", "Delivery")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t("Toimitamme ruokasi suoraan ovellesi", "We deliver food straight to your door")}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-xl">
                    <Clock className="w-5 h-5 text-orange-600" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white">
                      {config.hours.delivery.monday.open} - {config.hours.delivery.monday.close}
                    </span>
                  </div>
                  <div className="text-center text-sm font-medium text-gray-500 dark:text-gray-400">
                    {t("Päivittäin", "Daily")}
                  </div>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Lunch Buffet */}
          {config.services.hasLunchBuffet && config.services.lunchBuffetHours && config.services.lunchBuffetHours.monday && (
            <Card className="group hover:shadow-2xl transition-all duration-500 border-0 bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 overflow-hidden relative">
              <div className="absolute top-0 right-0 w-32 h-32 bg-purple-200 dark:bg-purple-800 rounded-full -mr-16 -mt-16 opacity-20"></div>
              <CardContent className="p-8 relative z-10">
                <div className="flex items-center justify-between mb-6">
                  <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all">
                    <Coffee className="w-8 h-8 text-white" />
                  </div>
                  <Badge className="bg-purple-600 text-white">
                    {t("Arkisin", "Weekdays")}
                  </Badge>
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white mb-2">
                  {t("Lounasbuffet", "Lunch Buffet")}
                </h3>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
                  {t("Monipuolinen lounasbuffet päivittäin", "Varied lunch buffet daily")}
                </p>
                <div className="space-y-3">
                  <div className="flex items-center justify-between p-3 bg-white dark:bg-stone-900 rounded-xl">
                    <Clock className="w-5 h-5 text-purple-600" />
                    <span className="font-bold text-xl text-gray-900 dark:text-white">
                      {config.services.lunchBuffetHours.monday.open} - {config.services.lunchBuffetHours.monday.close}
                    </span>
                  </div>
                  <div className="p-3 bg-purple-100 dark:bg-purple-900/30 rounded-xl">
                    <p className="text-sm font-medium text-purple-700 dark:text-purple-300 text-center">
                      ☕ {t("Sis. kahvi & jälkiruoka", "Incl. coffee & dessert")}
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Current Status Banner */}
        <div className="relative">
          <div 
            className={`p-8 rounded-2xl shadow-xl transform transition-all duration-500 hover:scale-105 ${
              effectiveIsOpen 
                ? 'bg-gradient-to-r from-green-500 to-emerald-600' 
                : 'bg-gradient-to-r from-red-500 to-orange-600'
            }`}
          >
            <div className="flex flex-col md:flex-row items-center justify-between gap-4">
              <div className="flex items-center gap-4">
                <div className={`w-16 h-16 rounded-full ${effectiveIsOpen ? 'bg-white/20' : 'bg-white/20'} flex items-center justify-center animate-pulse`}>
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <div className="text-sm font-medium opacity-90">
                    {t("Ravintolan tila", "Restaurant Status")}
                  </div>
                  <div className="text-3xl font-black">
                    {effectiveIsOpen 
                      ? t("AVOINNA", "OPEN")
                      : t("SULJETTU", "CLOSED")
                    }
                  </div>
                </div>
              </div>
              <div className="text-right text-white">
                <div className="text-sm opacity-90 mb-1">
                  {t("Aukioloajat", "Opening hours")}
                </div>
                <div className="text-2xl font-bold">
                  {config.hours.general.monday.open} - {config.hours.general.monday.close}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}