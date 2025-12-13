import React, { useState, useMemo, useCallback } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { items, categories } from "@/data/mockData";
import { CartItem, PaymentMethod } from "@/types";
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

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const VAT_RATE = 0.05;
const SERVICE_CHARGE_RATE = 0.05;

type OrderType = "dine-in" | "takeaway" | "delivery";

const paymentMethods: { id: PaymentMethod; label: string; icon: React.ReactNode }[] = [
  { id: "cash", label: "Cash", icon: <Wallet className="w-5 h-5" /> },
  { id: "card", label: "Card", icon: <CreditCard className="w-5 h-5" /> },
  { id: "bkash", label: "bKash", icon: <Smartphone className="w-5 h-5" /> },
  { id: "nagad", label: "Nagad", icon: <Smartphone className="w-5 h-5" /> },
];

export default function Sales() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [orderType, setOrderType] = useState<OrderType>("dine-in");
  const [tableNo, setTableNo] = useState("");
  const [selectedPayment, setSelectedPayment] = useState<PaymentMethod>("cash");
  const [discount, setDiscount] = useState(0);
  const [includeVat, setIncludeVat] = useState(true);
  const [includeServiceCharge, setIncludeServiceCharge] = useState(false);
  const [showReceipt, setShowReceipt] = useState(false);
  const [lastSale, setLastSale] = useState<any>(null);

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
  }, [searchQuery, selectedCategory]);

  const addToCart = useCallback((item: typeof items[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        if (existing.quantity >= item.stockQty) {
          toast({
            title: "Stock limit reached",
            description: `Only ${item.stockQty} available`,
            variant: "destructive",
          });
          return prev;
        }
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
          available: item.stockQty,
        },
      ];
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

  const subtotal = useMemo(() => cart.reduce((sum, c) => sum + c.total, 0), [cart]);
  const vatAmount = useMemo(() => (includeVat ? subtotal * VAT_RATE : 0), [subtotal, includeVat]);
  const serviceCharge = useMemo(
    () => (includeServiceCharge ? subtotal * SERVICE_CHARGE_RATE : 0),
    [subtotal, includeServiceCharge]
  );
  const total = useMemo(
    () => subtotal + vatAmount + serviceCharge - discount,
    [subtotal, vatAmount, serviceCharge, discount]
  );

  const handleCheckout = () => {
    if (cart.length === 0) {
      toast({
        title: "Cart is empty",
        description: "Add items to proceed",
        variant: "destructive",
      });
      return;
    }

    const sale = {
      id: `S${Date.now()}`,
      createdAt: new Date().toISOString(),
      items: cart,
      subtotal,
      vatAmount,
      serviceCharge,
      discount,
      total,
      paymentMethod: selectedPayment,
      orderType,
      tableNo: orderType === "dine-in" ? tableNo : undefined,
    };

    setLastSale(sale);
    setShowReceipt(true);
    setCart([]);
    setDiscount(0);
    setTableNo("");

    toast({
      title: "Sale completed!",
      description: `Total: ${formatCurrency(total)}`,
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
                className="p-3 cursor-pointer transition-all duration-200"
                onClick={() => addToCart(item)}
              >
                <div className="aspect-square mb-2 rounded-lg bg-muted/30 overflow-hidden">
                  {item.imageUrl ? (
                    <img src={item.imageUrl} alt={item.name} className="w-full h-full object-cover" loading="lazy" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-muted-foreground">
                      <UtensilsCrossed className="w-8 h-8" />
                    </div>
                  )}
                </div>
                <h4 className="font-medium text-sm truncate">{item.name}</h4>
                <div className="flex items-center justify-between mt-1">
                  <span className="font-display font-bold text-primary">{formatCurrency(item.price)}</span>
                  <span className="text-xs text-muted-foreground">{item.stockQty} left</span>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </div>

      {/* Right: Cart */}
      <GlassCard className="w-full lg:w-96 flex flex-col animate-slide-in-left">
        {/* Order Type */}
        <div className="p-4 border-b border-border">
          <div className="flex gap-2">
            {[
              { type: "dine-in" as OrderType, icon: <UtensilsCrossed className="w-4 h-4" />, label: "Dine-in" },
              { type: "takeaway" as OrderType, icon: <ShoppingBag className="w-4 h-4" />, label: "Takeaway" },
              { type: "delivery" as OrderType, icon: <Truck className="w-4 h-4" />, label: "Delivery" },
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
        </div>

        {/* Cart Items */}
        <div className="flex-1 overflow-auto p-4 custom-scrollbar">
          {cart.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-muted-foreground">
              <Receipt className="w-12 h-12 mb-3 opacity-50" />
              <p className="text-sm">Cart is empty</p>
              <p className="text-xs">কার্ট খালি</p>
            </div>
          ) : (
            <div className="space-y-3">
              {cart.map((item) => (
                <div
                  key={item.itemId}
                  className="flex items-center gap-3 p-3 rounded-lg bg-muted/30"
                >
                  <div className="flex-1 min-w-0">
                    <p className="font-medium truncate">{item.itemName}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatCurrency(item.unitPrice)} × {item.quantity}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.itemId, -1)}
                    >
                      <Minus className="w-3 h-3" />
                    </Button>
                    <span className="w-6 text-center font-medium">{item.quantity}</span>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7"
                      onClick={() => updateQuantity(item.itemId, 1)}
                    >
                      <Plus className="w-3 h-3" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-7 w-7 text-destructive"
                      onClick={() => removeFromCart(item.itemId)}
                    >
                      <Trash2 className="w-3 h-3" />
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
              variant={includeVat ? "default" : "outline"}
              size="sm"
              onClick={() => setIncludeVat(!includeVat)}
              className="flex-1"
            >
              VAT 5%
            </Button>
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
              onChange={(e) => setDiscount(Number(e.target.value) || 0)}
              className="w-24 bg-muted/50"
              min={0}
            />
          </div>

          {/* Summary */}
          <div className="space-y-2 text-sm">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Subtotal</span>
              <span>{formatCurrency(subtotal)}</span>
            </div>
            {includeVat && (
              <div className="flex justify-between">
                <span className="text-muted-foreground">VAT (5%)</span>
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
          <div className="grid grid-cols-4 gap-2">
            {paymentMethods.map((pm) => (
              <Button
                key={pm.id}
                variant={selectedPayment === pm.id ? "default" : "outline"}
                size="sm"
                onClick={() => setSelectedPayment(pm.id)}
                className="flex-col h-auto py-2"
              >
                {pm.icon}
                <span className="text-xs mt-1">{pm.label}</span>
              </Button>
            ))}
          </div>

          {/* Checkout Button */}
          <Button
            variant="glow"
            size="xl"
            className="w-full animate-glow-pulse"
            onClick={handleCheckout}
            disabled={cart.length === 0}
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
            <DialogDescription>বিক্রয় সম্পন্ন</DialogDescription>
          </DialogHeader>
          {lastSale && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 font-mono text-sm">
                <div className="text-center mb-4">
                  <h3 className="font-display font-bold text-lg">RestaurantOS</h3>
                  <p className="text-muted-foreground">রেস্টুরেন্ট ওএস</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(lastSale.createdAt).toLocaleString()}
                  </p>
                </div>
                <div className="border-t border-dashed border-border pt-3 space-y-1">
                  {lastSale.items.map((item: any) => (
                    <div key={item.itemId} className="flex justify-between">
                      <span>
                        {item.itemName} x{item.quantity}
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
                </div>
                <p className="text-center text-xs text-muted-foreground mt-4">
                  Thank you for dining with us!<br />
                  আমাদের সাথে খাওয়ার জন্য ধন্যবাদ!
                </p>
              </div>
              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  <Printer className="w-4 h-4 mr-2" />
                  Print
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
