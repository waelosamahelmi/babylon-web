import { useState, useEffect, useRef } from 'react';
import { useLanguage } from '@/lib/language-context';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { MapPin, Loader2, Search } from 'lucide-react';
import { cn } from '@/lib/utils';

interface AddressResult {
  streetAddress: string;
  postalCode: string;
  city: string;
  country?: string;
  fullAddress: string;
  latitude?: number;
  longitude?: number;
}

interface AddressAutocompleteProps {
  onAddressSelected: (address: AddressResult) => void;
  initialValue?: string;
  label?: string;
  placeholder?: string;
  countryCode?: string; // e.g., 'FI' for Finland
  className?: string;
}

export function AddressAutocomplete({
  onAddressSelected,
  initialValue = '',
  label,
  placeholder,
  countryCode = 'FI',
  className,
}: AddressAutocompleteProps) {
  const { t } = useLanguage();
  const [inputValue, setInputValue] = useState(initialValue);
  const [suggestions, setSuggestions] = useState<AddressResult[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [selectedIndex, setSelectedIndex] = useState(-1);
  const debounceTimer = useRef<NodeJS.Timeout>();
  const wrapperRef = useRef<HTMLDivElement>(null);

  // Close suggestions when clicking outside
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setShowSuggestions(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Fetch address suggestions using Nominatim (OpenStreetMap)
  const fetchAddressSuggestions = async (query: string) => {
    if (query.length < 3) {
      setSuggestions([]);
      return;
    }

    setIsLoading(true);

    try {
      // Using Nominatim (free, no API key required)
      const params = new URLSearchParams({
        q: query,
        format: 'json',
        addressdetails: '1',
        limit: '5',
        countrycodes: countryCode.toLowerCase(),
      });

      const response = await fetch(
        `https://nominatim.openstreetmap.org/search?${params}`,
        {
          headers: {
            'Accept-Language': 'fi,en',
          },
        }
      );

      if (!response.ok) {
        throw new Error('Failed to fetch addresses');
      }

      const data = await response.json();

      const results: AddressResult[] = data.map((item: any) => {
        const address = item.address || {};

        // Extract components
        const road = address.road || '';
        const houseNumber = address.house_number || '';
        const streetAddress = houseNumber ? `${road} ${houseNumber}` : road;
        const postalCode = address.postcode || '';
        const city = address.city || address.town || address.village || address.municipality || '';
        const country = address.country || '';

        return {
          streetAddress,
          postalCode,
          city,
          country,
          fullAddress: item.display_name,
          latitude: parseFloat(item.lat),
          longitude: parseFloat(item.lon),
        };
      });

      setSuggestions(results);
      setShowSuggestions(true);
    } catch (error) {
      console.error('Error fetching address suggestions:', error);
      setSuggestions([]);
    } finally {
      setIsLoading(false);
    }
  };

  // Handle input change with debouncing
  const handleInputChange = (value: string) => {
    setInputValue(value);
    setSelectedIndex(-1);

    // Clear existing timer
    if (debounceTimer.current) {
      clearTimeout(debounceTimer.current);
    }

    // Set new timer
    debounceTimer.current = setTimeout(() => {
      fetchAddressSuggestions(value);
    }, 300);
  };

  // Handle suggestion selection
  const handleSelectSuggestion = (address: AddressResult) => {
    setInputValue(address.fullAddress);
    setShowSuggestions(false);
    setSuggestions([]);
    onAddressSelected(address);
  };

  // Handle keyboard navigation
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!showSuggestions || suggestions.length === 0) return;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev < suggestions.length - 1 ? prev + 1 : prev
        );
        break;
      case 'ArrowUp':
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : -1));
        break;
      case 'Enter':
        e.preventDefault();
        if (selectedIndex >= 0 && selectedIndex < suggestions.length) {
          handleSelectSuggestion(suggestions[selectedIndex]);
        }
        break;
      case 'Escape':
        setShowSuggestions(false);
        break;
    }
  };

  return (
    <div ref={wrapperRef} className={cn('relative', className)}>
      {label && (
        <Label htmlFor="address-autocomplete" className="mb-2 flex items-center gap-2">
          <MapPin className="w-4 h-4" />
          {label}
        </Label>
      )}

      <div className="relative">
        <Input
          id="address-autocomplete"
          type="text"
          value={inputValue}
          onChange={(e) => handleInputChange(e.target.value)}
          onKeyDown={handleKeyDown}
          onFocus={() => {
            if (suggestions.length > 0) {
              setShowSuggestions(true);
            }
          }}
          placeholder={
            placeholder ||
            t(
              'Hae osoitetta...',
              'Search for address...',
              'ابحث عن عنوان...',
              'Поиск адреса...',
              'Sök adress...'
            )
          }
          className="pr-10"
        />
        <div className="absolute right-3 top-1/2 -translate-y-1/2">
          {isLoading ? (
            <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
          ) : (
            <Search className="w-4 h-4 text-gray-400" />
          )}
        </div>
      </div>

      {/* Suggestions dropdown */}
      {showSuggestions && suggestions.length > 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 rounded-xl shadow-2xl max-h-80 overflow-y-auto">
          {suggestions.map((address, index) => (
            <button
              key={index}
              type="button"
              onClick={() => handleSelectSuggestion(address)}
              className={cn(
                'w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-stone-700 transition-colors border-b border-gray-100 dark:border-stone-700 last:border-0',
                selectedIndex === index && 'bg-orange-50 dark:bg-orange-900/20'
              )}
            >
              <div className="flex items-start gap-3">
                <MapPin className="w-4 h-4 text-orange-500 dark:text-orange-400 flex-shrink-0 mt-1" />
                <div className="flex-1 min-w-0">
                  <p className="font-medium text-gray-900 dark:text-white truncate">
                    {address.streetAddress}
                  </p>
                  <p className="text-sm text-gray-600 dark:text-gray-400 truncate">
                    {address.postalCode} {address.city}
                    {address.country && `, ${address.country}`}
                  </p>
                </div>
              </div>
            </button>
          ))}
        </div>
      )}

      {/* No results message */}
      {showSuggestions && !isLoading && inputValue.length >= 3 && suggestions.length === 0 && (
        <div className="absolute z-50 w-full mt-2 bg-white dark:bg-stone-800 border border-gray-200 dark:border-stone-700 rounded-xl shadow-2xl p-4">
          <p className="text-sm text-gray-600 dark:text-gray-400 text-center">
            {t(
              'Osoitetta ei löytynyt',
              'No addresses found',
              'لم يتم العثور على عناوين',
              'Адреса не найдены',
              'Inga adresser hittades'
            )}
          </p>
        </div>
      )}

      {/* Helper text */}
      <p className="text-xs text-gray-500 dark:text-gray-400 mt-2">
        {t(
          'Aloita kirjoittamaan osoitetta saadaksesi ehdotuksia',
          'Start typing to get address suggestions',
          'ابدأ الكتابة للحصول على اقتراحات العنوان',
          'Начните вводить адрес для получения предложений',
          'Börja skriva för att få adressförslag'
        )}
      </p>
    </div>
  );
}
