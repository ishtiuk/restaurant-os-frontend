import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { recentSales } from "@/data/mockData";
import { Sale } from "@/types";
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

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export default function SalesHistoryPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState<string>("all");
  const [selectedSale, setSelectedSale] = useState<Sale | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [editReason, setEditReason] = useState("");
  const [editAmount, setEditAmount] = useState("");

  const filteredSales = recentSales.filter((sale) => {
    const matchesSearch =
      sale.id.toLowerCase().includes(searchQuery.toLowerCase()) ||
      sale.customerName?.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesStatus = filterStatus === "all" || sale.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

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

  const handleSaveEdit = () => {
    if (!editReason.trim()) {
      toast({ title: "Please provide a reason", variant: "destructive" });
      return;
    }

    toast({
      title: "Sale Updated",
      description: `Sale ${selectedSale?.id} has been modified. Audit log created.`,
    });

    setShowEditDialog(false);
    setEditReason("");
    setEditAmount("");
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
      bkash: "bg-pink-500/20 text-pink-500",
      nagad: "bg-orange-500/20 text-orange-500",
    };
    return (
      <Badge className={`${colors[method] || "bg-muted text-muted-foreground"} border-0 capitalize`}>
        {method}
      </Badge>
    );
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
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Admin Warning */}
      <GlassCard className="p-4 border-2 border-destructive/30 bg-destructive/10 animate-fade-in stagger-1">
        <div className="flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-destructive mt-0.5" />
          <div>
            <p className="font-semibold text-destructive">Admin Access Required</p>
            <p className="text-sm text-muted-foreground">
              Editing sales records is a sensitive operation. All changes are logged for audit purposes.
              Only authorized administrators can modify completed transactions.
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
                  <td className="p-4 font-mono font-medium">{sale.id}</td>
                  <td className="p-4 text-muted-foreground">
                    {new Date(sale.createdAt).toLocaleString()}
                  </td>
                  <td className="p-4">
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
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* View Sale Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-lg glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Sale Details - {selectedSale?.id}</DialogTitle>
            <DialogDescription>
              {selectedSale && new Date(selectedSale.createdAt).toLocaleString()}
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
                          {new Date(edit.editedAt).toLocaleString()}
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
              Edit Sale - {selectedSale?.id}
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
