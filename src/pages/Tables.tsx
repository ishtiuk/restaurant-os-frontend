import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";
import { tablesApi } from "@/lib/api/tables";
import { Label } from "@/components/ui/label";

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
    categories,
    tables,
    tableOrders,
    saveTableOrder,
    finalizeTableBill,
    ensureTableSession,
    markTableBilling,
    refreshTables,
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
  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [newTable, setNewTable] = useState({ tableNo: "", capacity: 4, location: "" });
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);

  const currentOrder = useMemo(() => {
    if (!selectedTable) return null;
    let order: typeof tableOrders[0] | null = null;
    if (selectedTable.currentOrderId) {
      order = tableOrders.find((o) => o.id === selectedTable.currentOrderId) || null;
    } else {
      order = tableOrders.find((o) => o.tableId === selectedTable.id && o.status !== "completed") || null;
    }
    
    // Recalculate VAT if order exists but VAT is 0 and products have VAT rates
    if (order && order.vatAmount === 0) {
      const recalculatedVat = order.items.reduce((sum, item) => {
        if (!item.vatRate || item.vatRate === 0) return sum;
        // Extract VAT from VAT-inclusive price
        const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
        return sum + itemVat;
      }, 0);
      
      if (recalculatedVat > 0) {
        // Return order with recalculated VAT for display
        return {
          ...order,
          vatAmount: recalculatedVat,
        };
      }
    }
    
    return order;
  }, [selectedTable, tableOrders]);

  const primeCartFromOrder = (itemsToUse: CartItem[] | undefined) => {
    const safeItems = itemsToUse ?? [];
    setCart(safeItems);
    setBaselineItems(safeItems);
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    if (table.status === "empty" || table.status === "reserved") {
      // For empty tables, just open the dialog with empty cart
      // Order will be created when user adds items and saves
      setCart([]);
      setBaselineItems([]);
      setShowOrderDialog(true);
      return;
    }

    if (table.status === "occupied") {
      // For occupied tables, load existing order
      const existingOrder = tableOrders.find((o) => o.id === table.currentOrderId);
      if (existingOrder) {
        primeCartFromOrder(existingOrder.items);
      } else {
        // Try to ensure session exists (might have been created elsewhere)
        try {
          const session = await ensureTableSession(table.id);
          primeCartFromOrder(session.items);
        } catch (err) {
          // If no order exists, start with empty cart
          setCart([]);
          setBaselineItems([]);
        }
      }
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
      // Only check stock for packaged items (ice cream, coke, etc.)
      // Cooked items (biryani, curry) don't need stock tracking
      if (existing) {
        if (item.isPackaged && existing.quantity >= item.stockQty) {
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
          available: item.isPackaged ? item.stockQty : 9999, // Unlimited for cooked items
          vatRate: item.vatRate, // Store VAT rate from product
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

  // In Bangladesh, prices shown to customers are VAT-inclusive
  // But for backend accounting, we need to separate VAT
  const subtotalInclusive = cart.reduce((sum, c) => sum + c.total, 0);
  // Calculate VAT from each product's VAT rate
  // Extract VAT from VAT-inclusive prices: vat = (price * qty) * (vatRate / (100 + vatRate))
  // Round to integer (real-world requirement in Bangladesh)
  const calculatedVat = cart.reduce((sum, item) => {
    if (!item.vatRate || item.vatRate === 0) return sum;
    // VAT-inclusive price: extract VAT amount
    const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
    return sum + itemVat;
  }, 0);
  const vatAmount = Math.round(calculatedVat);
  // Subtotal without VAT (for backend accounting) - round after subtracting VAT
  const subtotal = Math.round(subtotalInclusive - calculatedVat);
  // Total = Subtotal (VAT-exclusive) + VAT (rounded)
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
    setShowFinalizeConfirm(true);
  };

  const confirmFinalizeBill = () => {
    if (!selectedTable || !currentOrder) return;
    setShowFinalizeConfirm(false);
    setBillLoading(true);
    
    // Calculate service charge if enabled
    const serviceChargeAmount = billServiceCharge ? currentOrder.subtotal * 0.05 : 0;
    
    finalizeTableBill(selectedTable.id, billPayment, {
      discount: billDiscount,
      serviceCharge: serviceChargeAmount,
    })
      .then((sale) => {
        toast({
          title: `✅ Bill finalized for ${selectedTable.tableNo}`,
          description: `Total: ${formatCurrency(sale.total)}`,
        });
        setShowBillDialog(false);
        setCart([]);
        setBaselineItems([]);
        setSelectedTable(null);
        setBillDiscount(0);
        setBillServiceCharge(false);
      })
      .catch(() => toast({ title: "Unable to finalize bill", variant: "destructive" }))
      .finally(() => setBillLoading(false));
  };

  const handleAddTable = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newTable.tableNo.trim()) {
      toast({
        title: "Table number required",
        description: "Please enter a table number.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTable(true);
    try {
      await tablesApi.create({
        table_no: newTable.tableNo.trim(),
        capacity: newTable.capacity || 4,
        location: newTable.location.trim() || undefined,
        is_active: true,
      });

      toast({
        title: "Table created!",
        description: `Table ${newTable.tableNo} has been added.`,
      });

      setNewTable({ tableNo: "", capacity: 4, location: "" });
      setShowAddTableDialog(false);
      
      // Refresh tables from API
      await refreshTables();
    } catch (err: any) {
      toast({
        title: "Failed to create table",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsCreatingTable(false);
    }
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
        <Button variant="glow" onClick={() => setShowAddTableDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Table
        </Button>
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
                    className="p-3 rounded-lg bg-muted/30 hover:bg-muted/50 cursor-pointer transition-colors relative"
                  >
                    <p className="font-medium text-sm truncate">{item.name}</p>
                    <p className="text-primary font-semibold">{formatCurrency(item.price)}</p>
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
                  {(() => {
                    // Calculate VAT from order items if vatAmount is 0 or missing
                    const calculatedVat = currentOrder.vatAmount > 0 
                      ? currentOrder.vatAmount 
                      : currentOrder.items.reduce((sum, item) => {
                          if (!item.vatRate || item.vatRate === 0) return sum;
                          const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
                          return sum + itemVat;
                        }, 0);
                    
                    // Round VAT to integer (real-world requirement in Bangladesh)
                    const displayVat = Math.round(calculatedVat);
                    
                    // Calculate VAT-exclusive subtotal from items (sum of item totals - VAT)
                    const itemsTotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
                    const displaySubtotal = itemsTotal - calculatedVat;
                    
                    return (
                      <>
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">Subtotal</span>
                          <span>{formatCurrency(Math.round(displaySubtotal))}</span>
                        </div>
                        {displayVat > 0 && (
                          <div className="flex justify-between text-sm">
                            <span className="text-muted-foreground">VAT</span>
                            <span>{formatCurrency(displayVat)}</span>
                          </div>
                        )}
                      </>
                    );
                  })()}
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
                  {(() => {
                    // Calculate VAT from order items
                    const calculatedVat = currentOrder.vatAmount > 0 
                      ? currentOrder.vatAmount 
                      : currentOrder.items.reduce((sum, item) => {
                          if (!item.vatRate || item.vatRate === 0) return sum;
                          const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
                          return sum + itemVat;
                        }, 0);
                    const displayVat = Math.round(calculatedVat);
                    
                    // Calculate VAT-exclusive subtotal
                    const itemsTotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
                    const displaySubtotal = Math.round(itemsTotal - calculatedVat);
                    
                    // Total = Subtotal + VAT
                    const displayTotal = displaySubtotal + displayVat;
                    
                    return (
                      <div className="flex justify-between font-bold text-lg pt-2 border-t-2 border-border">
                        <span>Total</span>
                        <span className="gradient-text">{formatCurrency(displayTotal)}</span>
                      </div>
                    );
                  })()}
                </div>

                <div className="text-center text-xs text-muted-foreground mt-4 pt-3 border-t-2 border-dashed border-border">
                  <p>ধন্যবাদ, আবার আসবেন</p>
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
                      // Calculate max discount from items total (VAT-inclusive)
                      const itemsTotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
                      if (val < 0) {
                        setBillDiscount(0);
                      } else if (val > itemsTotal) {
                        setBillDiscount(itemsTotal);
                      } else {
                        setBillDiscount(val);
                      }
                    }}
                    className="w-28 bg-muted/50"
                    min={0}
                    max={currentOrder.items.reduce((sum, item) => sum + item.total, 0)}
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
              <div className="grid grid-cols-3 gap-2">
                {[
                  { id: "cash", label: "Cash", icon: <Wallet className="w-5 h-5 mb-1" /> },
                  { id: "card", label: "Card", icon: <CreditCard className="w-5 h-5 mb-1" /> },
                  { id: "online", label: "Online Pay", icon: <Smartphone className="w-5 h-5 mb-1" /> },
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
                  onClick={() => printContent('table-bill-print', { title: 'Bill' })}
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
                  onClick={() => printContent('kot-slip-print', { title: 'KOT' })}
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

      {/* Add Table Dialog */}
      <Dialog open={showAddTableDialog} onOpenChange={setShowAddTableDialog}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Add New Table</DialogTitle>
            <DialogDescription>নতুন টেবিল যোগ করুন • Create a new table</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddTable} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="tableNo">Table Number *</Label>
              <Input
                id="tableNo"
                value={newTable.tableNo}
                onChange={(e) => setNewTable((prev) => ({ ...prev, tableNo: e.target.value }))}
                placeholder="e.g. T1, Table 5, VIP-1"
                required
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                Unique identifier for this table
              </p>
            </div>

            <div className="space-y-2">
              <Label htmlFor="capacity">Capacity (Seats)</Label>
              <Input
                id="capacity"
                type="number"
                min="1"
                value={newTable.capacity}
                onChange={(e) => setNewTable((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 4 }))}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="location">Location (Optional)</Label>
              <Input
                id="location"
                value={newTable.location}
                onChange={(e) => setNewTable((prev) => ({ ...prev, location: e.target.value }))}
                placeholder="e.g. Main Hall, VIP Room, Outdoor"
                className="bg-muted/50"
              />
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setShowAddTableDialog(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow" disabled={isCreatingTable}>
                {isCreatingTable ? (
                  <>
                    <Clock className="w-4 h-4 mr-2 animate-spin" />
                    Creating...
                  </>
                ) : (
                  <>
                    <Plus className="w-4 h-4 mr-2" />
                    Create Table
                  </>
                )}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Finalize Bill Confirmation Dialog */}
      <AlertDialog open={showFinalizeConfirm} onOpenChange={setShowFinalizeConfirm}>
        <AlertDialogContent className="glass-card border-2 border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display gradient-text text-xl">
              Finalize Bill?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-3 pt-2">
              <div className="flex items-center gap-2 text-base">
                <UtensilsCrossed className="w-5 h-5 text-primary" />
                <span className="font-semibold">Table: {selectedTable?.tableNo}</span>
              </div>
              <div className="bg-muted/30 rounded-lg p-4 space-y-2">
                {currentOrder && (() => {
                  // Calculate VAT from order items
                  const calculatedVat = currentOrder.vatAmount > 0 
                    ? currentOrder.vatAmount 
                    : currentOrder.items.reduce((sum, item) => {
                        if (!item.vatRate || item.vatRate === 0) return sum;
                        const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
                        return sum + itemVat;
                      }, 0);
                  const displayVat = Math.round(calculatedVat);
                  
                  // Calculate VAT-exclusive subtotal
                  const itemsTotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
                  const displaySubtotal = Math.round(itemsTotal - calculatedVat);
                  
                  // Service charge is calculated on VAT-inclusive amount (itemsTotal)
                  const serviceChargeAmount = billServiceCharge ? Math.round(itemsTotal * 0.05) : 0;
                  
                  // Total = Subtotal (VAT-exclusive) + VAT (rounded) + Service Charge - Discount
                  const calculatedTotal = displaySubtotal + displayVat + serviceChargeAmount - billDiscount;
                  
                  return (
                    <>
                      <div className="flex justify-between items-center">
                        <span className="text-muted-foreground">Total Amount:</span>
                        <span className="text-2xl font-display font-bold text-primary">
                          {formatCurrency(calculatedTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span className="text-muted-foreground">Subtotal:</span>
                        <span>{formatCurrency(displaySubtotal)}</span>
                      </div>
                      {displayVat > 0 && (
                        <div className="flex justify-between text-sm">
                          <span className="text-muted-foreground">VAT:</span>
                          <span>{formatCurrency(displayVat)}</span>
                        </div>
                      )}
                      {serviceChargeAmount > 0 && (
                        <div className="flex justify-between text-sm text-primary">
                          <span>Service Charge:</span>
                          <span>+{formatCurrency(serviceChargeAmount)}</span>
                        </div>
                      )}
                      {billDiscount > 0 && (
                        <div className="flex justify-between text-sm text-accent">
                          <span>Discount:</span>
                          <span>-{formatCurrency(billDiscount)}</span>
                        </div>
                      )}
                    </>
                  );
                })()}
              </div>
              <div className="flex items-start gap-2 pt-2">
                <CheckCircle2 className="w-5 h-5 text-accent mt-0.5 flex-shrink-0" />
                <p className="text-sm">
                  Table will be marked as <span className="font-semibold text-accent">free</span> after payment is processed.
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmFinalizeBill}
              className="bg-primary hover:bg-primary/90 text-primary-foreground"
              disabled={billLoading}
            >
              {billLoading ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Confirm & Finalize
                </>
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
