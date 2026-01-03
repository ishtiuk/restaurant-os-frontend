import React, { useMemo, useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { RestaurantTable, CartItem, PaymentMethod, Staff } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import { KotSlip } from "@/components/print/KotSlip";
import { TableBillReceipt } from "@/components/print/TableBillReceipt";
import { printContent } from "@/utils/printUtils";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatWithTimezone, formatDate, formatTime } from "@/utils/date";
import { staffApi } from "@/lib/api/staff";
import { tablesApi } from "@/lib/api/tables";
import { useAuth } from "@/contexts/AuthContext";
import { isFeatureEnabled } from "@/utils/features";
import { Textarea } from "@/components/ui/textarea";
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
  User,
  AlertTriangle,
  XCircle,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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
import { Label } from "@/components/ui/label";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const getElapsedTime = (createdAt: string): string => {
  // Ensure UTC parsing by appending 'Z' if missing
  const dateStr = createdAt.endsWith('Z') ? createdAt : createdAt + 'Z';
  const now = new Date().getTime();
  const created = new Date(dateStr).getTime();
  const diffMs = now - created;
  const diffMins = Math.floor(diffMs / 60000);

  if (diffMins < 1) return "Just now";
  if (diffMins < 60) return `${diffMins} min ago`;
  const hours = Math.floor(diffMins / 60);
  const mins = diffMins % 60;
  return `${hours}h ${mins}m ago`;
};

const getTimeColorClass = (createdAt: string): string => {
  // Ensure UTC parsing by appending 'Z' if missing
  const dateStr = createdAt.endsWith('Z') ? createdAt : createdAt + 'Z';
  const now = new Date().getTime();
  const created = new Date(dateStr).getTime();
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

// Voided item interface
interface VoidedItem {
  itemId: string;
  itemName: string;
  originalQuantity: number;
  voidedQuantity: number;
  reason: string;
  voidedBy: string;
  voidedAt: string;
  tableNo?: string; // Table number where item was voided
  orderId?: string; // Order ID where item was voided
}

export default function Tables() {
  const { timezone } = useTimezone();
  const { user } = useAuth();
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
    refreshItems,
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
  const [lastKot, setLastKot] = useState<{ kotNumber: number; items: CartItem[]; time: Date } | null>(null);
  const [showAddTableDialog, setShowAddTableDialog] = useState(false);
  const [newTable, setNewTable] = useState({ tableNo: "", capacity: 4, location: "" });
  const [isCreatingTable, setIsCreatingTable] = useState(false);
  const [showFinalizeConfirm, setShowFinalizeConfirm] = useState(false);
  const [showClearTableConfirm, setShowClearTableConfirm] = useState(false);

  // Feature 1: Waiter Assignment
  const [waiters, setWaiters] = useState<Staff[]>([]);
  const [selectedWaiterId, setSelectedWaiterId] = useState<string | null>(null);
  const [loadingWaiters, setLoadingWaiters] = useState(false);
  const [updatingWaiter, setUpdatingWaiter] = useState(false);

  // Feature 3: Void Flow
  const [showVoidReasonDialog, setShowVoidReasonDialog] = useState(false);
  const [pendingVoid, setPendingVoid] = useState<{ itemId: string; itemName: string; action: 'reduce' | 'delete'; newQuantity?: number } | null>(null);
  const [voidReason, setVoidReason] = useState("");
  const [voidedItems, setVoidedItems] = useState<VoidedItem[]>([]); // Local to order modal
  const [allVoidedItems, setAllVoidedItems] = useState<VoidedItem[]>([]); // Global across all tables
  const [sendingKOT, setSendingKOT] = useState(false);
  const [goingToBilling, setGoingToBilling] = useState(false);

  // Fetch waiters on mount
  useEffect(() => {
    const fetchWaiters = async () => {
      setLoadingWaiters(true);
      try {
        const response = await staffApi.list({ role: "waiter", is_active: true });
        setWaiters(response.map(s => ({
          id: s.id,
          name: s.name,
          nameBn: s.name_bn ?? undefined,
          phone: s.phone,
          email: s.email ?? undefined,
          role: s.role as Staff["role"],
          salary: s.salary,
          joiningDate: s.joining_date ?? new Date().toISOString(),
          isActive: s.is_active,
          emergencyContact: s.emergency_contact ?? undefined,
          address: s.address ?? undefined,
        })));
      } catch (err) {
        console.error("Failed to fetch waiters", err);
      } finally {
        setLoadingWaiters(false);
      }
    };
    fetchWaiters();
  }, []);

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

  // Sync selectedWaiterId with currentOrder when it changes (after refresh)
  useEffect(() => {
    if (currentOrder && showOrderDialog) {
      // Only update if different to avoid unnecessary re-renders
      // This ensures the waiter name is updated after refresh
      if (currentOrder.waiterId !== selectedWaiterId) {
        setSelectedWaiterId(currentOrder.waiterId ?? null);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentOrder?.waiterId, currentOrder?.waiterName, showOrderDialog]);

  // Load voided items from order when order dialog opens (only if feature is enabled)
  useEffect(() => {
    if (!isFeatureEnabled("void_management")) {
      setVoidedItems([]);
      return;
    }
    if (currentOrder && showOrderDialog) {
      // Fetch voided items from the voided_items API
      const loadVoidedItems = async () => {
        try {
          const voidedItemsData = await tablesApi.listVoidedItems({
            order_id: currentOrder.id,
          });

          // Map to VoidedItem format
          const voidedItemsFromOrder: VoidedItem[] = voidedItemsData.map(item => ({
            itemId: String(item.product_id),
            itemName: item.item_name,
            originalQuantity: item.original_quantity ?? 0,
            voidedQuantity: item.quantity, // This is the voided quantity (negative in UI)
            reason: item.void_reason || "No reason provided",
            voidedBy: item.voided_by_name || user?.name || "Unknown",
            voidedAt: item.voided_at || new Date().toISOString(),
            tableNo: item.table_no || currentOrder.tableNo,
            orderId: item.order_id || currentOrder.id,
          }));
          setVoidedItems(voidedItemsFromOrder);
        } catch (error) {
          console.error("Failed to load voided items from order:", error);
          // If fetch fails, set empty array
          setVoidedItems([]);
        }
      };
      loadVoidedItems();
    } else {
      // Reset voided items when dialog closes
      setVoidedItems([]);
    }
  }, [currentOrder?.id, showOrderDialog, user?.name]);

  const primeCartFromOrder = (itemsToUse: CartItem[] | undefined) => {
    const safeItems = itemsToUse ?? [];
    setCart(safeItems);
    setBaselineItems(safeItems);
  };

  const handleTableClick = async (table: RestaurantTable) => {
    setSelectedTable(table);
    setVoidedItems([]); // Reset voided items

    if (table.status === "empty" || table.status === "reserved") {
      // For empty tables, just open the dialog with empty cart
      // Order will be created when user adds items and saves
      setCart([]);
      setBaselineItems([]);
      setSelectedWaiterId(null); // Reset waiter selection for new tables
      setShowOrderDialog(true);
      return;
    }

    if (table.status === "occupied") {
      // For occupied tables, load existing order
      const existingOrder = tableOrders.find((o) => o.id === table.currentOrderId);
      if (existingOrder) {
        primeCartFromOrder(existingOrder.items);
        // Load waiter_id from existing order if available
        if (existingOrder.waiterId) {
          setSelectedWaiterId(existingOrder.waiterId);
        } else {
          setSelectedWaiterId(null);
        }
      } else {
        // Try to ensure session exists (might have been created elsewhere)
        try {
          const session = await ensureTableSession(table.id);
          primeCartFromOrder(session.items);
          // Load waiter_id from session if available
          if (session.waiterId) {
            setSelectedWaiterId(session.waiterId);
          } else {
            setSelectedWaiterId(null);
          }
        } catch (err) {
          // If no order exists, start with empty cart
          setCart([]);
          setBaselineItems([]);
          setSelectedWaiterId(null);
        }
      }
      setShowOrderDialog(true);
      return;
    }

    if (table.status === "billing") {
      const order = tableOrders.find((o) => o.id === table.currentOrderId);
      primeCartFromOrder(order?.items);
      // Load waiter_id from order if available
      if (order?.waiterId) {
        setSelectedWaiterId(order.waiterId);
      } else {
        setSelectedWaiterId(null);
      }
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
  };

  // Feature 3: Void handlers - only work if void management is enabled
  const handleVoidReduce = (itemId: string) => {
    if (!isFeatureEnabled("void_management")) {
      updateQuantity(itemId, -1);
      return;
    }
    const cartItem = cart.find(c => c.itemId === itemId);
    if (!cartItem) return;
    const baselineQty = baselineItems.find((b) => b.itemId === itemId)?.quantity ?? 0;
    const newQty = cartItem.quantity - 1;
    if (newQty < baselineQty) {
      setPendingVoid({
        itemId,
        itemName: cartItem.itemName,
        action: 'reduce',
        newQuantity: newQty,
      });
      setVoidReason("");
      setShowVoidReasonDialog(true);
    } else {
      updateQuantity(itemId, -1);
    }
  };

  const handleVoidDelete = (itemId: string) => {
    if (!isFeatureEnabled("void_management")) {
      removeFromCart(itemId);
      return;
    }
    const cartItem = cart.find(c => c.itemId === itemId);
    if (!cartItem) return;
    const baselineQty = baselineItems.find((b) => b.itemId === itemId)?.quantity ?? 0;
    if (baselineQty > 0) {
      setPendingVoid({
        itemId,
        itemName: cartItem.itemName,
        action: 'delete',
        newQuantity: 0,
      });
      setVoidReason("");
      setShowVoidReasonDialog(true);
    } else {
      removeFromCart(itemId);
    }
  };

  // Feature 3: Modified updateQuantity to support void flow
  const updateQuantity = (itemId: string, delta: number) => {
    const cartItem = cart.find(c => c.itemId === itemId);
    if (!cartItem) return;

    const newQty = cartItem.quantity + delta;
    const baselineQty = baselineItems.find((b) => b.itemId === itemId)?.quantity ?? 0;

    // If reducing below baseline (items already sent to kitchen) AND void management is enabled, show void reason dialog
    // Otherwise, allow normal quantity reduction (even if it goes below baseline)
    if (newQty < baselineQty && delta < 0 && isFeatureEnabled("void_management")) {
      setPendingVoid({
        itemId,
        itemName: cartItem.itemName,
        action: 'reduce',
        newQuantity: newQty,
      });
      setVoidReason("");
      setShowVoidReasonDialog(true);
      return;
    }

    // Normal quantity update
    setCart((prev) =>
      prev
        .map((c) => {
          if (c.itemId === itemId) {
            if (newQty <= 0) return null;
            // Check stock limit for packaged items when increasing quantity
            if (delta > 0 && c.available < 9999 && newQty > c.available) {
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
        .filter(Boolean) as CartItem[]
    );
  };

  // Feature 3: Modified removeFromCart to support void flow
  const removeFromCart = (itemId: string) => {
    const cartItem = cart.find(c => c.itemId === itemId);
    if (!cartItem) return;

    const baselineQty = baselineItems.find((b) => b.itemId === itemId)?.quantity ?? 0;

    // If item was sent to kitchen and void management is enabled, show void reason dialog
    // Otherwise, allow normal removal (even if item was sent)
    if (baselineQty > 0 && isFeatureEnabled("void_management")) {
      setPendingVoid({
        itemId,
        itemName: cartItem.itemName,
        action: 'delete',
        newQuantity: 0,
      });
      setVoidReason("");
      setShowVoidReasonDialog(true);
      return;
    }

    // Normal removal for items not yet sent
    setCart((prev) => prev.filter((c) => c.itemId !== itemId));
  };

  // Feature 3: Handle void confirmation
  const handleVoidConfirm = async () => {
    // Early return if void management is disabled - should not reach here, but safety check
    if (!isFeatureEnabled("void_management")) {
      toast({
        title: "Void management disabled",
        description: "This feature is not available for your tenant",
        variant: "destructive",
      });
      setShowVoidReasonDialog(false);
      setPendingVoid(null);
      setVoidReason("");
      return;
    }

    if (!pendingVoid || voidReason.trim().length < 10) {
      toast({
        title: "Reason required",
        description: "Please provide a detailed reason (at least 10 characters)",
        variant: "destructive",
      });
      return;
    }

    if (!currentOrder?.id) {
      toast({
        title: "No active order",
        description: "Cannot void item without an active order",
        variant: "destructive",
      });
      return;
    }

    const cartItem = cart.find(c => c.itemId === pendingVoid.itemId);
    if (!cartItem) return;

    // Fetch the latest order to get order item IDs
    let orderItemId: string | null = null;
    try {
      const latestOrder = await tablesApi.getOrder(currentOrder.id);
      const backendOrderItem = latestOrder.items.find(i => String(i.product_id) === pendingVoid.itemId);
      if (!backendOrderItem || !backendOrderItem.id) {
        toast({
          title: "Item not found",
          description: "Could not find item in order",
          variant: "destructive",
        });
        return;
      }
      orderItemId = backendOrderItem.id;
    } catch (error: any) {
      toast({
        title: "Failed to fetch order",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
      return;
    }

    try {
      // Call backend API to void the item
      await tablesApi.voidOrderItem(currentOrder.id, orderItemId, {
        reason: voidReason,
        new_quantity: pendingVoid.action === 'delete' ? 0 : pendingVoid.newQuantity ?? null,
      });

      // Refresh order data to get updated void status
      // This will update tableOrders with the latest data including void status
      await refreshTables();

      // Always refresh items after voiding to get updated stock
      // Stock restoration happens in backend for packaged items that were sent to kitchen
      if (refreshItems) {
        try {
          await refreshItems();
        } catch (err) {
          console.error("Failed to refresh items after void", err);
        }
      }

      const baselineQty = baselineItems.find((b) => b.itemId === pendingVoid.itemId)?.quantity ?? 0;
      const voidedQuantity = pendingVoid.action === 'delete'
        ? baselineQty
        : baselineQty - (pendingVoid.newQuantity ?? 0);

      // Add to voided items list (both local and global) for UI display
      const newVoidedItem: VoidedItem = {
        itemId: pendingVoid.itemId,
        itemName: pendingVoid.itemName,
        originalQuantity: baselineQty,
        voidedQuantity,
        reason: voidReason,
        voidedBy: user?.name || "Current User",
        voidedAt: new Date().toISOString(),
        tableNo: selectedTable?.tableNo || "Unknown",
        orderId: currentOrder.id,
      };
      setVoidedItems(prev => [...prev, newVoidedItem]);
      setAllVoidedItems(prev => [...prev, newVoidedItem]);

      // Update cart
      if (pendingVoid.action === 'delete') {
        setCart((prev) => prev.filter((c) => c.itemId !== pendingVoid.itemId));
        setBaselineItems((prev) => prev.filter((b) => b.itemId !== pendingVoid.itemId));
      } else if (pendingVoid.newQuantity !== undefined) {
        setCart((prev) =>
          prev.map((c) =>
            c.itemId === pendingVoid.itemId
              ? { ...c, quantity: pendingVoid.newQuantity!, total: pendingVoid.newQuantity! * c.unitPrice }
              : c
          )
        );
        setBaselineItems((prev) =>
          prev.map((b) =>
            b.itemId === pendingVoid.itemId
              ? { ...b, quantity: pendingVoid.newQuantity!, total: pendingVoid.newQuantity! * b.unitPrice }
              : b
          )
        );
      }

      toast({
        title: "Item voided",
        description: `${pendingVoid.itemName} has been voided`,
      });

      // Reset void dialog state
      setShowVoidReasonDialog(false);
      setPendingVoid(null);
      setVoidReason("");
    } catch (error: any) {
      toast({
        title: "Failed to void item",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
  };

  // Void reason suggestions
  const voidReasonSuggestions = [
    "Customer changed mind",
    "Waiter mistake",
    "Customer behavior",
    "Item unavailable",
  ];

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

  // Handle waiter change - update order if it exists
  const handleWaiterChange = async (newWaiterId: string) => {
    // Prevent multiple simultaneous updates
    if (updatingWaiter) {
      return;
    }

    const previousWaiterId = selectedWaiterId;

    // Don't update if selecting the same waiter
    if (newWaiterId === previousWaiterId) {
      return;
    }

    // Only update via API if there's an existing order
    if (currentOrder) {
      setUpdatingWaiter(true);
      try {
        // Validate waiter exists in our list
        const selectedWaiter = waiters.find((w) => w.id === newWaiterId);
        if (newWaiterId && !selectedWaiter) {
          throw new Error("Selected waiter not found");
        }

        // Update optimistically
        setSelectedWaiterId(newWaiterId);

        // Verify order still exists before updating
        if (!currentOrder.id) {
          throw new Error("Order ID is missing");
        }

        await tablesApi.updateWaiter(currentOrder.id, {
          waiter_id: newWaiterId || null,
        });

        // Refresh tables and orders to get updated data
        await refreshTables();

        // Find the selected waiter name for the toast
        const waiterName = selectedWaiter ? selectedWaiter.name : "Unassigned";

        toast({
          title: "Waiter updated",
          description: `${waiterName} assigned to ${selectedTable?.tableNo}`,
        });
      } catch (error: any) {
        // Revert selection on error
        setSelectedWaiterId(previousWaiterId);

        // Extract error message
        let errorMessage = "Please try again";
        if (error?.response?.data?.detail) {
          errorMessage = error.response.data.detail;
        } else if (error?.message) {
          errorMessage = error.message;
        } else if (typeof error === 'string') {
          errorMessage = error;
        }

        toast({
          title: "Failed to update waiter",
          description: errorMessage,
          variant: "destructive",
        });
      } finally {
        setUpdatingWaiter(false);
      }
    } else {
      // For new orders, just update local state
      setSelectedWaiterId(newWaiterId);
    }
  };

  // Feature 1: Validate waiter selection before KOT
  const handleSendKot = async () => {
    if (cart.length === 0) {
      toast({ title: "Cart is empty", variant: "destructive" });
      return;
    }
    if (!selectedTable) return;

    // Waiter validation
    if (!selectedWaiterId) {
      toast({
        title: "Waiter required",
        description: "Please assign a waiter before sending to kitchen",
        variant: "destructive"
      });
      return;
    }

    const deltaItems = getDeltaItems();
    if (deltaItems.length === 0) {
      toast({ title: "No new items to send", description: "Add items to send a KOT." });
      return;
    }

    setSendingKOT(true);
    try {
      // Filter out items with quantity 0 (voided items) before sending to backend
      const mergedItems = cart
        .filter((item) => item.quantity > 0) // Exclude voided items (quantity 0)
        .map((item) => ({ ...item, total: item.quantity * item.unitPrice }));
      await saveTableOrder(selectedTable.id, mergedItems, { kotItems: deltaItems, waiterId: selectedWaiterId ?? undefined });
      setBaselineItems(mergedItems);

      // Show KOT print dialog
      const kotCount = (currentOrder?.kots?.length ?? 0) + 1;
      setLastKot({
        kotNumber: kotCount,
        items: deltaItems,
        time: new Date(),
      });
      setShowKotDialog(true);

      toast({
        title: `✅ KOT #${kotCount} Printed Successfully`,
        description: `${deltaItems.reduce((sum, i) => sum + i.quantity, 0)} item(s) for ${selectedTable.tableNo
          }. Please deliver slip to kitchen.`,
      });
    } catch (error: any) {
      toast({
        title: "Failed to send KOT",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setSendingKOT(false);
    }
  };

  // Feature 1: Validate waiter selection before billing
  const handleGoToBilling = async () => {
    if (!selectedTable) return;
    if (cart.length === 0 && baselineItems.length === 0) {
      toast({ title: "No order yet", variant: "destructive" });
      return;
    }

    // Waiter validation (only if there are items to bill)
    if ((cart.length > 0 || baselineItems.length > 0) && !selectedWaiterId) {
      toast({
        title: "Waiter required",
        description: "Please assign a waiter before proceeding to billing",
        variant: "destructive"
      });
      return;
    }

    setGoingToBilling(true);
    try {
      const deltaItems = getDeltaItems();
      if (deltaItems.length > 0) {
        // Filter out items with quantity 0 (voided items) before sending to backend
        const mergedItems = cart
          .filter((item) => item.quantity > 0) // Exclude voided items (quantity 0)
          .map((item) => ({ ...item, total: item.quantity * item.unitPrice }));
        await saveTableOrder(selectedTable.id, mergedItems, { kotItems: deltaItems });
        setBaselineItems(mergedItems);
      }

      await markTableBilling(selectedTable.id);
      setSelectedTable((prev) => (prev ? { ...prev, status: "billing" } : prev));
      setShowOrderDialog(false);
      setShowBillDialog(true);
    } catch (error: any) {
      toast({
        title: "Failed to proceed to billing",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    } finally {
      setGoingToBilling(false);
    }
  };

  const handleFinalizeBill = () => {
    if (!selectedTable || !currentOrder) return;

    // Check if all items are voided (cart is empty and no active items)
    const activeItems = currentOrder.items.filter(item => item.quantity > 0);
    if (activeItems.length === 0) {
      toast({
        title: "Cannot finalize bill",
        description: "All items have been voided. Please clear the table instead.",
        variant: "destructive",
      });
      return;
    }

    setShowFinalizeConfirm(true);
  };

  const confirmFinalizeBill = () => {
    if (!selectedTable || !currentOrder) return;

    // Double-check: prevent finalizing if all items are voided
    const activeItems = currentOrder.items.filter(item => item.quantity > 0);
    if (activeItems.length === 0) {
      toast({
        title: "Cannot finalize bill",
        description: "All items have been voided. Please clear the table instead.",
        variant: "destructive",
      });
      return;
    }

    setShowFinalizeConfirm(false);
    setBillLoading(true);

    // Calculate service charge if enabled
    // Service charge must be calculated on VAT-inclusive amount (itemsTotal), not VAT-exclusive subtotal
    // IMPORTANT: Don't round service charge to match POS Sales behavior (52.5, not 53)
    const itemsTotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
    const serviceChargeAmount = billServiceCharge ? itemsTotal * 0.05 : 0;

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
        setSelectedWaiterId(null);
        setVoidedItems([]);
      })
      .catch(() => toast({ title: "Unable to finalize bill", variant: "destructive" }))
      .finally(() => setBillLoading(false));
  };

  const handleClearTable = () => {
    if (!selectedTable || !currentOrder) return;
    setShowClearTableConfirm(true);
  };

  const confirmClearTable = async () => {
    if (!selectedTable || !currentOrder) return;
    setShowClearTableConfirm(false);

    try {
      await tablesApi.cancelOrder(currentOrder.id);
      toast({
        title: `✅ Table ${selectedTable.tableNo} cleared`,
        description: "Order cancelled and table reset to empty",
      });

      // Refresh tables to get updated status
      await refreshTables();

      // Close dialogs and reset state
      setShowOrderDialog(false);
      setShowBillDialog(false);
      setCart([]);
      setBaselineItems([]);
      setSelectedTable(null);
      setSelectedWaiterId(null);
      setVoidedItems([]);
      setAllVoidedItems([]);
    } catch (error: any) {
      toast({
        title: "Failed to clear table",
        description: error?.message || "Please try again",
        variant: "destructive",
      });
    }
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

  // Get selected waiter name
  const selectedWaiterName = waiters.find(w => w.id === selectedWaiterId)?.name;

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
                    {/* Void indicator badge - Only show if feature is enabled */}
                    {isFeatureEnabled("void_management") && (() => {
                      // Calculate void count from order items (from backend data)
                      const voidCount = order.items.filter(item => item.isVoided === true).length;
                      return voidCount > 0 ? (
                        <Badge variant="destructive" className="mt-1 text-xs">
                          <XCircle className="w-3 h-3 mr-1" />
                          {voidCount} void{voidCount > 1 ? 's' : ''}
                        </Badge>
                      ) : null;
                    })()}
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
              {selectedWaiterName && (
                <Badge variant="outline" className="ml-2 text-xs">
                  <User className="w-3 h-3 mr-1" />
                  {selectedWaiterName}
                </Badge>
              )}
            </DialogTitle>
            <DialogDescription>অর্ডার যোগ করুন • Items will persist to this table</DialogDescription>
          </DialogHeader>

          <div className="flex gap-4 h-[60vh]">
            {/* Items Selection */}
            <div className="flex-1 flex flex-col min-h-0">
              {/* Feature 1: Waiter Selection */}
              <div className="mb-3 p-3 rounded-lg bg-muted/30 border border-border">
                <div className="flex items-center gap-3">
                  <User className="w-5 h-5 text-muted-foreground" />
                  <div className="flex-1 flex items-center gap-3">
                    <Label className="text-sm font-medium whitespace-nowrap">Assign Waiter *</Label>
                    <Select
                      value={selectedWaiterId ?? ""}
                      onValueChange={handleWaiterChange}
                      disabled={updatingWaiter}
                    >
                      <SelectTrigger className="bg-background" disabled={updatingWaiter}>
                        <SelectValue placeholder={updatingWaiter ? "Updating..." : "Select a waiter..."} />
                      </SelectTrigger>
                      <SelectContent>
                        {loadingWaiters ? (
                          <SelectItem value="loading" disabled>Loading waiters...</SelectItem>
                        ) : waiters.length === 0 ? (
                          <SelectItem value="none" disabled>No active waiters found</SelectItem>
                        ) : (
                          waiters.map((waiter) => (
                            <SelectItem
                              key={waiter.id}
                              value={waiter.id}
                              disabled={waiter.id === selectedWaiterId}
                            >
                              {waiter.name} {waiter.nameBn ? `(${waiter.nameBn})` : ""}
                              {waiter.id === selectedWaiterId && " (Current)"}
                            </SelectItem>
                          ))
                        )}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                {!selectedWaiterId && cart.length > 0 && (
                  <p className="text-xs text-destructive mt-2">⚠️ Waiter must be assigned before KOT or billing</p>
                )}
              </div>

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
                    <div className="font-medium text-sm truncate">{item.name}</div>
                    <div className="text-primary font-semibold">{formatCurrency(item.price)}</div>
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
                {(() => {
                  // Filter out items with quantity 0 (voided items) from display
                  const activeCartItems = cart.filter((item) => item.quantity > 0);
                  if (activeCartItems.length === 0) {
                    return (
                      <div className="flex flex-col items-center justify-center h-full text-muted-foreground">
                        <UtensilsCrossed className="w-8 h-8 mb-2 opacity-50" />
                        <p className="text-sm">No items added</p>
                        {/* Show Clear Table button only when all items are voided */}
                        {currentOrder && voidedItems.length > 0 && (
                          <Button
                            variant="destructive"
                            size="sm"
                            className="mt-4"
                            onClick={handleClearTable}
                          >
                            <Trash2 className="w-4 h-4 mr-2" />
                            Clear Table
                          </Button>
                        )}
                      </div>
                    );
                  }
                  return (
                    <>
                      {activeCartItems.map((item) => {
                        const baselineQty = baselineItems.find((b) => b.itemId === item.itemId)?.quantity ?? 0;
                        const isSentItem = baselineQty > 0;

                        return (
                          <div key={item.itemId} className="p-2 rounded-lg bg-muted/30">
                            <div className="flex justify-between items-start mb-1">
                              <div className="font-medium text-sm truncate flex-1 flex items-center gap-1">
                                <span>{item.itemName}</span>
                                {isSentItem && (
                                  <Badge variant="outline" className="text-xs">Sent</Badge>
                                )}
                              </div>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-6 w-6"
                                onClick={() => {
                                  // Only use void handler if feature is enabled AND item is sent to kitchen
                                  if (isFeatureEnabled("void_management") && isSentItem) {
                                    handleVoidDelete(item.itemId);
                                  } else {
                                    // Normal removal - works even for sent items when void management is disabled
                                    removeFromCart(item.itemId);
                                  }
                                }}
                              >
                                <X className="w-3 h-3" />
                              </Button>
                            </div>
                            <div className="flex items-center justify-between">
                              <div className="flex items-center gap-1">
                                {isFeatureEnabled("void_management") && isSentItem ? (
                                  // If void management is enabled and item is sent, use void handlers
                                  <>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => handleVoidReduce(item.itemId)}>
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.itemId, 1)}>
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </>
                                ) : (
                                  // Normal quantity controls - works for all items when void management is disabled
                                  <>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.itemId, -1)}>
                                      <Minus className="w-3 h-3" />
                                    </Button>
                                    <span className="w-6 text-center text-sm">{item.quantity}</span>
                                    <Button variant="ghost" size="icon" className="h-6 w-6" onClick={() => updateQuantity(item.itemId, 1)}>
                                      <Plus className="w-3 h-3" />
                                    </Button>
                                  </>
                                )}
                              </div>
                              <span className="text-sm font-semibold">{formatCurrency(item.total)}</span>
                            </div>
                          </div>
                        );
                      })}

                      {/* Feature 3: Voided Items Section - Only show if feature is enabled */}
                      {isFeatureEnabled("void_management") && voidedItems.length > 0 && (
                        <div className="mt-4 pt-3 border-t border-destructive/30">
                          <h5 className="text-sm font-semibold text-destructive flex items-center gap-1 mb-3">
                            <XCircle className="w-4 h-4" />
                            Voided Items ({voidedItems.length})
                          </h5>
                          <div className="rounded-md border border-destructive/20 overflow-hidden">
                            <Table>
                              <TableHeader>
                                <TableRow className="bg-destructive/10 hover:bg-destructive/15">
                                  <TableHead className="w-[200px] text-xs font-semibold">Item Name</TableHead>
                                  <TableHead className="w-[80px] text-xs font-semibold text-center">Original Qty</TableHead>
                                  <TableHead className="w-[80px] text-xs font-semibold text-center">Voided Qty</TableHead>
                                  <TableHead className="text-xs font-semibold">Reason</TableHead>
                                  <TableHead className="w-[120px] text-xs font-semibold">Voided By</TableHead>
                                  <TableHead className="w-[120px] text-xs font-semibold">Time</TableHead>
                                </TableRow>
                              </TableHeader>
                              <TableBody>
                                {voidedItems.map((voided, idx) => (
                                  <TableRow key={idx} className="hover:bg-destructive/5">
                                    <TableCell className="font-medium text-sm line-through text-muted-foreground">
                                      {voided.itemName}
                                    </TableCell>
                                    <TableCell className="text-center text-sm">
                                      {voided.originalQuantity}
                                    </TableCell>
                                    <TableCell className="text-center text-sm text-destructive font-semibold">
                                      -{voided.voidedQuantity}
                                    </TableCell>
                                    <TableCell className="text-sm text-muted-foreground max-w-[200px] truncate" title={voided.reason}>
                                      {voided.reason}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {voided.voidedBy}
                                    </TableCell>
                                    <TableCell className="text-xs text-muted-foreground">
                                      {formatTime(new Date(voided.voidedAt), timezone)}
                                    </TableCell>
                                  </TableRow>
                                ))}
                              </TableBody>
                            </Table>
                          </div>
                        </div>
                      )}
                    </>
                  );
                })()}
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

              <Button
                variant="glow"
                className="mt-3"
                onClick={handleSendKot}
                disabled={!hasDeltaItems || !selectedWaiterId || sendingKOT}
              >
                <Check className="w-4 h-4 mr-2" />
                {sendingKOT ? "Sending..." : "Send to Kitchen (KOT)"}
              </Button>
              <Button
                variant="outline"
                className="mt-2"
                onClick={handleGoToBilling}
                disabled={cart.length === 0 && baselineItems.length === 0 || goingToBilling}
              >
                {goingToBilling ? "Processing..." : "Go to Billing"}
              </Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Feature 3: Void Reason Dialog */}
      <AlertDialog open={showVoidReasonDialog} onOpenChange={setShowVoidReasonDialog}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Void Item - Reason Required
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-4">
                <div>
                  You are about to {pendingVoid?.action === 'delete' ? 'remove' : 'reduce quantity of'}{' '}
                  <strong>{pendingVoid?.itemName}</strong> that has already been sent to the kitchen.
                </div>

                <div className="flex flex-wrap gap-2">
                  {voidReasonSuggestions.map((suggestion) => (
                    <Button
                      key={suggestion}
                      variant="outline"
                      size="sm"
                      onClick={() => setVoidReason(suggestion)}
                      className={voidReason === suggestion ? "border-primary" : ""}
                    >
                      {suggestion}
                    </Button>
                  ))}
                </div>

                <div>
                  <Label>Reason (minimum 10 characters) *</Label>
                  <Textarea
                    value={voidReason}
                    onChange={(e) => setVoidReason(e.target.value)}
                    placeholder="Enter detailed reason for voiding this item..."
                    className="mt-1"
                    rows={3}
                  />
                  <div className="text-xs text-muted-foreground mt-1">
                    {voidReason.length}/10 characters
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => {
              setPendingVoid(null);
              setVoidReason("");
            }}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleVoidConfirm}
              className="bg-destructive hover:bg-destructive/90"
              disabled={voidReason.trim().length < 10}
            >
              <XCircle className="w-4 h-4 mr-2" />
              Confirm Void
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
                  serviceCharge={billServiceCharge ? currentOrder.items.reduce((sum, item) => sum + item.total, 0) * 0.05 : 0}
                  extraDiscount={billDiscount}
                />
              </div>

              {/* Preview bill */}
              <div className="p-4 rounded-lg bg-muted/30 space-y-2 font-mono max-h-[40vh] overflow-auto custom-scrollbar">
                <div className="text-center mb-4 border-b-2 border-dashed border-border pb-3">
                  <h3 className="font-display font-bold text-xl">RysTRO</h3>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatWithTimezone(new Date(), timezone)}
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
                    {billServiceCharge ? "Applied" : "Apply"}
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
                    {billServiceCharge && (() => {
                      // Service charge must be calculated on VAT-inclusive amount (itemsTotal), not VAT-exclusive subtotal
                      // IMPORTANT: Don't round service charge to match POS Sales behavior (52.5, not 53)
                      const itemsTotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
                      const serviceChargeAmount = itemsTotal * 0.05;
                      return (
                        <div className="flex justify-between text-primary">
                          <span>+ Service Charge:</span>
                          <span>+{formatCurrency(serviceChargeAmount)}</span>
                        </div>
                      );
                    })()}
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
                          (() => {
                            // Calculate correct total: Subtotal (VAT-exclusive) + VAT + Service Charge - Discount
                            const itemsTotal = currentOrder.items.reduce((sum, item) => sum + item.total, 0);
                            // IMPORTANT: Don't round service charge to match POS Sales behavior (52.5, not 53)
                            const serviceChargeAmount = billServiceCharge ? itemsTotal * 0.05 : 0;
                            // Calculate VAT-exclusive subtotal and VAT
                            const calculatedVat = currentOrder.vatAmount > 0
                              ? currentOrder.vatAmount
                              : currentOrder.items.reduce((sum, item) => {
                                if (!item.vatRate || item.vatRate === 0) return sum;
                                const itemVat = (item.total * item.vatRate) / (100 + item.vatRate);
                                return sum + itemVat;
                              }, 0);
                            const displayVat = Math.round(calculatedVat);
                            const displaySubtotal = Math.round(itemsTotal - calculatedVat);
                            // Total = Subtotal (VAT-exclusive) + VAT + Service Charge - Discount
                            return displaySubtotal + displayVat + serviceChargeAmount - billDiscount;
                          })()
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
                  waiterName={selectedWaiterName ?? undefined}
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
                    <span>{formatDate(typeof lastKot.time === 'string' ? new Date(lastKot.time) : lastKot.time, timezone)}</span>
                  </div>
                  {selectedWaiterName && (
                    <div className="flex justify-between text-sm">
                      <span>Waiter:</span>
                      <span>{selectedWaiterName}</span>
                    </div>
                  )}
                </div>

                <div className="border-t-2 border-dashed border-border pt-3 mb-3">
                  <p className="font-bold mb-2 text-xs uppercase tracking-wider">Items:</p>
                  {lastKot.items.map((item, idx) => (
                    <div key={idx} className="mb-2 flex items-center gap-2">
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

      {/* Clear Table Confirmation Dialog */}
      <AlertDialog open={showClearTableConfirm} onOpenChange={setShowClearTableConfirm}>
        <AlertDialogContent className="glass-card border-2 border-destructive/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display gradient-text text-xl flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Clear Table?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
                <div className="flex items-center gap-2 text-base">
                  <UtensilsCrossed className="w-5 h-5 text-destructive" />
                  <span className="font-semibold">Table: {selectedTable?.tableNo}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  This will cancel the current order and reset the table to empty. All order data will be permanently deleted.
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setShowClearTableConfirm(false)}>
              Cancel
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmClearTable}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear Table
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Finalize Bill Confirmation Dialog */}
      <AlertDialog open={showFinalizeConfirm} onOpenChange={setShowFinalizeConfirm}>
        <AlertDialogContent className="glass-card border-2 border-primary/30">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display gradient-text text-xl">
              Finalize Bill?
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-3 pt-2">
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
                    // IMPORTANT: Don't round service charge to match POS Sales behavior (52.5, not 53)
                    const serviceChargeAmount = billServiceCharge ? itemsTotal * 0.05 : 0;

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
                  <div className="text-sm">
                    Table will be marked as <span className="font-semibold text-accent">free</span> after payment is processed.
                  </div>
                </div>
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
