import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { purchaseOrders } from "@/data/mockData";
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
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Purchases</h1>
          <p className="text-muted-foreground">ক্রয় অর্ডার ম্যানেজমেন্ট • Purchase Orders</p>
        </div>
        <Button variant="glow">
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
            {formatCurrency(
              purchaseOrders
                .filter((po) => po.status === "pending")
                .reduce((sum, po) => sum + po.total, 0)
            )}
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
                        <Button variant="outline" size="sm">
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
    </div>
  );
}
