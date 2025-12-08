import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ShoppingCart, Plus, Minus, Trash2 } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

interface CartModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCheckout: () => void;
}

export function CartModal({ isOpen, onClose, onCheckout }: CartModalProps) {
  const { language, t } = useLanguage();
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  // Fetch toppings to resolve names
  const { data: allToppings = [] } = useQuery({
    queryKey: ['/api/toppings'],
    enabled: isOpen && items.some(item => item.toppings && item.toppings.length > 0)
  });

  const getToppingName = (toppingId: string) => {
    const toppings = Array.isArray(allToppings) ? allToppings : [];
    const topping = toppings.find((t: any) => t.id.toString() === toppingId);
    return topping ? (language === "fi" ? topping.name : topping.nameEn) : toppingId;
  };

  const handleCheckout = () => {
    if (items.length === 0) return;
    onClose();
    onCheckout();
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-md max-h-[90vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle className="flex items-center space-x-2">
            <ShoppingCart className="w-5 h-5" />
            <span>{t("Ostoskori", "Shopping Cart")}</span>
          </DialogTitle>
        </DialogHeader>

        <div className="max-h-96 overflow-y-auto">
          {items.length === 0 ? (
            <div className="text-center text-gray-500 dark:text-gray-400 py-8">
              <ShoppingCart className="w-16 h-16 mx-auto mb-4 text-gray-300 dark:text-gray-600" />
              <p>{t("Ostoskorisi on tyhjä", "Your cart is empty")}</p>
            </div>
          ) : (
            <div className="space-y-4">
              {items.map((item) => {
                const hasConditionalPricing = item.menuItem.hasConditionalPricing;
                const includedToppingsCount = item.menuItem.includedToppingsCount || 0;
                const toppingCount = item.toppings?.length || 0;
                const extraToppings = Math.max(0, toppingCount - includedToppingsCount);
                const basePrice = parseFloat(item.menuItem.offerPrice || item.menuItem.price);
                const itemTotalPrice = (basePrice + (item.toppingsPrice || 0) + (item.sizePrice || 0)) * item.quantity;
                
                return (
                <div key={item.id} className="flex justify-between items-center p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <h4 className="font-medium text-gray-900 dark:text-gray-100">
                        {language === "fi" ? item.menuItem.name : item.menuItem.nameEn}
                      </h4>
                      {hasConditionalPricing && includedToppingsCount > 0 && (
                        <Badge className="bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100 text-xs">
                          {includedToppingsCount} {t("täytettä", "toppings")}
                        </Badge>
                      )}
                    </div>
                    <p className="text-gray-600 dark:text-gray-400 text-sm">
                      €{basePrice.toFixed(2)} x {item.quantity}
                    </p>
                    {item.size && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {t("Koko:", "Size:")} {item.size}
                      </p>
                    )}
                    {item.toppings && item.toppings.length > 0 && (
                      <div className="mt-2 space-y-1">
                        {hasConditionalPricing && includedToppingsCount > 0 ? (
                          <>
                            <p className="text-green-600 dark:text-green-400 text-xs font-medium">
                              ✓ {t("Valitut täytteet:", "Selected toppings:")} {Math.min(toppingCount, includedToppingsCount)}/{includedToppingsCount}
                            </p>
                            <p className="text-gray-500 dark:text-gray-400 text-xs">
                              {item.toppings.map(getToppingName).join(", ")}
                            </p>
                            {extraToppings > 0 && (
                              <p className="text-amber-600 dark:text-amber-400 text-xs">
                                +{extraToppings} {t("lisätäyte", "extra")} (+€{(item.toppingsPrice || 0).toFixed(2)})
                              </p>
                            )}
                          </>
                        ) : (
                          <p className="text-gray-500 dark:text-gray-400 text-xs">
                            {t("Lisätäytteet:", "Toppings:")} {item.toppings.map(getToppingName).join(", ")}
                          </p>
                        )}
                      </div>
                    )}
                    {item.specialInstructions && (
                      <p className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                        {t("Erityisohjeet:", "Special instructions:")}{" "}
                        {item.specialInstructions}
                      </p>
                    )}
                    {/* Show item total price */}
                    <p className="text-gray-700 dark:text-gray-300 text-sm font-medium mt-2">
                      {t("Yhteensä:", "Total:")} €{itemTotalPrice.toFixed(2)}
                    </p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity - 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-8 text-center text-sm">{item.quantity}</span>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => updateQuantity(item.id, item.quantity + 1)}
                      className="w-8 h-8 p-0"
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      onClick={() => removeItem(item.id)}
                      className="w-8 h-8 p-0 ml-2"
                    >
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </div>
              )})}
            </div>
          )}
        </div>

        {items.length > 0 && (
          <>
            <Separator />
            <div className="space-y-4">
              <div className="flex justify-between items-center text-lg font-semibold">
                <span>{t("Yhteensä:", "Total:")}</span>
                <span className="text-red-600">€{totalPrice.toFixed(2)}</span>
              </div>
              <Button
                onClick={handleCheckout}
                className="w-full bg-red-600 hover:bg-red-700 text-white font-semibold py-3"
              >
                {t("Siirry kassalle", "Proceed to Checkout")}
              </Button>
            </div>
          </>
        )}
      </DialogContent>
    </Dialog>
  );
}
