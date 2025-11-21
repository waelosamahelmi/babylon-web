import { useLanguage } from "@/lib/language-context";
import { useBranches, useBranchStatus, type Branch } from "@/hooks/use-branches";
import { UniversalHeader } from "@/components/universal-header";
import { Footer } from "@/components/footer";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Phone, Mail, MapPin, Clock, Loader2, Store } from "lucide-react";

const BranchCard = ({ branch }: { branch: Branch }) => {
  const { t, language } = useLanguage();
  const branchStatus = useBranchStatus(branch);

  const formatHours = (hours: Branch['opening_hours']) => {
    if (!hours) return [];

    const dayNames: Record<string, Record<string, string>> = {
      monday: { fi: "Maanantai", en: "Monday", ar: "الاثنين", ru: "Понедельник" },
      tuesday: { fi: "Tiistai", en: "Tuesday", ar: "الثلاثاء", ru: "Вторник" },
      wednesday: { fi: "Keskiviikko", en: "Wednesday", ar: "الأربعاء", ru: "Среда" },
      thursday: { fi: "Torstai", en: "Thursday", ar: "الخميس", ru: "Четверг" },
      friday: { fi: "Perjantai", en: "Friday", ar: "الجمعة", ru: "Пятница" },
      saturday: { fi: "Lauantai", en: "Saturday", ar: "السبت", ru: "Суббота" },
      sunday: { fi: "Sunnuntai", en: "Sunday", ar: "الأحد", ru: "Воскресенье" },
    };

    // Define explicit day order (Monday to Sunday)
    const dayOrder = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];

    return dayOrder
      .filter(day => hours[day as keyof typeof hours]) // Only include days that exist
      .map((day) => ({
        day: dayNames[day]?.[language] || dayNames[day]?.en || day,
        ...hours[day as keyof typeof hours],
      }));
  };

  const formattedHours = formatHours(branch.opening_hours);

  // Group consecutive days with same hours
  const groupedHours = formattedHours.reduce((acc: any[], curr) => {
    if (curr.closed) {
      acc.push({ days: [curr.day], hours: t('Suljettu', 'Closed', 'مغلق') });
      return acc;
    }

    const timeStr = `${curr.open} - ${curr.close}`;
    const lastGroup = acc[acc.length - 1];

    if (lastGroup && lastGroup.hours === timeStr && !Array.isArray(lastGroup.hours)) {
      lastGroup.days.push(curr.day);
    } else {
      acc.push({ days: [curr.day], hours: timeStr });
    }

    return acc;
  }, []);

  return (
    <Card className="hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-500">
      <CardHeader className="bg-gradient-to-br from-orange-50 to-red-50 dark:from-stone-800 dark:to-stone-700">
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-3 text-2xl">
            <div className="w-12 h-12 rounded-full bg-gradient-to-br from-orange-500 to-red-600 flex items-center justify-center">
              <Store className="w-6 h-6 text-white" />
            </div>
            {language === 'fi' ? branch.name : branch.name_en}
          </CardTitle>
          {branchStatus && (
            <div className={`flex items-center gap-2 px-3 py-1 rounded-full text-sm font-bold ${
              branchStatus.isOpen
                ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-100'
                : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-100'
            }`}>
              <div className={`w-2 h-2 rounded-full ${branchStatus.isOpen ? 'bg-green-500' : 'bg-red-500'}`}></div>
              {branchStatus.isOpen ? t('Auki', 'Open', 'مفتوح') : t('Suljettu', 'Closed', 'مغلق')}
            </div>
          )}
        </div>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        {/* Contact Information Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {/* Phone */}
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900 flex items-center justify-center flex-shrink-0">
              <Phone className="w-5 h-5 text-orange-600 dark:text-orange-400" />
            </div>
            <div>
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                {t('Puhelin', 'Phone', 'هاتف')}
              </p>
              <a href={`tel:${branch.phone}`} className="text-lg font-medium text-gray-900 dark:text-white hover:text-orange-600 transition-colors">
                {branch.phone}
              </a>
            </div>
          </div>

          {/* Email */}
          {branch.email && (
            <div className="flex items-start gap-3">
              <div className="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900 flex items-center justify-center flex-shrink-0">
                <Mail className="w-5 h-5 text-blue-600 dark:text-blue-400" />
              </div>
              <div>
                <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">Email</p>
                <a href={`mailto:${branch.email}`} className="text-lg font-medium text-gray-900 dark:text-white hover:text-blue-600 transition-colors break-all">
                  {branch.email}
                </a>
              </div>
            </div>
          )}
        </div>

        {/* Address */}
        <div className="flex items-start gap-3 p-4 bg-gray-50 dark:bg-stone-800 rounded-lg">
          <div className="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900 flex items-center justify-center flex-shrink-0">
            <MapPin className="w-5 h-5 text-green-600 dark:text-green-400" />
          </div>
          <div className="flex-1">
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
              {t('Osoite', 'Address', 'عنوان')}
            </p>
            <p className="text-lg font-medium text-gray-900 dark:text-white">
              {branch.address}
            </p>
            <p className="text-gray-700 dark:text-gray-300">
              {branch.postal_code} {branch.city}
            </p>
            <a
              href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${branch.address}, ${branch.postal_code} ${branch.city}`)}`}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 mt-2 text-sm font-bold text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition-colors"
            >
              {t("Avaa kartassa", "Open in Maps", "افتح في الخريطة")}
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 8l4 4m0 0l-4 4m4-4H3" />
              </svg>
            </a>
          </div>
        </div>

        {/* Opening Hours */}
        {branch.opening_hours && (
          <div className="flex items-start gap-3">
            <div className="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900 flex items-center justify-center flex-shrink-0">
              <Clock className="w-5 h-5 text-purple-600 dark:text-purple-400" />
            </div>
            <div className="flex-1">
              <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                {t('Aukioloajat', 'Opening Hours', 'ساعات العمل')}
              </p>
              <div className="space-y-2">
                {groupedHours.map((group, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="font-medium text-gray-900 dark:text-white">
                      {group.days.length === 1
                        ? group.days[0]
                        : `${group.days[0]} - ${group.days[group.days.length - 1]}`
                      }:
                    </span>
                    <span className="text-gray-700 dark:text-gray-300">{group.hours}</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default function Branches() {
  const { t } = useLanguage();
  const { data: branches, isLoading } = useBranches();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-stone-900">
      <UniversalHeader />

      {/* Page Header */}
      <div className="relative bg-gradient-to-br from-orange-600 via-red-600 to-pink-600 text-white py-24 overflow-hidden">
        {/* Animated background patterns */}
        <div className="absolute inset-0 opacity-20">
          <div className="absolute top-0 right-0 w-96 h-96 bg-white rounded-full blur-3xl animate-pulse"></div>
          <div className="absolute bottom-0 left-0 w-96 h-96 bg-pink-300 rounded-full blur-3xl animate-pulse" style={{ animationDelay: '1.5s' }}></div>
        </div>

        <div className="max-w-7xl mx-auto px-4 text-center relative">
          <div className="inline-block mb-6">
            <div className="bg-white/20 backdrop-blur-sm px-6 py-2 rounded-full border border-white/30 shadow-lg">
              <span className="text-sm font-bold uppercase tracking-wider">
                {t("Löydä lähimmät ravintolat", "Find Our Restaurants", "ابحث عن مطاعمنا")}
              </span>
            </div>
          </div>
          <h1 className="text-5xl md:text-7xl font-bold mb-6 animate-fade-in">
            {t("Ravintolat", "Our Branches", "فروعنا")}
          </h1>
          <p className="text-xl md:text-3xl opacity-90 max-w-3xl mx-auto font-light">
            {t("Meillä on useita ravintoloita palvelemaan sinua", "We have multiple locations to serve you", "لدينا عدة مواقع لخدمتك")}
          </p>
          {/* Decorative line */}
          <div className="mt-8 flex justify-center">
            <div className="w-24 h-1 bg-white/50 rounded-full"></div>
          </div>
        </div>
      </div>

      {/* Branches Content */}
      <section className="py-20 relative">
        <div className="max-w-7xl mx-auto px-4">
          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <Loader2 className="w-12 h-12 animate-spin text-orange-600" />
            </div>
          ) : branches && branches.length > 0 ? (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 animate-fade-in">
              {branches.map((branch) => (
                <BranchCard key={branch.id} branch={branch} />
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <Store className="w-20 h-20 mx-auto mb-6 text-gray-400" />
              <h3 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
                {t("Ei ravintoloita", "No branches yet", "لا توجد فروع بعد")}
              </h3>
              <p className="text-gray-600 dark:text-gray-400">
                {t("Ravintolat lisätään pian", "Branches will be added soon", "سيتم إضافة الفروع قريبًا")}
              </p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
