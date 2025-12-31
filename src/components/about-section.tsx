import { useLanguage } from "@/lib/language-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { useBranches } from "@/hooks/use-branches";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import * as LucideIcons from "lucide-react";
import { 
  MapPin, 
  Phone, 
  Clock, 
  Star, 
  Heart,
  ChefHat,
  Truck,
  Coffee,
  Facebook
} from "lucide-react";

// Define explicit day order (Monday to Sunday)
const DAY_ORDER = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const;

const getDayName = (day: string, language: string): string => {
  const dayNames: Record<string, { fi: string; en: string }> = {
    monday: { fi: 'Maanantai', en: 'Monday' },
    tuesday: { fi: 'Tiistai', en: 'Tuesday' },
    wednesday: { fi: 'Keskiviikko', en: 'Wednesday' },
    thursday: { fi: 'Torstai', en: 'Thursday' },
    friday: { fi: 'Perjantai', en: 'Friday' },
    saturday: { fi: 'Lauantai', en: 'Saturday' },
    sunday: { fi: 'Sunnuntai', en: 'Sunday' },
  };
  return dayNames[day]?.[language === 'fi' ? 'fi' : 'en'] || day;
};

export function AboutSection() {
  const { t, language } = useLanguage();
  const { config } = useRestaurant();
  const { data: branches } = useBranches();

  return (
    <section className="py-20 bg-gradient-to-b from-gray-50 to-white dark:from-stone-900 dark:to-stone-800 relative overflow-hidden">
      <div className="absolute inset-0 opacity-5" style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg width=\'60\' height=\'60\' viewBox=\'0 0 60 60\' xmlns=\'http://www.w3.org/2000/svg\'%3E%3Cg fill=\'none\' fill-rule=\'evenodd\'%3E%3Cg fill=\'%23000000\' fill-opacity=\'0.4\'%3E%3Cpath d=\'M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z\'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")' }}></div>
      
      <div className="max-w-7xl mx-auto px-4 relative z-10">
        {/* Content */}
        <div className="text-center mb-16">
          <div className="max-w-4xl mx-auto space-y-6">
            <p className="text-xl text-gray-700 dark:text-gray-300 leading-relaxed">
              {t(config.about.story, config.about.storyEn)}
            </p>
            <div className="inline-flex items-center gap-3 px-8 py-4 bg-gradient-to-r from-red-600 to-orange-600 text-white rounded-2xl shadow-xl">
              <Truck className="w-6 h-6" />
              <span className="text-lg font-bold">
                {config.services.hasDelivery && t("Nopea ja luotettava toimituspalvelu!", "Fast and reliable delivery service!")}
              </span>
            </div>
            <p className="text-lg text-gray-600 dark:text-gray-400">
              {t(config.about.mission, config.about.missionEn)}
            </p>
          </div>
        </div>

        {/* Specialties Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-16">
          {config.about.specialties.map((specialty, index) => {
            const IconComponent = (LucideIcons as any)[specialty.icon] || LucideIcons.Star;
            const gradients = [
              'from-red-500 to-orange-600',
              'from-blue-500 to-cyan-600',
              'from-purple-500 to-pink-600',
              'from-green-500 to-emerald-600'
            ];
            
            return (
              <Card key={index} className="group hover:shadow-2xl transition-all duration-500 border-0 bg-white dark:bg-stone-800 overflow-hidden relative">
                <div className={`absolute top-0 left-0 right-0 h-2 bg-gradient-to-r ${gradients[index % gradients.length]}`}></div>
                <CardContent className="p-6 text-center">
                  <div 
                    className={`w-20 h-20 rounded-2xl bg-gradient-to-br ${gradients[index % gradients.length]} flex items-center justify-center mx-auto mb-4 shadow-lg group-hover:scale-110 group-hover:rotate-6 transition-all`}
                  >
                    <IconComponent className="w-10 h-10 text-white" />
                  </div>
                  <h3 className="text-xl font-black mb-2 text-gray-900 dark:text-white">
                    {t(specialty.title, specialty.titleEn)}
                  </h3>
                  <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed">
                    {t(specialty.description, specialty.descriptionEn)}
                  </p>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Info Cards */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Why Choose Us Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-950 dark:to-pink-950 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <Star className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {t("Miksi valita meidät?", "Why Choose Us?")}
                </h3>
              </div>
              
              <div className="space-y-4">
                <div className="flex items-start gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl group hover:shadow-lg transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <ChefHat className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                      {t("Ammattitaitoiset kokit", "Professional Chefs")}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Kokeneet kokit valmistavat jokaisen annoksen rakkaudella", "Experienced chefs prepare every dish with love")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl group hover:shadow-lg transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-cyan-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Truck className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                      {t("Nopea toimitus", "Fast Delivery")}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Tuoretta ruokaa ovellesi nopeasti ja luotettavasti", "Fresh food to your door quickly and reliably")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl group hover:shadow-lg transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-orange-500 to-red-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Heart className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                      {t("Tuoreet raaka-aineet", "Fresh Ingredients")}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Käytämme vain laadukkaita ja tuoreita raaka-aineita", "We use only quality and fresh ingredients")}
                    </div>
                  </div>
                </div>

                <div className="flex items-start gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl group hover:shadow-lg transition-all">
                  <div className="w-10 h-10 bg-gradient-to-br from-yellow-500 to-amber-600 rounded-lg flex items-center justify-center flex-shrink-0 group-hover:scale-110 transition-transform">
                    <Star className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 dark:text-white mb-1">
                      {t("Erinomainen asiakaspalvelu", "Excellent Customer Service")}
                    </div>
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      {t("Ystävällinen ja avulias henkilökunta palveluksessasi", "Friendly and helpful staff at your service")}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 p-6 bg-gradient-to-r from-purple-600 to-pink-600 rounded-xl shadow-lg text-white">
                <div className="text-center">
                  <div className="text-4xl font-black mb-2">500+</div>
                  <div className="text-sm font-medium opacity-90">
                    {t("Tyytyväistä asiakasta", "Happy Customers")}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Contact Info Card */}
          <Card className="border-0 shadow-xl bg-gradient-to-br from-orange-50 to-red-50 dark:from-orange-950 dark:to-red-950 overflow-hidden">
            <CardContent className="p-8">
              <div className="flex items-center gap-4 mb-6">
                <div className="w-16 h-16 bg-gradient-to-br from-orange-500 to-red-600 rounded-2xl flex items-center justify-center shadow-lg">
                  <MapPin className="w-8 h-8 text-white" />
                </div>
                <h3 className="text-2xl font-black text-gray-900 dark:text-white">
                  {t("Yhteystiedot", "Contact Info")}
                </h3>
              </div>
              
              <div className="space-y-6">
                {/* All Branches */}
                {branches && branches.length > 0 ? (
                  branches.map((branch, index) => (
                    <div key={branch.id} className="space-y-3">
                      {/* Branch Name */}
                      {branches.length > 1 && (
                        <div className="flex items-center gap-2 mb-3">
                          <Badge className="bg-gradient-to-r from-orange-600 to-red-600 text-white font-bold px-3 py-1">
                            {branch.name}
                          </Badge>
                        </div>
                      )}
                      
                      {/* Address */}
                      <div className="flex items-start gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl">
                        <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                          <MapPin className="w-5 h-5 text-red-600" />
                        </div>
                        <div>
                          <div className="font-bold text-gray-900 dark:text-white mb-1">{branch.address}</div>
                          <div className="text-gray-600 dark:text-gray-400">
                            {branch.postal_code} {branch.city}
                          </div>
                        </div>
                      </div>
                      
                      {/* Phone */}
                      {branch.phone && (
                        <div className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl">
                          <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                            <Phone className="w-5 h-5 text-green-600" />
                          </div>
                          <a href={`tel:${branch.phone}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-red-600 transition-colors">
                            {branch.phone}
                          </a>
                        </div>
                      )}
                      
                      {/* Opening Hours */}
                      {branch.opening_hours && (
                        <div className="p-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg text-white">
                          <h4 className="font-black text-sm mb-2 flex items-center gap-2">
                            <Clock className="w-4 h-4" />
                            {t("Aukioloajat", "Opening Hours")}
                          </h4>
                          <div className="text-sm font-medium space-y-1">
                            {DAY_ORDER.filter(day => branch.opening_hours![day]).map((day) => {
                              const hours = branch.opening_hours![day] as any;
                              return (
                                <div key={day} className="flex justify-between">
                                  <span>{getDayName(day, language)}:</span>
                                  <span className="font-bold">
                                    {hours.closed ? t("Suljettu", "Closed") : `${hours.open} - ${hours.close}`}
                                  </span>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}
                      
                      {/* Divider between branches */}
                      {index < branches.length - 1 && (
                        <div className="border-t border-gray-200 dark:border-gray-700 my-4"></div>
                      )}
                    </div>
                  ))
                ) : (
                  /* Fallback to config if no branches */
                  <>
                    <div className="flex items-start gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl">
                      <div className="w-10 h-10 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <MapPin className="w-5 h-5 text-red-600" />
                      </div>
                      <div>
                        <div className="font-bold text-gray-900 dark:text-white mb-1">{config.address.street}</div>
                        <div className="text-gray-600 dark:text-gray-400">
                          {config.address.postalCode} {config.address.city}
                        </div>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl">
                      <div className="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                        <Phone className="w-5 h-5 text-green-600" />
                      </div>
                      <a href={`tel:${config.phone}`} className="text-lg font-bold text-gray-900 dark:text-white hover:text-red-600 transition-colors">
                        {config.phone}
                      </a>
                    </div>
                    
                    {config.hours?.general?.monday && (
                      <div className="p-4 bg-gradient-to-r from-orange-600 to-red-600 rounded-xl shadow-lg text-white">
                        <h4 className="font-black text-sm mb-2 flex items-center gap-2">
                          <Clock className="w-4 h-4" />
                          {t("Aukioloajat", "Opening Hours")}
                        </h4>
                        <div className="text-sm font-medium space-y-1">
                          {DAY_ORDER.map((day) => {
                            const hours = config.hours.general[day] as any;
                            return (
                              <div key={day} className="flex justify-between">
                                <span>{getDayName(day, language)}:</span>
                                <span className="font-bold">
                                  {hours?.closed ? t("Suljettu", "Closed") : `${hours?.open || ''} - ${hours?.close || ''}`}
                                </span>
                              </div>
                            );
                          })}
                        </div>
                      </div>
                    )}
                  </>
                )}
                
                {/* Facebook - Show once for all branches */}
                {config.facebook && (
                  <div className="flex items-center gap-4 p-4 bg-white dark:bg-stone-900 rounded-xl">
                    <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center flex-shrink-0">
                      <Facebook className="w-5 h-5 text-blue-600" />
                    </div>
                    <a 
                      href={config.facebook} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="font-medium text-gray-900 dark:text-white hover:text-blue-600 transition-colors"
                    >
                      {t("Seuraa meitä Facebookissa", "Follow us on Facebook")}
                    </a>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
}