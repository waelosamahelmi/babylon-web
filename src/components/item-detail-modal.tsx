import { useState, useEffect } from "react";
import { useLanguage } from "@/lib/language-context";
import { useQuery } from "@tanstack/react-query";
import { useToppingGroupsForItem } from "@/hooks/use-topping-groups";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Checkbox } from "@/components/ui/checkbox";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { Minus, Plus, X, Leaf, Heart, Wheat, ShoppingCart } from "lucide-react";

interface ItemDetailModalProps {
  item: any;
  isOpen: boolean;
  onClose: () => void;
  onAddToCart: (item: any, quantity: number, size?: string, toppings?: string[], specialInstructions?: string, toppingsPrice?: number, sizePrice?: number) => void;
}

export function ItemDetailModal({ item, isOpen, onClose, onAddToCart }: ItemDetailModalProps) {
  const { t } = useLanguage();
  const [quantity, setQuantity] = useState(1);
  const [selectedSize, setSelectedSize] = useState("normal");
  const [selectedToppings, setSelectedToppings] = useState<string[]>([]);
  const [specialInstructions, setSpecialInstructions] = useState("");
  const [radioGroupSelections, setRadioGroupSelections] = useState<Record<number, number>>({});

  // Fetch topping groups for this item (either category-specific or item-specific)
  const { data: toppingGroups } = useToppingGroupsForItem(item?.categoryId, item?.id);

  // Debug logging
  useEffect(() => {
    if (isOpen && item) {
      console.log('🔍 ItemDetailModal opened:', {
        itemName: item.name,
        itemId: item.id,
        categoryId: item.categoryId,
        toppingGroups: toppingGroups,
        toppingGroupsCount: toppingGroups?.length || 0
      });
    }
  }, [isOpen, item, toppingGroups]);

  // Fetch legacy toppings from API (fallback for old system when no topping groups exist)
  const hasToppingGroups = toppingGroups && toppingGroups.length > 0;
  const { data: allToppings = [] } = useQuery({
    queryKey: ['/api/toppings'],
    enabled: isOpen && !hasToppingGroups
  });

  // Legacy category detection (only used when no topping groups exist)
  // All detection now based on categoryId instead of name
  const isPizza = !hasToppingGroups && item?.categoryId === 6;
  const isKebab = !hasToppingGroups && (item?.categoryId === 2 || item?.categoryId === 3); // Adjust these IDs as needed
  const isChicken = !hasToppingGroups && item?.categoryId === 4; // Adjust this ID as needed
  const isBurger = !hasToppingGroups && item?.categoryId === 5; // Adjust this ID as needed
  const isSalad = !hasToppingGroups && item?.categoryId === 7; // Adjust this ID as needed
  const isChild = !hasToppingGroups && item?.categoryId === 8; // Adjust this ID as needed
  const isDrink = item?.categoryId === 9; // Adjust this ID as needed

  // State for radio selections
  const [selectedSauce, setSelectedSauce] = useState("");
  const [selectedDrink, setSelectedDrink] = useState("");
  const [selectedMealSize, setSelectedMealSize] = useState("");
  const basePrice = parseFloat(item?.offerPrice || item?.price || "0");
  const familySizeUpcharge = 8.00; // Family size costs 8€ more
  
  // Filter toppings by category based on product type
  const getFilteredToppings = () => {
    if (!Array.isArray(allToppings)) return { toppings: [], sauces: [], extras: [], spices: [] };
    
    if (isPizza) {
      // Pizza toppings - only show pizza category items
      const toppings = allToppings.filter((t: any) => t.category === 'pizza' && t.type === 'topping');
      const extras = allToppings.filter((t: any) => t.category === 'pizza' && t.type === 'extra');
      const spices = allToppings.filter((t: any) => t.category === 'pizza' && t.type === 'spice');
      return { toppings, sauces: [], extras, spices };
    }
    
    if (isKebab) {
      // Kebab options - sauces and limited extras
      const sauces = allToppings.filter((t: any) => t.category === 'kebab' && t.type === 'sauce');
      const extras = allToppings.filter((t: any) => t.category === 'kebab' && t.type === 'extra');
      return { toppings: [], sauces, extras, spices: [] };
    }
    
    if (isChicken) {
      // Chicken options - for wings show sauces, for regular chicken show extras
      const sauces = allToppings.filter((t: any) => t.category === 'hotwings' && t.type === 'sauce');
      const extras = allToppings.filter((t: any) => t.category === 'chicken' && t.type === 'extra');
      return { toppings: [], sauces, extras, spices: [] };
    }
    
    if (isBurger) {
      // Burger options - extras only
      const extras = allToppings.filter((t: any) => t.category === 'burger' && t.type === 'extra');
      return { toppings: [], sauces: [], extras, spices: [] };
    }
    
    if (isDrink) {
      // Drink sizes
      const sizes = allToppings.filter((t: any) => t.category === 'drink' && t.type === 'size');
      return { toppings: [], sauces: [], extras: [], spices: [], sizes };
    }
    
    return { toppings: [], sauces: [], extras: [], spices: [] };
  };

  const { toppings, sauces, extras, spices } = getFilteredToppings();

  // Calculate total price
  const sizePrice = selectedSize === "perhe" ? familySizeUpcharge : 0;
  const drinkPrice = isDrink && selectedSize === "0.5L" ? 0.60 : 
                   isDrink && selectedSize === "1.5L" ? 2.10 : 0;
  
  // Conditional pricing support: check if item has conditional pricing enabled
  const hasConditionalPricing = item?.hasConditionalPricing || false;
  const includedToppingsCount = item?.includedToppingsCount || 0;
  
  const toppingsPrice = selectedToppings.reduce((total, toppingId, index) => {
    const topping = Array.isArray(allToppings) ? allToppings.find((t: any) => t.id.toString() === toppingId) : null;
    if (!topping) return total;
    
    // Conditional pricing: if enabled, first N toppings are free
    if (hasConditionalPricing && index < includedToppingsCount) {
      return total; // This topping is included in base price
    }
    
    // Legacy support: Special rule for "Oma valinta" pizza (product ID 93): first 4 toppings are free
    if (item?.id === 93 && index < 4) {
      return total; // First 4 toppings are free
    }
    
    let toppingPrice = parseFloat(topping.price);
    
    // Special rule: if pizza size is "perhe" (family), all toppings are double-priced
    if (selectedSize === "perhe") {
      toppingPrice *= 2;
    }
    
    // Special rule: if pizza size is "large", toppings that cost €1.00 become €2.00
    if (selectedSize === "large" && Math.abs(toppingPrice - 1.00) < 0.01) {
      toppingPrice = 2.00;
    }
    
    return total + toppingPrice;
  }, 0);

  // Calculate price from radio group selections
  const radioGroupsPrice = Object.entries(radioGroupSelections).reduce((total, [groupId, toppingId]) => {
    if (!toppingGroups) return total;
    
    const groupAssignment = toppingGroups.find((g: any) => 
      (g.topping_groups || g.toppingGroups)?.id === parseInt(groupId)
    );
    const group = groupAssignment?.topping_groups || groupAssignment?.toppingGroups;
    if (!group) return total;
    
    const groupItems = group.topping_group_items || group.toppingGroupItems || [];
    const selectedItem = groupItems.find((gi: any) => 
      (gi.toppings || gi.topping)?.id === toppingId
    );
    const topping = selectedItem?.toppings || selectedItem?.topping;
    
    if (topping && topping.price) {
      return total + parseFloat(topping.price);
    }
    
    return total;
  }, 0);
  
  const totalPrice = (basePrice + sizePrice + drinkPrice + toppingsPrice + radioGroupsPrice) * quantity;

  useEffect(() => {
    if (isOpen) {
      setQuantity(1);
      setSelectedSize(isDrink ? "0.33L" : "normal");
      setSelectedToppings([]);
      setSpecialInstructions("");
      setRadioGroupSelections({});
      setSelectedSauce("");
      setSelectedDrink("");
      setSelectedMealSize("");
    }
  }, [isOpen, item, isDrink]);

  if (!item) return null;

  const handleToppingChange = (toppingId: string, checked: boolean) => {
    if (checked) {
      setSelectedToppings(prev => [...prev, toppingId]);
    } else {
      setSelectedToppings(prev => prev.filter(id => id !== toppingId));
    }
  };

  const handleAddToCart = () => {
    // Build special instructions with radio selections (NO toppings - those are handled separately)
    let instructions = "";
    
    // Add size information
    if (selectedSize && selectedSize !== "normal") {
      const sizeText = `Size: ${selectedSize}`;
      instructions = instructions ? `${instructions}; ${sizeText}` : sizeText;
    }
    
    // Add radio group selections
    if (toppingGroups && Object.keys(radioGroupSelections).length > 0) {
      Object.entries(radioGroupSelections).forEach(([groupId, toppingId]) => {
        const groupAssignment = toppingGroups.find((g: any) => 
          (g.topping_groups || g.toppingGroups)?.id === parseInt(groupId)
        );
        const group = groupAssignment?.topping_groups || groupAssignment?.toppingGroups;
        if (group) {
          const groupItems = group.topping_group_items || group.toppingGroupItems || [];
          const selectedItem = groupItems.find((gi: any) => 
            (gi.toppings || gi.topping)?.id === toppingId
          );
          const topping = selectedItem?.toppings || selectedItem?.topping;
          if (topping) {
            const selectionText = `${group.name}: ${topping.name}`;
            instructions = instructions ? `${instructions}; ${selectionText}` : selectionText;
          }
        }
      });
    }
    
    if (selectedSauce) {
      instructions = instructions ? `${instructions}; Kastike: ${selectedSauce}` : `Kastike: ${selectedSauce}`;
    }
    
    if (selectedDrink) {
      instructions = instructions ? `${instructions}; Juoma: ${selectedDrink}` : `Juoma: ${selectedDrink}`;
    }
    
    if (selectedMealSize) {
      instructions = instructions ? `${instructions}; ${selectedMealSize}` : selectedMealSize;
    }
    
    // Add any additional special instructions
    if (specialInstructions) {
      instructions = instructions ? `${instructions}; Special: ${specialInstructions}` : `Special: ${specialInstructions}`;
    }
    
    // Handle drink sizes for pricing
    const finalSize = isDrink ? selectedSize : (isPizza ? selectedSize : undefined);
    
    onAddToCart(
      item,
      quantity,
      finalSize,
      selectedToppings.length > 0 ? selectedToppings : undefined,
      instructions || undefined,
      toppingsPrice,
      sizePrice + drinkPrice + radioGroupsPrice
    );
  };

  const formatPrice = (price: number) => `${price.toFixed(2)} €`;

  // Helper function to calculate displayed topping price based on size
  const getDisplayToppingPrice = (originalPrice: number) => {
    let toppingPrice = originalPrice;
    
    // Special rule: if pizza size is "perhe" (family), all toppings are double-priced
    if (selectedSize === "perhe") {
      toppingPrice *= 2;
    }
    
    // Special rule: if pizza size is "large", toppings that cost €1.00 become €2.00
    if (selectedSize === "large" && Math.abs(toppingPrice - 1.00) < 0.01) {
      toppingPrice = 2.00;
    }
    
    return toppingPrice;
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex items-start justify-between">
            <DialogTitle className="text-xl font-bold pr-8">
              {item.name}
            </DialogTitle>
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="absolute right-4 top-4"
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </DialogHeader>

        <div className="space-y-6">
          {/* Item Image */}
          <div className="relative aspect-video rounded-lg overflow-hidden">
            <img
              src={item.imageUrl || "/placeholder-food.jpg"}
              alt={item.name}
              className="w-full h-full object-cover"
            />
            {item.offerPercentage && (
              <Badge className="absolute top-4 right-4 bg-red-500 text-white text-lg px-3 py-1">
                -{item.offerPercentage}%
              </Badge>
            )}
          </div>

          {/* Item Info */}
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              {item.isVegetarian && (
                <Badge variant="outline" className="text-green-600 border-green-600">
                  <Leaf className="w-3 h-3 mr-1" />
                  {t("Kasvisruoka", "Vegetarian")}
                </Badge>
              )}
              {item.isVegan && (
                <Badge variant="outline" className="text-green-700 border-green-700">
                  <Heart className="w-3 h-3 mr-1" />
                  {t("Vegaaninen", "Vegan")}
                </Badge>
              )}
              {item.isGlutenFree && (
                <Badge variant="outline" className="text-amber-600 border-amber-600">
                  <Wheat className="w-3 h-3 mr-1" />
                  {t("Gluteeniton", "Gluten-free")}
                </Badge>
              )}
            </div>

            {item.description && (
              <p className="text-gray-600 dark:text-gray-400 leading-relaxed">
                {item.description}
              </p>
            )}

            <div className="flex items-center space-x-3">
              {item.offerPrice ? (
                <>
                  <span className="text-2xl font-bold text-red-600">
                    {formatPrice(parseFloat(item.offerPrice))}
                  </span>
                  <span className="text-lg text-gray-500 line-through">
                    {formatPrice(parseFloat(item.price))}
                  </span>
                  <Badge className="bg-red-100 text-red-800 border-red-200">
                    {t("Tarjous", "Offer")}
                  </Badge>
                </>
              ) : (
                <span className="text-2xl font-bold text-gray-900 dark:text-white">
                  {formatPrice(basePrice)}
                </span>
              )}
            </div>

            {/* Conditional Pricing Highlight for "Your Choice" type items */}
            {hasConditionalPricing && includedToppingsCount > 0 && (
              <div className="mt-4 p-4 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/30 dark:to-emerald-900/30 border-2 border-green-300 dark:border-green-600 rounded-xl">
                <div className="flex items-center gap-3">
                  <div className="flex-shrink-0 w-12 h-12 bg-green-500 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-lg">{includedToppingsCount}</span>
                  </div>
                  <div>
                    <p className="font-bold text-green-800 dark:text-green-200 text-lg">
                      {t(
                        `${includedToppingsCount} täytettä valintasi mukaan!`,
                        `${includedToppingsCount} toppings of your choice!`
                      )}
                    </p>
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {t(
                        "Valitse suosikkitäytteesi alla olevasta listasta",
                        "Choose your favorite toppings from the list below"
                      )}
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Pizza Size Selection */}
          {isPizza && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {t("Valitse koko", "Choose Size")}
                </h3>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="normal" id="normal" />
                      <Label htmlFor="normal" className="font-medium">
                        {t("Normaali (Ø 30cm)", "Normal (Ø 30cm)")}
                      </Label>
                    </div>
                    <span className="text-sm text-gray-600">
                      {formatPrice(basePrice)}
                    </span>
                  </div>
                  <div className="flex items-center justify-between p-3 border rounded-lg">
                    <div className="flex items-center space-x-3">
                      <RadioGroupItem value="perhe" id="perhe" />
                      <Label htmlFor="perhe" className="font-medium">
                        {t("Perhekoko (Ø 42cm)", "Family Size (Ø 42cm)")}
                      </Label>
                    </div>
                    <span className="text-sm text-gray-600">
                      +{formatPrice(familySizeUpcharge)}
                    </span>
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Topping Groups System (New) */}
          {toppingGroups && toppingGroups.length > 0 && toppingGroups.map((groupAssignment: any) => {
            const group = groupAssignment.topping_groups;
            if (!group) {
              console.log('⚠️ No topping_groups found in:', groupAssignment);
              return null;
            }

            const groupItems = group.topping_group_items || [];
            console.log('🔍 Group:', group.name, 'Items:', groupItems.length, 'Selection type:', group.selection_type, 'Raw items:', groupItems);
            
            return (
              <div key={group.id} className="space-y-4">
                <Separator />
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    {group.name}
                    {group.is_required && <span className="text-red-500 ml-1">*</span>}
                  </h3>
                  {group.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-400 mb-3">
                      {group.description}
                    </p>
                  )}

                  {/* Radio Selection (min=1, max=1) */}
                  {group.selection_type === 'radio' && (
                    <RadioGroup 
                      value={radioGroupSelections[group.id]?.toString() || ""} 
                      onValueChange={(value) => {
                        setRadioGroupSelections(prev => ({
                          ...prev,
                          [group.id]: parseInt(value)
                        }));
                      }}
                    >
                      <div className="grid grid-cols-1 gap-3">
                        {groupItems.map((groupItem: any) => {
                          const topping = groupItem.toppings;
                          if (!topping) {
                            console.log('⚠️ No toppings found in groupItem:', groupItem);
                            return null;
                          }
                          
                          return (
                            <div key={topping.id} className="flex items-center justify-between p-3 border rounded-lg">
                              <div className="flex items-center space-x-3">
                                <RadioGroupItem value={topping.id.toString()} id={`radio-${group.id}-${topping.id}`} />
                                <Label htmlFor={`radio-${group.id}-${topping.id}`} className="font-medium">
                                  {topping.name}
                                </Label>
                              </div>
                              {parseFloat(topping.price) > 0 && (
                                <span className="text-sm text-gray-600">
                                  +{formatPrice(parseFloat(topping.price))}
                                </span>
                              )}
                            </div>
                          );
                        })}
                      </div>
                    </RadioGroup>
                  )}

                  {/* Checkbox Selection (min/max limits) */}
                  {group.selection_type === 'checkbox' && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupItems.map((groupItem: any) => {
                        const topping = groupItem.toppings;
                        if (!topping) {
                          console.log('⚠️ No toppings found in checkbox groupItem:', groupItem);
                          return null;
                        }

                        const isSelected = selectedToppings.includes(topping.id.toString());
                        const selectedCount = selectedToppings.filter((id) => 
                          groupItems.some((gi: any) => (gi.toppings || gi.topping)?.id.toString() === id)
                        ).length;
                        
                        const canSelect = !group.max_selections || selectedCount < group.max_selections;
                        
                        return (
                          <div key={topping.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`checkbox-${group.id}-${topping.id}`}
                                checked={isSelected}
                                disabled={!isSelected && !canSelect}
                                onCheckedChange={(checked) => {
                                  handleToppingChange(topping.id.toString(), !!checked);
                                }}
                              />
                              <Label 
                                htmlFor={`checkbox-${group.id}-${topping.id}`} 
                                className="font-medium cursor-pointer"
                              >
                                {topping.name}
                              </Label>
                            </div>
                            {parseFloat(topping.price) > 0 && (
                              <span className="text-sm text-gray-600">
                                +{formatPrice(parseFloat(topping.price))}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Default rendering when selection_type is undefined - use checkbox */}
                  {!group.selection_type && groupItems.length > 0 && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {groupItems.map((groupItem: any) => {
                        const topping = groupItem.toppings;
                        if (!topping) {
                          console.log('⚠️ No toppings found in default groupItem:', groupItem);
                          return null;
                        }

                        const isSelected = selectedToppings.includes(topping.id.toString());
                        
                        return (
                          <div key={topping.id} className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <Checkbox
                                id={`default-${group.id}-${topping.id}`}
                                checked={isSelected}
                                onCheckedChange={(checked) => {
                                  handleToppingChange(topping.id.toString(), !!checked);
                                }}
                              />
                              <Label 
                                htmlFor={`default-${group.id}-${topping.id}`} 
                                className="font-medium cursor-pointer"
                              >
                                {topping.name}
                              </Label>
                            </div>
                            {parseFloat(topping.price) > 0 && (
                              <span className="text-sm text-gray-600">
                                +{formatPrice(parseFloat(topping.price))}
                              </span>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Selection limits info */}
                  {group.selection_type === 'checkbox' && (group.min_selections || group.max_selections) && (
                    <p className="text-xs text-gray-500 mt-2">
                      {group.min_selections && group.max_selections ? (
                        t(
                          `Valitse ${group.min_selections}-${group.max_selections} vaihtoehtoa`,
                          `Select ${group.min_selections}-${group.max_selections} options`
                        )
                      ) : group.min_selections ? (
                        t(
                          `Valitse vähintään ${group.min_selections} vaihtoehtoa`,
                          `Select at least ${group.min_selections} options`
                        )
                      ) : (
                        t(
                          `Valitse enintään ${group.max_selections} vaihtoehtoa`,
                          `Select up to ${group.max_selections} options`
                        )
                      )}
                    </p>
                  )}
                </div>
              </div>
            );
          })}

          {/* Category-specific options */}
          {isDrink && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {t("Koko", "Size")} <span className="text-red-500">*</span>
                </h3>
                <RadioGroup value={selectedSize} onValueChange={setSelectedSize}>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="0.33L" id="033l" />
                        <Label htmlFor="033l" className="font-medium">0,33L</Label>
                      </div>
                    </div>
                    {!item?.name?.toLowerCase().includes('fanta') && (
                      <>
                        <div className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value="0.5L" id="05l" />
                            <Label htmlFor="05l" className="font-medium">0,5L</Label>
                          </div>
                          <span className="text-sm text-gray-600">+€0,60</span>
                        </div>
                        {item?.name?.toLowerCase().includes('coca') && (
                          <div className="flex items-center justify-between p-3 border rounded-lg">
                            <div className="flex items-center space-x-3">
                              <RadioGroupItem value="1.5L" id="15l" />
                              <Label htmlFor="15l" className="font-medium">1,5L</Label>
                            </div>
                            <span className="text-sm text-gray-600">+€2,10</span>
                          </div>
                        )}
                      </>
                    )}
                    {item?.name?.toLowerCase().includes('fanta') && (
                      <div className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value="0.5L" id="05l" />
                          <Label htmlFor="05l" className="font-medium">0,5L</Label>
                        </div>
                        <span className="text-sm text-gray-600">+€0,60</span>
                      </div>
                    )}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Kebab sauce options */}
          {isKebab && sauces.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {t("Kastikevaihtoehto", "Sauce Option")} <span className="text-red-500">*</span>
                </h3>
                <RadioGroup value={selectedSauce} onValueChange={setSelectedSauce}>
                  <div className="grid grid-cols-1 gap-3">
                    {sauces.map((sauce: any) => (
                      <div key={sauce.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={sauce.name} id={sauce.id.toString()} />
                          <Label htmlFor={sauce.id.toString()} className="font-medium">{sauce.name}</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Hot wings sauce */}
          {isChicken && item?.name?.toLowerCase().includes('wing') && sauces.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {t("Kastike", "Sauce")} <span className="text-red-500">*</span>
                </h3>
                <RadioGroup value={selectedSauce} onValueChange={setSelectedSauce}>
                  <div className="grid grid-cols-1 gap-3">
                    {sauces.map((sauce: any) => (
                      <div key={sauce.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <RadioGroupItem value={sauce.name} id={sauce.id.toString()} />
                          <Label htmlFor={sauce.id.toString()} className="font-medium">{sauce.name}</Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </RadioGroup>
              </div>
            </div>
          )}

          {/* Burger meal and drink options */}
          {isBurger && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {t("Koko", "Size")} <span className="text-red-500">*</span>
                </h3>
                <RadioGroup value={selectedMealSize} onValueChange={setSelectedMealSize}>
                  <div className="grid grid-cols-1 gap-3">
                    <div className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <RadioGroupItem value="ateria" id="ateria" />
                        <Label htmlFor="ateria" className="font-medium">Ateria (Ranskalaiset + 0,33L)</Label>
                      </div>
                    </div>
                  </div>
                </RadioGroup>
              </div>
              
              {selectedMealSize === "ateria" && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    {t("Juoma", "Drink")} <span className="text-red-500">*</span>
                  </h3>
                  <RadioGroup value={selectedDrink} onValueChange={setSelectedDrink}>
                    <div className="grid grid-cols-1 gap-3">
                      {["Coca Cola 0,33l", "Coca Cola Zero 0,33l", "Fanta 0,33l"].map((drink) => (
                        <div key={drink} className="flex items-center justify-between p-3 border rounded-lg">
                          <div className="flex items-center space-x-3">
                            <RadioGroupItem value={drink} id={drink} />
                            <Label htmlFor={drink} className="font-medium">{drink}</Label>
                          </div>
                        </div>
                      ))}
                    </div>
                  </RadioGroup>
                </div>
              )}
            </div>
          )}

          {/* Pizza toppings */}
          {isPizza && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {t("Lisätäytteet", "Pizza Toppings")}
                  {(hasConditionalPricing && includedToppingsCount > 0) && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      {t(
                        `(${includedToppingsCount} ensimmäistä ilmaista)`, 
                        `(First ${includedToppingsCount} free)`
                      )}
                    </span>
                  )}
                  {/* Legacy support for Oma valinta pizza */}
                  {item?.id === 93 && !hasConditionalPricing && (
                    <span className="text-sm font-normal text-green-600 ml-2">
                      {t("(4 ensimmäistä ilmaista)", "(First 4 free)")}
                    </span>
                  )}
                </h3>
                
                {/* Enhanced Conditional pricing progress tracker */}
                {hasConditionalPricing && includedToppingsCount > 0 && (
                  <div className="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border-2 border-green-300 dark:border-green-600 rounded-xl p-4 mb-4">
                    <div className="flex items-center justify-between mb-3">
                      <span className="font-bold text-green-800 dark:text-green-200">
                        🎉 {t("Valitse täytteesi", "Choose your toppings")}
                      </span>
                      <Badge className={`text-sm px-3 py-1 ${
                        selectedToppings.length >= includedToppingsCount 
                          ? 'bg-green-600 text-white' 
                          : 'bg-green-100 text-green-800 dark:bg-green-800 dark:text-green-100'
                      }`}>
                        {selectedToppings.length} / {includedToppingsCount}
                      </Badge>
                    </div>
                    
                    {/* Progress bar */}
                    <div className="w-full bg-green-200 dark:bg-green-700 rounded-full h-3 mb-3">
                      <div 
                        className="bg-green-600 h-3 rounded-full transition-all duration-300"
                        style={{ width: `${Math.min(100, (selectedToppings.length / includedToppingsCount) * 100)}%` }}
                      />
                    </div>
                    
                    <p className="text-sm text-green-700 dark:text-green-300">
                      {selectedToppings.length < includedToppingsCount ? (
                        <>
                          {t(
                            `Valitse vielä ${includedToppingsCount - selectedToppings.length} täytettä (ilmaista!)`,
                            `Select ${includedToppingsCount - selectedToppings.length} more toppings (free!)`
                          )}
                        </>
                      ) : selectedToppings.length === includedToppingsCount ? (
                        <>
                          ✅ {t("Kaikki ilmaiset täytteet valittu!", "All free toppings selected!")}
                        </>
                      ) : (
                        <>
                          {t(
                            `${selectedToppings.length - includedToppingsCount} lisätäyte(ttä) (+€1/kpl)`,
                            `${selectedToppings.length - includedToppingsCount} extra topping(s) (+€1 each)`
                          )}
                        </>
                      )}
                    </p>
                  </div>
                )}
                
                {/* Legacy: Free toppings info for Oma valinta pizza (product ID 93) */}
                {item?.id === 93 && !hasConditionalPricing && (
                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-700 rounded-lg p-3 mb-4">
                    <p className="text-sm text-green-800 dark:text-green-200">
                      <span className="font-semibold">🎉 {t("Erikoistarjous!", "Special offer!")}</span>{" "}
                      {t(
                        "Valitse 4 ensimmäistä lisätäytettä ilmaiseksi! Lisätäytteet sen jälkeen normaalihintaan.",
                        "Choose your first 4 toppings for free! Additional toppings after that at regular price."
                      )}
                    </p>
                    {selectedToppings.length > 0 && (
                      <p className="text-xs text-green-700 dark:text-green-300 mt-1">
                        {t(
                          `Valittu: ${selectedToppings.length} lisätäytettä (${Math.max(0, 4 - selectedToppings.length)} ilmaista jäljellä)`,
                          `Selected: ${selectedToppings.length} toppings (${Math.max(0, 4 - selectedToppings.length)} free remaining)`
                        )}
                      </p>
                    )}
                  </div>
                )}
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {toppings.map((topping: any, index: number) => {
                    const toppingIndex = selectedToppings.indexOf(topping.id.toString());
                    
                    // Check if topping is free based on conditional pricing
                    const isFreeConditional = hasConditionalPricing && toppingIndex !== -1 && toppingIndex < includedToppingsCount;
                    
                    // Legacy support: check if free for Oma valinta pizza
                    const isFreeForOmaValinta = item?.id === 93 && !hasConditionalPricing && toppingIndex !== -1 && toppingIndex < 4;
                    
                    const isFree = isFreeConditional || isFreeForOmaValinta;
                    
                    return (
                      <div key={topping.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={topping.id.toString()}
                            checked={selectedToppings.includes(topping.id.toString())}
                            onCheckedChange={(checked) => handleToppingChange(topping.id.toString(), !!checked)}
                          />
                          <Label htmlFor={topping.id.toString()} className="font-medium cursor-pointer">
                            {topping.name}
                          </Label>
                        </div>
                        <span className="text-sm text-gray-600">
                          {isFree ? (
                            <span className="text-green-600 font-medium">
                              {t("Ilmainen", "Free")}
                            </span>
                          ) : (
                            `+${formatPrice(getDisplayToppingPrice(parseFloat(topping.price)))}`
                          )}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* Pizza extras */}
              {extras.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    {t("Extrat", "Extras")}
                  </h3>
                  <div className="grid grid-cols-1 gap-3">
                    {extras.map((extra: any) => (
                      <div key={extra.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={extra.id.toString()}
                            checked={selectedToppings.includes(extra.id.toString())}
                            onCheckedChange={(checked) => handleToppingChange(extra.id.toString(), !!checked)}
                          />
                          <Label htmlFor={extra.id.toString()} className="font-medium cursor-pointer">
                            {extra.name}
                          </Label>
                        </div>
                        <span className="text-sm text-gray-600">
                          +{formatPrice(getDisplayToppingPrice(parseFloat(extra.price)))}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Pizza spices */}
              {spices.length > 0 && (
                <div>
                  <h3 className="font-semibold text-lg mb-3">
                    {t("Mausteet", "Spices")}
                  </h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    {spices.map((spice: any) => (
                      <div key={spice.id} className="flex items-center justify-between p-3 border rounded-lg">
                        <div className="flex items-center space-x-3">
                          <Checkbox
                            id={spice.id.toString()}
                            checked={selectedToppings.includes(spice.id.toString())}
                            onCheckedChange={(checked) => handleToppingChange(spice.id.toString(), !!checked)}
                          />
                          <Label htmlFor={spice.id.toString()} className="font-medium cursor-pointer">
                            {spice.name}
                          </Label>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Extras for kebab, chicken, burgers */}
          {(isKebab || isChicken || isBurger) && extras.length > 0 && (
            <div className="space-y-4">
              <Separator />
              <div>
                <h3 className="font-semibold text-lg mb-3">
                  {t("Extrat", "Extras")}
                </h3>
                <div className="grid grid-cols-1 gap-3">
                  {extras.filter((extra: any) => {
                    // Show relevant extras for each category
                    if (isKebab || isChicken) return ["Tuplaliha", "Aurajuusto", "Salaattijuusto", "Ananas", "Jalapeno"].includes(extra.name);
                    if (isBurger) return ["aurajuusto", "feta", "ananas", "jalapeno", "kananmuna"].includes(extra.name.toLowerCase());
                    return false;
                  }).map((extra: any) => (
                    <div key={extra.id} className="flex items-center justify-between p-3 border rounded-lg">
                      <div className="flex items-center space-x-3">
                        <Checkbox
                          id={extra.id.toString()}
                          checked={selectedToppings.includes(extra.id.toString())}
                          onCheckedChange={(checked) => handleToppingChange(extra.id.toString(), !!checked)}
                        />
                        <Label htmlFor={extra.id.toString()} className="font-medium cursor-pointer">
                          {extra.name}
                        </Label>
                      </div>
                      <span className="text-sm text-gray-600">
                        +{formatPrice(parseFloat(extra.price))}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Special Instructions */}
          <div className="space-y-4">
            <Separator />
            <div>
              <Label htmlFor="instructions" className="font-semibold text-lg mb-3 block">
                {t("Erityistoiveet", "Special Instructions")}
              </Label>
              <Textarea
                id="instructions"
                placeholder={t("Esim. ilman sipulia, extra mausteita...", "e.g. no onions, extra spices...")}
                value={specialInstructions}
                onChange={(e) => setSpecialInstructions(e.target.value)}
                rows={3}
              />
            </div>
          </div>

          {/* Quantity and Add to Cart */}
          <div className="space-y-4">
            <Separator />
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4">
                <span className="font-semibold">{t("Määrä", "Quantity")}:</span>
                <div className="flex items-center space-x-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(Math.max(1, quantity - 1))}
                    disabled={quantity <= 1}
                  >
                    <Minus className="w-4 h-4" />
                  </Button>
                  <span className="w-12 text-center font-semibold">{quantity}</span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setQuantity(quantity + 1)}
                  >
                    <Plus className="w-4 h-4" />
                  </Button>
                </div>
              </div>
              
              <div className="text-right">
                <div className="text-sm text-gray-600 dark:text-gray-400">
                  {t("Yhteensä", "Total")}
                </div>
                <div className="text-2xl font-bold text-green-600">
                  {formatPrice(totalPrice)}
                </div>
              </div>
            </div>

            <Button 
              onClick={handleAddToCart}
              className="w-full text-lg py-6"
              size="lg"
            >
              <ShoppingCart className="w-5 h-5 mr-2" />
              {t("Lisää ostoskoriin", "Add to Cart")} - {formatPrice(totalPrice)}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}