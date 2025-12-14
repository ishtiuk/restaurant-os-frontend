import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { purchaseOrders } from "@/data/mockData";
import { useAppData } from "@/contexts/AppDataContext";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { toast } from "@/hooks/use-toast";
import { Plus, Truck, Check, Clock, X, Eye } from "lucide-react";

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

export default function Purchases() {
  const { purchaseOrders, suppliers, items, createPurchaseOrder, markPurchaseOrderReceived } = useAppData();
  const [showNew, setShowNew] = useState(false);
  const [creating, setCreating] = useState(false);
  const [form, setForm] = useState({
    supplierId: "",
    itemId: "",
    quantity: "1",
    unitCost: "0",
    invoiceNo: "",
    date: new Date().toISOString().slice(0, 10),
  });
  const totalPendingValue = useMemo(
    () =>
      purchaseOrders
        .filter((po) => po.status === "pending")
        .reduce((sum, po) => sum + po.total, 0),
    [purchaseOrders]
  );

  const handleCreate = async () => {
    const qty = parseFloat(form.quantity);
    const cost = parseFloat(form.unitCost);
    if (!form.supplierId || !form.itemId || !qty || !cost) {
      toast({ title: "Fill supplier, item, qty, cost", variant: "destructive" });
      return;
    }
    const item = items.find((i) => i.id === form.itemId);
    if (!item) {
      toast({ title: "Invalid item", variant: "destructive" });
      return;
    }
    setCreating(true);
    await createPurchaseOrder({
      supplierId: form.supplierId,
      supplierName: suppliers.find((s) => s.id === form.supplierId)?.name || "Supplier",
      invoiceNo: form.invoiceNo || undefined,
      date: form.date,
      status: "pending",
      items: [
        {
          itemId: item.id,
          itemName: item.name,
          quantity: qty,
          unitCost: cost,
          total: qty * cost,
        },
      ],
      total: qty * cost,
      createdAt: form.date,
    });
    setCreating(false);
    setShowNew(false);
    setForm({ ...form, quantity: "1", unitCost: "0", invoiceNo: "" });
    toast({ title: "Purchase order created" });
  };

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
          <p className="text-2xl font-display font-bold">
            {formatCurrency(totalPendingValue)}
          </p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">This Month</p>
          <p className="text-2xl font-display font-bold text-accent">
            {formatCurrency(purchaseOrders.reduce((sum, po) => sum + po.total, 0))}
          </p>
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
                  <td className="p-4 font-medium">{po.id}</td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 rounded-lg bg-secondary/20 flex items-center justify-center">
                        <Truck className="w-4 h-4 text-secondary" />
                      </div>
                      {po.supplierName}
                    </div>
                  </td>
                  <td className="p-4 text-muted-foreground">{po.invoiceNo || "-"}</td>
                  <td className="p-4 text-muted-foreground">{po.date}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(po.total)}</td>
                  <td className="p-4 text-center">{getStatusBadge(po.status)}</td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm">
                        <Eye className="w-4 h-4 mr-1" />
                        View
                      </Button>
                      {po.status === "pending" && (
                        <Button variant="outline" size="sm" onClick={() => markPurchaseOrderReceived(po.id)}>
                          <Check className="w-4 h-4 mr-1" />
                          Mark Received
                        </Button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* New PO Dialog */}
      <Dialog open={showNew} onOpenChange={setShowNew}>
        <DialogContent className="max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">New Purchase Order</DialogTitle>
            <DialogDescription>Frontend-only PO; will update stock on receive</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Supplier</Label>
              <Select value={form.supplierId} onValueChange={(v) => setForm((f) => ({ ...f, supplierId: v }))}>
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
              <Label>Item</Label>
              <Select value={form.itemId} onValueChange={(v) => setForm((f) => ({ ...f, itemId: v }))}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select item" />
                </SelectTrigger>
                <SelectContent>
                  {items.map((i) => (
                    <SelectItem key={i.id} value={i.id}>
                      {i.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <div className="space-y-1">
                <Label>Quantity</Label>
                <Input
                  type="number"
                  value={form.quantity}
                  onChange={(e) => setForm((f) => ({ ...f, quantity: e.target.value }))}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-1">
                <Label>Unit Cost</Label>
                <Input
                  type="number"
                  value={form.unitCost}
                  onChange={(e) => setForm((f) => ({ ...f, unitCost: e.target.value }))}
                  className="bg-muted/50"
                />
              </div>
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
            <div className="space-y-1">
              <Label>Date</Label>
              <Input
                type="date"
                value={form.date}
                onChange={(e) => setForm((f) => ({ ...f, date: e.target.value }))}
                className="bg-muted/50"
              />
            </div>
            <div className="p-3 rounded-lg bg-muted/30 border border-muted/40">
              <p className="text-sm text-muted-foreground">Total</p>
              <p className="text-xl font-display font-bold">
                {formatCurrency((parseFloat(form.quantity) || 0) * (parseFloat(form.unitCost) || 0))}
              </p>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setShowNew(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleCreate} disabled={creating}>
              {creating ? "Creating..." : "Create PO"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
