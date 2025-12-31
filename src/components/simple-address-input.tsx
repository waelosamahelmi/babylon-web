import { useState, useEffect, useCallback, useRef } from "react";
import { useLanguage } from "@/lib/language-context";
import { useRestaurant } from "@/lib/restaurant-context";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Loader2, MapPin, Truck, CheckCircle, AlertCircle } from "lucide-react";
import { calculateDistance, calculateDeliveryFee, getDeliveryZone, getRestaurantLocation, isWithinFinland } from "@/lib/map-utils";

interface SimpleAddressInputProps {
  onAddressChange: (addressData: {
    streetAddress: string;
    postalCode: string;
    city: string;
    fullAddress: string;
  }) => void;
  onDeliveryCalculated: (fee: number, distance: number, address: string) => void;
  initialAddress?: string;
  branchLocation?: { lat: number; lng: number; address?: string; name?: string } | null;
}

interface AddressSuggestion {
  display_name: string;
  lat: string;
  lon: string;
  address: {
    road?: string;
    street?: string;
    house_number?: string;
    postcode?: string;
    city?: string;
    town?: string;
    village?: string;
    municipality?: string;
  };
}

export function SimpleAddressInput({
  onAddressChange,
  onDeliveryCalculated,
  initialAddress = "",
  branchLocation
}: SimpleAddressInputProps) {
  const { t } = useLanguage();
  const { config } = useRestaurant();
  
  const [streetAddress, setStreetAddress] = useState("");
  const [postalCode, setPostalCode] = useState("");
  const [city, setCity] = useState("");
  const [suggestions, setSuggestions] = useState<AddressSuggestion[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [deliveryInfo, setDeliveryInfo] = useState<{
    fee: number;
    distance: number;
    zone: string;
  } | null>(null);
  const [error, setError] = useState("");
  
  const searchTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const streetInputRef = useRef<HTMLInputElement>(null);

  // Parse initial address if provided
  useEffect(() => {
    if (initialAddress) {
      parseAddress(initialAddress);
    }
  }, [initialAddress]);

  const parseAddress = (address: string) => {
    // Simple Finnish address parsing: "Street 123, 12345 City"
    const match = address.match(/^(.+?),\s*(\d{5})\s+(.+)$/);
    if (match) {
      setStreetAddress(match[1].trim());
      setPostalCode(match[2]);
      setCity(match[3].trim());
    } else {
      setStreetAddress(address);
    }
  };

  // Build full address from fields
  const buildFullAddress = useCallback(() => {
    let full = streetAddress;
    if (postalCode && city) {
      full += `, ${postalCode} ${city}`;
    } else if (city) {
      full += `, ${city}`;
    }
    return full;
  }, [streetAddress, postalCode, city]);

  // Notify parent of address changes
  useEffect(() => {
    if (streetAddress || city) {
      onAddressChange({
        streetAddress,
        postalCode,
        city,
        fullAddress: buildFullAddress()
      });
    }
  }, [streetAddress, postalCode, city, buildFullAddress, onAddressChange]);

  // Auto-calculate delivery when address is complete
  useEffect(() => {
    if (streetAddress && postalCode && city) {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
      searchTimeoutRef.current = setTimeout(() => {
        calculateDelivery();
      }, 800);
    }
    return () => {
      if (searchTimeoutRef.current) {
        clearTimeout(searchTimeoutRef.current);
      }
    };
  }, [streetAddress, postalCode, city]);

  const calculateDelivery = async () => {
    if (!config || !streetAddress || !city) return;
    
    setIsLoading(true);
    setError("");
    
    const fullAddress = buildFullAddress();
    const RESTAURANT_LOCATION = branchLocation 
      ? { lat: branchLocation.lat, lng: branchLocation.lng }
      : getRestaurantLocation(config);

    try {
      // Geocode the address
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
            setError(t("Toimitus vain Suomessa", "Delivery only in Finland"));
            setIsLoading(false);
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
            setError(t("Osoite on toimitus-alueen ulkopuolella", "Address is outside delivery area"));
            setIsLoading(false);
            return;
          }

          setDeliveryInfo({
            distance: Math.round(distance * 10) / 10,
            fee: Number(fee.toFixed(2)),
            zone: zone.description
          });
          
          onDeliveryCalculated(Number(fee.toFixed(2)), Math.round(distance * 10) / 10, fullAddress);
        } else {
          // Address not found, use minimum fee
          const minFee = config?.delivery?.zones?.[0]?.fee || 3.00;
          setDeliveryInfo({
            distance: 0,
            fee: minFee,
            zone: t("Vahvistetaan tilauksessa", "Confirmed on order")
          });
          onDeliveryCalculated(minFee, 0, fullAddress);
        }
      }
    } catch (err) {
      console.error('Delivery calculation error:', err);
      const minFee = config?.delivery?.zones?.[0]?.fee || 3.00;
      onDeliveryCalculated(minFee, 0, fullAddress);
    } finally {
      setIsLoading(false);
    }
  };

  // Fetch address suggestions for street input
  const fetchSuggestions = async (query: string) => {
    if (!query || query.length < 3) {
      setSuggestions([]);
      return;
    }

    try {
      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?` +
        `format=json&q=${encodeURIComponent(query + (city ? ', ' + city : '') + ', Finland')}` +
        `&countrycodes=fi&limit=5&addressdetails=1`,
        {
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'babylonRestaurant/1.0'
          }
        }
      );
      
      if (response.ok) {
        const data: AddressSuggestion[] = await response.json();
        setSuggestions(
          data.filter(item => 
            item.address && 
            (item.address.road || item.address.street)
          ).slice(0, 4)
        );
      }
    } catch (err) {
      console.warn('Suggestion fetch failed:', err);
    }
  };

  const handleStreetChange = (value: string) => {
    setStreetAddress(value);
    setDeliveryInfo(null);
    
    // Debounce suggestions
    if (searchTimeoutRef.current) {
      clearTimeout(searchTimeoutRef.current);
    }
    searchTimeoutRef.current = setTimeout(() => {
      fetchSuggestions(value);
      setShowSuggestions(true);
    }, 400);
  };

  const selectSuggestion = (suggestion: AddressSuggestion) => {
    const addr = suggestion.address;
    
    const street = [
      addr.house_number,
      addr.road || addr.street
    ].filter(Boolean).join(' ').trim();
    
    setStreetAddress(street);
    setPostalCode(addr.postcode || '');
    setCity(addr.city || addr.town || addr.village || addr.municipality || '');
    setSuggestions([]);
    setShowSuggestions(false);
  };

  const handlePostalChange = (value: string) => {
    const cleaned = value.replace(/\D/g, '').slice(0, 5);
    setPostalCode(cleaned);
    setDeliveryInfo(null);
  };

  const handleCityChange = (value: string) => {
    setCity(value);
    setDeliveryInfo(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <MapPin className="w-5 h-5 text-red-500" />
        <span className="font-medium text-sm">
          {t("Toimitusosoite", "Delivery Address")}
        </span>
      </div>

      {/* Street Address with Autocomplete */}
      <div className="relative">
        <Label htmlFor="street" className="text-sm">
          {t("Katuosoite", "Street Address")} *
        </Label>
        <Input
          ref={streetInputRef}
          id="street"
          placeholder={t("esim. Kauppakatu 5 B 12", "e.g. Main Street 5 B 12")}
          value={streetAddress}
          onChange={(e) => handleStreetChange(e.target.value)}
          onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
          className="mt-1"
          autoComplete="off"
        />
        
        {/* Suggestions Dropdown */}
        {showSuggestions && suggestions.length > 0 && (
          <div className="absolute z-50 w-full mt-1 bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-600 rounded-lg shadow-lg max-h-48 overflow-y-auto">
            {suggestions.map((suggestion, index) => (
              <button
                key={index}
                type="button"
                className="w-full px-3 py-2 text-left text-sm hover:bg-gray-100 dark:hover:bg-stone-700 transition-colors first:rounded-t-lg last:rounded-b-lg"
                onClick={() => selectSuggestion(suggestion)}
              >
                <span className="font-medium">
                  {suggestion.address.house_number} {suggestion.address.road || suggestion.address.street}
                </span>
                <span className="text-gray-500 dark:text-gray-400 ml-2">
                  {suggestion.address.postcode} {suggestion.address.city || suggestion.address.town || suggestion.address.municipality}
                </span>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* Postal Code and City on same row */}
      <div className="grid grid-cols-5 gap-3">
        <div className="col-span-2">
          <Label htmlFor="postal" className="text-sm">
            {t("Postinumero", "Postal Code")} *
          </Label>
          <Input
            id="postal"
            placeholder="00100"
            value={postalCode}
            onChange={(e) => handlePostalChange(e.target.value)}
            className="mt-1"
            maxLength={5}
            inputMode="numeric"
          />
        </div>
        <div className="col-span-3">
          <Label htmlFor="city" className="text-sm">
            {t("Kaupunki", "City")} *
          </Label>
          <Input
            id="city"
            placeholder={t("esim. Helsinki", "e.g. Helsinki")}
            value={city}
            onChange={(e) => handleCityChange(e.target.value)}
            className="mt-1"
          />
        </div>
      </div>

      {/* Delivery Info Card */}
      {(isLoading || deliveryInfo || error) && (
        <div className={`p-3 rounded-lg border ${
          error 
            ? 'bg-red-50 dark:bg-red-950/30 border-red-200 dark:border-red-800' 
            : 'bg-green-50 dark:bg-green-950/30 border-green-200 dark:border-green-800'
        }`}>
          {isLoading ? (
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <Loader2 className="w-4 h-4 animate-spin" />
              {t("Lasketaan toimitusmaksua...", "Calculating delivery fee...")}
            </div>
          ) : error ? (
            <div className="flex items-center gap-2 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="w-4 h-4" />
              {error}
            </div>
          ) : deliveryInfo && (
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Truck className="w-4 h-4 text-green-600" />
                <span className="text-sm font-medium">
                  {t("Toimitusmaksu", "Delivery Fee")}:
                </span>
              </div>
              <div className="flex items-center gap-2">
                <Badge variant="secondary" className="bg-green-100 dark:bg-green-900 text-green-700 dark:text-green-300">
                  {deliveryInfo.fee.toFixed(2)}€
                </Badge>
                {deliveryInfo.distance > 0 && (
                  <span className="text-xs text-gray-500">
                    ({deliveryInfo.distance} km)
                  </span>
                )}
                <CheckCircle className="w-4 h-4 text-green-600" />
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
