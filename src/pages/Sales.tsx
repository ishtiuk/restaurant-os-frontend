import React, { useState, useMemo, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { CartItem, PaymentMethod } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import { SalesReceipt } from "@/components/print/SalesReceipt";
import { printContent } from "@/utils/printUtils";
import {
  Search,
  Plus,
  Minus,
  Trash2,
  CreditCard,
  Wallet,
  Smartphone,
  UtensilsCrossed,
  ShoppingBag,
  Truck,
  Printer,
  Check,
  X,
  Receipt,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatWithTimezone } from "@/utils/date";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const SERVICE_CHARGE_RATE = 0.05;

type OrderType = "dine-in" | "takeaway" | "delivery";

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: "cash", label: "Cash", icon: <Wallet className="w-5 h-5" /> },
  { id: "card", label: "Card", icon: <CreditCard className="w-5 h-5" /> },
  { id: "online", label: "Online Pay", icon: <Smartphone className="w-5 h-5" /> },
];

export default function Sales() {
  const navigate = useNavigate();
  const { items, categories, completeSale } = useAppData();
  const { timezone } = useTimezone();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("takeaway");
  const [tableNo, setTableNo] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState(0);
  const [includeServiceCharge, setIncludeServiceCharge] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);
  
  // Delivery info
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [deliveryAddress, setDeliveryAddress] = useState("");
  const [deliveryNotes, setDeliveryNotes] = useState("");

  const filteredItems = useMemo(() => {
    return items.filter((item) => {
      const matchesSearch =
        item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        item.sku.toLowerCase().includes(searchQuery.toLowerCase()) ||
        (item.nameBn && item.nameBn.includes(searchQuery));

      const matchesCategory =
        selectedCategory === "all" || item.categoryId === selectedCategory;

      return matchesSearch && matchesCategory && item.isActive;
    });
  }, [items, searchQuery, selectedCategory]);

  const addToCart = useCallback((item: typeof items[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      // Only check stock for packaged items (ice cream, coke, etc.)
      // Cooked items (biryani, curry) don't need stock tracking
      
      // Check stock BEFORE adding (for both new and existing items)
      if (item.isPackaged) {
        // If stock is 0, prevent adding
        if (item.stockQty === 0) {
          toast({
            title: "Out of stock",
            description: `${item.name} is currently out of stock`,
            variant: "destructive",
          });
          return prev;
        }
        
        if (existing) {
          // Check if adding 1 more would exceed available stock
          const newQuantity = existing.quantity + 1;
          if (newQuantity > item.stockQty) {
            toast({
              title: "Stock limit reached",
              description: `Only ${item.stockQty} available`,
              variant: "destructive",
            });
            return prev;
          }
          return prev.map((c) =>
            c.itemId === item.id
              ? { ...c, quantity: newQuantity, total: newQuantity * c.unitPrice }
              : c
          );
        } else {
          // New item: check if stock is available (already checked stock > 0 above)
          return [
            ...prev,
            {
              itemId: item.id,
              itemName: item.name,
              quantity: 1,
              unitPrice: item.price,
              discount: 0,
              total: item.price,
              available: item.stockQty, // Store current stock
              vatRate: item.vatRate, // Store VAT rate from product
            },
          ];
        }
      } else {
        // Cooked items: no stock check needed
        if (existing) {
          return prev.map((c) =>
            c.itemId === item.id
              ? { ...c, quantity: c.quantity + 1, total: (c.quantity + 1) * c.unitPrice }
              : c
          );
        }
        return [
          ...prev,
          {
            itemId: item.id,
            itemName: item.name,
            quantity: 1,
            unitPrice: item.price,
            discount: 0,
            total: item.price,
            available: 9999, // Unlimited for cooked items
            vatRate: item.vatRate, // Store VAT rate from product
          },
        ];
      }
    });
  }, []);

  const updateQuantity = useCallback((itemId: string, delta: number) => {
    setCart((prev) => {
      return prev
        .map((c) => {
          if (c.itemId === itemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            if (newQty > c.available) {
              toast({
                title: "Stock limit reached",
                description: `Only ${c.available} available`,
                variant: "destructive",
              });
              return c;
            }
            return { ...c, quantity: newQty, total: newQty * c.unitPrice };
          }
          return c;
        })
        .filter(Boolean) as CartItem[];
    });
  }, []);

  const removeFromCart = useCallback((itemId: string) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  }, []);

  // In Bangladesh, prices shown to customers are VAT-inclusive
  // But for backend accounting, we need to separate VAT
  const subtotalInclusive = useMemo(() => cart.reduce((sum, c) => sum + c.total, 0), [cart]);
  // Calculate VAT from each product's VAT rate
  // Extract VAT from VAT-inclusive prices: vat = (price * qty) * (vatRate / (100 + vatRate))
  // Round to integer (real-world requirement in Bangladesh)
  const vatAmount = useMemo(() => {
    const calculated = cart.reduce((sum, item) => {
      if (!item.vatRate || item.vatRate === 0) return sum;
      // VAT-inclusive price: extract VAT amount
      const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
      return sum + itemVat;
    }, 0);
    return Math.round(calculated);
  }, [cart]);
  // Subtotal without VAT (for backend accounting)
  // Calculate VAT first (with decimals), then round, then subtract from inclusive total
  const calculatedVat = cart.reduce((sum, item) => {
    if (!item.vatRate || item.vatRate === 0) return sum;
    const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
    return sum + itemVat;
  }, 0);
  const subtotal = Math.round(subtotalInclusive - calculatedVat);
  const serviceCharge = useMemo(
    () => (includeServiceCharge ? subtotalInclusive * SERVICE_CHARGE_RATE : 0),
    [subtotalInclusive, includeServiceCharge]
  );
  // Total = Subtotal (VAT-exclusive) + VAT + Service Charge - Discount
  const total = useMemo(
    () => subtotal + vatAmount + serviceCharge - discount,
    [subtotal, vatAmount, serviceCharge, discount]
  );
  const isDineIn = orderType === "dine-in";

  const handleCheckout = () => {
    const dineInTableNo = isDineIn ? tableNo : undefined;

    if (isDineIn) {
      toast({
        title: "Dine-in handled in Tables",
        description: "Open the table to send KOTs and close the bill.",
      });
      return;
    }

    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to proceed",
        variant: "destructive",
      });
      return;
    }

    // Validate delivery info
    if (orderType === "delivery") {
      if (!customerName.trim()) {
        toast({
          title: "Customer name required",
          description: "Please enter customer name for delivery",
          variant: "destructive",
        });
        return;
      }
      if (!customerPhone.trim()) {
        toast({
          title: "Phone number required",
          description: "Please enter customer phone for delivery",
          variant: "destructive",
        });
        return;
      }
      if (!deliveryAddress.trim()) {
        toast({
          title: "Delivery address required",
          description: "Please enter delivery address",
          variant: "destructive",
        });
        return;
      }
    }

    const saleData = {
      createdAt: new Date().toISOString(),
      items: cart.map(item => ({
        itemId: item.itemId,
        itemName: item.itemName,
        quantity: item.quantity,
        unitPrice: item.unitPrice,
        discount: item.discount,
        total: item.total,
      })),
      subtotal,
      vatAmount,
      serviceCharge,
      discount,
      total,
      paymentMethod: selectedPayment,
      orderType,
      status: "completed" as const,
      tableNo: dineInTableNo,
      ...(orderType === "delivery" && {
        customerName,
        customerPhone,
        deliveryAddress,
        deliveryNotes: deliveryNotes.trim() || undefined,
      }),
    };

    // Complete sale (deducts stock and saves)
    completeSale(saleData)
      .then((sale) => {
        setLastSale(sale);
        setShowReceipt(true);
        setCart([]);
        setDiscount(0);
        setTableNo("");
        
        // Clear delivery info
        if (orderType === "delivery") {
          setCustomerName("");
          setCustomerPhone("");
          setDeliveryAddress("");
          setDeliveryNotes("");
        }

        toast({
          title: "✅ Sale completed!",
          description: `Total: ${formatCurrency(total)} • Stock updated`,
        });
      })
      .catch((error) => {
        toast({
          title: "Sale failed",
          description: error.message,
          variant: "destructive",
        });
      });
  };

  return (
    <div className="h-[calc(100vh-8rem)] flex flex-col lg:flex-row gap-4">
      {/* Left: Items Selection */}
      <div className="flex-1 flex flex-col min-h-0">
        <div className="flex flex-col gap-4 mb-4 animate-fade-in">
          <div>
            <h1 className="text-3xl font-display font-bold gradient-text">POS Sales</h1>
            <p className="text-muted-foreground">বিক্রয় পয়েন্ট • Point of Sale</p>
          </div>

          {/* Search & Category */}
          <div className="flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Search items... (Press /)"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-10 bg-muted/50"
              />
            </div>
            <Select value={selectedCategory} onValueChange={setSelectedCategory}>
              <SelectTrigger className="w-full sm:w-[180px] bg-muted/50">
                <SelectValue placeholder="Category" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-auto custom-scrollbar">
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
            {filteredItems.map((item) => (
              <GlassCard
                key={item.id}
                hover
                className="p-3 cursor-pointer transition-all duration-200 relative"
                onClick={() => addToCart(item)}
              >
                <div className="aspect-square mb-2 rounded-lg bg-muted/30 overflow-hidden relative">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                  )}
                  {/* Stock Badge - Bottom Right Corner */}
                  <div className="absolute bottom-2 right-2">
                    {item.isPackaged ? (
                      <Badge 
                        variant={item.stockQty === 0 ? "destructive" : item.stockQty <= 5 ? "secondary" : "default"}
                        className="text-xs font-semibold shadow-lg"
                      >
                        {item.stockQty === 0 ? "Out" : `Stock: ${item.stockQty}`}
                      </Badge>
                    ) : (
                      <Badge variant="outline" className="text-xs font-semibold shadow-lg bg-background/90">
                        Cooked • ∞
                      </Badge>
                    )}
                  </div>
                </div>
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <div className="mt-1">
                  <span className="font-display font-bold text-primary">
                    {formatCurrency(item.price)}
                  </span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <GlassCard className="w-full lg:w-96 flex flex-col animate-slide-in-left">
        {/* Order Type */}
        <div className={`border-b border-border ${orderType === "delivery" ? "p-3" : "p-4"}`}>
          <div className="flex gap-2">
            {[
              { type: "takeaway" as OrderType, icon: <ShoppingBag className="w-4 h-4" />, label: "Takeaway" },
              { type: "delivery" as OrderType, icon: <Truck className="w-4 h-4" />, label: "Delivery" },
              { type: "dine-in" as OrderType, icon: <UtensilsCrossed className="w-4 h-4" />, label: "Dine-in" },
            ].map((opt) => (
              <Button
                key={opt.type}
                variant={orderType === opt.type ? "default" : "outline"}
                size="sm"
                onClick={() => setOrderType(opt.type)}
                className="flex-1"
              >
                {opt.icon}
                <span className="ml-1 hidden sm:inline">{opt.label}</span>
              </Button>
            ))}
          </div>
          {orderType === "dine-in" && (
            <Input
              placeholder="Table No."
              value={tableNo}
              onChange={(e) => setTableNo(e.target.value)}
              className="mt-3 bg-muted/50"
            />
          )}
          
          {orderType === "delivery" && (
            <div className="mt-2.5 space-y-1.5">
              <div className="grid grid-cols-2 gap-1.5">
                <Input
                  placeholder="Customer Name *"
                  value={customerName}
                  onChange={(e) => setCustomerName(e.target.value)}
                  className="bg-muted/50 text-sm h-9"
                  required
                />
                <Input
                  placeholder="Phone Number *"
                  value={customerPhone}
                  onChange={(e) => setCustomerPhone(e.target.value)}
                  type="tel"
                  className="bg-muted/50 text-sm h-9"
                  required
                />
              </div>
              <Input
                placeholder="Delivery Address *"
                value={deliveryAddress}
                onChange={(e) => setDeliveryAddress(e.target.value)}
                className="bg-muted/50 text-sm h-9"
                required
              />
              <Input
                placeholder="Delivery Notes (Optional)"
                value={deliveryNotes}
                onChange={(e) => setDeliveryNotes(e.target.value)}
                className="bg-muted/50 text-sm h-9"
              />
            </div>
          )}
        </div>

        {isDineIn && (
          <div className="px-4 py-3 border-b border-border bg-amber-50 text-amber-900 dark:bg-amber-500/10">
            <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
              <div>
                <p className="font-semibold">Dine-in orders are managed from Tables</p>
                <p className="text-sm text-muted-foreground">
                  Open a table to send KOTs and close bills.
                </p>
              </div>
              <Button size="sm" variant="default" onClick={() => navigate("/tables")}>
                Go to Tables
              </Button>
            </div>
          </div>
        )}

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Receipt className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">কার্ট খালি</p>
            </div>
          ) : (
            <div className="space-y-2.5">
              {cart.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center gap-2.5 p-2.5 rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{item.itemName}</p>
                    <p className="text-xs text-muted-foreground">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-[26px] w-[26px]"
                      onClick={() => updateQuantity(item.itemId, -1)}
                    >
                      <Minus className="w-[10px] h-[10px]" />
                    </Button>
                    <span className="w-5 text-center text-sm font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-[26px] w-[26px]"
                      onClick={() => updateQuantity(item.itemId, 1)}
                    >
                      <Plus className="w-[10px] h-[10px]" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-[26px] w-[26px] text-destructive"
                      onClick={() => removeFromCart(item.itemId)}
                    >
                      <Trash2 className="w-[10px] h-[10px]" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Totals & Payment */}
        <div className="p-4 border-t border-border space-y-4">
          {/* Toggles */}
          <div className="flex gap-2">
            <Button
              variant={includeServiceCharge ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeServiceCharge(!includeServiceCharge)}
              className="flex-1"
            >
              Service 5%
            </Button>
          </div>

          {/* Discount */}
          <div className="flex gap-2 items-center">
            <span className="text-sm text-muted-foreground">Discount:</span>
            <Input
              type="number"
              value={discount}
              onChange={(e) => {
                const val = Number(e.target.value) || 0;
                // Validate: must be between 0 and subtotal
                if (val < 0) {
                  setDiscount(0);
                  toast({
                    title: "Invalid discount",
                    description: "Discount cannot be negative",
                    variant: "destructive",
                  });
                } else if (val > subtotal) {
                  setDiscount(subtotal);
                  toast({
                    title: "Discount adjusted",
                    description: "Discount cannot exceed subtotal",
                    variant: "destructive",
                  });
                } else {
                  setDiscount(val);
                }
              }}
              className="w-24 bg-muted/50"
              min={0}
              max={subtotal}
            />
          </div>

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {vatAmount > 0 && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT</span>
                <span>{formatCurrency(vatAmount)}</span>
              </div>
            )}
            {includeServiceCharge && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">Service (5%)</span>
                <span>{formatCurrency(serviceCharge)}</span>
              </div>
            )}
            {discount > 0 && (
              <div className="flex justify-between text-accent">
                <span>Discount</span>
                <span>-{formatCurrency(discount)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 border-t border-border text-lg font-display font-bold">
              <span>Total</span>
              <span className="text-primary">{formatCurrency(total)}</span>
            </div>
          </div>

          {/* Payment Methods */}
          <div className="grid grid-cols-3 gap-3">
            {paymentMethods.map((pm) => (
              <Button
                key={pm.id}
                variant={selectedPayment === pm.id ? "default" : "outline"}
                size="default"
                onClick={() => setSelectedPayment(pm.id)}
                disabled={isDineIn}
                className="flex-col h-auto py-3"
              >
                {pm.icon}
                <span className="text-sm mt-1">{pm.label}</span>
              </Button>
            ))}
          </div>

          {/* Checkout Button */}
          <Button
            variant="glow"
            size="xl"
            className="w-full animate-glow-pulse"
            onClick={handleCheckout}
            disabled={cart.length === 0 || isDineIn}
          >
            <Check className="w-5 h-5 mr-2" />
            Complete Sale • {formatCurrency(total)}
          </Button>
        </div>
      </GlassCard>

      {/* Receipt Dialog */}
      <Dialog open={showReceipt} onOpenChange={setShowReceipt}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Sale Complete!</DialogTitle>
            <DialogDescription>বিক্রয় সম্পন্ন • Print receipt for customer</DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4">
              {/* Hidden printable receipt */}
              <div className="hidden">
                <SalesReceipt
                  sale={lastSale}
                  orderType={lastSale.orderType as 'takeaway' | 'delivery'}
                  customerName={lastSale.customerName}
                  customerPhone={lastSale.customerPhone}
                  deliveryAddress={lastSale.deliveryAddress}
                  deliveryNotes={lastSale.deliveryNotes}
                />
              </div>
              
              {/* Preview receipt */}
              <div className="p-4 rounded-lg bg-muted/30 font-mono text-sm max-h-[50vh] overflow-auto custom-scrollbar">
                <div className="text-center mb-4 border-b-2 border-dashed border-border pb-3">
                  <h3 className="font-display font-bold text-lg">RestaurantOS</h3>
                  <p className="text-muted-foreground text-xs">রেস্টুরেন্ট ওএস</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatWithTimezone(lastSale.createdAt, timezone)}
                  </p>
                  <Badge variant="outline" className="mt-2">
                    {lastSale.orderType === 'takeaway' ? '🛍️ Takeaway' : '🚚 Delivery'}
                  </Badge>
                </div>
                
                {/* Delivery Info */}
                {lastSale.orderType === 'delivery' && lastSale.customerName && (
                  <div className="mb-3 p-2 rounded bg-muted/50 text-xs">
                    <p className="font-semibold">🚚 Delivery Details:</p>
                    <p>Name: {lastSale.customerName}</p>
                    <p>Phone: {lastSale.customerPhone}</p>
                    <p>Address: {lastSale.deliveryAddress}</p>
                    {lastSale.deliveryNotes && <p>Notes: {lastSale.deliveryNotes}</p>}
                  </div>
                )}
                
                <div className="border-t border-dashed border-border pt-3 space-y-1">
                  {lastSale.items.map((item: any, index: number) => (
                    <div key={`${item.itemId}-${index}`} className="flex justify-between">
                      <span className="flex-1">
                        <span className="font-bold">{item.quantity}x</span> {item.itemName}
                      </span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>
                <div className="border-t border-dashed border-border mt-3 pt-3 space-y-1">
                  <div className="flex justify-between">
                    <span>Subtotal</span>
                    <span>{formatCurrency(lastSale.subtotal)}</span>
                  </div>
                  {lastSale.vatAmount > 0 && (
                    <div className="flex justify-between">
                      <span>VAT</span>
                      <span>{formatCurrency(lastSale.vatAmount)}</span>
                    </div>
                  )}
                  {lastSale.serviceCharge > 0 && (
                    <div className="flex justify-between">
                      <span>Service Charge</span>
                      <span>{formatCurrency(lastSale.serviceCharge)}</span>
                    </div>
                  )}
                  {lastSale.discount > 0 && (
                    <div className="flex justify-between text-accent">
                      <span>Discount</span>
                      <span>-{formatCurrency(lastSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="text-primary">{formatCurrency(lastSale.total)}</span>
                  </div>
                  <div className="flex justify-between text-xs text-muted-foreground pt-1">
                    <span>Payment</span>
                    <span className="uppercase">{lastSale.paymentMethod}</span>
                  </div>
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4 pt-3 border-t border-dashed border-border">
                  Thank you for your order!<br />
                  আপনার অর্ডারের জন্য ধন্যবাদ!
                </p>
              </div>
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => printContent('sales-receipt-print', { title: 'Receipt' })}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print Receipt
                </Button>
                <Button variant="glow" className="flex-1" onClick={() => setShowReceipt(false)}>
                  New Sale
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
