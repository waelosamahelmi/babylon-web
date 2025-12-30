import { useLanguage } from "@/lib/language-context";
import { Clock, Car, Truck, Coffee } from "lucide-react";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { isRestaurantOpen } from "@/lib/business-hours";

type DayOfWeek = 'monday' | 'tuesday' | 'wednesday' | 'thursday' | 'friday' | 'saturday' | 'sunday';

export function ServiceHoursSection() {
  const { t, language } = useLanguage();
  const { config, isOpen: dbIsOpen } = useRestaurantSettings();

  const isOpenByHours = config ? isRestaurantOpen(config) : false;
  const effectiveIsOpen = dbIsOpen !== undefined ? dbIsOpen : isOpenByHours;

  if (!config || !config.services) {
    return null;
  }

  // Days in correct order (Monday first)
  const daysOrder: DayOfWeek[] = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

  const dayLabels: Record<DayOfWeek, { fi: string; en: string; ar: string; ru: string; sv: string }> = {
    monday: { fi: 'Maanantai', en: 'Monday', ar: 'الاثنين', ru: 'Понедельник', sv: 'Måndag' },
    tuesday: { fi: 'Tiistai', en: 'Tuesday', ar: 'الثلاثاء', ru: 'Вторник', sv: 'Tisdag' },
    wednesday: { fi: 'Keskiviikko', en: 'Wednesday', ar: 'الأربعاء', ru: 'Среда', sv: 'Onsdag' },
    thursday: { fi: 'Torstai', en: 'Thursday', ar: 'الخميس', ru: 'Четверг', sv: 'Torsdag' },
    friday: { fi: 'Perjantai', en: 'Friday', ar: 'الجمعة', ru: 'Пятница', sv: 'Fredag' },
    saturday: { fi: 'Lauantai', en: 'Saturday', ar: 'السبت', ru: 'Суббота', sv: 'Lördag' },
    sunday: { fi: 'Sunnuntai', en: 'Sunday', ar: 'الأحد', ru: 'Воскресенье', sv: 'Söndag' },
  };

  const getDayLabel = (day: DayOfWeek) => {
    const labels = dayLabels[day];
    switch (language) {
      case 'en': return labels.en;
      case 'ar': return labels.ar;
      case 'ru': return labels.ru;
      case 'sv': return labels.sv;
      default: return labels.fi;
    }
  };

  return (
    <section className="py-20 relative overflow-hidden bg-white dark:bg-stone-800">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'40\' height=\'40\' viewBox=\'0 0 40 40\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'1\' fill-rule=\'evenodd\'%3E%3Cpath d=\'M0 40L40 0H20L0 20M40 40V20L20 40\'/%3E%3C/g%3E%3C/svg%3E")' }}></div>

      <div className="max-w-7xl mx-auto px-4 relative z-10">
        <div className="text-center mb-16">
          <div className="inline-block px-6 py-2 bg-gradient-to-r from-blue-500 to-purple-500 text-white rounded-full text-sm font-bold mb-6 shadow-lg">
            {t("Palvelut", "Services", "خدمات", "Услуги", "Tjänster")}
          </div>
          <h2 className="text-5xl md:text-6xl font-black mb-6 text-gray-900 dark:text-white">
            {t("Palveluajat", "Service Hours", "ساعات الخدمة", "Часы работы", "Öppettider")}
          </h2>
          <p className="text-xl text-gray-600 dark:text-gray-300 max-w-2xl mx-auto">
            {t(
              "Olemme täällä palvelemassa sinua parhaaseen aikaan",
              "We're here to serve you at the best time",
              "نحن هنا لخدمتك في أفضل وقت",
              "Мы здесь, чтобы обслужить вас в лучшее время",
              "Vi är här för att tjäna dig vid bästa tid"
            )}
          </p>
        </div>

        {/* Weekly Hours Table */}
        <div className="mb-12 bg-white dark:bg-stone-900 rounded-2xl shadow-xl overflow-hidden border border-gray-200 dark:border-stone-700">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gradient-to-r from-blue-500 to-purple-500 text-white">
                <tr>
                  <th className="px-6 py-4 text-left font-black text-lg">
                    {t("Päivä", "Day", "يوم", "День", "Dag")}
                  </th>
                  {config.services.hasPickup && (
                    <th className="px-6 py-4 text-left font-black text-lg">
                      <div className="flex items-center gap-2">
                        <Car className="w-5 h-5" />
                        {t("Nouto", "Pickup", "استلام", "Самовывоз", "Avhämtning")}
                      </div>
                    </th>
                  )}
                  {config.services.hasDelivery && (
                    <th className="px-6 py-4 text-left font-black text-lg">
                      <div className="flex items-center gap-2">
                        <Truck className="w-5 h-5" />
                        {t("Kotiinkuljetus", "Delivery", "توصيل", "Доставка", "Hemleverans")}
                      </div>
                    </th>
                  )}
                  {config.services.hasLunchBuffet && (
                    <th className="px-6 py-4 text-left font-black text-lg">
                      <div className="flex items-center gap-2">
                        <Coffee className="w-5 h-5" />
                        {t("Lounas", "Lunch", "غداء", "Обед", "Lunch")}
                      </div>
                    </th>
                  )}
                </tr>
              </thead>
              <tbody>
                {daysOrder.map((day, index) => (
                  <tr
                    key={day}
                    className={`border-t border-gray-200 dark:border-stone-700 hover:bg-gray-50 dark:hover:bg-stone-800 transition-colors ${
                      index % 2 === 0 ? 'bg-gray-50/50 dark:bg-stone-900/50' : ''
                    }`}
                  >
                    <td className="px-6 py-4 font-bold text-gray-900 dark:text-white">
                      {getDayLabel(day)}
                    </td>
                    {config.services.hasPickup && (
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {config.hours.pickup?.[day] ? (
                          <span className="font-mono font-semibold">
                            {config.hours.pickup[day].open} - {config.hours.pickup[day].close}
                          </span>
                        ) : (
                          <span className="text-red-500">
                            {t("Suljettu", "Closed", "مغلق", "Закрыто", "Stängt")}
                          </span>
                        )}
                      </td>
                    )}
                    {config.services.hasDelivery && (
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {config.hours.delivery?.[day] ? (
                          <span className="font-mono font-semibold">
                            {config.hours.delivery[day].open} - {config.hours.delivery[day].close}
                          </span>
                        ) : (
                          <span className="text-red-500">
                            {t("Suljettu", "Closed", "مغلق", "Закрыто", "Stängt")}
                          </span>
                        )}
                      </td>
                    )}
                    {config.services.hasLunchBuffet && (
                      <td className="px-6 py-4 text-gray-700 dark:text-gray-300">
                        {config.services.lunchBuffetHours?.[day] ? (
                          <span className="font-mono font-semibold">
                            {config.services.lunchBuffetHours[day].open} - {config.services.lunchBuffetHours[day].close}
                          </span>
                        ) : (
                          <span className="text-red-500">
                            {t("Suljettu", "Closed", "مغلق", "Закрыто", "Stängt")}
                          </span>
                        )}
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
                <div className={`w-16 h-16 rounded-full bg-white/20 flex items-center justify-center animate-pulse`}>
                  <Clock className="w-8 h-8 text-white" />
                </div>
                <div className="text-white">
                  <div className="text-sm font-medium opacity-90">
                    {t("Ravintolan tila", "Restaurant Status", "حالة المطعم", "Статус ресторана", "Restaurangstatus")}
                  </div>
                  <div className="text-3xl font-black">
                    {effectiveIsOpen
                      ? t("AVOINNA", "OPEN", "مفتوح", "ОТКРЫТО", "ÖPPET")
                      : t("SULJETTU", "CLOSED", "مغلق", "ЗАКРЫТО", "STÄNGT")
                    }
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
