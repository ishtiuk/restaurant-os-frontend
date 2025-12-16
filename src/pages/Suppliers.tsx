import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone, Mail, MapPin, Truck, Clock, Check, X, Eye } from "lucide-react";
import { suppliersApi, type SupplierDto } from "@/lib/api/suppliers";
import { purchasesApi, type PurchaseOrderDto } from "@/lib/api/purchases";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;
const formatDate = (dateString: string) => {
  const date = new Date(dateString);
  return date.toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });
};

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
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrderDto[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
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
    const load = async () => {
      try {
        setLoading(true);
        const [suppliersData, posData] = await Promise.all([
          suppliersApi.list(),
          purchasesApi.list({ limit: 1000 }),
        ]);
        setSuppliers(suppliersData);
        setPurchaseOrders(posData);
      } catch (error: any) {
        toast({
          title: "Failed to load suppliers",
          description: error.message,
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    load();
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

  // Get purchase orders for selected supplier
  const supplierPOs = useMemo(() => {
    if (!selectedSupplier) return [];
    return purchaseOrders
      .filter((po) => po.supplier_id === selectedSupplier.id)
      .sort((a, b) => new Date(b.order_date).getTime() - new Date(a.order_date).getTime());
  }, [selectedSupplier, purchaseOrders]);

  // Calculate totals from POs
  const poStats = useMemo(() => {
    if (!selectedSupplier) return { totalPurchases: 0, totalPending: 0, totalReceived: 0 };
    const pos = supplierPOs;
    return {
      totalPurchases: pos.reduce((sum, po) => sum + po.total_amount, 0),
      totalPending: pos.filter((po) => po.status === "pending").reduce((sum, po) => sum + po.total_amount, 0),
      totalReceived: pos.filter((po) => po.status === "received").reduce((sum, po) => sum + po.total_amount, 0),
    };
  }, [selectedSupplier, supplierPOs]);

  const openLedger = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setShowLedger(true);
  };

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
                  Since {formatDate(supplier.created_at)}
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
                View History
              </Button>
              <Button
                variant="glass"
                size="sm"
                className="flex-1"
                onClick={() => handleNewOrder(supplier.id)}
              >
                New Order
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {filtered.length === 0 && (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">No suppliers found. Add your first supplier to get started.</p>
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
                  <p className="text-xs text-muted-foreground">Purchase Orders</p>
                  <p className="text-xl font-display font-bold">{supplierPOs.length}</p>
                </GlassCard>
              </div>

              {/* Tabs: Purchase Orders */}
              <Tabs defaultValue="purchase-orders" className="w-full">
                <TabsList className="grid w-full grid-cols-1">
                  <TabsTrigger value="purchase-orders">Purchase Orders</TabsTrigger>
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
                        {supplierPOs.map((po) => (
                          <tr key={po.id} className="border-t border-border/50">
                            <td className="p-3 font-medium">PO-{po.id.slice(-8).toUpperCase()}</td>
                            <td className="p-3 text-muted-foreground">{formatDate(po.order_date)}</td>
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
                            <td className="p-3 text-right font-display font-semibold">
                              {formatCurrency(po.total_amount)}
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
                        ))}
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
                </TabsContent>
              </Tabs>
            </div>
          ) : (
            <p className="text-muted-foreground">No supplier selected</p>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Supplier Dialog */}
      <Dialog open={showAddSupplier} onOpenChange={setShowAddSupplier}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Add Supplier</DialogTitle>
            <DialogDescription>Create a new supplier record</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name *</Label>
              <Input
                value={supplierForm.name}
                onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))}
                placeholder="Supplier name"
              />
            </div>
            <div className="space-y-1">
              <Label>Phone *</Label>
              <Input
                value={supplierForm.phone}
                onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))}
                placeholder="+880 1712-345678"
              />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                type="email"
                value={supplierForm.email}
                onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="supplier@example.com"
              />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input
                value={supplierForm.address}
                onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))}
                placeholder="123 Street, City"
              />
            </div>
            <div className="space-y-1">
              <Label>Contact Person</Label>
              <Input
                value={supplierForm.contact_person}
                onChange={(e) => setSupplierForm((f) => ({ ...f, contact_person: e.target.value }))}
                placeholder="John Doe"
              />
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={supplierForm.notes}
                onChange={(e) => setSupplierForm((f) => ({ ...f, notes: e.target.value }))}
                placeholder="Additional notes..."
                rows={3}
              />
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
