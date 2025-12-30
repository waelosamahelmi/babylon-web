import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { useBranches } from "@/hooks/use-branches";
import { useLounasMenus, getCurrentWeek } from "@/hooks/use-lounas-menus";
import { usePageVariant } from "@/hooks/use-page-variant";
import { useRestaurant } from "@/lib/restaurant-context";
import { cn } from "@/lib/utils";
import { useLounasSettings, formatTime } from "@/hooks/use-lounas-settings";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronLeft, ChevronRight, Leaf, Wheat, Droplet, Milk, Flame, Store, Calendar } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { UniversalHeader } from "@/components/universal-header";
import type { LounasMenu } from "@/hooks/use-lounas-menus";

export default function Lounas() {
  const { t, language } = useLanguage();
  const { config } = useRestaurant();
  const { data: allBranches, isLoading: branchesLoading } = useBranches();
  const variant = usePageVariant('menu');
  
  // Get theme colors
  const theme = config?.theme || {};
  const primaryColor = theme.primary || '#8B4513';
  const secondaryColor = theme.secondary || '#FF8C00';
  const fonts = theme.fonts || { heading: 'Inter', body: 'Inter' };

  const currentWeekInfo = getCurrentWeek();
  const [selectedBranchId, setSelectedBranchId] = useState<number>(0);
  const [weekNumber, setWeekNumber] = useState(currentWeekInfo.week);
  const [year, setYear] = useState(currentWeekInfo.year);

  const { data: menus, isLoading: menusLoading } = useLounasMenus(
    undefined,
    weekNumber,
    year
  );

  const { data: lounasSettings } = useLounasSettings(selectedBranchId || undefined);

  // Check if lounas is enabled
  const isLounasEnabled = lounasSettings && !Array.isArray(lounasSettings) 
    ? lounasSettings.is_enabled 
    : true;

  // Filter branches that have lunch entries for the selected week
  const branches = allBranches?.filter(branch => 
    menus?.some(menu => menu.branch_id === branch.id)
  );

  // Auto-select first branch with entries if none selected
  if (branches && branches.length > 0 && !selectedBranchId) {
    setSelectedBranchId(branches[0].id);
  }

  // Filter menus for selected branch
  const selectedBranchMenus = menus?.filter(m => m.branch_id === selectedBranchId);

  // If lounas is disabled, show message
  if (!isLounasEnabled) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
        <UniversalHeader />
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="max-w-md mx-4">
            <CardHeader>
              <CardTitle className="text-center">
                {t("Lounas ei ole käytössä", "Lounas is not available", "الغداء غير متاح", "Обед недоступен", "Lunch är inte tillgänglig")}
              </CardTitle>
            </CardHeader>
            <CardContent className="text-center text-muted-foreground">
              {t(
                "Lounas-palvelu ei ole tällä hetkellä käytössä. Tarkista myöhemmin uudelleen.",
                "Lounas service is currently not available. Please check back later.",
                "خدمة الغداء غير متاحة حالياً. يرجى التحقق مرة أخرى لاحقاً.",
                "Обеденный сервис в настоящее время недоступен. Пожалуйста, проверьте позже.",
                "Lunchtjänsten är för närvarande inte tillgänglig. Vänligen kontrollera senare."
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    );
  }

  const dayNames = {
    fi: ["Sunnuntai", "Maanantai", "Tiistai", "Keskiviikko", "Torstai", "Perjantai", "Lauantai"],
    en: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"],
    ar: ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"],
  };

  const handlePreviousWeek = () => {
    if (weekNumber === 1) {
      setWeekNumber(52);
      setYear(year - 1);
    } else {
      setWeekNumber(weekNumber - 1);
    }
  };

  const handleNextWeek = () => {
    if (weekNumber === 52) {
      setWeekNumber(1);
      setYear(year + 1);
    } else {
      setWeekNumber(weekNumber + 1);
    }
  };

  const getMenusForDay = (dayOfWeek: number) => {
    return selectedBranchMenus?.filter((m) => m.day_of_week === dayOfWeek) || [];
  };

  const getLocalizedName = (menu: LounasMenu) => {
    if (language === "en" && menu.name_en) return menu.name_en;
    if (language === "ar" && menu.name_ar) return menu.name_ar;
    if (language === "ru" && menu.name_ru) return menu.name_ru;
    if (language === "sv" && menu.name_sv) return menu.name_sv;
    return menu.name;
  };

  const getLocalizedDescription = (menu: LounasMenu) => {
    if (language === "en" && menu.description_en) return menu.description_en;
    if (language === "ar" && menu.description_ar) return menu.description_ar;
    if (language === "ru" && menu.description_ru) return menu.description_ru;
    if (language === "sv" && menu.description_sv) return menu.description_sv;
    return menu.description;
  };

  // Get the actual date for a day of week in the selected week
  const getDateForDay = (dayOfWeek: number) => {
    // ISO 8601 week date calculation
    // Week 1 is the week with the first Thursday of the year
    const jan4 = new Date(year, 0, 4); // January 4th is always in week 1
    const jan4DayOfWeek = jan4.getDay() || 7; // Sunday = 7, Monday = 1
    const weekOneMonday = new Date(jan4);
    weekOneMonday.setDate(jan4.getDate() - jan4DayOfWeek + 1);
    
    // Calculate the Monday of the selected week
    const selectedWeekMonday = new Date(weekOneMonday);
    selectedWeekMonday.setDate(weekOneMonday.getDate() + (weekNumber - 1) * 7);
    
    // Add days to get to the target day (Monday = 1, Sunday = 0)
    const targetDate = new Date(selectedWeekMonday);
    const daysToAdd = dayOfWeek === 0 ? 6 : dayOfWeek - 1; // Sunday at end of week
    targetDate.setDate(selectedWeekMonday.getDate() + daysToAdd);
    
    return targetDate;
  };

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.getMonth() + 1;
    return `${day}.${month}.`;
  };

  const DietaryTag = ({ icon: Icon, label, color }: { icon: any; label: string; color: string }) => (
    <div className={`inline-flex items-center space-x-1 px-3 py-1.5 rounded-full text-xs font-bold shadow-sm ${color}`}>
      <Icon className="h-4 w-4" />
      <span>{label}</span>
    </div>
  );

  const isCurrentWeek = weekNumber === currentWeekInfo.week && year === currentWeekInfo.year;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-orange-50 dark:from-stone-900 dark:via-stone-800 dark:to-stone-900">
      <UniversalHeader />
      
      {/* Modern Hero Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-orange-600 via-amber-600 to-orange-600 text-white">
        <div className="absolute inset-0 opacity-20" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'100\' height=\'100\' viewBox=\'0 0 100 100\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cpath d=\'M11 18c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm48 25c3.866 0 7-3.134 7-7s-3.134-7-7-7-7 3.134-7 7 3.134 7 7 7zm-43-7c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm63 31c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM34 90c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zm56-76c1.657 0 3-1.343 3-3s-1.343-3-3-3-3 1.343-3 3 1.343 3 3 3zM12 86c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm28-65c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm23-11c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-6 60c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm29 22c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zM32 63c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm57-13c2.76 0 5-2.24 5-5s-2.24-5-5-5-5 2.24-5 5 2.24 5 5 5zm-9-21c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM60 91c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM35 41c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2zM12 60c1.105 0 2-.895 2-2s-.895-2-2-2-2 .895-2 2 .895 2 2 2z\' fill=\'%23ffffff\' fill-opacity=\'1\' fill-rule=\'evenodd\'/%3E%3C/svg%3E")' }}></div>
        <div className="max-w-7xl mx-auto px-4 py-16 md:py-20 relative z-10">
          <div className="grid md:grid-cols-2 gap-8 items-center">
            <div className="animate-fade-in">
              <div className="inline-block px-4 py-2 bg-white/20 backdrop-blur-sm rounded-full text-sm font-bold mb-4">
                {t("Herkullinen lounas joka päivä", "Delicious lunch every day", "وجبة غداء لذيذة كل يوم", "Вкусный обед каждый день", "Utsökt lunch varje dag")}
              </div>
              <h1 className="text-5xl md:text-6xl lg:text-7xl font-black mb-6 leading-tight drop-shadow-lg">
                {t("Lounas-valikko", "Lunch Menu", "قائمة الغداء", "Обеденное меню", "Lunchmeny")}
              </h1>
              <p className="text-xl md:text-2xl text-white/90 font-medium">
                {lounasSettings && !Array.isArray(lounasSettings) ? (
                  <>
                    💡 {t("Lounas tarjoillaan", "Lunch served", "يتم تقديم الغداء", "Обед подается", "Lunch serveras")}{" "}
                    {formatTime(lounasSettings.start_time)} - {formatTime(lounasSettings.end_time)}
                  </>
                ) : (
                  t(
                    "💡 Lounas tarjoillaan arkisin klo 10:30 - 14:00",
                    "💡 Lunch served weekdays 10:30 - 14:00",
                    "💡 يتم تقديم الغداء في أيام الأسبوع 10:30 - 14:00",
                    "💡 Обед подается по будням 10:30 - 14:00",
                    "💡 Lunch serveras vardagar 10:30 - 14:00"
                  )
                )}
              </p>
              {/* Price Display */}
              {lounasSettings && !Array.isArray(lounasSettings) && (
                lounasSettings.price_text || lounasSettings.price_text_en
              ) && (
                <div className="mt-4 inline-block px-5 py-3 bg-yellow-400 text-yellow-900 rounded-full font-bold text-lg shadow-lg">
                  💰 {language === "en" && lounasSettings.price_text_en 
                    ? lounasSettings.price_text_en 
                    : lounasSettings.price_text || lounasSettings.price_text_en}
                </div>
              )}
            </div>
            <div className="relative animate-slide-up">
              <div className="absolute -inset-4 bg-white/10 blur-3xl rounded-full"></div>
              <div className="relative bg-white/10 backdrop-blur-md rounded-2xl shadow-2xl p-6 border border-white/20">
                <Calendar className="w-16 h-16 text-white/90 mx-auto mb-2" />
                <div className="text-center">
                  <div className="text-3xl font-black text-white mb-1">
                    {t("Viikko", "Week", "أسبوع", "Неделя", "Vecka")} {weekNumber}
                  </div>
                  <div className="text-lg text-white/80">{year}</div>
                  {isCurrentWeek && (
                    <div className="mt-2 inline-block px-3 py-1 bg-yellow-400 text-yellow-900 rounded-full text-sm font-bold">
                      {t("Nykyinen viikko", "Current week", "الأسبوع الحالي", "Текущая неделя", "Aktuell vecka")}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Branch Selection & Week Navigator */}
      <div className="bg-white dark:bg-stone-800 border-b border-gray-200 dark:border-stone-700 shadow-sm sticky top-20 z-30">
        <div className="max-w-7xl mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            {/* Branch Selector - Button Style like Menu Page */}
            <div className="flex items-center gap-3 flex-wrap flex-1">
              <Store className="w-5 h-5 text-gray-600 dark:text-gray-400 flex-shrink-0" />
              <span className="font-semibold text-gray-700 dark:text-gray-300">
                {t("Valitse toimipiste:", "Select branch:", "اختر الفرع:", "Выберите филиал:", "Välj filial:")}
              </span>
              {branchesLoading ? (
                <Skeleton className="h-10 w-32" />
              ) : (
                <div className="flex gap-2 flex-wrap">
                  {branches?.map((branch) => (
                    <Button
                      key={branch.id}
                      variant={selectedBranchId === branch.id ? "default" : "outline"}
                      size="sm"
                      onClick={() => setSelectedBranchId(branch.id)}
                      className={selectedBranchId === branch.id ? "bg-gradient-to-r from-orange-600 to-amber-600 hover:from-orange-700 hover:to-amber-700" : ""}
                    >
                      {language === "en" && branch.name_en ? branch.name_en : branch.name}
                    </Button>
                  ))}
                </div>
              )}
            </div>

            {/* Week Navigator */}
            <div className="flex items-center gap-3">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousWeek}
                className="h-10 w-10 rounded-xl hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600 dark:hover:bg-orange-950 transition-all"
              >
                <ChevronLeft className="h-5 w-5" />
              </Button>
              <div className="px-4 py-2 bg-gradient-to-r from-orange-50 to-amber-50 dark:from-orange-950 dark:to-amber-950 rounded-xl border-2 border-orange-200 dark:border-orange-800 min-w-[140px] text-center">
                <div className="font-bold text-sm text-gray-700 dark:text-gray-300">
                  {t("Viikko", "Week", "أسبوع", "Неделя", "Vecka")} {weekNumber}
                </div>
                <div className="text-xs text-gray-500 dark:text-gray-400">{year}</div>
              </div>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextWeek}
                className="h-10 w-10 rounded-xl hover:bg-orange-50 hover:border-orange-500 hover:text-orange-600 dark:hover:bg-orange-950 transition-all"
              >
                <ChevronRight className="h-5 w-5" />
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Menu Content */}
      <div className="max-w-7xl mx-auto px-4 py-8">{menusLoading ? (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3, 4, 5, 6, 0].map((i) => (
              <Skeleton key={i} className="h-64 w-full rounded-2xl" />
            ))}
          </div>
        ) : !selectedBranchId ? (
          <div className="bg-white dark:bg-stone-800 rounded-2xl shadow-lg p-12 text-center border border-gray-200 dark:border-stone-700">
            <Store className="w-16 h-16 text-gray-400 mx-auto mb-4" />
            <p className="text-gray-500 dark:text-gray-400 text-lg">
              {t(
                "Valitse toimipiste nähdäksesi lounas-valikon",
                "Select a branch to view the lunch menu",
                "اختر فرعًا لعرض قائمة الغداء",
                "Выберите филиал для просмотра обеденного меню",
                "Välj en filial för att se lunchmenyn"
              )}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-6">
            {[1, 2, 3, 4, 5, 6, 0].map((day) => {
              const dayMenus = getMenusForDay(day);
              const dayName =
                language === "ar"
                  ? dayNames.ar[day]
                  : language === "en"
                  ? dayNames.en[day]
                  : dayNames.fi[day];

              return (
                <Card
                  key={day}
                  className="overflow-hidden hover:shadow-xl transition-all duration-300 border-2 hover:border-orange-300 dark:hover:border-orange-700 rounded-2xl bg-white dark:bg-stone-800"
                >
                  <CardHeader className="bg-gradient-to-r from-orange-500 via-amber-500 to-orange-500 text-white pb-4">
                    <div className="flex justify-between items-center">
                      <div>
                        <CardTitle className="text-2xl md:text-3xl font-black flex items-center gap-3">
                          <div className="w-10 h-10 bg-white/20 rounded-xl flex items-center justify-center text-xl">
                            {day}
                          </div>
                          {dayName}
                        </CardTitle>
                        <div className="text-sm md:text-base text-white/80 ml-14 mt-1 font-semibold">
                          {formatDate(getDateForDay(day))}
                        </div>
                      </div>
                      {dayMenus.length > 0 && dayMenus[0].price && (
                        <div className="text-3xl font-black text-white drop-shadow-lg">
                          {dayMenus[0].price}
                        </div>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent className="p-6">
                    {dayMenus.length === 0 ? (
                      <div className="text-center py-8">
                        <Leaf className="w-12 h-12 text-gray-300 dark:text-gray-600 mx-auto mb-3" />
                        <p className="text-gray-500 dark:text-gray-400">
                          {t(
                            "Ei lounasta tälle päivälle",
                            "No lunch items for this day",
                            "لا توجد عناصر غداء لهذا اليوم",
                            "Нет обеда на этот день",
                            "Ingen lunch för denna dag"
                          )}
                        </p>
                      </div>
                    ) : (
                      <div className="space-y-4">
                        {dayMenus.map((menu, index) => (
                          <div
                            key={menu.id}
                            className={`p-5 rounded-xl bg-gradient-to-br from-gray-50 to-orange-50/30 dark:from-stone-900 dark:to-orange-950/20 border-2 border-gray-200 dark:border-stone-700 hover:border-orange-300 dark:hover:border-orange-700 transition-all duration-200 hover:shadow-md ${
                              index !== dayMenus.length - 1 ? "mb-4" : ""
                            }`}
                          >
                            {/* Image Display */}
                            {menu.image_url && (
                              <div className="mb-4">
                                <img
                                  src={menu.image_url}
                                  alt={getLocalizedName(menu)}
                                  className="w-full h-48 object-cover rounded-xl shadow-md"
                                  onError={(e) => {
                                    e.currentTarget.style.display = 'none';
                                  }}
                                />
                              </div>
                            )}

                            <div className="mb-3">
                              <h3 className="text-xl md:text-2xl font-bold text-gray-900 dark:text-white mb-2">
                                {getLocalizedName(menu)}
                              </h3>
                              {getLocalizedDescription(menu) && (
                                <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                                  {getLocalizedDescription(menu)}
                                </p>
                              )}
                            </div>

                            {/* Dietary Tags */}
                            {(menu.is_vegan || menu.is_gluten_free || menu.is_lactose_free || menu.is_milk_free || menu.is_hot) && (
                              <div className="flex flex-wrap gap-2 mt-4">
                                {menu.is_vegan && (
                                  <DietaryTag
                                    icon={Leaf}
                                    label={t("Vegaani", "Vegan", "نباتي", "Веган", "Vegansk")}
                                    color="bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-200 border border-green-300 dark:border-green-700"
                                  />
                                )}
                                {menu.is_gluten_free && (
                                  <DietaryTag
                                    icon={Wheat}
                                    label={t("Gluteeniton", "Gluten-free", "خالي من الغلوتين", "Без глютена", "Glutenfri")}
                                    color="bg-amber-100 text-amber-800 dark:bg-amber-900/30 dark:text-amber-200 border border-amber-300 dark:border-amber-700"
                                  />
                                )}
                                {menu.is_lactose_free && (
                                  <DietaryTag
                                    icon={Droplet}
                                    label={t("Laktoositon", "Lactose-free", "خالي من اللاكتوز", "Без лактозы", "Laktosfri")}
                                    color="bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-200 border border-blue-300 dark:border-blue-700"
                                  />
                                )}
                                {menu.is_milk_free && (
                                  <DietaryTag
                                    icon={Milk}
                                    label={t("Maidoton", "Dairy-free", "خالي من الحليب", "Без молочных продуктов", "Mjölkfri")}
                                    color="bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-200 border border-purple-300 dark:border-purple-700"
                                  />
                                )}
                                {menu.is_hot && (
                                  <DietaryTag
                                    icon={Flame}
                                    label={t("Tulinen", "Hot", "ساخن", "Острое", "Het")}
                                    color="bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-200 border border-red-300 dark:border-red-700"
                                  />
                                )}
                              </div>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Info Footer */}
        <div className="mt-8 p-6 bg-gradient-to-r from-blue-50 to-cyan-50 dark:from-blue-950 dark:to-cyan-950 rounded-2xl border-2 border-blue-200 dark:border-blue-800 shadow-md">
          <div className="flex items-start gap-4">
            <div className="text-3xl flex-shrink-0">ℹ️</div>
            <div>
              <h3 className="font-bold text-lg text-gray-900 dark:text-white mb-1">
                {t("Tärkeää tietoa", "Important information", "معلومات مهمة", "Важная информация", "Viktig information")}
              </h3>
              <p className="text-gray-700 dark:text-gray-300 leading-relaxed">
                {lounasSettings && !Array.isArray(lounasSettings) ? (
                  <>
                    {t("Lounas tarjoillaan", "Lunch is served", "يتم تقديم الغداء", "Обед подается", "Lunch serveras")}{" "}
                    {formatTime(lounasSettings.start_time)} - {formatTime(lounasSettings.end_time)}.{" "}
                    {t(
                      "Allergiat ja erityisruokavaliot huomioidaan tilauksen yhteydessä. Ota yhteyttä ravintolaan lisätietojen saamiseksi.",
                      "Allergies and special diets are noted when ordering. Contact the restaurant for more information.",
                      "يتم ملاحظة الحساسية والوجبات الخاصة عند الطلب. اتصل بالمطعم لمزيد من المعلومات.",
                      "Аллергии и особые диеты учитываются при заказе. Свяжитесь с рестораном для получения дополнительной информации.",
                      "Allergier och specialkost noteras vid beställning. Kontakta restaurangen för mer information."
                    )}
                  </>
                ) : (
                  t(
                    "Lounas tarjoillaan arkisin klo 10:30 - 14:00. Allergiat ja erityisruokavaliot huomioidaan tilauksen yhteydessä. Ota yhteyttä ravintolaan lisätietojen saamiseksi.",
                    "Lunch is served on weekdays from 10:30 - 14:00. Allergies and special diets are noted when ordering. Contact the restaurant for more information.",
                    "يتم تقديم الغداء في أيام الأسبوع من 10:30 - 14:00. يتم ملاحظة الحساسية والوجبات الخاصة عند الطلب. اتصل بالمطعم لمزيد من المعلومات.",
                    "Обед подается по будням с 10:30 до 14:00. Аллергии и особые диеты учитываются при заказе. Свяжитесь с рестораном для получения дополнительной информации.",
                    "Lunch serveras vardagar från 10:30 - 14:00. Allergier och specialkost noteras vid beställning. Kontakta restaurangen för mer information."
                  )
                )}
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
