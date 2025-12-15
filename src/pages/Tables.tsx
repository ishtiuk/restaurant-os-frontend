import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { categories } from "@/data/mockData";
import { RestaurantTable, CartItem, PaymentMethod } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import { KotSlip } from "@/components/print/KotSlip";
import { TableBillReceipt } from "@/components/print/TableBillReceipt";
import { printContent } from "@/utils/printUtils";
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
  Printer,
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

const getElapsedTime = (createdAt: string): string => {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);
  
  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m ago`;
};

const getTimeColorClass = (createdAt: string): string => {
  const now = new Date().getTime();
  const created = new Date(createdAt).getTime();
  const diffMins = Math.floor((now - created) / 60000);
  
  if (diffMins < 20) return "text-accent";  // Green - fresh
  if (diffMins < 40) return "text-primary"; // Yellow - attention
  return "text-destructive";                // Red - urgent
};

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
  const {
    items,
    tables,
    tableOrders,
    saveTableOrder,
    finalizeTableBill,
    ensureTableSession,
    markTableBilling,
  } = useAppData();
  const [selectedTable, setSelectedTable] = useState<RestaurantTable | null>(null);
  const [showOrderDialog, setShowOrderDialog] = useState(false);
  const [showBillDialog, setShowBillDialog] = useState(false);
  const [showKotDialog, setShowKotDialog] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [cart, setCart] = useState<CartItem[]>([]);
  const [billPayment, setBillPayment] = useState<PaymentMethod>("cash");
  const [billLoading, setBillLoading] = useState(false);
  const [billServiceCharge, setBillServiceCharge] = useState(false);
  const [billDiscount, setBillDiscount] = useState(0);
  const [baselineItems, setBaselineItems] = useState<CartItem[]>([]);
  const [lastKot, setLastKot] = useState<{ kotNumber: number; items: CartItem[]; time: string } | null>(null);

  const currentOrder = useMemo(() => {
    if (!selectedTable) return null;
    if (selectedTable.currentOrderId) {
      return tableOrders.find((o) => o.id === selectedTable.currentOrderId) || null;
    }
    return tableOrders.find((o) => o.tableId === selectedTable.id && o.status !== "completed") || null;
  }, [selectedTable, tableOrders]);

  const primeCartFromOrder = (itemsToUse: CartItem[] | undefined) => {
    const safeItems = itemsToUse ?? [];
    setCart(safeItems);
    setBaselineItems(safeItems);
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    if (table.status === "empty" || table.status === "reserved") {
      const session = await ensureTableSession(table.id);
      setSelectedTable({ ...table, status: "occupied", currentOrderId: session.id });
      primeCartFromOrder(session.items);
      setShowOrderDialog(true);
      return;
    }

    if (table.status === "occupied") {
      const order = tableOrders.find((o) => o.id === table.currentOrderId);
      primeCartFromOrder(order?.items);
      setShowOrderDialog(true);
      return;
    }

    if (table.status === "billing") {
      const order = tableOrders.find((o) => o.id === table.currentOrderId);
      primeCartFromOrder(order?.items);
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
            const baselineQty = baselineItems.find((b) => b.itemId === itemId)?.quantity ?? 0;
            if (newQty < baselineQty) {
              toast({ title: "Cannot reduce sent items", description: "Adjust in billing instead.", variant: "destructive" });
              return c;
            }
            if (newQty <= 0) return null;
            return { ...c, quantity: newQty, total: newQty * c.unitPrice };
          }
          return c;
        })
        .filter(Boolean) as CartItem[]
    );
  };

  const removeFromCart = (itemId: string) => {
    const baselineQty = baselineItems.find((b) => b.itemId === itemId)?.quantity ?? 0;
    if (baselineQty > 0) {
      toast({ title: "Cannot remove sent items", description: "Finalize in billing.", variant: "destructive" });
      return;
    }
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  const subtotal = cart.reduce((sum, c) => sum + c.total, 0);
  const vatAmount = subtotal * 0.05;
  const total = subtotal + vatAmount;
  const hasDeltaItems = useMemo(() => {
    const baselineMap = new Map(baselineItems.map((b) => [b.itemId, b.quantity]));
    return cart.some((item) => item.quantity > (baselineMap.get(item.itemId) ?? 0));
  }, [baselineItems, cart]);

  const getDeltaItems = () => {
    const baselineMap = new Map(baselineItems.map((b) => [b.itemId, b.quantity]));
    return cart
      .map((item) => {
        const sentQty = baselineMap.get(item.itemId) ?? 0;
        const newQty = item.quantity - sentQty;
        if (newQty <= 0) return null;
        return { ...item, quantity: newQty, total: newQty * item.unitPrice };
      })
      .filter(Boolean) as CartItem[];
  };

  const handleSendKot = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    if (!selectedTable) return;

    const deltaItems = getDeltaItems();
    if (deltaItems.length === 0) {
      toast({ title: "No new items to send", description: "Add items to send a KOT." });
      return;
    }

    const mergedItems = cart.map((item) => ({ ...item, total: item.quantity * item.unitPrice }));
    await saveTableOrder(selectedTable.id, mergedItems, { kotItems: deltaItems });
    setBaselineItems(mergedItems);

    // Show KOT print dialog
    const kotCount = (currentOrder?.kots?.length ?? 0) + 1;
    setLastKot({
      kotNumber: kotCount,
      items: deltaItems,
      time: new Date().toLocaleString(),
    });
    setShowKotDialog(true);

    toast({
      title: `✅ KOT #${kotCount} Printed Successfully`,
      description: `${deltaItems.reduce((sum, i) => sum + i.quantity, 0)} item(s) for ${
        selectedTable.tableNo
      }. Please deliver slip to kitchen.`,
    });
  };

  const handleGoToBilling = async () => {
    if (!selectedTable) return;
    if (cart.length === 0 && baselineItems.length === 0) {
      toast({ title: "No order yet", variant: "destructive" });
      return;
    }

    const deltaItems = getDeltaItems();
    if (deltaItems.length > 0) {
      const mergedItems = cart.map((item) => ({ ...item, total: item.quantity * item.unitPrice }));
      await saveTableOrder(selectedTable.id, mergedItems, { kotItems: deltaItems });
      setBaselineItems(mergedItems);
    }

    await markTableBilling(selectedTable.id);
    setSelectedTable((prev) => (prev ? { ...prev, status: "billing" } : prev));
    setShowOrderDialog(false);
    setShowBillDialog(true);
  };

  const handleFinalizeBill = () => {
    if (!selectedTable || !currentOrder) return;
    
    // Confirmation dialog
    const confirmMsg = `Finalize bill for ${selectedTable.tableNo}?\n\nTotal Amount: ${formatCurrency(currentOrder.total)}\n\nTable will be marked as free after payment.`;
    if (!window.confirm(confirmMsg)) {
      return;
    }
    
    setBillLoading(true);
    finalizeTableBill(selectedTable.id, billPayment)
      .then((sale) => {
        toast({
          title: `✅ Bill finalized for ${selectedTable.tableNo}`,
          description: `Total: ${formatCurrency(sale.total)}`,
        });
        setShowBillDialog(false);
        setCart([]);
        setBaselineItems([]);
        setSelectedTable(null);
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
                  <div className="mt-2 pt-2 border-t border-border w-full space-y-1">
                    <p className="text-xs text-muted-foreground">{order.items.length} items</p>
                    <p className="text-sm font-semibold text-primary">{formatCurrency(order.total)}</p>
                    <p className={`text-xs font-medium ${getTimeColorClass(order.createdAt)}`}>
                      ⏱️ {getElapsedTime(order.createdAt)}
                    </p>
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

              <Button variant="glow" className="mt-3" onClick={handleSendKot} disabled={!hasDeltaItems}>
                <Check className="w-4 h-4 mr-2" />
                Send to Kitchen (KOT)
              </Button>
              <Button
                variant="outline"
                className="mt-2"
                onClick={handleGoToBilling}
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
            <DialogDescription>বিল চূড়ান্তকরণ • Finalize table bill</DialogDescription>
          </DialogHeader>

          {currentOrder && selectedTable && (
            <div className="space-y-4">
              {/* Hidden printable bill */}
              <div className="hidden">
                <TableBillReceipt
                  order={currentOrder}
                  tableNo={selectedTable.tableNo}
                  serviceCharge={billServiceCharge ? currentOrder.subtotal * 0.05 : 0}
                  extraDiscount={billDiscount}
                />
              </div>
              
              {/* Preview bill */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-2 font-mono max-h-[40vh] overflow-auto custom-scrollbar">
                <div className="text-center mb-4 border-b-2 border-dashed border-border pb-3">
                  <h3 className="font-display font-bold text-xl">RestaurantOS</h3>
                  <p className="text-sm text-muted-foreground mt-1">রেস্টুরেন্ট ওএস</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date().toLocaleString()}
                  </p>
                  <p className="font-bold mt-2">Table: {selectedTable.tableNo}</p>
                </div>

                <div className="space-y-1">
                  {currentOrder.items.map((item) => (
                    <div key={item.itemId} className="flex justify-between text-sm">
                      <span>
                        <span className="font-bold">{item.quantity}x</span> {item.itemName}
                      </span>
                      <span>{formatCurrency(item.total)}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-border pt-2 mt-2 space-y-1">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Subtotal</span>
                    <span>{formatCurrency(currentOrder.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT (5%)</span>
                    <span>{formatCurrency(currentOrder.vatAmount)}</span>
                  </div>
                  {currentOrder.serviceCharge > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Service Charge</span>
                      <span>{formatCurrency(currentOrder.serviceCharge)}</span>
                    </div>
                  )}
                  {currentOrder.discount > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>Discount</span>
                      <span>-{formatCurrency(currentOrder.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-border">
                    <span>Total</span>
                    <span className="gradient-text">{formatCurrency(currentOrder.total)}</span>
                  </div>
                </div>

                <div className="text-center text-xs text-muted-foreground mt-4 pt-3 border-t-2 border-dashed border-border">
                  <p>Thank you for dining with us!</p>
                  <p>আমাদের সাথে খাওয়ার জন্য ধন্যবাদ!</p>
                </div>
              </div>

              {/* Service Charge & Discount */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-sm font-medium">Service Charge (5%)</span>
                  <Button
                    variant={billServiceCharge ? "default" : "outline"}
                    size="sm"
                    onClick={() => setBillServiceCharge(!billServiceCharge)}
                  >
                    {billServiceCharge ? "Applied" : "Add"}
                  </Button>
                </div>
                
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Discount:</span>
                  <Input
                    type="number"
                    value={billDiscount}
                    onChange={(e) => {
                      const val = Number(e.target.value) || 0;
                      if (val < 0) {
                        setBillDiscount(0);
                      } else if (val > currentOrder.subtotal) {
                        setBillDiscount(currentOrder.subtotal);
                      } else {
                        setBillDiscount(val);
                      }
                    }}
                    className="w-28 bg-muted/50"
                    min={0}
                    max={currentOrder.subtotal}
                    placeholder="৳0"
                  />
                </div>

                {(billServiceCharge || billDiscount > 0) && (
                  <div className="p-3 rounded-lg bg-primary/10 space-y-1 text-sm">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Original Total:</span>
                      <span>{formatCurrency(currentOrder.total)}</span>
                    </div>
                    {billServiceCharge && (
                      <div className="flex justify-between text-primary">
                        <span>+ Service Charge:</span>
                        <span>+{formatCurrency(currentOrder.subtotal * 0.05)}</span>
                      </div>
                    )}
                    {billDiscount > 0 && (
                      <div className="flex justify-between text-accent">
                        <span>- Discount:</span>
                        <span>-{formatCurrency(billDiscount)}</span>
                      </div>
                    )}
                    <div className="flex justify-between font-bold text-base pt-1 border-t border-border">
                      <span>New Total:</span>
                      <span className="text-primary">
                        {formatCurrency(
                          currentOrder.total + 
                          (billServiceCharge ? currentOrder.subtotal * 0.05 : 0) - 
                          billDiscount
                        )}
                      </span>
                    </div>
                  </div>
                )}
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
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => printContent('table-bill-print', { title: 'Bill', paperSize: 'thermal' })}
                >
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

      {/* KOT Print Dialog */}
      <Dialog open={showKotDialog} onOpenChange={setShowKotDialog}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Kitchen Order Ticket (KOT)</DialogTitle>
            <DialogDescription>রান্নাঘর অর্ডার টিকিট • Print and send to kitchen</DialogDescription>
          </DialogHeader>

          {lastKot && selectedTable && (
            <div className="space-y-4">
              {/* Hidden printable KOT slip */}
              <div className="hidden">
                <KotSlip
                  kotNumber={lastKot.kotNumber}
                  tableNo={selectedTable.tableNo}
                  items={lastKot.items}
                  time={lastKot.time}
                />
              </div>
              
              {/* Preview KOT Slip */}
              <div className="p-6 rounded-lg bg-muted/30 font-mono text-sm border-2 border-dashed border-border">
                <div className="text-center mb-4 border-b-2 border-dashed border-border pb-3">
                  <h3 className="font-display font-bold text-2xl">🍳 KITCHEN ORDER</h3>
                  <p className="text-lg font-bold mt-1">KOT #{lastKot.kotNumber}</p>
                </div>
                
                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-base">
                    <span className="font-bold">Table:</span>
                    <span className="text-xl font-bold">{selectedTable.tableNo}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span>Time:</span>
                    <span>{new Date(lastKot.time).toLocaleString()}</span>
                  </div>
                </div>

                <div className="border-t-2 border-dashed border-border pt-3 mb-3">
                  <p className="font-bold mb-2 text-xs uppercase tracking-wider">Items:</p>
                  {lastKot.items.map((item, idx) => (
                    <div key={idx} className="mb-2 flex items-start gap-2">
                      <span className="font-bold text-lg min-w-[40px]">{item.quantity}x</span>
                      <span className="flex-1">{item.itemName}</span>
                    </div>
                  ))}
                </div>

                <div className="border-t-2 border-dashed border-border pt-3 text-center">
                  <p className="text-sm font-bold">
                    Total Items: {lastKot.items.reduce((sum, i) => sum + i.quantity, 0)}
                  </p>
                  <p className="text-xs text-muted-foreground mt-2">
                    --- Please prepare immediately ---
                  </p>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2">
                <Button 
                  variant="outline" 
                  className="flex-1" 
                  onClick={() => printContent('kot-slip-print', { title: 'KOT', paperSize: 'thermal' })}
                >
                  <Printer className="w-4 h-4 mr-2" />
                  Print KOT
                </Button>
                <Button 
                  variant="default" 
                  className="flex-1" 
                  onClick={() => setShowKotDialog(false)}
                >
                  Done
                </Button>
              </div>

              <p className="text-xs text-center text-muted-foreground">
                💡 Print this slip and provide to kitchen staff
              </p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
