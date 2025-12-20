import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate as formatDateWithTimezone, getDateOnly } from "@/utils/date";
import { Plus, Search, Phone, Mail, MapPin, Truck, Clock, Check, X, Eye, DollarSign, Receipt, HelpCircle, Info, Calendar as CalendarIcon } from "lucide-react";
import {
  suppliersApi,
  type SupplierDto,
  type SupplierPaymentDto,
  type SupplierPaymentCreateInput,
} from "@/lib/api/suppliers";
import { purchasesApi, type PurchaseOrderDto } from "@/lib/api/purchases";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const getStatusBadge = (status: string) => {
  switch (status) {
    case "received":
      return <Badge variant="success"><Check className="w-3 h-3 mr-1" />Received</Badge>;
    case "pending":
      return <Badge variant="warning"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "cancelled":
      return <Badge variant="danger"><X className="w-3 h-3 mr-1" />Cancelled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function Suppliers() {
  const navigate = useNavigate();
  const { timezone } = useTimezone();
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [payments, setPayments] = useState<SupplierPaymentDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [showAddPayment, setShowAddPayment] = useState(false);
  const [showDeletePayment, setShowDeletePayment] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [paymentToDelete, setPaymentToDelete] = useState<SupplierPaymentDto | null>(null);
  const [calendarOpen, setCalendarOpen] = useState(false);
  const [paymentPage, setPaymentPage] = useState(1);
  const [paymentPageSize] = useState(10);
  const [paymentTotal, setPaymentTotal] = useState(0);
  const [poPage, setPoPage] = useState(1);
  const [poPageSize] = useState(10);
  const [poTotal, setPoTotal] = useState(0);
  const [supplierPOsPaginated, setSupplierPOsPaginated] = useState<PurchaseOrderDto[]>([]);
  const [paymentForm, setPaymentForm] = useState<SupplierPaymentCreateInput>({
    supplier_id: "",
    purchase_order_id: null,
    amount: 0,
    payment_date: getDateOnly(new Date(), timezone),
    payment_method: "cash",
    reference_no: "",
    notes: "",
  });
  const [submittingPayment, setSubmittingPayment] = useState(false);
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
    contact_person: "",
    notes: "",
  });
  const [submitting, setSubmitting] = useState(false);

  // Load suppliers and purchase orders
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
        
        const [suppliersData, posData] = await Promise.all([
          suppliersApi.list(),
          purchasesApi.list({ limit: 1000 }),
        ]);
        
        clearTimeout(timeoutId);
        
        if (mounted) {
          setSuppliers(suppliersData || []);
          setPurchaseOrders(posData || []);
        }
      } catch (error: any) {
        clearTimeout(timeoutId);
        if (mounted) {
          toast({
            title: "Failed to load suppliers",
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
  }, []);

  const filtered = useMemo(
    () =>
      suppliers.filter(
        (s) =>
          s.name.toLowerCase().includes(search.toLowerCase()) ||
          (s.email ?? "").toLowerCase().includes(search.toLowerCase()) ||
          s.phone.includes(search)
      ),
    [search, suppliers]
  );

  const selectedSupplier = selectedSupplierId
    ? suppliers.find((s) => s.id === selectedSupplierId) || null
    : null;

  // Get purchase orders for selected supplier (use paginated data if in ledger view, otherwise use all)
  // Helper function for consistent UTC date parsing
  const parseUTCDate = (dateStr: string) => {
    const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
    return new Date(utcStr).getTime();
  };
  
  const supplierPOs = useMemo(() => {
    if (!selectedSupplier) return [];
    if (showLedger && supplierPOsPaginated.length > 0) {
      // Use paginated data when viewing ledger
      return supplierPOsPaginated.sort((a, b) => parseUTCDate(b.order_date) - parseUTCDate(a.order_date));
    }
    // Fallback to all purchase orders (for stats calculation)
    return purchaseOrders
      .filter((po) => po.supplier_id === selectedSupplier.id)
      .sort((a, b) => parseUTCDate(b.order_date) - parseUTCDate(a.order_date));
  }, [selectedSupplier, purchaseOrders, showLedger, supplierPOsPaginated]);

  // Calculate totals from POs and payments
  const poStats = useMemo(() => {
    if (!selectedSupplier) return { totalPurchases: 0, totalPending: 0, totalReceived: 0, totalPaid: 0 };
    const pos = supplierPOs;
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);
    return {
      totalPurchases: pos.reduce((sum, po) => sum + po.total_amount, 0),
      totalPending: pos.filter((po) => po.status === "pending").reduce((sum, po) => sum + po.total_amount, 0),
      totalReceived: pos.filter((po) => po.status === "received").reduce((sum, po) => sum + po.total_amount, 0),
      totalPaid,
    };
  }, [selectedSupplier, supplierPOs, payments]);

  // Calculate remaining balance per PO
  const getPORemainingBalance = (poId: string) => {
    const po = supplierPOs.find((p) => p.id === poId);
    if (!po) return 0;
    const paidForPO = payments
      .filter((p) => p.purchase_order_id === poId)
      .reduce((sum, p) => sum + p.amount, 0);
    return Math.max(0, po.total_amount - paidForPO);
  };

  const handleCreatePayment = async () => {
    if (!paymentForm.amount || paymentForm.amount <= 0) {
      toast({ title: "Payment amount must be greater than 0", variant: "destructive" });
      return;
    }
    if (!selectedSupplier) return;

    setSubmittingPayment(true);
    try {
      const created = await suppliersApi.createPayment({
        ...paymentForm,
        supplier_id: selectedSupplier.id,
      });
      setPayments((prev) => [created, ...prev]);
      // Refresh supplier to get updated balance
      const updatedSupplier = await suppliersApi.get(selectedSupplier.id);
      setSuppliers((prev) => prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s)));
      setShowAddPayment(false);
      setPaymentForm({
        supplier_id: "",
        purchase_order_id: null,
        amount: 0,
        payment_date: getDateOnly(new Date(), timezone),
        payment_method: "cash",
        reference_no: "",
        notes: "",
      });
      toast({ title: "Payment recorded successfully" });
    } catch (error: any) {
      toast({
        title: "Failed to record payment",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setSubmittingPayment(false);
    }
  };

  const openLedger = async (supplierId: string, page: number = 1, poPageNum: number = 1) => {
    setSelectedSupplierId(supplierId);
    setShowLedger(true);
    setPaymentPage(page);
    setPoPage(poPageNum);
    
    // Load payments for this supplier with pagination
    try {
      const offset = (page - 1) * paymentPageSize;
      const paymentsData = await suppliersApi.listPayments({
        supplier_id: supplierId,
        limit: paymentPageSize,
        offset: offset,
      });
      setPayments(paymentsData);
      // If we got a full page, there might be more. For now, we'll assume there are more if we got pageSize items
      // In a real implementation, the API should return total count
      if (paymentsData.length === paymentPageSize) {
        // Likely more pages, set total to indicate there's at least one more page
        setPaymentTotal((page + 1) * paymentPageSize);
      } else {
        // This is the last page
        setPaymentTotal((page - 1) * paymentPageSize + paymentsData.length);
      }
    } catch (error: any) {
      toast({
        title: "Failed to load payments",
        description: error.message,
        variant: "destructive",
      });
    }
    
    // Load purchase orders for this supplier with pagination
    try {
      const poOffset = (poPageNum - 1) * poPageSize;
      const posData = await purchasesApi.list({
        supplier_id: supplierId,
        limit: poPageSize,
        offset: poOffset,
      });
      setSupplierPOsPaginated(posData);
      // Estimate total
      if (posData.length === poPageSize) {
        setPoTotal((poPageNum + 1) * poPageSize);
      } else {
        setPoTotal((poPageNum - 1) * poPageSize + posData.length);
      }
    } catch (error: any) {
      console.error("Failed to load purchase orders", error);
    }
  };
  
  // Load purchase orders when PO page changes
  useEffect(() => {
    const loadPOs = async () => {
      if (!selectedSupplierId || !showLedger) return;
      try {
        const poOffset = (poPage - 1) * poPageSize;
        const posData = await purchasesApi.list({
          supplier_id: selectedSupplierId,
          limit: poPageSize,
          offset: poOffset,
        });
        setSupplierPOsPaginated(posData);
        // Estimate total
        if (posData.length === poPageSize) {
          setPoTotal((poPage + 1) * poPageSize);
        } else {
          setPoTotal((poPage - 1) * poPageSize + posData.length);
        }
      } catch (error: any) {
        console.error("Failed to load purchase orders", error);
      }
    };
    loadPOs();
  }, [poPage, poPageSize, selectedSupplierId, showLedger]);

  const handleCreateSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      toast({ title: "Name and phone required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    try {
      const created = await suppliersApi.create({
        name: supplierForm.name,
        phone: supplierForm.phone,
        email: supplierForm.email || undefined,
        address: supplierForm.address || undefined,
        contact_person: supplierForm.contact_person || undefined,
        notes: supplierForm.notes || undefined,
      });
      setSuppliers((prev) => [created, ...prev]);
      setSupplierForm({ name: "", phone: "", email: "", address: "", contact_person: "", notes: "" });
      setShowAddSupplier(false);
      toast({ title: "Supplier added successfully" });
    } catch (error: any) {
      toast({
        title: "Failed to create supplier",
        description: error.message,
        variant: "destructive",
      });
    } finally {
    setSubmitting(false);
    }
  };

  const handleNewOrder = (supplierId: string) => {
    // Navigate to Purchases page with supplier pre-selected
    navigate("/purchases", { state: { supplierId } });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-muted-foreground">Loading suppliers...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Suppliers</h1>
          <p className="text-muted-foreground">সরবরাহকারী ম্যানেজমেন্ট • Vendor Management</p>
        </div>
        <Button variant="glow" onClick={() => setShowAddSupplier(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <GlassCard className="p-4 animate-fade-in stagger-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search suppliers..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </GlassCard>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((supplier, index) => (
          <GlassCard
            key={supplier.id}
            hover
            glow="secondary"
            className="p-5 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{supplier.name}</h3>
                <p className="text-sm text-muted-foreground">
                  Since {formatDateWithTimezone(supplier.created_at, timezone)}
                </p>
              </div>
              {supplier.balance > 0 ? (
                <Badge variant="warning">Due: {formatCurrency(supplier.balance)}</Badge>
              ) : (
                <Badge variant="success">Paid</Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{supplier.phone}</span>
              </div>
              {supplier.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span className="truncate">{supplier.address}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button
                variant="outline"
                size="sm"
                className="flex-1"
                onClick={() => openLedger(supplier.id)}
              >
                <Eye className="w-4 h-4 mr-1" />
                View History
              </Button>
              <Button
                variant="glass"
                size="sm"
                className="flex-1"
                onClick={() => handleNewOrder(supplier.id)}
              >
                <Truck className="w-4 h-4 mr-1" />
                New Order
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 && search && (
        <GlassCard className="p-8 text-center">
          <Search className="w-12 h-12 mx-auto mb-4 text-muted-foreground opacity-50" />
          <p className="text-muted-foreground mb-2">No suppliers found matching "{search}"</p>
          <p className="text-sm text-muted-foreground">Try a different search term or clear the search</p>
        </GlassCard>
      )}
      {filtered.length === 0 && !search && (
        <GlassCard className="p-8 text-center">
          <Truck className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
          <h3 className="text-lg font-semibold mb-2">No suppliers yet</h3>
          <p className="text-muted-foreground mb-4">
            Start by adding your first supplier. You'll be able to create purchase orders and track payments.
          </p>
          <Button variant="glow" onClick={() => setShowAddSupplier(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Your First Supplier
          </Button>
        </GlassCard>
      )}

      {/* History Dialog */}
      <Dialog open={showLedger} onOpenChange={setShowLedger}>
        <DialogContent className="max-w-4xl glass-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              {selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription>Purchase Orders & Balance Summary</DialogDescription>
          </DialogHeader>

          {selectedSupplier ? (
            <div className="space-y-4">
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
                <GlassCard className="p-3">
                  <p className="text-xs text-muted-foreground">Due Balance</p>
                  <p className="text-xl font-display font-bold text-warning">
                    {formatCurrency(selectedSupplier.balance)}
                  </p>
                </GlassCard>
                <GlassCard className="p-3">
                  <p className="text-xs text-muted-foreground">Total Purchases</p>
                  <p className="text-xl font-display font-bold">
                    {formatCurrency(poStats.totalPurchases)}
                  </p>
                </GlassCard>
                <GlassCard className="p-3">
                  <p className="text-xs text-muted-foreground">Pending</p>
                  <p className="text-xl font-display font-bold text-warning">
                    {formatCurrency(poStats.totalPending)}
                  </p>
                </GlassCard>
                <GlassCard className="p-3">
                  <p className="text-xs text-muted-foreground">Total Paid</p>
                  <p className="text-xl font-display font-bold text-success">
                    {formatCurrency(poStats.totalPaid)}
                  </p>
                </GlassCard>
              </div>

              {/* Tabs: Purchase Orders & Payments */}
              <Tabs defaultValue="purchase-orders" className="w-full">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
                  <TabsTrigger value="payments">Payments</TabsTrigger>
                </TabsList>
                <TabsContent value="purchase-orders" className="space-y-3">
                  <div className="overflow-x-auto border border-border rounded-lg">
                    <table className="w-full text-sm">
                      <thead className="bg-muted/50">
                        <tr>
                          <th className="p-3 text-left">PO #</th>
                          <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">Invoice</th>
                          <th className="p-3 text-left">Items</th>
                          <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-center">Status</th>
                          <th className="p-3 text-right">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {supplierPOs.map((po) => {
                          const remaining = getPORemainingBalance(po.id);
                          const paid = po.total_amount - remaining;
                          return (
                            <tr key={po.id} className="border-t border-border/50">
                              <td className="p-3 font-medium">PO-{po.id.slice(-8).toUpperCase()}</td>
                              <td className="p-3 text-muted-foreground">{formatDateWithTimezone(po.order_date, timezone)}</td>
                              <td className="p-3 text-muted-foreground">{po.invoice_no || "-"}</td>
                              <td className="p-3">
                                <div className="flex flex-col gap-1">
                                  {po.items.slice(0, 2).map((item, idx) => (
                                    <span key={idx} className="text-xs">
                                      {item.quantity}x {item.item_name}
                                    </span>
                                  ))}
                                  {po.items.length > 2 && (
                                    <span className="text-xs text-muted-foreground">
                                      +{po.items.length - 2} more
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-right">
                                <div className="flex flex-col">
                                  <span className="font-display font-semibold">
                                    {formatCurrency(po.total_amount)}
                                  </span>
                                  {paid > 0 && (
                                    <span className="text-xs text-muted-foreground">
                                      Paid: {formatCurrency(paid)}
                                    </span>
                                  )}
                                  {remaining > 0 && (
                                    <span className="text-xs text-warning">
                                      Due: {formatCurrency(remaining)}
                                    </span>
                                  )}
                                </div>
                              </td>
                              <td className="p-3 text-center">{getStatusBadge(po.status)}</td>
                              <td className="p-3 text-right">
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => navigate(`/purchases?po=${po.id}`)}
                                >
                                  <Eye className="w-4 h-4" />
                                </Button>
                              </td>
                            </tr>
                          );
                        })}
                        {supplierPOs.length === 0 && (
                          <tr>
                            <td colSpan={7} className="p-4 text-center text-muted-foreground">
                              No purchase orders yet. Click "New Order" to create one.
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
                              if (poPage > 1 && selectedSupplierId) {
                                openLedger(selectedSupplierId, paymentPage, poPage - 1);
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
                                    onClick={() => {
                                      if (selectedSupplierId) {
                                        openLedger(selectedSupplierId, paymentPage, page);
                                      }
                                    }}
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
                              if (
                                poPage < Math.ceil(poTotal / poPageSize) &&
                                selectedSupplierId
                              ) {
                                openLedger(selectedSupplierId, paymentPage, poPage + 1);
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
                </TabsContent>
                <TabsContent value="payments" className="space-y-3">
                  <div className="flex justify-between items-center">
                    <h3 className="font-semibold">Payment History</h3>
                    <Button 
                      variant="glow" 
                      size="sm" 
                      onClick={() => {
                        if (!selectedSupplier) {
                          toast({ title: "Please select a supplier first", variant: "destructive" });
                          return;
                        }
                        setPaymentForm((prev) => ({
                          ...prev,
                          supplier_id: selectedSupplier.id,
                          payment_date: getDateOnly(new Date(), timezone),
                        }));
                        setShowAddPayment(true);
                      }}
                    >
                      <DollarSign className="w-4 h-4 mr-1" />
                      Record Payment
                  </Button>
                </div>
              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                          <th className="p-3 text-left">PO #</th>
                          <th className="p-3 text-left">Method</th>
                          <th className="p-3 text-left">Reference</th>
                      <th className="p-3 text-right">Amount</th>
                          <th className="p-3 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                        {payments.map((payment) => (
                          <tr key={payment.id} className="border-t border-border/50">
                            <td className="p-3 text-muted-foreground">{formatDateWithTimezone(payment.payment_date, timezone)}</td>
                            <td className="p-3 text-muted-foreground">
                              {payment.purchase_order_id
                                ? `PO-${payment.purchase_order_id.slice(-8).toUpperCase()}`
                                : "General"}
                            </td>
                            <td className="p-3">{payment.payment_method || "-"}</td>
                            <td className="p-3 text-muted-foreground">{payment.reference_no || "-"}</td>
                            <td className="p-3 text-right font-display font-semibold text-success">
                              {formatCurrency(payment.amount)}
                        </td>
                            <td className="p-3 text-right">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => {
                                  setPaymentToDelete(payment);
                                  setShowDeletePayment(true);
                                }}
                              >
                                <X className="w-4 h-4 text-destructive" />
                              </Button>
                        </td>
                      </tr>
                    ))}
                        {payments.length === 0 && (
                      <tr>
                            <td colSpan={6} className="p-4 text-center text-muted-foreground">
                              No payments recorded yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
              {paymentTotal > paymentPageSize && (
                <Pagination className="mt-4">
                  <PaginationContent>
                    <PaginationItem>
                      <PaginationPrevious
                        onClick={() => {
                          if (paymentPage > 1 && selectedSupplierId) {
                            openLedger(selectedSupplierId, paymentPage - 1);
                          }
                        }}
                        className={paymentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                      />
                    </PaginationItem>
                    {Array.from({ length: Math.ceil(paymentTotal / paymentPageSize) }, (_, i) => i + 1)
                      .filter((page) => {
                        const totalPages = Math.ceil(paymentTotal / paymentPageSize);
                        return (
                          page === 1 ||
                          page === totalPages ||
                          (page >= paymentPage - 1 && page <= paymentPage + 1)
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
                                onClick={() => {
                                  if (selectedSupplierId) {
                                    openLedger(selectedSupplierId, page);
                                  }
                                }}
                                isActive={paymentPage === page}
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
                          if (
                            paymentPage < Math.ceil(paymentTotal / paymentPageSize) &&
                            selectedSupplierId
                          ) {
                            openLedger(selectedSupplierId, paymentPage + 1);
                          }
                        }}
                        className={
                          paymentPage >= Math.ceil(paymentTotal / paymentPageSize)
                            ? "pointer-events-none opacity-50"
                            : "cursor-pointer"
                        }
                      />
                    </PaginationItem>
                  </PaginationContent>
                </Pagination>
              )}
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <p className="text-muted-foreground">No supplier selected</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Payment Dialog */}
      <Dialog open={showAddPayment && !!selectedSupplier} onOpenChange={(open) => {
        if (!open) {
          setShowAddPayment(false);
        } else if (!selectedSupplier) {
          toast({ title: "Please select a supplier first", variant: "destructive" });
          setShowAddPayment(false);
        }
      }}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Record Payment</DialogTitle>
            <DialogDescription>Record a payment to {selectedSupplier?.name || "supplier"}</DialogDescription>
          </DialogHeader>
          {selectedSupplier && (
          <div className="space-y-4">
            {selectedSupplier && selectedSupplier.balance > 0 && (
              <div className="p-3 rounded-lg bg-warning/10 border border-warning/20">
                <p className="text-sm font-medium mb-1">Due Balance</p>
                <p className="text-xl font-display font-bold text-warning">
                  {formatCurrency(selectedSupplier.balance)}
                </p>
              </div>
            )}
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Record a payment to reduce the supplier's balance. You can link it to a specific purchase order or record it as a general payment.
              </p>
            </div>
            <div className="space-y-3">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>Amount *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the payment amount in ৳ (Taka)</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  type="number"
                  value={paymentForm.amount || ""}
                  onChange={(e) =>
                    setPaymentForm((f) => ({ ...f, amount: parseFloat(e.target.value) || 0 }))
                  }
                  placeholder="0.00"
                  min="0"
                  step="0.01"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label>Payment Date *</Label>
                <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
                  <PopoverTrigger asChild>
                    <Button
                      variant="outline"
                      className={cn(
                        "w-full justify-start text-left font-normal bg-muted/50 hover:bg-muted/70",
                        !paymentForm.payment_date && "text-muted-foreground"
                      )}
                    >
                      <CalendarIcon className="mr-2 h-4 w-4" />
                      {paymentForm.payment_date ? (
                        (() => {
                          try {
                            const date = new Date(paymentForm.payment_date);
                            return isNaN(date.getTime()) ? "dd/mm/yyyy" : formatDateWithTimezone(paymentForm.payment_date, timezone);
                          } catch {
                            return "dd/mm/yyyy";
                          }
                        })()
                      ) : (
                        <span>dd/mm/yyyy</span>
                      )}
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-auto p-0" align="start">
                    <Calendar
                      mode="single"
                      selected={
                        paymentForm.payment_date
                          ? (() => {
                              try {
                                const date = new Date(paymentForm.payment_date);
                                return isNaN(date.getTime()) ? undefined : date;
                              } catch {
                                return undefined;
                              }
                            })()
                          : undefined
                      }
                      onSelect={(date) => {
                        if (date) {
                          setPaymentForm((f) => ({
                            ...f,
                            payment_date: format(date, "yyyy-MM-dd"),
                          }));
                          setCalendarOpen(false);
                        } else {
                          setPaymentForm((f) => ({ ...f, payment_date: "" }));
                        }
                      }}
                      initialFocus
                    />
                  </PopoverContent>
                </Popover>
              </div>
              <div className="space-y-1">
                <Label>Payment Method</Label>
                <Select
                  value={paymentForm.payment_method || "cash"}
                  onValueChange={(v) => setPaymentForm((f) => ({ ...f, payment_method: v }))}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                    <SelectItem value="check">Check</SelectItem>
                    <SelectItem value="mobile_banking">Mobile Banking</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>Against Purchase Order (Optional)</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Link this payment to a specific purchase order, or leave as "General Payment"</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Select
                  value={paymentForm.purchase_order_id || "general"}
                  onValueChange={(v) =>
                    setPaymentForm((f) => ({
                      ...f,
                      purchase_order_id: v === "general" ? null : v,
                    }))
                  }
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue placeholder="General Payment" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="general">General Payment</SelectItem>
                    {supplierPOs
                      .filter((po) => getPORemainingBalance(po.id) > 0)
                      .map((po) => (
                        <SelectItem key={po.id} value={po.id}>
                          PO-{po.id.slice(-8).toUpperCase()} - {formatCurrency(po.total_amount)} (Due:{" "}
                          {formatCurrency(getPORemainingBalance(po.id))})
                        </SelectItem>
                      ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1">
                <Label>Reference No. (Optional)</Label>
                <Input
                  value={paymentForm.reference_no || ""}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, reference_no: e.target.value }))}
                  placeholder="e.g., Check #1234, Transaction ID, etc."
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={paymentForm.notes || ""}
                  onChange={(e) => setPaymentForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional notes about this payment..."
                  rows={2}
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>
          )}
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddPayment(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleCreatePayment} disabled={submittingPayment || !selectedSupplier}>
              {submittingPayment ? "Recording..." : "Record Payment"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Delete Payment Confirmation Dialog */}
      <AlertDialog open={showDeletePayment} onOpenChange={setShowDeletePayment}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="font-display gradient-text flex items-center gap-2">
              <X className="w-5 h-5 text-destructive" />
              Delete Payment?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete this payment?</p>
              {paymentToDelete && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Amount:</span>
                    <span className="font-semibold">{formatCurrency(paymentToDelete.amount)}</span>
                  </div>
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Date:</span>
                    <span>{formatDateWithTimezone(paymentToDelete.payment_date, timezone)}</span>
                  </div>
                  {paymentToDelete.payment_method && (
                    <div className="flex justify-between text-sm">
                      <span className="text-muted-foreground">Method:</span>
                      <span>{paymentToDelete.payment_method}</span>
                    </div>
                  )}
                </div>
              )}
              <p className="text-sm text-muted-foreground mt-2">
                This action will update the supplier balance and cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel className="mt-2 sm:mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (!paymentToDelete || !selectedSupplier) return;
                try {
                  await suppliersApi.deletePayment(paymentToDelete.id);
                  setPayments((prev) => prev.filter((p) => p.id !== paymentToDelete.id));
                  const updatedSupplier = await suppliersApi.get(selectedSupplier.id);
                  setSuppliers((prev) =>
                    prev.map((s) => (s.id === updatedSupplier.id ? updatedSupplier : s))
                  );
                  setShowDeletePayment(false);
                  setPaymentToDelete(null);
                  toast({ title: "Payment deleted" });
                } catch (error: any) {
                  toast({
                    title: "Failed to delete payment",
                    description: error.message,
                    variant: "destructive",
                  });
                }
              }}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              <X className="w-4 h-4 mr-2" />
              Delete Payment
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Add Supplier</DialogTitle>
            <DialogDescription>Create a new supplier record</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="p-3 rounded-lg bg-primary/5 border border-primary/20 flex items-start gap-2">
              <Info className="w-4 h-4 text-primary mt-0.5 flex-shrink-0" />
              <p className="text-sm text-muted-foreground">
                Fill in the required fields (marked with *) to add a new supplier. You can add more details later.
              </p>
            </div>
          <div className="space-y-3">
            <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>Name *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Enter the supplier's business or company name</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={supplierForm.name}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="e.g., ABC Trading Company"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <Label>Phone *</Label>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <HelpCircle className="w-3 h-3 text-muted-foreground cursor-help" />
                    </TooltipTrigger>
                    <TooltipContent>
                      <p>Primary contact number for this supplier</p>
                    </TooltipContent>
                  </Tooltip>
                </div>
                <Input
                  value={supplierForm.phone}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))}
                  placeholder="+880 1712-345678 or 01712-345678"
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label>Email (Optional)</Label>
                <Input
                  type="email"
                  value={supplierForm.email}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="supplier@example.com"
                  className="bg-muted/50"
                />
            </div>
            <div className="space-y-1">
                <Label>Address (Optional)</Label>
                <Input
                  value={supplierForm.address}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))}
                  placeholder="123 Street, City, Country"
                  className="bg-muted/50"
                />
            </div>
            <div className="space-y-1">
                <Label>Contact Person (Optional)</Label>
                <Input
                  value={supplierForm.contact_person}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, contact_person: e.target.value }))}
                  placeholder="Name of the person to contact"
                  className="bg-muted/50"
                />
            </div>
            <div className="space-y-1">
                <Label>Notes (Optional)</Label>
                <Textarea
                  value={supplierForm.notes}
                  onChange={(e) => setSupplierForm((f) => ({ ...f, notes: e.target.value }))}
                  placeholder="Any additional information about this supplier..."
                  rows={3}
                  className="bg-muted/50"
                />
              </div>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddSupplier(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleCreateSupplier} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
