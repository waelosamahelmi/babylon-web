import { useState, useEffect, useMemo } from "react";
import { useLanguage } from "@/lib/language-context";
import { useCart } from "@/lib/cart-context";
import { useCreateOrder } from "@/hooks/use-orders";
import { useRestaurantSettings } from "@/hooks/use-restaurant-settings";
import { useRestaurantConfig } from "@/hooks/use-restaurant-config";
import { useBranches } from "@/hooks/use-branches";
import { useBlacklistCheck } from "@/hooks/use-blacklist";
import { useCustomerAuth } from "@/hooks/use-customer-auth";
import { useQuery } from "@tanstack/react-query";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Separator } from "@/components/ui/separator";
import { Card, CardContent } from "@/components/ui/card";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Bike, ShoppingBag, CreditCard, Banknote, AlertTriangle, Smartphone, Wallet, Zap, Tag, ShieldAlert, Gift, Check, User } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { DeliveryMap } from "@/components/delivery-map";
import { AddressSelector } from "@/components/address-selector";
import { OrderSuccessModal } from "@/components/order-success-modal";
import { isBranchOrderingAvailable, getBranchNextOpeningTime } from "@/lib/branch-business-hours";
import { Elements } from '@stripe/react-stripe-js';
import { getStripe } from '@/lib/stripe-client';
import { createPaymentIntent } from '@/lib/stripe-api';
import { StripePaymentForm } from '@/components/stripe-payment-form';
import { PaymentMethodIcon } from '@/components/payment-method-icons';
import { supabase } from '@/lib/supabase';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onBack: () => void;
  onOrderSuccess?: (orderNumber: string, orderType: "delivery" | "pickup") => void;
}

export function CheckoutModal({ isOpen, onClose, onBack, onOrderSuccess }: CheckoutModalProps) {
  const { language, t } = useLanguage();
  const { items, totalPrice, clearCart } = useCart();
  const { toast } = useToast();
  const { config, dbSettings } = useRestaurantSettings();
  const { config: restaurantConfig } = useRestaurantConfig();
  const createOrder = useCreateOrder();
  const { customer, isAuthenticated } = useCustomerAuth();
  
  // Load payment methods from database
  const [availablePaymentMethods, setAvailablePaymentMethods] = useState<Array<{
    id: string;
    nameFi: string;
    nameEn: string;
    enabled: boolean;
    icon?: string;
    requiresStripe?: boolean;
  }>>([
    { id: 'online', nameFi: 'Verkkomaksu', nameEn: 'Online Payment', enabled: true, icon: 'globe', requiresStripe: true },
  ]);
  
  useEffect(() => {
    // Start with custom payment methods from database
    const methods: Array<{
      id: string;
      nameFi: string;
      nameEn: string;
      enabled: boolean;
      icon?: string;
      requiresStripe?: boolean;
    }> = [];
    
    // Add custom payment methods from database first
    if (dbSettings?.payment_methods && Array.isArray(dbSettings.payment_methods)) {
      const customMethods = dbSettings.payment_methods.filter((m: any) => 
        m.enabled && m.id !== 'online' // Don't duplicate online payment
      );
      methods.push(...customMethods);
    }
    
    // Add online payment method at the end ONLY if Stripe is enabled
    if (dbSettings?.stripe_enabled) {
      methods.push(
        { id: 'online', nameFi: 'Verkkomaksu', nameEn: 'Online Payment', enabled: true, icon: 'globe', requiresStripe: true }
      );
    }
    
    setAvailablePaymentMethods(methods);
  }, [dbSettings]);

  // Check if selected payment method requires Stripe
  const isStripePaymentMethod = (methodId: string) => {
    return methodId === 'online' || ['apple_pay', 'google_pay', 'stripe_link', 'klarna', 'ideal', 'sepa_debit'].includes(methodId);
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

  // Coupon state
  const [couponCode, setCouponCode] = useState("");
  const [appliedCoupon, setAppliedCoupon] = useState<{
    id: string;
    code: string;
    discount: number;
    discountType: 'percentage' | 'fixed' | 'free_delivery';
  } | null>(null);
  const [couponError, setCouponError] = useState("");
  const [couponLoading, setCouponLoading] = useState(false);

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
    paymentMethod: "online",
    specialInstructions: "",
  });

  // Pre-fill form with customer data when logged in
  useEffect(() => {
    if (isAuthenticated && customer) {
      const fullName = [customer.first_name, customer.last_name].filter(Boolean).join(" ");
      setFormData(prev => ({
        ...prev,
        customerName: fullName || prev.customerName,
        customerPhone: customer.phone || prev.customerPhone,
        customerEmail: customer.email || prev.customerEmail,
      }));
      
      // Also pre-fill default address if available
      if (customer.addresses?.length > 0) {
        const defaultAddr = customer.addresses[customer.default_address_index || 0];
        if (defaultAddr) {
          setFormData(prev => ({
            ...prev,
            streetAddress: defaultAddr.streetAddress || "",
            postalCode: defaultAddr.postalCode || "",
            city: defaultAddr.city || "",
            deliveryAddress: `${defaultAddr.streetAddress || ""}, ${defaultAddr.postalCode || ""} ${defaultAddr.city || ""}`,
          }));
        }
      }
    }
  }, [isAuthenticated, customer]);

  // Blacklist check - must be after formData declaration
  const { isBlacklisted, reason: blacklistReason, isLoading: blacklistLoading } = useBlacklistCheck(
    formData.customerEmail || null, 
    formData.customerPhone || null
  );

  // Branch payment methods - must be after formData declaration
  const { data: branchPaymentMethods } = useQuery({
    queryKey: ['branch-payment-methods', formData.branchId],
    queryFn: async () => {
      if (!formData.branchId) return null;
      const { data, error } = await supabase
        .from('branch_payment_methods')
        .select('*')
        .eq('branch_id', formData.branchId)
        .eq('is_enabled', true);
      if (error) throw error;
      return data;
    },
    enabled: !!formData.branchId,
  });

  const [deliveryInfo, setDeliveryInfo] = useState<{
    fee: number;
    distance: number;
    address: string;
  } | null>(null);

  const [showSuccessModal, setShowSuccessModal] = useState(false);
  const [successOrderNumber, setSuccessOrderNumber] = useState<string>("");

  // Stripe payment states
  const [showStripePayment, setShowStripePayment] = useState(false);
  const [stripeClientSecret, setStripeClientSecret] = useState<string>("");
  const [stripePaymentIntentId, setStripePaymentIntentId] = useState<string>("");
  const [isCreatingPaymentIntent, setIsCreatingPaymentIntent] = useState(false);
  const [pendingOrderId, setPendingOrderId] = useState<number | null>(null);

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
  
  // Calculate small order fee if total is less than minimum for delivery
  // Get minimum order from config for delivery only (pickup has no minimum)
  const MINIMUM_ORDER = formData.orderType === "delivery" 
    ? (restaurantConfig?.delivery?.minimumOrderDelivery || 15.00)
    : 0;
  const smallOrderFee = formData.orderType === "delivery" && totalPrice < MINIMUM_ORDER 
    ? (MINIMUM_ORDER - totalPrice) 
    : 0;
  
  // Calculate online payment service fee
  const calculateServiceFee = () => {
    if (!isStripePaymentMethod(formData.paymentMethod)) return 0;
    
    const feeAmount = parseFloat(dbSettings?.online_payment_service_fee?.toString() || "0");
    const feeType = dbSettings?.online_payment_service_fee_type || "fixed";
    
    if (feeType === "percentage") {
      // Calculate percentage of order subtotal + delivery + small order fee
      return ((totalPrice + deliveryFee + smallOrderFee) * feeAmount) / 100;
    } else {
      // Fixed amount
      return feeAmount;
    }
  };
  
  const serviceFee = calculateServiceFee();
  
  // Calculate coupon discount
  const couponDiscount = useMemo(() => {
    if (!appliedCoupon) return 0;
    if (appliedCoupon.discountType === 'percentage') {
      return (totalPrice * appliedCoupon.discount) / 100;
    } else if (appliedCoupon.discountType === 'fixed') {
      return Math.min(appliedCoupon.discount, totalPrice);
    } else if (appliedCoupon.discountType === 'free_delivery') {
      return deliveryFee;
    }
    return 0;
  }, [appliedCoupon, totalPrice, deliveryFee]);
  
  const totalAmount = totalPrice + deliveryFee + smallOrderFee + serviceFee - couponDiscount;
  const minimumOrderAmount = formData.orderType === "delivery" && 
    deliveryInfo && deliveryInfo.distance > 10 ? 20.00 : 0;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check blacklist first
    if (isBlacklisted) {
      toast({
        title: t("Tilaaminen estetty", "Ordering blocked"),
        description: blacklistReason || t("Tiliäsi ei voi käyttää tilausten tekemiseen.", "Your account cannot be used to place orders."),
        variant: "destructive",
      });
      return;
    }

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

    // Check if payment method requires Stripe - if so, show payment form first
    if (isStripePaymentMethod(formData.paymentMethod)) {
      await handleStripePayment();
      return;
    }

    // For non-Stripe payments (cash, card), create order directly
    await createOrderWithPaymentStatus();
  };

  const handleStripePayment = async () => {
    setIsCreatingPaymentIntent(true);

    try {
      // STEP 1: Create the order FIRST with pending_payment status
      // This ensures the order exists before any Stripe redirects
      const orderData = {
        ...formData,
        subtotal: totalPrice.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        smallOrderFee: smallOrderFee.toFixed(2),
        couponDiscount: couponDiscount.toFixed(2),
        couponCode: appliedCoupon?.code || null,
        couponId: appliedCoupon?.id || null,
        totalAmount: totalAmount.toFixed(2),
        paymentStatus: 'pending_payment', // Will be updated to 'paid' after successful payment
        items: items.map(item => ({
          menuItemId: item.menuItem.id,
          quantity: item.quantity,
          specialInstructions: item.specialInstructions || "",
          toppings: item.toppings ? item.toppings.map(toppingId => {
            const topping = Array.isArray(allToppings) ? allToppings.find((t: any) => t.id.toString() === toppingId) : null;
            return topping ? { name: topping.name, price: topping.price } : { name: toppingId, price: "0" };
          }) : [],
          toppingsPrice: item.toppingsPrice || 0,
          sizePrice: item.sizePrice || 0,
          size: item.size || "normal",
        })),
      };

      const orderResult = await createOrder.mutateAsync(orderData);
      const orderId = orderResult.id;
      const orderNumber = orderResult.orderNumber || orderResult.order_number;
      
      console.log('Order created with pending_payment status:', { orderId, orderNumber });

      // STEP 2: Create payment intent with order ID in metadata
      const paymentIntent = await createPaymentIntent({
        amount: totalAmount,
        currency: 'eur',
        metadata: {
          orderId: orderId.toString(),
          orderNumber: orderNumber || '',
          customerName: formData.customerName,
          customerPhone: formData.customerPhone,
          orderType: formData.orderType,
        },
      });

      // STEP 3: Payment intent ID is automatically saved by the Supabase Edge Function
      // The Edge Function uses service role key and has permission to update orders
      console.log('✅ Payment intent created:', paymentIntent.paymentIntentId, 'for order:', orderId);
      console.log('📝 Note: Payment intent ID saved automatically by Edge Function');
      
      // Store orderId in sessionStorage as backup for redirect
      sessionStorage.setItem('pending_order_id', orderId.toString());
      sessionStorage.setItem('pending_order_number', orderNumber || '');

      setStripeClientSecret(paymentIntent.clientSecret);
      setStripePaymentIntentId(paymentIntent.paymentIntentId);
      setPendingOrderId(orderId);
      setShowStripePayment(true);
    } catch (error: any) {
      toast({
        title: t("Virhe", "Error"),
        description: t("Tilauksen luominen epäonnistui", "Failed to create order"),
        variant: "destructive",
      });
      console.error('Error creating order or payment intent:', error);
    } finally {
      setIsCreatingPaymentIntent(false);
    }
  };

  const handlePaymentSuccess = async (paymentIntentId: string) => {
    console.log('✅ Payment succeeded! Payment Intent ID:', paymentIntentId);
    console.log('📦 Order ID:', pendingOrderId);

    if (pendingOrderId) {
      try {
        // Get the order to show the order number in success modal
        // NOTE: We do NOT update payment status here - the webhook will handle that
        // The Edge Function already saved the stripe_payment_intent_id with service role permissions
        const { data: existingOrder, error: fetchError } = await supabase
          .from('orders')
          .select('*')
          .eq('id', pendingOrderId)
          .single();

        if (fetchError) {
          console.error('Error fetching order:', fetchError);
          throw fetchError;
        }

        if (existingOrder) {
          console.log('Found order:', existingOrder.order_number);

          // Store order details for success modal
          const orderNumber = existingOrder.order_number || existingOrder.id?.toString() || "";
          const orderType = formData.orderType;

          console.log('🎯 Order details:', { orderNumber, orderType, hasCallback: !!onOrderSuccess });

          // Clear cart
          clearCart();

          // CRITICAL: Call success callback BEFORE closing modals
          // This ensures the parent sets success modal state before checkout unmounts
          if (onOrderSuccess) {
            console.log('🎉 Calling onOrderSuccess callback with:', orderNumber, orderType);
            onOrderSuccess(orderNumber, orderType);
          } else {
            console.log('⚠️ No onOrderSuccess callback, using internal modal');
            // Fallback: Show internal success modal if no callback provided
            setSuccessOrderNumber(orderNumber);
            setShowSuccessModal(true);
          }

          // Close payment modal and checkout AFTER success callback
          // Use setTimeout to ensure success modal state is set first
          setTimeout(() => {
            console.log('🚪 Closing payment and checkout modals');
            setShowStripePayment(false);
            setPendingOrderId(null);
            onClose();
          }, 50);

          // Webhook will update the order status to 'paid' and send confirmation email
          console.log('ℹ️ Webhook will update order status and send email');
        }
      } catch (err) {
        console.error('Error in handlePaymentSuccess:', err);
        // Still show success - the payment went through
        toast({
          title: t("Maksu vastaanotettu", "Payment received"),
          description: t("Tilauksesi on vastaanotettu.", "Your order has been received."),
        });

        // Close modals even on error
        clearCart();
        setShowStripePayment(false);
        setPendingOrderId(null);
        onClose();
      }
    } else {
      console.error('⚠️ No pending order ID found');
      // No pending order found - just close modals
      setShowStripePayment(false);
      setPendingOrderId(null);
      onClose();
    }
  };

  const handlePaymentError = (error: string) => {
    toast({
      title: t("Maksu epäonnistui", "Payment failed"),
      description: error,
      variant: "destructive",
    });
    // Mark the order as failed if we have one
    if (pendingOrderId) {
      supabase
        .from('orders')
        .update({ payment_status: 'failed' })
        .eq('id', pendingOrderId)
        .then(() => console.log('Order marked as failed'));
    }
    setShowStripePayment(false);
    setPendingOrderId(null);
  };

  const handlePaymentCancel = async () => {
    // If user cancels, mark order as cancelled
    if (pendingOrderId) {
      await supabase
        .from('orders')
        .update({ payment_status: 'failed', status: 'cancelled' })
        .eq('id', pendingOrderId);
      console.log('Order cancelled:', pendingOrderId);
    }
    setShowStripePayment(false);
    setStripeClientSecret("");
    setStripePaymentIntentId("");
    setPendingOrderId(null);
  };

  const createOrderWithPaymentStatus = async (paymentStatus: string = 'pending', paymentIntentId?: string) => {
    try {
      const orderData = {
        ...formData,
        subtotal: totalPrice.toFixed(2),
        deliveryFee: deliveryFee.toFixed(2),
        smallOrderFee: smallOrderFee.toFixed(2),
        couponDiscount: couponDiscount.toFixed(2),
        couponCode: appliedCoupon?.code || null,
        couponId: appliedCoupon?.id || null,
        totalAmount: totalAmount.toFixed(2),
        paymentStatus: paymentStatus || (formData.paymentMethod === 'cash' ? 'pending' : 'paid'),
        stripePaymentIntentId: paymentIntentId,
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

  // Apply coupon code
  const handleApplyCoupon = async () => {
    if (!couponCode.trim()) {
      setCouponError(t("Syötä kuponkikoodi", "Enter coupon code"));
      return;
    }

    setCouponLoading(true);
    setCouponError("");

    try {
      const { data: coupon, error } = await supabase
        .from('coupon_codes')
        .select('*')
        .eq('code', couponCode.toUpperCase())
        .eq('is_active', true)
        .single();

      if (error || !coupon) {
        setCouponError(t("Virheellinen kuponkikoodi", "Invalid coupon code"));
        return;
      }

      // Check validity dates
      const now = new Date();
      if (coupon.valid_from && new Date(coupon.valid_from) > now) {
        setCouponError(t("Kuponki ei ole vielä voimassa", "Coupon not yet valid"));
        return;
      }
      if (coupon.valid_until && new Date(coupon.valid_until) < now) {
        setCouponError(t("Kuponki on vanhentunut", "Coupon has expired"));
        return;
      }

      // Check usage limits
      if (coupon.max_uses_total && coupon.current_uses >= coupon.max_uses_total) {
        setCouponError(t("Kuponki on käytetty loppuun", "Coupon has been fully used"));
        return;
      }

      // Check minimum order amount
      if (coupon.min_order_amount && totalPrice < coupon.min_order_amount) {
        setCouponError(t(`Vähimmäistilaus ${coupon.min_order_amount}€`, `Minimum order €${coupon.min_order_amount}`));
        return;
      }

      // Check order type restrictions
      if (coupon.pickup_only && formData.orderType !== 'pickup') {
        setCouponError(t("Kuponki vain noutoihin", "Coupon only for pickup orders"));
        return;
      }
      if (coupon.delivery_only && formData.orderType !== 'delivery') {
        setCouponError(t("Kuponki vain toimituksiin", "Coupon only for delivery orders"));
        return;
      }

      // Calculate discount
      let discount = 0;
      let discountType: 'percentage' | 'fixed' | 'free_delivery' = 'fixed';
      
      if (coupon.discount_type === 'percentage') {
        discount = coupon.discount_value;
        discountType = 'percentage';
      } else if (coupon.discount_type === 'fixed') {
        discount = coupon.discount_value;
        discountType = 'fixed';
      } else if (coupon.discount_type === 'free_delivery') {
        discount = 0;
        discountType = 'free_delivery';
      }

      setAppliedCoupon({
        id: coupon.id,
        code: coupon.code,
        discount,
        discountType,
      });
      setCouponCode("");
    } catch (err) {
      setCouponError(t("Virhe kupongin tarkistuksessa", "Error validating coupon"));
    } finally {
      setCouponLoading(false);
    }
  };

  const handleRemoveCoupon = () => {
    setAppliedCoupon(null);
    setCouponError("");
  };

  // Filter payment methods by branch settings
  const filteredPaymentMethods = useMemo(() => {
    if (!branchPaymentMethods || branchPaymentMethods.length === 0) {
      // No branch-specific settings, show all available methods
      return availablePaymentMethods;
    }
    
    const enabledMethodKeys = branchPaymentMethods.map(m => m.payment_method);
    
    return availablePaymentMethods.filter(method => {
      // Map checkout modal method IDs to branch payment method keys
      // Branch keys: cash_or_card, stripe_card, apple_pay, google_pay, klarna, etc.
      // Checkout IDs: online, cash, card, cash_or_card
      
      if (method.id === 'online') {
        // Online payment (Stripe) - check if any Stripe method is enabled
        return enabledMethodKeys.some(key => 
          ['stripe_card', 'apple_pay', 'google_pay', 'klarna', 'link', 'ideal', 'sepa_debit'].includes(key)
        );
      }
      
      if (method.id === 'cash' || method.id === 'card') {
        // Cash or card payments - check for cash_or_card or exact match
        return enabledMethodKeys.includes('cash_or_card') || 
               enabledMethodKeys.includes(method.id);
      }
      
      // Direct match for other methods
      return enabledMethodKeys.includes(method.id);
    });
  }, [availablePaymentMethods, branchPaymentMethods]);

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

          {/* Logged-in User Indicator */}
          {isAuthenticated && customer && (
            <div className="flex items-center gap-2 p-3 bg-green-50 dark:bg-green-950 border border-green-200 dark:border-green-800 rounded-lg">
              <User className="w-5 h-5 text-green-600" />
              <div className="flex-1">
                <p className="text-sm font-medium text-green-700 dark:text-green-300">
                  {t("Kirjautunut tilillä", "Logged in as")} {customer.email}
                </p>
                {customer.loyalty_points > 0 && (
                  <p className="text-xs text-green-600 dark:text-green-400">
                    {t("Kanta-asiakaspisteet", "Loyalty points")}: {customer.loyalty_points}
                  </p>
                )}
              </div>
            </div>
          )}

          {/* Delivery Address with Address Selector for logged-in users */}
          {formData.orderType === "delivery" && (
            <AddressSelector
              onAddressSelect={(addressData) => {
                handleAddressChange(addressData);
              }}
              onDeliveryCalculated={handleDeliveryCalculated}
              branchLocation={branchLocation}
            />
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
                {filteredPaymentMethods.map((method) => {
                  const isStripeMethod = isStripePaymentMethod(method.id);
                  
                  return (
                    <Label 
                      key={method.id}
                      className="flex items-center space-x-3 p-4 sm:p-3 border-2 border-gray-200 rounded-lg cursor-pointer hover:border-red-600 active:bg-gray-50 transition-colors touch-manipulation"
                    >
                      <RadioGroupItem value={method.id} className="text-red-600 w-5 h-5" />
                      <PaymentMethodIcon methodId={method.icon || method.id} className="w-12 h-8" />
                      <span className="font-medium text-base sm:text-sm flex-1">
                        {language === "fi" ? method.nameFi : method.nameEn}
                      </span>
                      {isStripeMethod && (
                        <span className="text-xs bg-blue-100 text-blue-700 px-2 py-1 rounded-full font-medium">
                          {t("Online", "Online")}
                        </span>
                      )}
                    </Label>
                  );
                })}
              </div>
            </RadioGroup>
          </div>

          {/* Blacklist Warning */}
          {isBlacklisted && (
            <Alert variant="destructive" className="border-2 border-red-500">
              <ShieldAlert className="h-5 w-5" />
              <AlertDescription>
                <p className="font-bold mb-1">
                  {t("Tilaaminen estetty", "Ordering blocked")}
                </p>
                <p className="text-sm">
                  {blacklistReason || t(
                    "Tiliäsi ei voi käyttää tilausten tekemiseen. Ota yhteyttä asiakaspalveluun.",
                    "Your account cannot be used to place orders. Please contact customer service."
                  )}
                </p>
              </AlertDescription>
            </Alert>
          )}

          {/* Coupon Code Input */}
          <div className="space-y-3">
            <Label className="text-base sm:text-sm font-medium flex items-center gap-2">
              <Tag className="w-4 h-4" />
              {t("Kuponkikoodi", "Coupon Code")}
            </Label>
            {appliedCoupon ? (
              <div className="flex items-center justify-between p-3 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg">
                <div className="flex items-center gap-2">
                  <Check className="w-5 h-5 text-green-600" />
                  <span className="font-medium text-green-700 dark:text-green-300">
                    {appliedCoupon.code}
                  </span>
                  <span className="text-sm text-green-600 dark:text-green-400">
                    {appliedCoupon.discountType === 'percentage' 
                      ? `-${appliedCoupon.discount}%`
                      : appliedCoupon.discountType === 'free_delivery'
                      ? t("Ilmainen toimitus", "Free delivery")
                      : `-€${appliedCoupon.discount.toFixed(2)}`
                    }
                  </span>
                </div>
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  onClick={handleRemoveCoupon}
                  className="text-red-600 hover:text-red-700"
                >
                  {t("Poista", "Remove")}
                </Button>
              </div>
            ) : (
              <div className="flex gap-2">
                <Input
                  value={couponCode}
                  onChange={(e) => setCouponCode(e.target.value.toUpperCase())}
                  placeholder={t("Syötä koodi", "Enter code")}
                  className="h-12 sm:h-10 text-base uppercase"
                />
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleApplyCoupon}
                  disabled={couponLoading}
                  className="h-12 sm:h-10 px-4"
                >
                  {couponLoading ? "..." : t("Käytä", "Apply")}
                </Button>
              </div>
            )}
            {couponError && (
              <p className="text-sm text-red-600 dark:text-red-400">{couponError}</p>
            )}
          </div>

          {/* Order Summary */}
          <Card className="bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700">
            <CardContent className="p-4">
              <h4 className="font-semibold mb-3 text-gray-900 dark:text-gray-100">
                {t("Tilauksen yhteenveto", "Order Summary")}
              </h4>
              <div className="space-y-3 mb-4">
                {items.map((item) => {
                  const hasConditionalPricing = item.menuItem.hasConditionalPricing;
                  const includedToppingsCount = item.menuItem.includedToppingsCount || 0;
                  const toppingCount = item.toppings?.length || 0;
                  const basePrice = parseFloat(item.menuItem.offerPrice || item.menuItem.price);
                  const toppingsPrice = item.toppingsPrice || 0;
                  const sizePrice = item.sizePrice || 0;
                  const totalItemPrice = (basePrice + toppingsPrice + sizePrice) * item.quantity;
                  
                  return (
                    <div key={item.id} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <div className="flex justify-between items-start">
                        <div className="flex-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium text-gray-900 dark:text-gray-100">
                              {language === "fi" ? item.menuItem.name : item.menuItem.nameEn}
                            </span>
                            <span className="text-gray-500 dark:text-gray-400">x {item.quantity}</span>
                          </div>
                          
                          {/* Conditional pricing breakdown */}
                          {hasConditionalPricing && includedToppingsCount > 0 && (
                            <div className="mt-2 text-xs space-y-1">
                              <div className="flex items-center gap-1 text-green-600 dark:text-green-400">
                                <span>✓</span>
                                <span>
                                  {t(
                                    `${Math.min(toppingCount, includedToppingsCount)} täytettä sisältyy hintaan`,
                                    `${Math.min(toppingCount, includedToppingsCount)} toppings included`
                                  )}
                                </span>
                              </div>
                              {toppingCount > includedToppingsCount && (
                                <div className="text-amber-600 dark:text-amber-400">
                                  + {toppingCount - includedToppingsCount} {t("lisätäyte", "extra topping")} (€{toppingsPrice.toFixed(2)})
                                </div>
                              )}
                            </div>
                          )}
                          
                          {/* Non-conditional pricing extras */}
                          {!hasConditionalPricing && (toppingsPrice > 0 || sizePrice > 0) && (
                            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                              {toppingsPrice > 0 && <span>{t("+ lisätäytteet", "+ extras")}: €{toppingsPrice.toFixed(2)} </span>}
                              {sizePrice > 0 && <span>{t("+ koko", "+ size")}: €{sizePrice.toFixed(2)}</span>}
                            </div>
                          )}
                          
                          {sizePrice > 0 && hasConditionalPricing && (
                            <div className="text-gray-500 dark:text-gray-400 text-xs mt-1">
                              {t("+ koko", "+ size")}: €{sizePrice.toFixed(2)}
                            </div>
                          )}
                        </div>
                        <span className="font-medium text-gray-900 dark:text-gray-100">€{totalItemPrice.toFixed(2)}</span>
                      </div>
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
                {serviceFee > 0 && (
                  <div className="flex justify-between text-sm text-blue-600 dark:text-blue-400">
                    <span>{t("Verkkomaksu palvelumaksu", "Online payment service fee")}</span>
                    <span>€{serviceFee.toFixed(2)}</span>
                  </div>
                )}
                {couponDiscount > 0 && (
                  <div className="flex justify-between text-sm text-green-600 dark:text-green-400">
                    <span className="flex items-center gap-1">
                      <Tag className="w-3 h-3" />
                      {t("Kuponkialennus", "Coupon discount")} ({appliedCoupon?.code})
                    </span>
                    <span>-€{couponDiscount.toFixed(2)}</span>
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
              disabled={createOrder.isPending || isCreatingPaymentIntent || !isOrderingAvailable}
            >
              {createOrder.isPending || isCreatingPaymentIntent
                ? t("Lähetetään...", "Placing order...")
                : isStripePaymentMethod(formData.paymentMethod)
                ? t("Jatka maksuun", "Continue to Payment")
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

    {/* Stripe Payment Modal */}
    {showStripePayment && stripeClientSecret && dbSettings?.stripe_publishable_key && (
      <Dialog open={showStripePayment} onOpenChange={setShowStripePayment}>
        <DialogContent className="sm:max-w-[600px]">
          <DialogHeader>
            <DialogTitle className="text-2xl font-bold text-center">
              {t("Suorita maksu", "Complete Payment")}
            </DialogTitle>
          </DialogHeader>
          <Elements
            stripe={getStripe(dbSettings.stripe_publishable_key)}
            options={{
              clientSecret: stripeClientSecret,
              appearance: {
                theme: 'stripe',
                variables: {
                  colorPrimary: '#0066cc',
                  borderRadius: '8px',
                },
              },
            }}
          >
            <StripePaymentForm
              clientSecret={stripeClientSecret}
              amount={totalAmount}
              onSuccess={handlePaymentSuccess}
              onError={handlePaymentError}
              onCancel={handlePaymentCancel}
            />
          </Elements>
        </DialogContent>
      </Dialog>
    )}
  </>
  );
}
