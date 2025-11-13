import { useLanguage } from "@/lib/language-context";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Clock, Store, Phone, MapPin } from "lucide-react";
import { getRestaurantStatus } from "@/lib/business-hours";

interface RestaurantClosedModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantClosedModal({ isOpen, onClose }: RestaurantClosedModalProps) {
  const { t } = useLanguage();
  const { config } = useRestaurantSettings();
  const status = config ? getRestaurantStatus(config) : null;
  
  const isBusy = config?.isBusy || false;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2 text-red-600">
            <Store className="w-5 h-5" />
            <span>
              {isBusy 
                ? t("pizzeria on kiireinen", "Restaurant is Busy")
                : t("pizzeria suljettu", "Restaurant Closed")
              }
            </span>
          </DialogTitle>
        </DialogHeader>
        
        <div className="space-y-4">
          <div className="text-center p-6 bg-red-50 dark:bg-red-950/20 rounded-lg">
            <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-red-600" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-white mb-2">
              {isBusy
                ? t("Olemme tällä hetkellä todella kiireisiä", "We're very busy right now")
                : t("Verkkokauppa ei ole avoinna", "Online ordering is not available")
              }
            </h3>
            <p className="text-gray-600 dark:text-gray-400">
              {isBusy
                ? t(
                    "Pahoittelemme, mutta emme voi ottaa vastaan tilauksia juuri nyt. Ole hyvä ja yritä uudelleen hetken kuluttua.",
                    "Sorry, but we cannot accept orders right now. Please try again in a few moments."
                  )
                : t(
                    "Pahoittelemme, mutta verkkokauppa on tällä hetkellä suljettu. Voit tarkistaa aukioloajat alla.",
                    "Sorry, but online ordering is currently closed. You can check our opening hours below."
                  )
              }
            </p>
          </div>

          {status?.nextOrdering && !isBusy && (
            <div className="bg-blue-50 dark:bg-blue-950/20 p-4 rounded-lg">
              <h4 className="font-medium text-blue-900 dark:text-blue-100 mb-2">
                {t("Seuraava tilausaika", "Next ordering time")}
              </h4>
              <p className="text-blue-800 dark:text-blue-200">
                {status.nextOrdering.day} {t("klo", "at")} {status.nextOrdering.time}
              </p>
            </div>
          )}

          {!isBusy && (
            <div className="space-y-3">
              <h4 className="font-medium text-gray-900 dark:text-white">
                {t("Tilausajat", "Ordering Hours")}
              </h4>
              
              <div className="grid grid-cols-1 gap-3">
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Nouto", "Pickup")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    10:30 - 21:30
                  </span>
                </div>
                
                <div className="flex items-center justify-between py-2 px-3 bg-gray-50 dark:bg-gray-800 rounded">
                  <span className="text-sm text-gray-600 dark:text-gray-400">
                    {t("Kotiinkuljetus", "Delivery")}
                  </span>
                  <span className="text-sm font-medium text-gray-900 dark:text-white">
                    10:30 - 21:30
                  </span>
                </div>
              </div>
            </div>
          )}

          <div className="border-t pt-4">
            <h4 className="font-medium text-gray-900 dark:text-white mb-3">
              {t("Voit myös", "You can also")}
            </h4>
            
            <div className="grid grid-cols-1 gap-2">
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.open('tel:+358123456789')}
              >
                <Phone className="w-4 h-4 mr-2" />
                {t("Soita meille", "Call us")}
              </Button>
              
              <Button
                variant="outline"
                className="justify-start"
                onClick={() => window.open('https://maps.google.com', '_blank')}
              >
                <MapPin className="w-4 h-4 mr-2" />
                {t("Käy paikan päällä", "Visit us")}
              </Button>
            </div>
          </div>

          <Button
            onClick={onClose}
            className="w-full"
          >
            {t("Sulje", "Close")}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
