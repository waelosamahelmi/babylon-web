import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { useCreateOrder } from "@/hooks/use-orders";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { useBranches } from "@/hooks/use-branches";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Bike, ShoppingBag, CreditCard, Banknote, AlertTriangle, Smartphone, Wallet, Zap } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeliveryMap } from "@/components/delivery-map";
import { StructuredAddressInput } from "@/components/structured-address-input";
import { OrderSuccessModal } from "@/components/order-success-modal";
import { isBranchOrderingAvailable, getBranchNextOpeningTime } from "@/lib/branch-business-hours";

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
}

export function CheckoutModal({ isOpen, onClose, onBack }: CheckoutModalProps) {
  const { language, t } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { config, dbSettings } = useRestaurantSettings();
  const createOrder = useCreateOrder();
  
  // Load payment methods from database
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{
    id: string;
    nameFi: string;
    nameEn: string;
    enabled: boolean;
    icon?: string;
    requiresStripe?: boolean;
  }>>([
    { id: 'cash', nameFi: 'Käteinen', nameEn: 'Cash', enabled: true, icon: 'banknote' },
    { id: 'card', nameFi: 'Kortti', nameEn: 'Card', enabled: true, icon: 'credit-card' },
  ]);
  
  useEffect(() => {
    if (dbSettings?.payment_methods && Array.isArray(dbSettings.payment_methods)) {
      const enabledMethods = dbSettings.payment_methods.filter((m: any) => m.enabled);
      if (enabledMethods.length > 0) {
        setAvailablePaymentMethods(enabledMethods);
      }
    }
  }, [dbSettings]);

  // Check if selected payment method requires Stripe
  const isStripePaymentMethod = (methodId: string) => {
    return ['apple_pay', 'google_pay', 'stripe_link', 'klarna', 'ideal', 'sepa_debit'].includes(methodId);
  };
  
  // Check if ordering is available
  const [isOrderingAvailable, setIsOrderingAvailable] = useState(true);
  const [isPickupOpen, setIsPickupOpen] = useState(true);
  const [isDeliveryOpen, setIsDeliveryOpen] = useState(true);
  const [isRestaurantBusy, setIsRestaurantBusy] = useState(false);

  // Fetch toppings to resolve names
  const { data: allToppings = [] } = useQuery({
    queryKey: ['/api/toppings'],
    enabled: isOpen && items.some(item => item.toppings && item.toppings.length > 0)
  });

  // Fetch branches for branch selection
  const { data: branches = [], isLoading: branchesLoading } = useBranches();

  const activeBranches = branches?.filter((branch: any) => branch.is_active) || [];

  const getToppingName = (toppingId: string) => {
    const toppings = Array.isArray(allToppings) ? allToppings : [];
    const topping = toppings.find((t: any) => t.id.toString() === toppingId);
    return topping ? (language === "fi" ? topping.name : topping.nameEn) : toppingId;
  };

  const [formData, setFormData] = useState({
    customerName: "",
    customerPhone: "",
    customerEmail: "",
    deliveryAddress: "",
    streetAddress: "",
    postalCode: "",
    city: "",
    orderType: "delivery" as "delivery" | "pickup",
    branchId: null as number | null,
    paymentMethod: "cash",
    specialInstructions: "",
  });

  const [deliveryInfo, setDeliveryInfo] = useState<{
    fee: number;
    distance: number;
    address: string;
  } | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string>("");

  // Compute branch location using useMemo to ensure it updates properly
  const branchLocation = useMemo(() => {
    if (!formData.branchId || activeBranches.length === 0) return null;
    
    const branch = activeBranches.find((b: any) => b.id === formData.branchId);
    if (!branch) return null;
    
    return {
      lat: parseFloat(branch.latitude),
      lng: parseFloat(branch.longitude),
      name: language === "fi" ? branch.name : branch.name_en,
      address: `${branch.address}, ${branch.city}`
    };
  }, [formData.branchId, activeBranches, language]);

  // Log branch changes for debugging
  useEffect(() => {
    if (branchLocation) {
      console.log('Branch location computed:', branchLocation);
    }
  }, [branchLocation]);

  const handleAddressChange = (addressData: {
    streetAddress: string;
    postalCode: string;
    city: string;
    fullAddress: string;
  }) => {
    setFormData(prev => ({
      ...prev,
      streetAddress: addressData.streetAddress,
      postalCode: addressData.postalCode,
      city: addressData.city,
      deliveryAddress: addressData.fullAddress
    }));
    
    // Auto-detect branch based on city
    if (addressData.city && activeBranches.length > 0) {
      console.log('Detecting branch for city:', addressData.city);
      console.log('Available branches:', activeBranches.map((b: any) => ({ id: b.id, city: b.city })));
      const matchingBranch = activeBranches.find(
        (branch: any) => branch.city.toLowerCase() === addressData.city.toLowerCase()
      );
      if (matchingBranch) {
        console.log('Found matching branch:', matchingBranch.id, matchingBranch.name, matchingBranch.city);
        setFormData(prev => ({ ...prev, branchId: matchingBranch.id }));
      } else {
        console.log('No match found, using first branch:', activeBranches[0].id);
        // Default to first branch if no match
        setFormData(prev => ({ ...prev, branchId: activeBranches[0].id }));
      }
    }
  };

  const handleDeliveryCalculated = (fee: number, distance: number, address: string) => {
    setDeliveryInfo({ fee, distance, address });
    setFormData(prev => ({ ...prev, deliveryAddress: address }));
  };

  const calculateDeliveryFee = () => {
    if (formData.orderType !== "delivery") return 0;
    // Only return the calculated fee if delivery info exists, otherwise return 0
    return deliveryInfo?.fee ?? 0;
  };

  const deliveryFee = calculateDeliveryFee();
  
  // Calculate small order fee if total is less than 15 euros
  const MINIMUM_ORDER = 15.00;
  const smallOrderFee = totalPrice < MINIMUM_ORDER ? (MINIMUM_ORDER - totalPrice) : 0;
  
  const totalAmount = totalPrice + deliveryFee + smallOrderFee;
  const minimumOrderAmount = formData.orderType === "delivery" && 
    deliveryInfo && deliveryInfo.distance > 10 ? 20.00 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validate branch selection first
    if (activeBranches.length > 0 && !formData.branchId) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Valitse toimipiste", "Please select a branch"),
        variant: "destructive",
      });
      return;
    }

    // Get the selected branch
    const selectedBranch = activeBranches.find((b: any) => b.id === formData.branchId);

    // Check branch-specific business hours before processing order
    if (selectedBranch && !isBranchOrderingAvailable(selectedBranch)) {
      const nextOpening = getBranchNextOpeningTime(selectedBranch);
      const branchName = language === 'fi' ? selectedBranch.name : selectedBranch.name_en;

      toast({
        title: t("Ravintola suljettu", "Restaurant closed"),
        description: nextOpening
          ? t(
              `${branchName} on suljettu. Avautuu ${language === 'fi' ? nextOpening.day : nextOpening.dayEn} klo ${nextOpening.time}`,
              `${branchName} is closed. Opens ${nextOpening.dayEn} at ${nextOpening.time}`
            )
          : t(`${branchName} on suljettu`, `${branchName} is closed`),
        variant: "destructive",
      });
      return;
    }
    
    if (items.length === 0) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Lisää tuotteita koriin ensin", "Add items to cart first"),
        variant: "destructive",
      });
      return;
    }

    // Validate delivery address if order type is delivery
    if (formData.orderType === "delivery") {
      if (!formData.deliveryAddress || formData.deliveryAddress.trim() === "" || 
          !formData.streetAddress || formData.streetAddress.trim() === "" ||
          !formData.city || formData.city.trim() === "") {
        toast({
          title: t("Virhe", "Error"),
          description: t("Täydellinen toimitusosoite on pakollinen kotiinkuljetuksessa", "Complete delivery address is required for delivery orders"),
          variant: "destructive",
        });
        return;
      }
    }

    // Check minimum order amount for long distance delivery
    if (minimumOrderAmount > 0 && totalPrice < minimumOrderAmount) {
      toast({
        title: t("Virhe", "Error"),
        description: t(`Vähimmäistilaussumma tälle alueelle on ${minimumOrderAmount.toFixed(2)} €`, `Minimum order amount for this area is ${minimumOrderAmount.toFixed(2)} €`),
        variant: "destructive",
      });
      return;
    }

    try {
      const orderData = {
        ...formData,
        subtotal: totalPrice.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        smallOrderFee: smallOrderFee.toFixed(2),
        totalAmount: totalAmount.toFixed(2),
        items: items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
          toppings: item.toppings ? item.toppings.map(toppingId => {
            // Convert topping ID to topping object with name and price
            const topping = Array.isArray(allToppings) ? allToppings.find((t: any) => t.id.toString() === toppingId) : null;
            return topping ? { name: topping.name, price: topping.price } : { name: toppingId, price: "0" };
          }) : [],
          toppingsPrice: item.toppingsPrice || 0,
          sizePrice: item.sizePrice || 0,
          size: item.size || "normal",
        })),
      };

      const result = await createOrder.mutateAsync(orderData);
      
      // Store order number and show success modal
      setSuccessOrderNumber(result.orderNumber || result.id?.toString() || "");
      setShowSuccessModal(true);

      clearCart();
      onClose();
    } catch (error) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Tilauksen lähettäminen epäonnistui", "Failed to place order"),
        variant: "destructive",
      });
    }
  };

  const handleInputChange = (field: string, value: string) => {
    setFormData(prev => ({ 
      ...prev, 
      [field]: field === "orderType" ? value as "delivery" | "pickup" : value 
    }));
  };

  useEffect(() => {
    if (isOpen && config) {
      const checkAvailability = () => {
        // For now, assume ordering is available if config exists
        setIsOrderingAvailable(true);
        setIsPickupOpen(true);
        setIsDeliveryOpen(true);
        setIsRestaurantBusy(config.isBusy || false);
        
        console.log('🔍 Checkout: Checking availability', {
          isBusy: config.isBusy,
          isOrderingAvailable: true
        });
      };
      
      checkAvailability();
      
      // Check if restaurant is busy
      if (config.isBusy) {
        console.log('⚠️ Checkout: Restaurant is BUSY - closing modal');
        onClose();
        toast({
          title: t("ravintola on kiireinen", "Restaurant is busy"),
          description: t("Olemme tällä hetkellä todella kiireisiä. Yritä uudelleen hetken kuluttua.", "We're very busy right now. Please try again in a moment."),
          variant: "destructive"
        });
        return;
      }
      
      // If not available, close modal
      if (!isOrderingAvailable) {
        onClose();
        toast({
          title: t("Tilaukset suljettu", "Orders closed"),
          description: t("Verkkokauppa on suljettu", "Online ordering is closed"),
          variant: "destructive"
        });
      }
    }
  }, [isOpen, config, onClose, toast, t]);

  return (
    <>
      <Dialog open={isOpen} onOpenChange={onClose}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-4 sm:p-6">
          <DialogHeader>
            <DialogTitle className="text-xl sm:text-2xl font-semibold">
              {t("Tilauksen tiedot", "Order Details")}
            </DialogTitle>
          </DialogHeader>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Order Type Selection */}
          <div className="space-y-3">
            <Label className="text-sm font-medium">
              {t("Tilaustyyppi", "Order Type")}
            </Label>
            <RadioGroup
              value={formData.orderType}
              onValueChange={(value) => handleInputChange("orderType", value)}
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 sm:gap-4">
                <Label className={`flex items-center space-x-3 p-4 sm:p-3 border-2 rounded-lg transition-colors touch-manipulation ${
                  formData.orderType === "delivery" 
                    ? "border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600" 
                    : ""
                } ${
                  isDeliveryOpen 
                    ? "border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-500 dark:hover:border-green-600 active:bg-green-50 dark:active:bg-green-950" 
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60 cursor-not-allowed"
                }`}>
                  <RadioGroupItem 
                    value="delivery" 
                    className="text-green-600 dark:text-green-500 w-5 h-5" 
                    disabled={!isDeliveryOpen}
                  />
                  <div className="flex items-center space-x-2">
                    <Bike className={`w-6 h-6 sm:w-5 sm:h-5 ${isDeliveryOpen ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-gray-600"}`} />
                    <div className="flex flex-col">
                      <span className="font-medium text-base sm:text-sm dark:text-gray-100">
                        {t("Kotiinkuljetus", "Delivery")}
                      </span>
                      {!isDeliveryOpen && (
                        <span className="text-xs text-red-500 dark:text-red-400">
                          {t("Suljettu", "Closed")}
                        </span>
                      )}
                    </div>
                  </div>
                </Label>
                <Label className={`flex items-center space-x-3 p-4 sm:p-3 border-2 rounded-lg transition-colors touch-manipulation ${
                  formData.orderType === "pickup" 
                    ? "border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-600" 
                    : ""
                } ${
                  isPickupOpen 
                    ? "border-gray-200 dark:border-gray-700 cursor-pointer hover:border-green-500 dark:hover:border-green-600 active:bg-green-50 dark:active:bg-green-950" 
                    : "border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 opacity-60 cursor-not-allowed"
                }`}>
                  <RadioGroupItem 
                    value="pickup" 
                    className="text-green-600 dark:text-green-500 w-5 h-5" 
                    disabled={!isPickupOpen}
                  />
                  <div className="flex items-center space-x-2">
                    <ShoppingBag className={`w-6 h-6 sm:w-5 sm:h-5 ${isPickupOpen ? "text-green-600 dark:text-green-500" : "text-gray-400 dark:text-gray-600"}`} />
                    <div className="flex flex-col">
                      <span className="font-medium text-base sm:text-sm dark:text-gray-100">{t("Nouto", "Pickup")}</span>
                      {!isPickupOpen && (
                        <span className="text-xs text-red-500 dark:text-red-400">
                          {t("Suljettu", "Closed")}
                        </span>
                      )}
                    </div>
                  </div>
                </Label>
              </div>
            </RadioGroup>
          </div>

          {/* Branch Selection - shown for both delivery and pickup */}
          {activeBranches.length > 0 && (
            <div className="space-y-2">
              <Label htmlFor="branchId" className="text-base sm:text-sm">
                {formData.orderType === "delivery" 
                  ? t("Lähin toimipiste", "Nearest Branch")
                  : t("Noutopiste", "Pickup Location")
                } *
              </Label>
              <select
                id="branchId"
                required
                value={formData.branchId || ""}
                onChange={(e) => {
                  const value = e.target.value ? parseInt(e.target.value) : null;
                  setFormData(prev => ({ ...prev, branchId: value }));
                }}
                className="w-full h-12 sm:h-10 px-3 border border-gray-200 dark:border-gray-700 rounded-md bg-white dark:bg-gray-950 text-base"
              >
                <option value="">
                  {t("Valitse toimipiste", "Select branch")}
                </option>
                {activeBranches.map((branch: any) => (
                  <option key={branch.id} value={branch.id}>
                    {language === "fi" ? branch.name : branch.nameEn} - {branch.address}, {branch.city}
                  </option>
                ))}
              </select>
              {formData.orderType === "delivery" && (
                <p className="text-xs text-muted-foreground">
                  {t(
                    "Toimitusmaksu lasketaan valitun toimipisteen etäisyyden perusteella",
                    "Delivery fee is calculated based on distance from selected branch"
                  )}
                </p>
              )}
            </div>
          )}

          {/* Customer Information */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="customerName" className="text-base sm:text-sm">
                {t("Nimi", "Name")} *
              </Label>
              <Input
                id="customerName"
                required
                value={formData.customerName}
                onChange={(e) => handleInputChange("customerName", e.target.value)}
                className="h-12 sm:h-10 text-base"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="customerPhone" className="text-base sm:text-sm">
                {t("Puhelinnumero", "Phone Number")} *
              </Label>
              <Input
                id="customerPhone"
                type="tel"
                required
                value={formData.customerPhone}
                onChange={(e) => handleInputChange("customerPhone", e.target.value)}
                className="h-12 sm:h-10 text-base"
                inputMode="tel"
              />
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="customerEmail" className="text-base sm:text-sm">Email</Label>
            <Input
              id="customerEmail"
              type="email"
              value={formData.customerEmail}
              onChange={(e) => handleInputChange("customerEmail", e.target.value)}
              className="h-12 sm:h-10 text-base"
              inputMode="email"
            />
          </div>

          {/* Delivery Address with Structured Input */}
          {formData.orderType === "delivery" && (
            <>
              <StructuredAddressInput 
                onAddressChange={handleAddressChange}
                onDeliveryCalculated={handleDeliveryCalculated}
                initialAddress={formData.deliveryAddress}
                branchLocation={branchLocation}
              />
            </>
          )}

          {/* Special Instructions */}
          <div className="space-y-2">
            <Label htmlFor="specialInstructions" className="text-base sm:text-sm">
              {t("Erityisohjeet", "Special Instructions")}
            </Label>
            <Textarea
              id="specialInstructions"
              rows={3}
              placeholder={t("Kerro meille erityistoiveistasi...", "Tell us about your special requests...")}
              value={formData.specialInstructions}
              onChange={(e) => handleInputChange("specialInstructions", e.target.value)}
              className="text-base resize-none"
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-3">
            <Label className="text-base sm:text-sm font-medium">
              {t("Maksutapa", "Payment Method")}
            </Label>
            <RadioGroup
              value={formData.paymentMethod}
              onValueChange={(value) => handleInputChange("paymentMethod", value)}
            >
              <div className="space-y-3">
                {availablePaymentMethods.map((method) => {
                  // Dynamically select icon based on method.icon value and method ID
                  const PaymentIcon = 
                    method.icon === 'banknote' ? Banknote :
                    method.icon === 'credit-card' ? CreditCard :
                    method.icon === 'smartphone' ? Smartphone :
                    method.icon === 'wallet' ? Wallet :
                    // Specific icons for Stripe payment methods
                    method.id === 'apple_pay' ? Smartphone :
                    method.id === 'google_pay' ? Wallet :
                    method.id === 'stripe_link' ? Zap :
                    method.id === 'klarna' || method.id === 'ideal' || method.id === 'sepa_debit' ? CreditCard :
                    // Default icons for legacy data
                    method.id === 'cash' ? Banknote :
                    method.id === 'card' ? CreditCard : 
                    CreditCard;
                  
                  return (
                    <Label 
                      key={method.id}
                      className="flex items-center space-x-3 p-4 sm:p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-red-600 active:bg-gray-50 transition-colors touch-manipulation"
                    >
                      <RadioGroupItem value={method.id} className="text-red-600 w-5 h-5" />
                      <PaymentIcon className="w-6 h-6 sm:w-5 sm:h-5 text-blue-600" />
                      <span className="font-medium text-base sm:text-sm">
                        {language === "fi" ? method.nameFi : method.nameEn}
                      </span>
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>
          {/* Order Summary */}
          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {t("Tilauksen yhteenveto", "Order Summary")}
              </h4>
              <div className="space-y-2 mb-4">
                {items.map((item) => {
                  const basePrice = parseFloat(item.menuItem.price);
                  const toppingsPrice = item.toppingsPrice || 0;
                  const sizePrice = item.sizePrice || 0;
                  const totalItemPrice = (basePrice + toppingsPrice + sizePrice) * item.quantity;
                  return (
                    <div key={item.id} className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                      <span>
                        {language === "fi" ? item.menuItem.name : item.menuItem.nameEn} x {item.quantity}
                        {(toppingsPrice > 0 || sizePrice > 0) && (
                          <span className="text-gray-500 dark:text-gray-400 text-xs block">
                            {toppingsPrice > 0 && `${t("+ lisätäytteet", "+ extras")}: €${toppingsPrice.toFixed(2)}`}
                            {sizePrice > 0 && `${t("+ koko", "+ size")}: €${sizePrice.toFixed(2)}`}
                          </span>
                        )}
                      </span>
                      <span>€{totalItemPrice.toFixed(2)}</span>
                    </div>
                  );
                })}
                {formData.orderType === "delivery" && deliveryFee > 0 && (
                  <div className="flex justify-between text-sm text-gray-700 dark:text-gray-300">
                    <span>{t("Kuljetusmaksu", "Delivery fee")}</span>
                    <span>€{deliveryFee.toFixed(2)}</span>
                  </div>
                )}
                {smallOrderFee > 0 && (
                  <div className="flex justify-between text-sm text-amber-600 dark:text-amber-400">
                    <span>{t("Pientilauslisä", "Small order fee")}</span>
                    <span>€{smallOrderFee.toFixed(2)}</span>
                  </div>
                )}
              </div>
              {smallOrderFee > 0 && (
                <div className="mb-3 p-2 bg-amber-50 dark:bg-amber-900/20 rounded text-amber-800 dark:text-amber-200 text-sm">
                  {t(
                    `Vähimmäistilaus on ${MINIMUM_ORDER.toFixed(2)}€. Pientilauslisä ${smallOrderFee.toFixed(2)}€ lisätty.`,
                    `Minimum order is €${MINIMUM_ORDER.toFixed(2)}. Small order fee of €${smallOrderFee.toFixed(2)} added.`
                  )}
                </div>
              )}
              <Separator className="my-3" />
              <div className="flex justify-between items-center text-lg font-semibold text-gray-900 dark:text-gray-100">
                <span>{t("Yhteensä:", "Total:")}</span>
                <span className="text-red-600 dark:text-red-400">€{totalAmount.toFixed(2)}</span>
              </div>
            </CardContent>
          </Card>

          {/* Business Hours Alert */}
          {!isOrderingAvailable && (
            <div className="p-4 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg mt-4">
              <div className="flex items-center space-x-3">
                <AlertTriangle className="w-5 h-5 text-red-600 dark:text-red-400" />
                <p className="text-sm text-red-600 dark:text-red-400">
                  {t("Verkkotilaus ei ole käytössä tällä hetkellä.", "Online ordering is not available at the moment.")}
                </p>
              </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-4 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={onBack}
              className="w-full sm:flex-1 h-12 sm:h-10 text-base sm:text-sm touch-manipulation"
            >
              {t("Takaisin", "Back")}
            </Button>
            <Button
              type="submit"
              className="w-full sm:flex-1 h-12 sm:h-10 text-base sm:text-sm bg-red-600 hover:bg-red-700 active:bg-red-800 text-white touch-manipulation"
              disabled={createOrder.isPending || !isOrderingAvailable}
            >
              {createOrder.isPending 
                ? t("Lähetetään...", "Placing order...")
                : t("Lähetä tilaus", "Place Order")
              }
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>

    {/* Order Success Modal */}
    <OrderSuccessModal 
      isOpen={showSuccessModal}
      onClose={() => setShowSuccessModal(false)}
      orderType={formData.orderType}
      orderNumber={successOrderNumber}
    />
  </>
  );
}
