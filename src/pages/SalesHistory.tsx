import React, { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useAppData } from "@/contexts/AppDataContext";
import { useAuth } from "@/contexts/AuthContext";
import { Sale } from "@/types";
import { salesApi, type SaleDto } from "@/lib/api/sales";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Search,
  Filter,
  Eye,
  Edit,
  AlertTriangle,
  History,
  Download,
  Undo2,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatWithTimezone } from "@/utils/date";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

// Helper function to map API SaleDto to frontend Sale type
const mapSaleDtoToSale = (s: SaleDto): Sale => ({
  id: s.id,
  createdAt: s.created_at,
  items: s.items.map((i) => ({
    itemId: i.item_id,
    itemName: i.item_name,
    quantity: i.quantity,
    unitPrice: i.unit_price,
    discount: i.discount,
    total: i.total,
    notes: i.notes ?? undefined,
  })),
  subtotal: s.subtotal,
  vatAmount: s.vat_amount,
  serviceCharge: s.service_charge,
  discount: s.discount,
  total: s.total,
  paymentMethod: s.payment_method as Sale["paymentMethod"],
  customerId: undefined,
  customerName: s.customer_name ?? undefined,
  customerPhone: s.customer_phone ?? undefined,
  deliveryAddress: s.delivery_address ?? undefined,
  deliveryNotes: s.delivery_notes ?? undefined,
  tableNo: s.table_no ?? undefined,
  orderType: s.order_type,
  status: s.status as Sale["status"],
  editHistory: s.edit_history?.map((edit) => ({
    id: edit.id,
    editedAt: edit.edited_at,
    editedBy: edit.edited_by,
    previousTotal: edit.previous_total,
    newTotal: edit.new_total,
    reason: edit.reason,
  })),
});

const formatSaleId = (id: string) => {
  // Show first 8 characters of UUID for readability
  return id.substring(0, 8).toUpperCase();
};

export default function SalesHistoryPage() {
  const { updateSaleTotalWithAudit, replaceSale } = useAppData();
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const canEditSales = user?.role === "owner" || user?.role === "superadmin";
  const [sales, setSales] = useState<Sale[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editAmount, setEditAmount] = useState("");
  const [undoStack, setUndoStack] = useState<Record<string, Sale[]>>({});
  const [redoStack, setRedoStack] = useState<Record<string, Sale[]>>({});
  const [salesPage, setSalesPage] = useState(1);
  const [salesPageSize] = useState(20);
  const [salesTotal, setSalesTotal] = useState(0);

  // Load sales with pagination
  useEffect(() => {
    const loadSales = async () => {
      setLoading(true);
      try {
        const offset = (salesPage - 1) * salesPageSize;
        const response = await salesApi.list(salesPageSize, offset);
        const mappedSales: Sale[] = response.data.map(mapSaleDtoToSale);
        setSales(mappedSales);
        setSalesTotal(response.total);
      } catch (error: any) {
        console.error("Failed to load sales", error);
        toast({
          title: "Failed to load sales",
          description: error?.message || "Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    loadSales();
  }, [salesPage, salesPageSize]);

  const filteredSales = useMemo(
    () =>
      sales.filter((sale) => {
        const matchesSearch =
          sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
          sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
        const matchesStatus = filterStatus === "all" || sale.status === filterStatus;
        return matchesSearch && matchesStatus;
      }),
    [sales, searchQuery, filterStatus]
  );

  const handleViewSale = (sale: Sale) => {
    setSelectedSale(sale);
    setShowDetailDialog(true);
  };

  const handleEditSale = (sale: Sale) => {
    setSelectedSale(sale);
    setEditAmount(sale.total.toString());
    setEditReason("");
    setShowEditDialog(true);
  };

  const handleSaveEdit = async () => {
    if (!editReason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }
    if (!selectedSale) return;

    const current = sales.find((s) => s.id === selectedSale.id);
    if (current) {
      setUndoStack((prev) => ({
        ...prev,
        [current.id]: [...(prev[current.id] || []), current],
      }));
      setRedoStack((prev) => ({ ...prev, [current.id]: [] }));
    }

    try {
      await updateSaleTotalWithAudit(selectedSale.id, {
        newTotal: parseFloat(editAmount),
        editedBy: user?.name || "Admin",
        reason: editReason,
      });

      // Refresh sales list to get updated data
      const offset = (salesPage - 1) * salesPageSize;
      const response = await salesApi.list(salesPageSize, offset);
      const convertedSales: Sale[] = response.data.map(mapSaleDtoToSale);
      setSales(convertedSales);
      setSalesTotal(response.total);

      // Update selected sale if detail dialog is open
      if (selectedSale) {
        const updatedSale = convertedSales.find((s) => s.id === selectedSale.id);
        if (updatedSale) {
          setSelectedSale(updatedSale);
        }
      }

      toast({
        title: "Sale Updated",
        description: `Sale ${formatSaleId(selectedSale.id)} has been modified. Audit log created.`,
      });

      setShowEditDialog(false);
      setEditReason("");
      setEditAmount("");
    } catch (error: any) {
      toast({
        title: "Update Failed",
        description: error?.message || "Failed to update sale. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleUndo = (sale: Sale) => {
    const stack = undoStack[sale.id] || [];
    if (stack.length === 0) return;
    const prev = stack[stack.length - 1];
    setUndoStack((s) => ({ ...s, [sale.id]: stack.slice(0, -1) }));
    setRedoStack((s) => ({ ...s, [sale.id]: [...(s[sale.id] || []), sale] }));
    replaceSale(prev);
  };

  const handleRedo = (sale: Sale) => {
    const stack = redoStack[sale.id] || [];
    if (stack.length === 0) return;
    const next = stack[stack.length - 1];
    setRedoStack((s) => ({ ...s, [sale.id]: stack.slice(0, -1) }));
    setUndoStack((s) => ({ ...s, [sale.id]: [...(s[sale.id] || []), sale] }));
    replaceSale(next);
  };

  const getStatusBadge = (status: Sale["status"]) => {
    switch (status) {
      case "completed":
        return <Badge variant="success">Completed</Badge>;
      case "refunded":
        return <Badge variant="danger">Refunded</Badge>;
      case "pending":
        return <Badge variant="warning">Pending</Badge>;
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getPaymentBadge = (method: string) => {
    const colors: Record<string, string> = {
      cash: "bg-accent/20 text-accent",
      card: "bg-primary/20 text-primary",
      online: "bg-pink-500/20 text-pink-500",
    };
    const labels: Record<string, string> = {
      cash: "Cash",
      card: "Card",
      online: "Online Pay",
    };
    return (
      <Badge className={`${colors[method] || "bg-muted text-muted-foreground"} border-0 capitalize`}>
        {labels[method] || method}
      </Badge>
    );
  };

  const handleExport = () => {
    if (filteredSales.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no sales to export with the current filters.",
        variant: "destructive",
      });
      return;
    }

    // CSV Headers
    const headers = [
      "Sale ID",
      "Date & Time",
      "Customer Name",
      "Customer Phone",
      "Order Type",
      "Payment Method",
      "Subtotal",
      "VAT Amount",
      "Service Charge",
      "Discount",
      "Total",
      "Status",
      "Table No",
      "Delivery Address",
      "Edit Count",
      "Items Count",
    ];

    // Convert sales to CSV rows
    const rows = filteredSales.map((sale) => {
      const date = formatWithTimezone(sale.createdAt, timezone);
      const editCount = sale.editHistory?.length || 0;
      const itemsCount = sale.items?.length || 0;

      return [
        sale.id,
        date,
        sale.customerName || "Walk-in",
        sale.customerPhone || "",
        sale.orderType || "",
        sale.paymentMethod || "",
        sale.subtotal.toFixed(2),
        sale.vatAmount.toFixed(2),
        sale.serviceCharge.toFixed(2),
        sale.discount.toFixed(2),
        sale.total.toFixed(2),
        sale.status || "",
        sale.tableNo || "",
        sale.deliveryAddress || "",
        editCount.toString(),
        itemsCount.toString(),
      ];
    });

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    link.setAttribute("download", `sales_history_${new Date().toISOString().split("T")[0]}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    toast({
      title: "Export Successful",
      description: `Exported ${filteredSales.length} sales to CSV file.`,
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Sales History</h1>
          <p className="text-muted-foreground">বিক্রয় ইতিহাস • Transaction Records</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={handleExport} disabled={filteredSales.length === 0}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Admin Warning */}
      <GlassCard className={`p-4 border-2 ${canEditSales ? "border-primary/30 bg-primary/5" : "border-destructive/30 bg-destructive/10"} animate-fade-in stagger-1`}>
        <div className="flex items-start gap-3">
          <AlertTriangle className={`w-5 h-5 ${canEditSales ? "text-primary" : "text-destructive"} mt-0.5`} />
          <div>
            <p className="font-semibold">{canEditSales ? "Audit logging enabled" : "Owner/Admin Access Required"}</p>
            <p className="text-sm text-muted-foreground">
              Editing sales records is a sensitive operation. All changes are logged for audit purposes.
              {canEditSales
                ? " Owners (admins) and system superadmins can edit and undo/redo changes."
                : " Only the restaurant owner (admin) or system superadmin can modify completed transactions."}
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Filters */}
      <GlassCard className="p-4 animate-fade-in stagger-2">
        <div className="flex flex-col sm:flex-row gap-4">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              placeholder="Search by Sale ID or Customer..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 bg-muted/50"
            />
          </div>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-[150px] bg-muted/50">
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="refunded">Refunded</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Sales Table */}
      <GlassCard className="overflow-hidden animate-fade-in stagger-3">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium">Sale ID</th>
                <th className="text-left p-4 font-medium">Date & Time</th>
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Type</th>
                <th className="text-center p-4 font-medium">Payment</th>
                <th className="text-right p-4 font-medium">Total</th>
                <th className="text-center p-4 font-medium">Status</th>
                <th className="text-center p-4 font-medium">Edited</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filteredSales.map((sale) => (
                <tr key={sale.id} className="border-b border-border/50 table-row-hover">
                  <td className="p-4 font-mono font-medium text-sm" title={sale.id}>
                    {formatSaleId(sale.id)}
                  </td>
                  <td className="p-4 text-muted-foreground text-sm">
                    {formatWithTimezone(sale.createdAt, timezone)}
                  </td>
                  <td className="p-4 text-sm">
                    {sale.customerName || (
                      <span className="text-muted-foreground">Walk-in</span>
                    )}
                  </td>
                  <td className="p-4">
                    <Badge variant="outline" className="capitalize">
                      {sale.orderType}
                    </Badge>
                  </td>
                  <td className="p-4 text-center">{getPaymentBadge(sale.paymentMethod)}</td>
                  <td className="p-4 text-right font-display font-semibold">
                    {formatCurrency(sale.total)}
                  </td>
                  <td className="p-4 text-center">{getStatusBadge(sale.status)}</td>
                  <td className="p-4 text-center">
                    {sale.editHistory && sale.editHistory.length > 0 ? (
                      <Badge variant="warning" className="gap-1">
                        <History className="w-3 h-3" />
                        {sale.editHistory.length}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground">-</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <Button variant="ghost" size="sm" onClick={() => handleViewSale(sale)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEditSale(sale)}
                        className="text-destructive hover:text-destructive"
                        disabled={!canEditSales}
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={(undoStack[sale.id] || []).length === 0}
                        onClick={() => handleUndo(sale)}
                      >
                        <Undo2 className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        disabled={(redoStack[sale.id] || []).length === 0}
                        onClick={() => handleRedo(sale)}
                      >
                        <History className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {salesTotal > 0 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (salesPage > 1) {
                      setSalesPage(salesPage - 1);
                    }
                  }}
                  className={salesPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: Math.ceil(salesTotal / salesPageSize) }, (_, i) => i + 1)
                .filter((page) => {
                  const totalPages = Math.ceil(salesTotal / salesPageSize);
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= salesPage - 1 && page <= salesPage + 1)
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
                          onClick={() => setSalesPage(page)}
                          isActive={salesPage === page}
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
                    if (salesPage < Math.ceil(salesTotal / salesPageSize)) {
                      setSalesPage(salesPage + 1);
                    }
                  }}
                  className={
                    salesPage >= Math.ceil(salesTotal / salesPageSize)
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </GlassCard>

      {/* View Sale Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              Sale Details - {selectedSale && formatSaleId(selectedSale.id)}
              <span className="text-xs font-normal text-muted-foreground ml-2 font-mono">
                ({selectedSale?.id})
              </span>
            </DialogTitle>
            <DialogDescription>
              {selectedSale && formatWithTimezone(selectedSale.createdAt, timezone)}
            </DialogDescription>
          </DialogHeader>

          {selectedSale && (
            <div className="space-y-4">
              <div className="p-4 rounded-lg bg-muted/30 space-y-2">
                {selectedSale.items.map((item) => (
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
                    <span>{formatCurrency(selectedSale.subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">VAT</span>
                    <span>{formatCurrency(selectedSale.vatAmount)}</span>
                  </div>
                  {selectedSale.discount > 0 && (
                    <div className="flex justify-between text-sm text-accent">
                      <span>Discount</span>
                      <span>-{formatCurrency(selectedSale.discount)}</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-lg pt-2 border-t border-border">
                    <span>Total</span>
                    <span className="gradient-text">{formatCurrency(selectedSale.total)}</span>
                  </div>
                </div>
              </div>

              {/* Edit History */}
              {selectedSale.editHistory && selectedSale.editHistory.length > 0 && (
                <div className="space-y-2">
                  <h4 className="font-semibold flex items-center gap-2">
                    <History className="w-4 h-4" />
                    Edit History
                  </h4>
                  {selectedSale.editHistory.map((edit) => (
                    <div key={edit.id} className="p-3 rounded-lg bg-destructive/10 border border-destructive/20 text-sm">
                      <div className="flex justify-between mb-1">
                        <span className="text-muted-foreground">By: {edit.editedBy}</span>
                        <span className="text-muted-foreground">
                          {formatWithTimezone(edit.editedAt, timezone)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="line-through text-muted-foreground">
                          {formatCurrency(edit.previousTotal)}
                        </span>
                        <span>→</span>
                        <span className="font-semibold">{formatCurrency(edit.newTotal)}</span>
                      </div>
                      <p className="mt-1 text-muted-foreground">Reason: {edit.reason}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Edit Sale Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="font-display text-destructive flex items-center gap-2">
              <AlertTriangle className="w-5 h-5" />
              Edit Sale - {selectedSale && formatSaleId(selectedSale.id)}
            </DialogTitle>
            <DialogDescription>
              This action will be logged. Please provide a valid reason.
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="p-4 rounded-lg bg-destructive/10 border border-destructive/20">
              <p className="text-sm text-muted-foreground mb-2">Current Total</p>
              <p className="text-2xl font-display font-bold">
                {selectedSale && formatCurrency(selectedSale.total)}
              </p>
            </div>

            <div className="space-y-2">
              <Label>New Total Amount (৳)</Label>
              <Input
                type="number"
                value={editAmount}
                onChange={(e) => setEditAmount(e.target.value)}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Reason for Edit (Required)</Label>
              <Textarea
                placeholder="Explain why this sale needs to be modified..."
                value={editReason}
                onChange={(e) => setEditReason(e.target.value)}
                className="bg-muted/50"
                rows={3}
              />
            </div>

            {editAmount && selectedSale && parseFloat(editAmount) !== selectedSale.total && (
              <div className="p-3 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-muted-foreground">Difference</span>
                  <span
                    className={`font-display font-bold ${
                      parseFloat(editAmount) < selectedSale.total
                        ? "text-destructive"
                        : "text-accent"
                    }`}
                  >
                    {parseFloat(editAmount) < selectedSale.total ? "-" : "+"}
                    {formatCurrency(Math.abs(parseFloat(editAmount) - selectedSale.total))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleSaveEdit}
              disabled={!editReason.trim()}
            >
              <Edit className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
