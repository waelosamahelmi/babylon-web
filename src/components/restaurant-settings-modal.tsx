import { useState } from "react";
import { useLanguage } from "@/lib/language-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { Badge } from "@/components/ui/badge";
import { 
  Clock, 
  Store, 
  Truck, 
  UtensilsCrossed,
  AlertCircle,
  Save,
  Power,
  Coffee
} from "lucide-react";

interface RestaurantSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function RestaurantSettingsModal({ isOpen, onClose }: RestaurantSettingsModalProps) {
  const { t } = useLanguage();
  
  // Restaurant settings state
  const [isOpen24h, setIsOpen24h] = useState(true);
  const [specialMessage, setSpecialMessage] = useState("");
  
  // Opening hours state
  const [openingHours, setOpeningHours] = useState({
    monday: { open: "06:00", close: "20:00", closed: false },
    tuesday: { open: "06:00", close: "20:00", closed: false },
    wednesday: { open: "06:00", close: "20:00", closed: false },
    thursday: { open: "06:00", close: "20:00", closed: false },
    friday: { open: "06:00", close: "20:00", closed: false },
    saturday: { open: "06:00", close: "20:00", closed: false },
    sunday: { open: "06:00", close: "20:00", closed: false },
  });

  // Pickup hours state
  const [pickupHours, setPickupHours] = useState({
    monday: { open: "10:00", close: "20:00", closed: false },
    tuesday: { open: "10:00", close: "20:00", closed: false },
    wednesday: { open: "10:00", close: "20:00", closed: false },
    thursday: { open: "10:00", close: "20:00", closed: false },
    friday: { open: "10:00", close: "20:00", closed: false },
    saturday: { open: "10:00", close: "20:00", closed: false },
    sunday: { open: "10:00", close: "20:00", closed: false },
  });

  // Delivery hours state
  const [deliveryHours, setDeliveryHours] = useState({
    monday: { open: "10:00", close: "19:30", closed: false },
    tuesday: { open: "10:00", close: "19:30", closed: false },
    wednesday: { open: "10:00", close: "19:30", closed: false },
    thursday: { open: "10:00", close: "19:30", closed: false },
    friday: { open: "10:00", close: "19:30", closed: false },
    saturday: { open: "10:00", close: "19:30", closed: false },
    sunday: { open: "10:00", close: "19:30", closed: false },
  });

  // Lunch buffet hours
  const [lunchBuffetHours, setLunchBuffetHours] = useState({
    monday: { open: "10:00", close: "14:30", closed: false },
    tuesday: { open: "10:00", close: "14:30", closed: false },
    wednesday: { open: "10:00", close: "14:30", closed: false },
    thursday: { open: "10:00", close: "14:30", closed: false },
    friday: { open: "10:00", close: "14:30", closed: false },
    saturday: { open: "", close: "", closed: true },
    sunday: { open: "", close: "", closed: true },
  });

  const daysOfWeek = [
    { key: "monday", label: t("Maanantai", "Monday") },
    { key: "tuesday", label: t("Tiistai", "Tuesday") },
    { key: "wednesday", label: t("Keskiviikko", "Wednesday") },
    { key: "thursday", label: t("Torstai", "Thursday") },
    { key: "friday", label: t("Perjantai", "Friday") },
    { key: "saturday", label: t("Lauantai", "Saturday") },
    { key: "sunday", label: t("Sunnuntai", "Sunday") },
  ];

  const updateHours = (type: string, day: string, field: string, value: string | boolean) => {
    const setters = {
      opening: setOpeningHours,
      pickup: setPickupHours,
      delivery: setDeliveryHours,
      lunchBuffet: setLunchBuffetHours,
    };
    
    const setter = setters[type as keyof typeof setters];
    if (setter) {
      setter((prev: any) => ({
        ...prev,
        [day]: { ...prev[day], [field]: value }
      }));
    }
  };

  const HoursSection = ({ 
    title, 
    icon: Icon, 
    hours, 
    type, 
    description 
  }: { 
    title: string; 
    icon: any; 
    hours: any; 
    type: string; 
    description: string;
  }) => (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center space-x-2">
          <Icon className="w-5 h-5" />
          <span>{title}</span>
        </CardTitle>
        <p className="text-sm text-gray-600 dark:text-gray-400">{description}</p>
      </CardHeader>
      <CardContent className="space-y-3">
        {daysOfWeek.map(({ key, label }) => (
          <div key={key} className="flex items-center space-x-4">
            <div className="w-20 text-sm font-medium">{label}</div>
            <div className="flex items-center space-x-2 flex-1">
              <Switch
                checked={!hours[key].closed}
                onCheckedChange={(checked) => updateHours(type, key, "closed", !checked)}
              />
              {!hours[key].closed ? (
                <div className="flex items-center space-x-2">
                  <Input
                    type="time"
                    value={hours[key].open}
                    onChange={(e) => updateHours(type, key, "open", e.target.value)}
                    className="w-32"
                  />
                  <span>-</span>
                  <Input
                    type="time"
                    value={hours[key].close}
                    onChange={(e) => updateHours(type, key, "close", e.target.value)}
                    className="w-32"
                  />
                </div>
              ) : (
                <Badge variant="secondary">{t("Suljettu", "Closed")}</Badge>
              )}
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );

  const handleSave = async () => {
    const settings = {
      isOpen: isOpen24h,
      openingHours: JSON.stringify(openingHours),
      pickupHours: JSON.stringify(pickupHours),
      deliveryHours: JSON.stringify(deliveryHours),
      lunchBuffetHours: JSON.stringify(lunchBuffetHours),
      specialMessage,
    };

    console.log("Saving restaurant settings:", settings);
    // TODO: Implement API call to save settings
    onClose();
  };

  // Check if currently open based on current time
  const getCurrentStatus = () => {
    const now = new Date();
    const currentDay = daysOfWeek[now.getDay() === 0 ? 6 : now.getDay() - 1].key;
    const currentTime = now.toTimeString().slice(0, 5);
    
    const todayHours = openingHours[currentDay as keyof typeof openingHours];
    if (todayHours.closed) return "closed";
    
    if (currentTime >= todayHours.open && currentTime <= todayHours.close) {
      return "open";
    }
    return "closed";
  };

  const status = getCurrentStatus();

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center space-x-2">
            <Store className="w-6 h-6" />
            <span>{t("pizzerian asetukset", "Restaurant Settings")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Current Status */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <Power className="w-5 h-5" />
                <span>{t("Nykyinen tila", "Current Status")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-4">
                  <Badge 
                    variant={status === "open" ? "default" : "destructive"}
                    className="text-base px-4 py-2"
                  >
                    {status === "open" ? t("AVOINNA", "OPEN") : t("SULJETTU", "CLOSED")}
                  </Badge>
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={isOpen24h}
                      onCheckedChange={setIsOpen24h}
                    />
                    <Label>{t("Pakota auki (ohittaa aukioloajat)", "Force Open (Override Hours)")}</Label>
                  </div>
                </div>
                {!isOpen24h && (
                  <div className="text-sm text-gray-600">
                    {t("Aukioloaikojen mukaan", "Following scheduled hours")}
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Special Message */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center space-x-2">
                <AlertCircle className="w-5 h-5" />
                <span>{t("Erikoisviesti", "Special Message")}</span>
              </CardTitle>
            </CardHeader>
            <CardContent>
              <Textarea
                placeholder={t("Esim. 'Tilapäisesti suljettu remontin vuoksi'", "e.g. 'Temporarily closed for renovation'")}
                value={specialMessage}
                onChange={(e) => setSpecialMessage(e.target.value)}
                rows={3}
              />
            </CardContent>
          </Card>

          {/* Hours Sections */}
          <div className="grid gap-6">
            <HoursSection
              title={t("Aukioloajat", "Opening Hours")}
              icon={Store}
              hours={openingHours}
              type="opening"
              description={t("pizzerian yleiset aukioloajat", "General restaurant opening hours")}
            />

            <HoursSection
              title={t("Noutopalvelu", "Pickup Service")}
              icon={UtensilsCrossed}
              hours={pickupHours}
              type="pickup"
              description={t("Noutotilausten saatavuus", "Pickup order availability")}
            />

            <HoursSection
              title={t("Toimituspalvelu", "Delivery Service")}
              icon={Truck}
              hours={deliveryHours}
              type="delivery"
              description={t("Kotiinkuljetus saatavuus", "Home delivery availability")}
            />

            <HoursSection
              title={t("Lounasbuffet", "Lunch Buffet")}
              icon={Coffee}
              hours={lunchBuffetHours}
              type="lunchBuffet"
              description={t("Lounasbuffetin saatavuus arkisin", "Lunch buffet availability on weekdays")}
            />
          </div>

          <Separator />

          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={onClose}>
              {t("Peruuta", "Cancel")}
            </Button>
            <Button onClick={handleSave}>
              <Save className="w-4 h-4 mr-2" />
              {t("Tallenna asetukset", "Save Settings")}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}