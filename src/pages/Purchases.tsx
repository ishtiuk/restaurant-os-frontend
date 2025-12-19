import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { suppliersApi, type SupplierDto, type SupplierPaymentDto } from "@/lib/api/suppliers";
import { purchasesApi, type PurchaseOrderDto, type PurchaseOrderItemCreateInput } from "@/lib/api/purchases";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Truck, Check, Clock, X, Eye, Trash2, CheckCircle2, HelpCircle, Info, Calculator, Calendar as CalendarIcon } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate as formatDateWithTimezone, getStartOfDay } from "@/utils/date";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

// Convert English digits to Bengali numerals
const toBengaliNumeral = (num: number | string): string => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num)
    .split("")
    .map((digit) => {
      const parsed = parseInt(digit, 10);
      return !isNaN(parsed) && parsed >= 0 && parsed <= 9 ? bengaliDigits[parsed] : digit;
    })
    .join("");
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "received":
      return (
        <Badge variant="success">
          <Check className="w-3 h-3 mr-1" />
          Received
        </Badge>
      );
    case "pending":
      return (
        <Badge variant="warning">
          <Clock className="w-3 h-3 mr-1" />
          Pending
        </Badge>
      );
    case "cancelled":
      return (
        <Badge variant="danger">
          <X className="w-3 h-3 mr-1" />
          Cancelled
        </Badge>
      );
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

interface POItem {
  product_id: number | null; // Always null - manual entry only
  item_name: string;
  quantity: number;
  unit_price: number;
  total: number;
}

export default function Purchases() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();
  const { items } = useAppData(); // Use items from context for product selection
  const { timezone } = useTimezone();

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [supplierPayments, setSupplierPayments] = useState<SupplierPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDto | null>(null);
  const [creating, setCreating] = useState(false);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [poPage, setPoPage] = useState(1);
  const [poPageSize] = useState(20);
  const [poTotal, setPoTotal] = useState(0);
  const [form, setForm] = useState({
    supplierId: "",
    invoiceNo: "",
    expectedDeliveryDate: "",
    notes: "",
    items: [] as POItem[],
  });

  // Check if supplier was pre-selected from Suppliers page
  useEffect(() => {
    const supplierId = location.state?.supplierId || searchParams.get("supplier");
    if (supplierId && suppliers.length > 0) {
      setForm((f) => ({ ...f, supplierId }));
      setShowNew(true);
    }
  }, [location.state, searchParams, suppliers]);

  // Check if PO was selected to view
  useEffect(() => {
    const poId = searchParams.get("po");
    if (poId && purchaseOrders.length > 0) {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (po) {
        setSelectedPO(po);
        setShowView(true);
      }
    }
  }, [searchParams, purchaseOrders]);

  // Load data
  useEffect(() => {
    let mounted = true;
    let timeoutId: NodeJS.Timeout;
    
    const load = async () => {
      try {
        setLoading(true);
        
        // Set a timeout to ensure loading state is cleared even if API hangs
        timeoutId = setTimeout(() => {
          if (mounted) {
            setLoading(false);
          }
        }, 30000); // 30 second timeout
        
        const offset = (poPage - 1) * poPageSize;
        const [suppliersData, posData, paymentsData] = await Promise.all([
          suppliersApi.list(),
          purchasesApi.list({ limit: poPageSize, offset: offset }),
          suppliersApi.listPayments(),
        ]);
        
        clearTimeout(timeoutId);
        
        if (mounted) {
          setSuppliers(suppliersData || []);
          setPurchaseOrders(posData || []);
          setSupplierPayments(paymentsData || []);
          // Estimate total - if we got a full page, there might be more
          if (posData.length === poPageSize) {
            setPoTotal((poPage + 1) * poPageSize);
          } else {
            setPoTotal((poPage - 1) * poPageSize + posData.length);
          }
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (mounted) {
          toast({
            title: "Failed to load data",
            description: error?.message || "An unexpected error occurred",
            variant: "destructive",
          });
          setSuppliers([]);
          setPurchaseOrders([]);
        }
      } finally {
        if (mounted) {
          setLoading(false);
        }
      }
    };
    
    load();
    
    return () => {
      mounted = false;
      if (timeoutId) clearTimeout(timeoutId);
    };
  }, [poPage, poPageSize]);

  const totalPendingValue = useMemo(
    () =>
      purchaseOrders
        .filter((po) => po.status === "pending")
        .reduce((sum, po) => sum + po.total_amount, 0),
    [purchaseOrders]
  );

  const totalThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = getStartOfDay(new Date(now.getFullYear(), now.getMonth(), 1), timezone);
    return purchaseOrders
      .filter((po) => {
        const poDate = new Date(po.order_date);
        return poDate >= startOfMonth;
      })
      .reduce((sum, po) => sum + po.total_amount, 0);
  }, [purchaseOrders, timezone]);

  const addItemToForm = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          product_id: null,
          item_name: "",
          quantity: 1,
          unit_price: 0,
          total: 0,
        },
      ],
    }));
  };

  const updateItem = (index: number, updates: Partial<POItem>) => {
    setForm((f) => {
      const newItems = [...f.items];
      const item = { ...newItems[index], ...updates };
      if (updates.quantity !== undefined || updates.unit_price !== undefined) {
        item.total = item.quantity * item.unit_price;
      }
      newItems[index] = item;
      return { ...f, items: newItems };
    });
  };

  const removeItem = (index: number) => {
    setForm((f) => ({
      ...f,
      items: f.items.filter((_, i) => i !== index),
    }));
  };

  const handleCreate = async () => {
    if (!form.supplierId || form.items.length === 0) {
      toast({ title: "Select supplier and add at least one item", variant: "destructive" });
      return;
    }

    for (const item of form.items) {
      if (!item.item_name || item.item_name.trim() === "") {
        toast({ title: "Item name is required", variant: "destructive" });
        return;
      }
      if (item.quantity <= 0 || item.unit_price <= 0) {
        toast({ title: "Quantity and unit price must be greater than 0", variant: "destructive" });
        return;
      }
    }

    setCreating(true);
    try {
      const itemsToCreate: PurchaseOrderItemCreateInput[] = form.items.map((item) => ({
        product_id: item.product_id || null, // null for manual entries
        item_name: item.item_name.trim(),
        quantity: item.quantity,
        unit_price: item.unit_price,
        total: item.total,
      }));

      const created = await purchasesApi.create({
        supplier_id: form.supplierId,
        invoice_no: form.invoiceNo || undefined,
        expected_delivery_date: form.expectedDeliveryDate || undefined,
        notes: form.notes || undefined,
        items: itemsToCreate,
      });

      setPurchaseOrders((prev) => [created, ...prev]);
      setShowNew(false);
      setForm({
        supplierId: "",
        invoiceNo: "",
        expectedDeliveryDate: "",
        notes: "",
        items: [],
      });
      toast({ title: "Purchase order created successfully" });
    } catch (error: any) {
      toast({
        title: "Failed to create purchase order",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setCreating(false);
    }
  };

  const handleReceive = async (poId: string) => {
    try {
      const po = purchaseOrders.find((p) => p.id === poId);
      if (!po) return;

      const receiveItems = po.items.map((item) => ({
        item_id: item.id,
        received_quantity: item.quantity, // Receive full quantity by default
      }));

      const updated = await purchasesApi.receive(poId, {
        items: receiveItems,
      });

      // Update the selected PO if it's the one being received
      if (selectedPO?.id === poId) {
        setSelectedPO(updated);
      }

      setPurchaseOrders((prev) => prev.map((p) => (p.id === poId ? updated : p)));
      toast({ title: "Purchase order marked as received" });
    } catch (error: any) {
      toast({
        title: "Failed to receive purchase order",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getSupplierName = (supplierId: string) => {
    return suppliers.find((s) => s.id === supplierId)?.name || "Unknown";
  };

  // Calculate due amount for a purchase order
  const getPODueAmount = (poId: string, totalAmount: number): number => {
    const paidForPO = supplierPayments
      .filter((p) => p.purchase_order_id === poId)
      .reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, totalAmount - paidForPO);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading purchase orders...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Purchases</h1>
          <p className="text-muted-foreground">ক্রয় অর্ডার ম্যানেজমেন্ট • Purchase Orders</p>
        </div>
        <Button variant="glow" onClick={() => setShowNew(true)}>
          <Plus className="w-4 h-4 mr-2" />
          New Purchase Order
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in stagger-1">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Pending Orders</p>
          <p className="text-2xl font-display font-bold text-primary">
            {toBengaliNumeral(purchaseOrders.filter((po) => po.status === "pending").length)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Pending Value</p>
          <p className="text-2xl font-display font-bold">{formatCurrency(totalPendingValue)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-display font-bold text-accent">{formatCurrency(totalThisMonth)}</p>
        </GlassCard>
      </div>

      {/* Orders Table */}
      <GlassCard className="overflow-hidden animate-fade-in stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium">PO #</th>
                <th className="text-left p-4 font-medium">Supplier</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-right p-4 font-medium">Due</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => {
                const dueAmount = getPODueAmount(po.id, po.total_amount);
                return (
                  <tr key={po.id} className="border-b border-border/50 table-row-hover">
                    <td className="p-4 font-medium">PO-{po.id.slice(-8).toUpperCase()}</td>
                    <td className="p-4">
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                          <Truck className="w-4 h-4 text-secondary" />
                        </div>
                        {getSupplierName(po.supplier_id)}
                      </div>
                    </td>
                    <td className="p-4 text-muted-foreground">{formatDateWithTimezone(po.order_date, timezone)}</td>
                    <td className="p-4 text-right">
                      <span className={dueAmount > 0 ? "font-medium text-warning" : "text-muted-foreground"}>
                        {formatCurrency(dueAmount)}
                      </span>
                    </td>
                    <td className="p-4 text-right font-medium">{formatCurrency(po.total_amount)}</td>
                    <td className="p-4 text-center">{getStatusBadge(po.status)}</td>
                    <td className="p-4 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedPO(po);
                            setShowView(true);
                          }}
                        >
                          <Eye className="w-4 h-4 mr-1" />
                          View
                        </Button>
                        {po.status === "pending" && (
                          <Button variant="outline" size="sm" onClick={() => handleReceive(po.id)}>
                            <Check className="w-4 h-4 mr-1" />
                            Mark Received
                          </Button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })}
              {purchaseOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center">
                    <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                    <h3 className="text-lg font-semibold mb-2">No purchase orders yet</h3>
                    <p className="text-muted-foreground mb-4">
                      Create your first purchase order to start tracking your purchases from suppliers.
                    </p>
                    <Button variant="glow" onClick={() => setShowNew(true)}>
                      <Plus className="w-4 h-4 mr-2" />
                      Create First Purchase Order
                    </Button>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
        {poTotal > poPageSize && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (poPage > 1) {
                      setPoPage(poPage - 1);
                    }
                  }}
                  className={poPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.ceil(poTotal / poPageSize) }, (_, i) => i + 1)
                .filter((page) => {
                  const totalPages = Math.ceil(poTotal / poPageSize);
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= poPage - 1 && page <= poPage + 1)
                  );
                })
                .map((page, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && arr[idx - 1] < page - 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setPoPage(page)}
                          isActive={poPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (poPage < Math.ceil(poTotal / poPageSize)) {
                      setPoPage(poPage + 1);
                    }
                  }}
                  className={
                    poPage >= Math.ceil(poTotal / poPageSize)
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </GlassCard>

      {/* New PO Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-2xl glass-card max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">New Purchase Order</DialogTitle>
            <DialogDescription>Create a new purchase order for items you're purchasing from a supplier</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Select a supplier and add the items you're purchasing. You can enter any item manually - it doesn't need to be in your product catalog.
              </p>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>Supplier *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Select the supplier you're purchasing from. If you don't see them, add them from the Suppliers page first.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={form.supplierId}
                  onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="Select supplier" />
                  </SelectTrigger>
                  <SelectContent>
                    {suppliers.map((s) => (
                      <SelectItem key={s.id} value={s.id}>
                        {s.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Expected Delivery Date (Optional)</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/50 hover:bg-muted/70",
                        !form.expectedDeliveryDate && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {form.expectedDeliveryDate ? (
                        formatDateWithTimezone(form.expectedDeliveryDate, timezone)
                      ) : (
                        <span>dd/mm/yyyy</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={form.expectedDeliveryDate ? new Date(form.expectedDeliveryDate) : undefined}
                      onSelect={(date) => {
                        if (date) {
                          setForm((f) => ({
                            ...f,
                            expectedDeliveryDate: format(date, "yyyy-MM-dd"),
                          }));
                          setCalendarOpen(false); // Close calendar after selection
                        } else {
                          setForm((f) => ({ ...f, expectedDeliveryDate: "" }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label>Invoice No. (Optional)</Label>
                <Input
                  value={form.invoiceNo}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceNo: e.target.value }))}
                  className="bg-muted/50"
                  placeholder="e.g., INV-2024-001"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes (Optional)</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="bg-muted/50"
                placeholder="Any additional notes about this purchase order..."
                rows={2}
              />
            </div>

            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Label className="text-base font-semibold">Items *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-4 h-4 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent className="max-w-xs">
                      <p>Add items you're purchasing. Enter the item name, quantity, and price. The total will be calculated automatically.</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Button variant="outline" size="sm" onClick={addItemToForm}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {form.items.map((item, index) => (
                <div key={index} className="space-y-3 p-4 border border-border rounded-lg bg-muted/20 hover:border-primary/30 transition-colors">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-muted-foreground">Item #{index + 1}</span>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive h-8 w-8 p-0"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                  <div className="grid grid-cols-1 md:grid-cols-12 gap-3">
                    {/* Item Name - Full width on mobile, 5 cols on desktop */}
                    <div className="col-span-12 md:col-span-5">
                      <div className="flex items-center gap-1 mb-1 h-5">
                        <Label className="text-xs text-muted-foreground leading-none">
                          Item Name *
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Enter the name of the item (e.g., Rice, Cleaning Supplies, Equipment)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="text"
                        placeholder="e.g., Rice, Cleaning Supplies, Equipment"
                        value={item.item_name}
                        onChange={(e) => updateItem(index, { item_name: e.target.value })}
                        className="bg-muted/50"
                      />
                    </div>
                    {/* Quantity - 3 cols on mobile, 2 cols on desktop */}
                    <div className="col-span-4 md:col-span-2">
                      <div className="flex items-center gap-1 mb-1 h-5">
                        <Label className="text-xs text-muted-foreground leading-none">
                          Quantity
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>How many units are you purchasing?</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        placeholder="Qty"
                        value={item.quantity || ""}
                        onChange={(e) => updateItem(index, { quantity: parseFloat(e.target.value) || 0 })}
                        className="bg-muted/50"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {/* Unit Price - 4 cols on mobile, 2 cols on desktop */}
                    <div className="col-span-4 md:col-span-2">
                      <div className="flex items-center gap-1 mb-1 h-5">
                        <Label className="text-xs text-muted-foreground leading-none">
                          Unit Price (৳)
                        </Label>
                        <Tooltip>
                          <TooltipTrigger asChild>
                            <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help flex-shrink-0" />
                          </TooltipTrigger>
                          <TooltipContent>
                            <p>Price per unit in Taka (৳)</p>
                          </TooltipContent>
                        </Tooltip>
                      </div>
                      <Input
                        type="number"
                        placeholder="0.00"
                        value={item.unit_price || ""}
                        onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                        className="bg-muted/50"
                        min="0"
                        step="0.01"
                      />
                    </div>
                    {/* Total - 4 cols on mobile, 3 cols on desktop */}
                    <div className="col-span-4 md:col-span-3">
                      <div className="flex items-center gap-1 mb-1 h-5">
                        <Label className="text-xs text-muted-foreground leading-none flex items-center gap-1">
                          <Calculator className="w-3 h-3 flex-shrink-0" />
                          Total (৳)
                        </Label>
                      </div>
                      <Input
                        type="text"
                        value={formatCurrency(item.total)}
                        readOnly
                        className="bg-muted/50 font-semibold text-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
              {form.items.length === 0 && (
                <div className="p-6 border-2 border-dashed border-border rounded-lg text-center bg-muted/10">
                  <Truck className="w-12 h-12 mx-auto mb-3 text-muted-foreground opacity-50" />
                  <p className="text-sm font-medium mb-1">No items added yet</p>
                  <p className="text-xs text-muted-foreground mb-4">
                    Click "Add Item" above to start adding items to this purchase order
                  </p>
                  <Button variant="outline" size="sm" onClick={addItemToForm}>
                    <Plus className="w-4 h-4 mr-1" />
                    Add Your First Item
                  </Button>
                </div>
              )}
            </div>

            <div className="p-4 rounded-lg bg-primary/5 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground mb-1">Total Purchase Order Amount</p>
                  <p className="text-2xl font-display font-bold gradient-text">
                    {formatCurrency(form.items.reduce((sum, item) => sum + item.total, 0))}
                  </p>
                </div>
                <Calculator className="w-8 h-8 text-primary opacity-50" />
              </div>
              {form.items.length > 0 && (
                <p className="text-xs text-muted-foreground mt-2">
                  {form.items.length} item{form.items.length !== 1 ? "s" : ""} • Total calculated automatically
                </p>
              )}
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button 
              variant="glow" 
              onClick={handleCreate} 
              disabled={creating || form.items.length === 0 || !form.supplierId}
              className="min-w-[120px]"
            >
              {creating ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <CheckCircle2 className="w-4 h-4 mr-2" />
                  Create Purchase Order
                </>
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View PO Dialog */}
      <Dialog open={showView} onOpenChange={setShowView}>
        <DialogContent className="max-w-3xl glass-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              Purchase Order: PO-{selectedPO?.id.slice(-8).toUpperCase()}
            </DialogTitle>
            <DialogDescription>
              {selectedPO && getSupplierName(selectedPO.supplier_id)} • {selectedPO && formatDateWithTimezone(selectedPO.order_date, timezone)}
            </DialogDescription>
          </DialogHeader>
          {selectedPO && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label className="text-xs text-muted-foreground">Status</Label>
                  <div className="mt-1">{getStatusBadge(selectedPO.status)}</div>
                </div>
                <div>
                  <Label className="text-xs text-muted-foreground">Total Amount</Label>
                  <div className="mt-1 text-xl font-display font-bold">
                    {formatCurrency(selectedPO.total_amount)}
                  </div>
                </div>
                {selectedPO.invoice_no && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Invoice No.</Label>
                    <div className="mt-1">{selectedPO.invoice_no}</div>
                  </div>
                )}
                {selectedPO.expected_delivery_date && (
                  <div>
                    <Label className="text-xs text-muted-foreground">Expected Delivery</Label>
                    <div className="mt-1">{formatDateWithTimezone(selectedPO.expected_delivery_date, timezone)}</div>
                  </div>
                )}
              </div>

              {selectedPO.notes && (
                <div>
                  <Label className="text-xs text-muted-foreground">Notes</Label>
                  <p className="mt-1 text-sm">{selectedPO.notes}</p>
                </div>
              )}

              <div>
                <Label className="text-xs text-muted-foreground mb-2 block">Items</Label>
                <div className="border border-border rounded-lg overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-muted/50">
                      <tr>
                        <th className="p-2 text-left">Product</th>
                        <th className="p-2 text-right">Quantity</th>
                        <th className="p-2 text-right">Unit Price</th>
                        <th className="p-2 text-right">Total</th>
                        {selectedPO.status === "received" && (
                          <th className="p-2 text-right">Received</th>
                        )}
                      </tr>
                    </thead>
                    <tbody>
                      {selectedPO.items.map((item) => (
                        <tr key={item.id} className="border-t border-border/50">
                          <td className="p-2">{item.item_name}</td>
                          <td className="p-2 text-right">{item.quantity}</td>
                          <td className="p-2 text-right">{formatCurrency(item.unit_price)}</td>
                          <td className="p-2 text-right font-semibold">{formatCurrency(item.total)}</td>
                          {selectedPO.status === "received" && (
                            <td className="p-2 text-right">{item.received_quantity}</td>
                          )}
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowView(false)}>
              Close
            </Button>
            {selectedPO?.status === "pending" && (
              <Button variant="glow" onClick={() => handleReceive(selectedPO.id)}>
                <Check className="w-4 h-4 mr-1" />
                Mark Received
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
