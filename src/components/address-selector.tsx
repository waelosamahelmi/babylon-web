import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/language-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { MapPin, Plus, Home, Building, Briefcase, Star, Check, Loader2, Truck } from "lucide-react";
import { calculateDistance, calculateDeliveryFee, getDeliveryZone, getRestaurantLocation, isWithinFinland } from "@/lib/map-utils";

interface Address {
  label?: string;
  streetAddress: string;
  postalCode: string;
  city: string;
  instructions?: string;
}

interface AddressSelectorProps {
  onAddressSelect: (addressData: {
    streetAddress: string;
    postalCode: string;
    city: string;
    fullAddress: string;
  }) => void;
  onDeliveryCalculated?: (fee: number, distance: number, address: string) => void;
  branchLocation?: {
    lat: number;
    lng: number;
  } | null;
}

type AddressMode = "saved" | "new" | "guest";

const ADDRESS_ICONS: Record<string, React.ElementType> = {
  home: Home,
  work: Briefcase,
  office: Building,
  default: MapPin,
};

export function AddressSelector({ onAddressSelect, onDeliveryCalculated, branchLocation }: AddressSelectorProps) {
  const { t, language } = useLanguage();
  const { config } = useRestaurant();
  const { customer, isAuthenticated, addAddress, loading } = useCustomerAuth();
  
  const [addressMode, setAddressMode] = useState<AddressMode>(
    isAuthenticated && customer?.addresses?.length ? "saved" : "guest"
  );
  const [selectedAddressIndex, setSelectedAddressIndex] = useState<number>(
    customer?.default_address_index ?? 0
  );
  
  // Delivery calculation state
  const [isCalculatingDelivery, setIsCalculatingDelivery] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    fee: number;
    distance: number;
    zone: string;
  } | null>(null);
  const [deliveryError, setDeliveryError] = useState("");
  const calculateTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  
  // New address form state
  const [newAddress, setNewAddress] = useState<Address>({
    label: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    instructions: "",
  });
  const [saveNewAddress, setSaveNewAddress] = useState(true);
  const [showNewAddressDialog, setShowNewAddressDialog] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  
  // Guest address state
  const [guestAddress, setGuestAddress] = useState<Address>({
    streetAddress: "",
    postalCode: "",
    city: "",
  });

  const savedAddresses = customer?.addresses || [];

  // Calculate delivery fee for an address
  const calculateDelivery = useCallback(async (streetAddress: string, postalCode: string, city: string) => {
    if (!config || !streetAddress || !city) return;
    
    setIsCalculatingDelivery(true);
    setDeliveryError("");
    
    const fullAddress = `${streetAddress}, ${postalCode} ${city}`;
    const RESTAURANT_LOCATION = branchLocation 
      ? { lat: branchLocation.lat, lng: branchLocation.lng }
      : getRestaurantLocation(config);

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(fullAddress)}` +
        `&countrycodes=fi&limit=1&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'babylonRestaurant/1.0'
          }
        }
      );

      if (response.ok) {
        const data = await response.json();
        
        if (data && data.length > 0) {
          const lat = parseFloat(data[0].lat);
          const lng = parseFloat(data[0].lon);

          if (!isWithinFinland(lat, lng)) {
            setDeliveryError(t("Toimitus vain Suomessa", "Delivery only in Finland"));
            setIsCalculatingDelivery(false);
            return;
          }

          const distance = calculateDistance(
            RESTAURANT_LOCATION.lat,
            RESTAURANT_LOCATION.lng,
            lat,
            lng
          );
          
          const fee = calculateDeliveryFee(distance, config);
          const zone = getDeliveryZone(distance, config);

          if (fee === -1) {
            setDeliveryError(t("Osoite on toimitus-alueen ulkopuolella", "Address is outside delivery area"));
            setIsCalculatingDelivery(false);
            return;
          }

          const deliveryData = {
            distance: Math.round(distance * 10) / 10,
            fee: Number(fee.toFixed(2)),
            zone: zone.description
          };
          
          setDeliveryInfo(deliveryData);
          onDeliveryCalculated?.(deliveryData.fee, deliveryData.distance, fullAddress);
        } else {
          const minFee = config?.delivery?.zones?.[0]?.fee || 3.00;
          setDeliveryInfo({
            distance: 0,
            fee: minFee,
            zone: t("Vahvistetaan tilauksessa", "Confirmed on order")
          });
          onDeliveryCalculated?.(minFee, 0, fullAddress);
        }
      }
    } catch (err) {
      console.error('Delivery calculation error:', err);
      const minFee = config?.delivery?.zones?.[0]?.fee || 3.00;
      onDeliveryCalculated?.(minFee, 0, fullAddress);
    } finally {
      setIsCalculatingDelivery(false);
    }
  }, [config, branchLocation, onDeliveryCalculated, t]);

  // Initialize with saved address on mount for authenticated users
  useEffect(() => {
    if (isAuthenticated && savedAddresses.length > 0 && addressMode === "saved") {
      const defaultIdx = customer?.default_address_index || 0;
      const addr = savedAddresses[defaultIdx];
      if (addr) {
        const fullAddress = `${addr.streetAddress}, ${addr.postalCode} ${addr.city}`;
        onAddressSelect({
          streetAddress: addr.streetAddress,
          postalCode: addr.postalCode,
          city: addr.city,
          fullAddress,
        });
        // Calculate delivery after a small delay
        setTimeout(() => {
          calculateDelivery(addr.streetAddress, addr.postalCode, addr.city);
        }, 500);
      }
    }
  }, [isAuthenticated, savedAddresses.length]); // Only run on initial load

  const handleSelectSavedAddress = (index: number) => {
    setSelectedAddressIndex(index);
    const addr = savedAddresses[index];
    if (addr) {
      const fullAddress = `${addr.streetAddress}, ${addr.postalCode} ${addr.city}`;
      onAddressSelect({
        streetAddress: addr.streetAddress,
        postalCode: addr.postalCode,
        city: addr.city,
        fullAddress,
      });
      
      // Calculate delivery for this address
      if (calculateTimeoutRef.current) {
        clearTimeout(calculateTimeoutRef.current);
      }
      calculateTimeoutRef.current = setTimeout(() => {
        calculateDelivery(addr.streetAddress, addr.postalCode, addr.city);
      }, 300);
    }
  };

  const handleGuestAddressChange = (field: keyof Address, value: string) => {
    setGuestAddress(prev => ({ ...prev, [field]: value }));
    
    const updatedAddress = { ...guestAddress, [field]: value };
    if (updatedAddress.streetAddress && updatedAddress.city) {
      const fullAddress = `${updatedAddress.streetAddress}, ${updatedAddress.postalCode} ${updatedAddress.city}`;
      onAddressSelect({
        streetAddress: updatedAddress.streetAddress,
        postalCode: updatedAddress.postalCode,
        city: updatedAddress.city,
        fullAddress,
      });
      
      // Calculate delivery with debounce
      if (updatedAddress.streetAddress && updatedAddress.postalCode && updatedAddress.city) {
        if (calculateTimeoutRef.current) {
          clearTimeout(calculateTimeoutRef.current);
        }
        calculateTimeoutRef.current = setTimeout(() => {
          calculateDelivery(updatedAddress.streetAddress, updatedAddress.postalCode, updatedAddress.city);
        }, 800);
      }
    }
  };

  const handleNewAddressChange = (field: keyof Address, value: string) => {
    setNewAddress(prev => ({ ...prev, [field]: value }));
  };

  const handleSaveNewAddress = async () => {
    if (!newAddress.streetAddress || !newAddress.city) return;
    
    setIsSaving(true);
    try {
      if (saveNewAddress && isAuthenticated) {
        await addAddress({
          label: newAddress.label || "Osoite",
          streetAddress: newAddress.streetAddress,
          postalCode: newAddress.postalCode,
          city: newAddress.city,
          instructions: newAddress.instructions,
        });
      }
      
      const fullAddress = `${newAddress.streetAddress}, ${newAddress.postalCode} ${newAddress.city}`;
      onAddressSelect({
        streetAddress: newAddress.streetAddress,
        postalCode: newAddress.postalCode,
        city: newAddress.city,
        fullAddress,
      });
      
      // Calculate delivery for this address
      calculateDelivery(newAddress.streetAddress, newAddress.postalCode, newAddress.city);
      
      setShowNewAddressDialog(false);
      if (saveNewAddress) {
        setAddressMode("saved");
      }
    } catch (error) {
      console.error("Error saving address:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const getAddressIcon = (label?: string) => {
    const normalizedLabel = label?.toLowerCase() || "default";
    const Icon = ADDRESS_ICONS[normalizedLabel] || ADDRESS_ICONS.default;
    return Icon;
  };

  // For non-authenticated users, show simple address form
  if (!isAuthenticated) {
    return (
      <div className="space-y-4">
        <Label className="text-base sm:text-sm font-medium flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {t("Toimitusosoite", "Delivery Address")}
        </Label>
        
        <div className="space-y-3">
          <div className="space-y-2">
            <Label htmlFor="guestStreetAddress" className="text-sm">
              {t("Katuosoite", "Street Address")} *
            </Label>
            <Input
              id="guestStreetAddress"
              required
              value={guestAddress.streetAddress}
              onChange={(e) => handleGuestAddressChange("streetAddress", e.target.value)}
              placeholder={t("Esim. Mannerheimintie 1 A 5", "E.g. 123 Main Street Apt 4")}
              className="h-12 sm:h-10 text-base"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="guestPostalCode" className="text-sm">
                {t("Postinumero", "Postal Code")} *
              </Label>
              <Input
                id="guestPostalCode"
                required
                value={guestAddress.postalCode}
                onChange={(e) => handleGuestAddressChange("postalCode", e.target.value)}
                placeholder="00100"
                className="h-12 sm:h-10 text-base"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCity" className="text-sm">
                {t("Kaupunki", "City")} *
              </Label>
              <Input
                id="guestCity"
                required
                value={guestAddress.city}
                onChange={(e) => handleGuestAddressChange("city", e.target.value)}
                placeholder={t("Helsinki", "Helsinki")}
                className="h-12 sm:h-10 text-base"
              />
            </div>
          </div>
          
          {/* Delivery Info Badge */}
          {(isCalculatingDelivery || deliveryInfo || deliveryError) && (
            <div className="mt-3">
              {isCalculatingDelivery ? (
                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <Loader2 className="w-4 h-4 animate-spin" />
                  {t("Lasketaan toimitusta...", "Calculating delivery...")}
                </div>
              ) : deliveryError ? (
                <div className="text-sm text-red-600 dark:text-red-400">
                  {deliveryError}
                </div>
              ) : deliveryInfo ? (
                <div className="flex items-center gap-2">
                  <Badge variant="secondary" className="flex items-center gap-1">
                    <Truck className="w-3 h-3" />
                    {t("Toimitusmaksu", "Delivery fee")}: €{deliveryInfo.fee.toFixed(2)}
                  </Badge>
                  {deliveryInfo.distance > 0 && (
                    <span className="text-xs text-gray-500">
                      ({deliveryInfo.distance} km)
                    </span>
                  )}
                </div>
              ) : null}
            </div>
          )}
        </div>
      </div>
    );
  }

  // For authenticated users, show address options
  return (
    <div className="space-y-4">
      <Label className="text-base sm:text-sm font-medium flex items-center gap-2">
        <MapPin className="w-4 h-4" />
        {t("Toimitusosoite", "Delivery Address")}
      </Label>

      {/* Address Mode Selection */}
      <div className="flex flex-wrap gap-2">
        {savedAddresses.length > 0 && (
          <Button
            type="button"
            variant={addressMode === "saved" ? "default" : "outline"}
            size="sm"
            onClick={() => setAddressMode("saved")}
            className={addressMode === "saved" ? "bg-green-600 hover:bg-green-700" : ""}
          >
            <Star className="w-4 h-4 mr-1" />
            {t("Tallennetut", "Saved")} ({savedAddresses.length})
          </Button>
        )}
        <Button
          type="button"
          variant={addressMode === "new" ? "default" : "outline"}
          size="sm"
          onClick={() => {
            setAddressMode("new");
            setShowNewAddressDialog(true);
          }}
          className={addressMode === "new" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <Plus className="w-4 h-4 mr-1" />
          {t("Lisää uusi", "Add New")}
        </Button>
        <Button
          type="button"
          variant={addressMode === "guest" ? "default" : "outline"}
          size="sm"
          onClick={() => setAddressMode("guest")}
          className={addressMode === "guest" ? "bg-green-600 hover:bg-green-700" : ""}
        >
          <MapPin className="w-4 h-4 mr-1" />
          {t("Kertatoimitus", "One-time")}
        </Button>
      </div>

      {/* Saved Addresses */}
      {addressMode === "saved" && savedAddresses.length > 0 && (
        <RadioGroup
          value={selectedAddressIndex.toString()}
          onValueChange={(value) => handleSelectSavedAddress(parseInt(value))}
          className="space-y-2"
        >
          {savedAddresses.map((addr: Address, index: number) => {
            const Icon = getAddressIcon(addr.label);
            const isSelected = selectedAddressIndex === index;
            const isDefault = customer?.default_address_index === index;
            
            return (
              <Card
                key={index}
                className={`cursor-pointer transition-all ${
                  isSelected
                    ? "border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600"
                    : "border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-700"
                }`}
                onClick={() => handleSelectSavedAddress(index)}
              >
                <CardContent className="p-3">
                  <Label className="flex items-start gap-3 cursor-pointer">
                    <RadioGroupItem
                      value={index.toString()}
                      className="mt-1 text-green-600"
                    />
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <Icon className="w-4 h-4 text-gray-500" />
                        <span className="font-medium text-sm">
                          {addr.label || t("Osoite", "Address")} {index + 1}
                        </span>
                        {isDefault && (
                          <span className="text-xs bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300 px-2 py-0.5 rounded-full">
                            {t("Oletus", "Default")}
                          </span>
                        )}
                      </div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">
                        {addr.streetAddress}
                      </p>
                      <p className="text-sm text-gray-500 dark:text-gray-500">
                        {addr.postalCode} {addr.city}
                      </p>
                      {addr.instructions && (
                        <p className="text-xs text-gray-400 mt-1 italic">
                          {addr.instructions}
                        </p>
                      )}
                    </div>
                    {isSelected && (
                      <Check className="w-5 h-5 text-green-600 flex-shrink-0" />
                    )}
                  </Label>
                </CardContent>
              </Card>
            );
          })}
        </RadioGroup>
      )}

      {/* Guest/One-time Address Form */}
      {addressMode === "guest" && (
        <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
          <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
            {t(
              "Tätä osoitetta ei tallenneta tilillesi.",
              "This address won't be saved to your account."
            )}
          </p>
          
          <div className="space-y-2">
            <Label htmlFor="guestStreetAddress2" className="text-sm">
              {t("Katuosoite", "Street Address")} *
            </Label>
            <Input
              id="guestStreetAddress2"
              required
              value={guestAddress.streetAddress}
              onChange={(e) => handleGuestAddressChange("streetAddress", e.target.value)}
              placeholder={t("Esim. Mannerheimintie 1 A 5", "E.g. 123 Main Street Apt 4")}
              className="h-12 sm:h-10 text-base"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-3">
            <div className="space-y-2">
              <Label htmlFor="guestPostalCode2" className="text-sm">
                {t("Postinumero", "Postal Code")} *
              </Label>
              <Input
                id="guestPostalCode2"
                required
                value={guestAddress.postalCode}
                onChange={(e) => handleGuestAddressChange("postalCode", e.target.value)}
                placeholder="00100"
                className="h-12 sm:h-10 text-base"
                inputMode="numeric"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="guestCity2" className="text-sm">
                {t("Kaupunki", "City")} *
              </Label>
              <Input
                id="guestCity2"
                required
                value={guestAddress.city}
                onChange={(e) => handleGuestAddressChange("city", e.target.value)}
                placeholder={t("Helsinki", "Helsinki")}
                className="h-12 sm:h-10 text-base"
              />
            </div>
          </div>
        </div>
      )}

      {/* Delivery Info Badge for Authenticated Users */}
      {(isCalculatingDelivery || deliveryInfo || deliveryError) && (
        <div className="mt-2">
          {isCalculatingDelivery ? (
            <div className="flex items-center gap-2 text-sm text-gray-500">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("Lasketaan toimitusta...", "Calculating delivery...")}
            </div>
          ) : deliveryError ? (
            <div className="text-sm text-red-600 dark:text-red-400">
              {deliveryError}
            </div>
          ) : deliveryInfo ? (
            <div className="flex items-center gap-2">
              <Badge variant="secondary" className="flex items-center gap-1">
                <Truck className="w-3 h-3" />
                {t("Toimitusmaksu", "Delivery fee")}: €{deliveryInfo.fee.toFixed(2)}
              </Badge>
              {deliveryInfo.distance > 0 && (
                <span className="text-xs text-gray-500">
                  ({deliveryInfo.distance} km)
                </span>
              )}
            </div>
          ) : null}
        </div>
      )}

      {/* Add New Address Dialog */}
      <Dialog open={showNewAddressDialog} onOpenChange={setShowNewAddressDialog}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Plus className="w-5 h-5" />
              {t("Lisää uusi osoite", "Add New Address")}
            </DialogTitle>
          </DialogHeader>
          
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="addressLabel" className="text-sm">
                {t("Osoitteen nimi", "Address Label")}
              </Label>
              <Input
                id="addressLabel"
                value={newAddress.label}
                onChange={(e) => handleNewAddressChange("label", e.target.value)}
                placeholder={t("Esim. Koti, Työ", "E.g. Home, Work")}
                className="h-10"
              />
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newStreetAddress" className="text-sm">
                {t("Katuosoite", "Street Address")} *
              </Label>
              <Input
                id="newStreetAddress"
                required
                value={newAddress.streetAddress}
                onChange={(e) => handleNewAddressChange("streetAddress", e.target.value)}
                placeholder={t("Esim. Mannerheimintie 1 A 5", "E.g. 123 Main Street Apt 4")}
                className="h-10"
              />
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-2">
                <Label htmlFor="newPostalCode" className="text-sm">
                  {t("Postinumero", "Postal Code")} *
                </Label>
                <Input
                  id="newPostalCode"
                  required
                  value={newAddress.postalCode}
                  onChange={(e) => handleNewAddressChange("postalCode", e.target.value)}
                  placeholder="00100"
                  className="h-10"
                  inputMode="numeric"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="newCity" className="text-sm">
                  {t("Kaupunki", "City")} *
                </Label>
                <Input
                  id="newCity"
                  required
                  value={newAddress.city}
                  onChange={(e) => handleNewAddressChange("city", e.target.value)}
                  placeholder={t("Helsinki", "Helsinki")}
                  className="h-10"
                />
              </div>
            </div>
            
            <div className="space-y-2">
              <Label htmlFor="newInstructions" className="text-sm">
                {t("Toimitusohjeet", "Delivery Instructions")}
              </Label>
              <Input
                id="newInstructions"
                value={newAddress.instructions}
                onChange={(e) => handleNewAddressChange("instructions", e.target.value)}
                placeholder={t("Esim. Ovikoodi 1234", "E.g. Door code 1234")}
                className="h-10"
              />
            </div>
            
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="saveAddress"
                checked={saveNewAddress}
                onChange={(e) => setSaveNewAddress(e.target.checked)}
                className="w-4 h-4 text-green-600 rounded border-gray-300 focus:ring-green-500"
              />
              <Label htmlFor="saveAddress" className="text-sm cursor-pointer">
                {t("Tallenna osoite tililleni", "Save address to my account")}
              </Label>
            </div>
          </div>
          
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setShowNewAddressDialog(false)}
            >
              {t("Peruuta", "Cancel")}
            </Button>
            <Button
              type="button"
              onClick={handleSaveNewAddress}
              disabled={!newAddress.streetAddress || !newAddress.city || isSaving}
              className="bg-green-600 hover:bg-green-700"
            >
              {isSaving
                ? t("Tallennetaan...", "Saving...")
                : t("Käytä osoitetta", "Use Address")
              }
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
