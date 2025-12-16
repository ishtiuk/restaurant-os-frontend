import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate, useSearchParams } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useAppData } from "@/contexts/AppDataContext";
import { suppliersApi, type SupplierDto } from "@/lib/api/suppliers";
import { purchasesApi, type PurchaseOrderDto, type PurchaseOrderItemCreateInput } from "@/lib/api/purchases";
import { productsApi, type ProductDto } from "@/lib/api/products";
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
import { Plus, Truck, Check, Clock, X, Eye, Trash2 } from "lucide-react";
import { Textarea } from "@/components/ui/textarea";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
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
  product_id: number;
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

  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [products, setProducts] = useState<ProductDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNew, setShowNew] = useState(false);
  const [showView, setShowView] = useState(false);
  const [selectedPO, setSelectedPO] = useState<PurchaseOrderDto | null>(null);
  const [creating, setCreating] = useState(false);
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
    const load = async () => {
      try {
        setLoading(true);
        const [suppliersData, posData] = await Promise.all([
          suppliersApi.list(),
          purchasesApi.list({ limit: 1000 }),
        ]);
        setSuppliers(suppliersData);
        setPurchaseOrders(posData);

        // Load products
        const productsData = await productsApi.list();
        setProducts(productsData);
      } catch (error: any) {
        toast({
          title: "Failed to load data",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const totalPendingValue = useMemo(
    () =>
      purchaseOrders
        .filter((po) => po.status === "pending")
        .reduce((sum, po) => sum + po.total_amount, 0),
    [purchaseOrders]
  );

  const totalThisMonth = useMemo(() => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return purchaseOrders
      .filter((po) => new Date(po.order_date) >= startOfMonth)
      .reduce((sum, po) => sum + po.total_amount, 0);
  }, [purchaseOrders]);

  const addItemToForm = () => {
    setForm((f) => ({
      ...f,
      items: [
        ...f.items,
        {
          product_id: 0,
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
      if (updates.product_id !== undefined) {
        const product = products.find((p) => p.id === updates.product_id);
        if (product) {
          item.item_name = product.name;
        }
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
      if (!item.product_id || item.quantity <= 0 || item.unit_price <= 0) {
        toast({ title: "Fill all item fields correctly", variant: "destructive" });
        return;
      }
    }

    setCreating(true);
    try {
      const itemsToCreate: PurchaseOrderItemCreateInput[] = form.items.map((item) => ({
        product_id: item.product_id,
        item_name: item.item_name,
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
            {purchaseOrders.filter((po) => po.status === "pending").length}
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
                <th className="text-left p-4 font-medium">Invoice No.</th>
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {purchaseOrders.map((po) => (
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
                  <td className="p-4 text-muted-foreground">{po.invoice_no || "-"}</td>
                  <td className="p-4 text-muted-foreground">{formatDate(po.order_date)}</td>
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
              ))}
              {purchaseOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="p-8 text-center text-muted-foreground">
                    No purchase orders yet. Create your first purchase order to get started.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* New PO Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-3xl glass-card max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">New Purchase Order</DialogTitle>
            <DialogDescription>Create a new purchase order</DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Supplier *</Label>
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
                <Label>Expected Delivery Date</Label>
                <Input
                  type="date"
                  value={form.expectedDeliveryDate}
                  onChange={(e) => setForm((f) => ({ ...f, expectedDeliveryDate: e.target.value }))}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label>Invoice No.</Label>
                <Input
                  value={form.invoiceNo}
                  onChange={(e) => setForm((f) => ({ ...f, invoiceNo: e.target.value }))}
                  className="bg-muted/50"
                  placeholder="INV-2024-001"
                />
              </div>
            </div>

            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={form.notes}
                onChange={(e) => setForm((f) => ({ ...f, notes: e.target.value }))}
                className="bg-muted/50"
                placeholder="Additional notes..."
                rows={2}
              />
            </div>

            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <Label>Items *</Label>
                <Button variant="outline" size="sm" onClick={addItemToForm}>
                  <Plus className="w-4 h-4 mr-1" />
                  Add Item
                </Button>
              </div>
              {form.items.map((item, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 p-3 border border-border rounded-lg">
                  <div className="col-span-12 md:col-span-4">
                    <Select
                      value={String(item.product_id || "")}
                      onValueChange={(v) => updateItem(index, { product_id: Number(v) })}
                    >
                      <SelectTrigger className="bg-muted/50">
                        <SelectValue placeholder="Select product" />
                      </SelectTrigger>
                      <SelectContent>
                        {products.map((p) => (
                          <SelectItem key={p.id} value={String(p.id)}>
                            {p.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-6 md:col-span-2">
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
                  <div className="col-span-6 md:col-span-2">
                    <Input
                      type="number"
                      placeholder="Unit Price"
                      value={item.unit_price || ""}
                      onChange={(e) => updateItem(index, { unit_price: parseFloat(e.target.value) || 0 })}
                      className="bg-muted/50"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div className="col-span-8 md:col-span-3">
                    <Input
                      type="text"
                      value={formatCurrency(item.total)}
                      readOnly
                      className="bg-muted/50 font-semibold"
                    />
                  </div>
                  <div className="col-span-4 md:col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeItem(index)}
                      className="text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
              {form.items.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-4">
                  Click "Add Item" to add products to this purchase order
                </p>
              )}
            </div>

            <div className="p-3 rounded-lg bg-muted/30 border border-muted/40">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-display font-bold">
                {formatCurrency(form.items.reduce((sum, item) => sum + item.total, 0))}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleCreate} disabled={creating || form.items.length === 0}>
              {creating ? "Creating..." : "Create PO"}
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
              {selectedPO && getSupplierName(selectedPO.supplier_id)} • {selectedPO && formatDate(selectedPO.order_date)}
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
                    <div className="mt-1">{formatDate(selectedPO.expected_delivery_date)}</div>
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
