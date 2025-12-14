import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { categories } from "@/data/mockData";
import { RestaurantTable, CartItem, PaymentMethod } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import {
  Users,
  Plus,
  Minus,
  Receipt,
  UtensilsCrossed,
  Clock,
  Check,
  Search,
  Trash2,
  CreditCard,
  Wallet,
  Smartphone,
  X,
  CheckCircle2,
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

const getStatusColor = (status: RestaurantTable["status"]) => {
  switch (status) {
    case "empty":
      return "bg-accent/20 border-accent/30 hover:bg-accent/30";
    case "occupied":
      return "bg-primary/20 border-primary/30 hover:bg-primary/30";
    case "reserved":
      return "bg-secondary/20 border-secondary/30 hover:bg-secondary/30";
    case "billing":
      return "bg-destructive/20 border-destructive/30 hover:bg-destructive/30";
    default:
      return "bg-muted/20 border-muted/30";
  }
};

const getStatusBadge = (status: RestaurantTable["status"]) => {
  switch (status) {
    case "empty":
      return <Badge variant="success">Empty</Badge>;
    case "occupied":
      return <Badge variant="warning">Occupied</Badge>;
    case "reserved":
      return <Badge variant="outline">Reserved</Badge>;
    case "billing":
      return <Badge variant="danger">Billing</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function Tables() {
  const { items, tables, tableOrders, saveTableOrder, finalizeTableBill } = useAppData();
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billPayment, setBillPayment] = useState<PaymentMethod>("cash");
  const [billLoading, setBillLoading] = useState(false);

  const currentOrder = useMemo(() => {
    if (!selectedTable) return null;
    if (selectedTable.currentOrderId) {
      return tableOrders.find((o) => o.id === selectedTable.currentOrderId) || null;
    }
    return tableOrders.find((o) => o.tableId === selectedTable.id && o.status !== "completed") || null;
  }, [selectedTable, tableOrders]);

  const handleTableClick = (table: RestaurantTable) => {
    setSelectedTable(table);
    if (table.status === "empty" || table.status === "reserved") {
      // Start new order
      setCart([]);
      setShowOrderDialog(true);
    } else if (table.status === "occupied") {
      // Continue order - load existing items
      const order = tableOrders.find((o) => o.id === table.currentOrderId);
      if (order) {
        setCart(order.items);
      }
      setShowOrderDialog(true);
    } else if (table.status === "billing") {
      setBillPayment("cash");
      setShowBillDialog(true);
    }
  };

  const filteredItems = items.filter((item) => {
    const matchesSearch =
      item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.sku.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesCategory = selectedCategory === "all" || item.categoryId === selectedCategory;
    return matchesSearch && matchesCategory && item.isActive;
  });

  const addToCart = (item: typeof items[0]) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.itemId === item.id);
      if (existing) {
        if (existing.quantity >= item.stockQty) {
          toast({ title: "Stock limit reached", variant: "destructive" });
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
  };

  const updateQuantity = (itemId: string, delta: number) => {
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.itemId === itemId) {
            const newQty = c.quantity + delta;
            if (newQty <= 0) return null;
            return { ...c, quantity: newQty, total: newQty * c.unitPrice };
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.total, 0);
  const vatAmount = subtotal * 0.05;
  const total = subtotal + vatAmount;

  const handleSaveOrder = () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    if (!selectedTable) return;
    saveTableOrder(selectedTable.id, cart).then(() => {
      toast({ title: `Order saved for ${selectedTable.tableNo}` });
      setShowOrderDialog(false);
      setCart([]);
    });
  };

  const handleFinalizeBill = () => {
    if (!selectedTable || !currentOrder) return;
    setBillLoading(true);
    finalizeTableBill(selectedTable.id, billPayment)
      .then((sale) => {
        toast({
          title: `Bill finalized for ${selectedTable.tableNo}`,
          description: `Total: ${formatCurrency(sale.total)}`,
        });
        setShowBillDialog(false);
      })
      .catch(() => toast({ title: "Unable to finalize bill", variant: "destructive" }))
      .finally(() => setBillLoading(false));
  };

  const occupiedCount = tables.filter((t) => t.status === "occupied").length;
  const billingCount = tables.filter((t) => t.status === "billing").length;
  const emptyCount = tables.filter((t) => t.status === "empty").length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Table Management</h1>
          <p className="text-muted-foreground">টেবিল ম্যানেজমেন্ট • Dine-in Orders</p>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 animate-fade-in stagger-1">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Tables</p>
          <p className="text-2xl font-display font-bold">{tables.length}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="accent">
          <p className="text-sm text-muted-foreground">Empty</p>
          <p className="text-2xl font-display font-bold text-accent">{emptyCount}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="primary">
          <p className="text-sm text-muted-foreground">Occupied</p>
          <p className="text-2xl font-display font-bold text-primary">{occupiedCount}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="secondary">
          <p className="text-sm text-muted-foreground">Billing</p>
          <p className="text-2xl font-display font-bold text-secondary">{billingCount}</p>
        </GlassCard>
      </div>

      {/* Table Grid */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4 animate-fade-in stagger-2">
        {tables.map((table) => {
          const order = table.currentOrderId
            ? tableOrders.find((o) => o.id === table.currentOrderId)
            : null;

          return (
            <GlassCard
              key={table.id}
              hover
              className={`p-4 cursor-pointer transition-all duration-200 border-2 ${getStatusColor(table.status)}`}
              onClick={() => handleTableClick(table)}
            >
              <div className="flex flex-col items-center text-center">
                <div className="text-2xl font-display font-bold mb-2">{table.tableNo}</div>
                <div className="flex items-center gap-1 text-sm text-muted-foreground mb-2">
                  <Users className="w-4 h-4" />
                  <span>{table.capacity}</span>
                </div>
                {getStatusBadge(table.status)}
                {order && (
                  <div className="mt-2 pt-2 border-t border-border w-full">
                    <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(order.total)}</p>
                  </div>
                )}
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Order Dialog */}
      <Dialog open={showOrderDialog} onOpenChange={setShowOrderDialog}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-hidden glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              {selectedTable?.tableNo} - {selectedTable?.status === "occupied" ? "Update Order" : "New Order"}
            </DialogTitle>
            <DialogDescription>অর্ডার যোগ করুন • Items will persist to this table</DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 h-[60vh]">
            {/* Items Selection */}
            <div className="flex-1 flex flex-col min-h-0">
              <div className="flex gap-2 mb-3">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input
                    placeholder="Search items..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="pl-10 bg-muted/50"
                  />
                </div>
                <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                  <SelectTrigger className="w-[140px] bg-muted/50">
                    <SelectValue placeholder="Category" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    {categories.map((cat) => (
                      <SelectItem key={cat.id} value={cat.id}>
                        {cat.icon} {cat.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="flex-1 overflow-auto grid grid-cols-2 sm:grid-cols-3 gap-2 custom-scrollbar">
                {filteredItems.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => addToCart(item)}
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors"
                  >
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-primary font-semibold">{formatCurrency(item.price)}</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Cart */}
            <div className="w-72 flex flex-col border-l border-border pl-4">
              <h4 className="font-semibold mb-3">Order Items</h4>
              <div className="flex-1 overflow-auto space-y-2 custom-scrollbar">
                {cart.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                    <UtensilsCrossed className="w-8 h-8 mb-2 opacity-50" />
                    <p className="text-sm">No items added</p>
                  </div>
                ) : (
                  cart.map((item) => (
                    <div key={item.itemId} className="p-2 rounded-lg bg-muted/30">
                      <div className="flex justify-between items-start mb-1">
                        <p className="font-medium text-sm truncate flex-1">{item.itemName}</p>
                        <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => removeFromCart(item.itemId)}>
                          <X className="w-3 h-3" />
                        </Button>
                      </div>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1">
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.itemId, -1)}>
                            <Minus className="w-3 h-3" />
                          </Button>
                          <span className="w-6 text-center text-sm">{item.quantity}</span>
                          <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.itemId, 1)}>
                            <Plus className="w-3 h-3" />
                          </Button>
                        </div>
                        <span className="text-sm font-semibold">{formatCurrency(item.total)}</span>
                      </div>
                    </div>
                  ))
                )}
              </div>

              {/* Totals */}
              <div className="pt-3 border-t border-border space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Subtotal</span>
                  <span>{formatCurrency(subtotal)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">VAT (5%)</span>
                  <span>{formatCurrency(vatAmount)}</span>
                </div>
                <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                  <span>Total</span>
                  <span className="text-primary">{formatCurrency(total)}</span>
                </div>
              </div>

              <Button variant="glow" className="mt-3" onClick={handleSaveOrder} disabled={cart.length === 0}>
                <Check className="w-4 h-4 mr-2" />
                Save Order
              </Button>
              <Button
                variant="outline"
                className="mt-2"
                onClick={async () => {
                  if (!selectedTable) return;
                  if (cart.length > 0) {
                    await saveTableOrder(selectedTable.id, cart);
                    setCart([]);
                  }
                  if (currentOrder || cart.length > 0) {
                    setShowOrderDialog(false);
                    setShowBillDialog(true);
                  } else {
                    toast({ title: "No order yet", variant: "destructive" });
                  }
                }}
              >
                Go to Billing
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Bill Dialog */}
      <Dialog open={showBillDialog} onOpenChange={setShowBillDialog}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Bill - {selectedTable?.tableNo}</DialogTitle>
            <DialogDescription>বিল চূড়ান্তকরণ</DialogDescription>
          </DialogHeader>

          {currentOrder && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                {currentOrder.items.map((item) => (
                  <div key={item.itemId} className="flex justify-between text-sm">
                    <span>
                      {item.itemName} x{item.quantity}
                    </span>
                    <span>{formatCurrency(item.total)}</span>
                  </div>
                ))}
                <div className="border-t border-border pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(currentOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT</span>
                    <span>{formatCurrency(currentOrder.vatAmount)}</span>
                  </div>
                  {currentOrder.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service</span>
                      <span>{formatCurrency(currentOrder.serviceCharge)}</span>
                    </div>
                  )}
                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>Discount</span>
                      <span>-{formatCurrency(currentOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="gradient-text">{formatCurrency(currentOrder.total)}</span>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="grid grid-cols-4 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: <Wallet className="w-5 h-5 mb-1" /> },
                  { id: "card", label: "Card", icon: <CreditCard className="w-5 h-5 mb-1" /> },
                  { id: "bkash", label: "bKash", icon: <Smartphone className="w-5 h-5 mb-1" /> },
                  { id: "nagad", label: "Nagad", icon: <Smartphone className="w-5 h-5 mb-1" /> },
                ].map((pm) => (
                  <Button
                    key={pm.id}
                    variant={billPayment === pm.id ? "default" : "outline"}
                    className="flex-col h-auto py-3"
                    onClick={() => setBillPayment(pm.id as PaymentMethod)}
                  >
                    {pm.icon}
                    <span className="text-xs">{pm.label}</span>
                  </Button>
                ))}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" className="flex-1" onClick={() => window.print()}>
                  <Receipt className="w-4 h-4 mr-2" />
                  Print Bill
                </Button>
                <Button variant="glow" className="flex-1" onClick={handleFinalizeBill} disabled={billLoading}>
                  <Check className="w-4 h-4 mr-2" />
                  {billLoading ? "Completing..." : "Complete"}
                </Button>
              </div>

              <div className="flex items-center gap-2 text-xs text-muted-foreground">
                <CheckCircle2 className="w-3 h-3" />
                Table will be marked empty after completion.
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
