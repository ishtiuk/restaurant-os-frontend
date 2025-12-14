import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Plus, Search, Phone, Mail, MapPin, Wallet, ArrowUpRight, ArrowDownRight } from "lucide-react";
import { useAppData } from "@/contexts/AppDataContext";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export default function Suppliers() {
  const { suppliers, supplierTransactions, addSupplierTransaction, createSupplier } = useAppData();
  const [search, setSearch] = useState("");
  const [showLedger, setShowLedger] = useState(false);
  const [showAddSupplier, setShowAddSupplier] = useState(false);
  const [selectedSupplierId, setSelectedSupplierId] = useState<string | null>(null);
  const [txForm, setTxForm] = useState({
    type: "purchase",
    amount: "",
    description: "",
    invoiceNo: "",
  });
  const [supplierForm, setSupplierForm] = useState({
    name: "",
    phone: "",
    email: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);

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

  const ledger = useMemo(() => {
    if (!selectedSupplier) return [];
    return supplierTransactions
      .filter((t) => t.supplierId === selectedSupplier.id)
      .sort((a, b) => (b.date || "").localeCompare(a.date || ""));
  }, [selectedSupplier, supplierTransactions]);

  const ledgerBalance = ledger.reduce((sum, t) => {
    return sum + (t.type === "purchase" ? t.amount : -t.amount);
  }, 0);

  const openLedger = (supplierId: string) => {
    setSelectedSupplierId(supplierId);
    setShowLedger(true);
  };

  const handleTxSubmit = async () => {
    if (!selectedSupplier) return;
    const amount = parseFloat(txForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await addSupplierTransaction({
      supplierId: selectedSupplier.id,
      type: txForm.type as "purchase" | "payment",
      amount,
      description: txForm.description || (txForm.type === "purchase" ? "Purchase" : "Payment"),
      invoiceNo: txForm.invoiceNo || undefined,
      date: new Date().toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setTxForm({ type: txForm.type, amount: "", description: "", invoiceNo: "" });
    toast({ title: "Entry added" });
  };

  const handleCreateSupplier = async () => {
    if (!supplierForm.name || !supplierForm.phone) {
      toast({ title: "Name and phone required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await createSupplier({ ...supplierForm, dueBalance: 0 });
    setSubmitting(false);
    setSupplierForm({ name: "", phone: "", email: "", address: "" });
    setShowAddSupplier(false);
    toast({ title: "Supplier added" });
  };

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
          <Input placeholder="Search suppliers..." value={search} onChange={(e) => setSearch(e.target.value)} className="pl-10 bg-muted/50" />
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
                <p className="text-sm text-muted-foreground">Since {supplier.createdAt}</p>
              </div>
              {supplier.dueBalance > 0 ? (
                <Badge variant="warning">Due: {formatCurrency(supplier.dueBalance)}</Badge>
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
                  <span>{supplier.address}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="flex-1" onClick={() => openLedger(supplier.id)}>
                View History
              </Button>
              <Button variant="glass" size="sm" className="flex-1">
                New Order
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Ledger Dialog */}
      <Dialog open={showLedger} onOpenChange={setShowLedger}>
        <DialogContent className="max-w-3xl glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              {selectedSupplier?.name}
            </DialogTitle>
            <DialogDescription>Ledger & balance summary</DialogDescription>
          </DialogHeader>

          {selectedSupplier ? (
            <div className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <GlassCard className="p-3">
                  <p className="text-xs text-muted-foreground">Due Balance</p>
                  <p className="text-xl font-display font-bold text-warning">
                    {formatCurrency(selectedSupplier.dueBalance)}
                  </p>
                </GlassCard>
                <GlassCard className="p-3">
                  <p className="text-xs text-muted-foreground">Ledger Delta</p>
                  <p className="text-xl font-display font-bold">
                    {formatCurrency(ledgerBalance)}
                  </p>
                </GlassCard>
                <GlassCard className="p-3">
                  <p className="text-xs text-muted-foreground">Entries</p>
                  <p className="text-xl font-display font-bold">{ledger.length}</p>
                </GlassCard>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                <div className="space-y-2 md:col-span-2">
                  <Label>Add Purchase / Payment</Label>
                  <div className="grid grid-cols-2 gap-2">
                    <Select value={txForm.type} onValueChange={(v) => setTxForm((f) => ({ ...f, type: v }))}>
                      <SelectTrigger className="bg-muted/50">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="purchase">Purchase (Increase due)</SelectItem>
                        <SelectItem value="payment">Payment (Decrease due)</SelectItem>
                      </SelectContent>
                    </Select>
                    <Input
                      type="number"
                      placeholder="Amount"
                      value={txForm.amount}
                      onChange={(e) => setTxForm((f) => ({ ...f, amount: e.target.value }))}
                      className="bg-muted/50"
                    />
                    <Input
                      placeholder="Invoice (optional)"
                      value={txForm.invoiceNo}
                      onChange={(e) => setTxForm((f) => ({ ...f, invoiceNo: e.target.value }))}
                      className="bg-muted/50"
                    />
                    <Input
                      placeholder="Description"
                      value={txForm.description}
                      onChange={(e) => setTxForm((f) => ({ ...f, description: e.target.value }))}
                      className="bg-muted/50"
                    />
                  </div>
                  <Button variant="glow" size="sm" onClick={handleTxSubmit} disabled={submitting}>
                    {submitting ? "Saving..." : "Add Entry"}
                  </Button>
                </div>
                <div className="space-y-2">
                  <Label>Notes</Label>
                  <Textarea placeholder="Add a note for this supplier..." className="bg-muted/50" />
                </div>
              </div>

              <div className="overflow-x-auto border border-border rounded-lg">
                <table className="w-full text-sm">
                  <thead className="bg-muted/50">
                    <tr>
                      <th className="p-3 text-left">Date</th>
                      <th className="p-3 text-left">Type</th>
                      <th className="p-3 text-left">Description</th>
                      <th className="p-3 text-left">Invoice</th>
                      <th className="p-3 text-right">Amount</th>
                    </tr>
                  </thead>
                  <tbody>
                    {ledger.map((entry) => (
                      <tr key={entry.id} className="border-t border-border/50">
                        <td className="p-3 text-muted-foreground">{entry.date}</td>
                        <td className="p-3">
                          <Badge variant={entry.type === "purchase" ? "warning" : "success"} className="gap-1">
                            {entry.type === "purchase" ? <ArrowUpRight className="w-3 h-3" /> : <ArrowDownRight className="w-3 h-3" />}
                            {entry.type}
                          </Badge>
                        </td>
                        <td className="p-3">{entry.description || "-"}</td>
                        <td className="p-3 text-muted-foreground">{entry.invoiceNo || "-"}</td>
                        <td className="p-3 text-right font-display font-semibold">
                          {entry.type === "purchase" ? "+" : "-"}
                          {formatCurrency(entry.amount)}
                        </td>
                      </tr>
                    ))}
                    {ledger.length === 0 && (
                      <tr>
                        <td colSpan={5} className="p-4 text-center text-muted-foreground">
                          No entries yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
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
            <DialogDescription>Create a supplier record (frontend-only)</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={supplierForm.name} onChange={(e) => setSupplierForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={supplierForm.phone} onChange={(e) => setSupplierForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={supplierForm.email} onChange={(e) => setSupplierForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Address</Label>
              <Input value={supplierForm.address} onChange={(e) => setSupplierForm((f) => ({ ...f, address: e.target.value }))} />
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
