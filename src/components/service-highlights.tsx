import { useLanguage } from "@/lib/language-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { Bike, ShoppingBag, UtensilsCrossed } from "lucide-react";

export function ServiceHighlights() {
  const { t } = useLanguage();
  const { config } = useRestaurant();

  if (!config) {
    return (
      <section className="py-16 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p>Loading services...</p>
          </div>
        </div>
      </section>
    );
  }

  const services = [
    {
      icon: Bike,
      title: t("Kotiinkuljetus", "Delivery"),
      description: t("Nopea ja luotettava toimitus suoraan ovellesi", "Fast and reliable delivery to your door"),
      bgColor: `${config.theme.secondary}20`,
      textColor: config.theme.secondary,
    },
    {
      icon: ShoppingBag,
      title: t("Nouto", "Pickup"),
      description: t("Tilaa etukäteen ja nouda sopivana aikana", "Order ahead and pickup at your convenience"),
      bgColor: '#fef3c7',
      textColor: '#d97706',
    },
    {
      icon: UtensilsCrossed,
      title: t("pizzeriassa", "Dine-in"),
      description: t("Nauti ateriastasi viihtyisässä ympäristössämme", "Enjoy your meal in our cozy atmosphere"),
      bgColor: '#dcfce7',
      textColor: '#16a34a',
    },
  ];

  return (
    <section className="py-16 bg-white">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {services.map((service, index) => {
            const Icon = service.icon;
            return (
              <div key={index} className="text-center">
                <div 
                  className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                  style={{
                    backgroundColor: service.bgColor,
                    color: service.textColor
                  }}
                >
                  <Icon className="w-8 h-8" />
                </div>
                <h3 className="text-xl font-semibold mb-2">{service.title}</h3>
                <p className="text-gray-600">{service.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}
