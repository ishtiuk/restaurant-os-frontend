import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { vatEntries } from "@/data/mockData";
import { VatEntry } from "@/types";
import {
  Plus,
  Download,
  Calendar,
  TrendingUp,
  TrendingDown,
  Receipt,
  FileText,
  Filter,
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
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const getTypeBadge = (type: VatEntry["type"]) => {
  switch (type) {
    case "sales":
      return <Badge variant="success">Sales VAT</Badge>;
    case "purchase":
      return <Badge variant="warning">Purchase VAT</Badge>;
    case "service":
      return <Badge variant="outline">Service VAT</Badge>;
    default:
      return <Badge variant="outline">{type}</Badge>;
  }
};

export default function VatPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterType, setFilterType] = useState<string>("all");

  const [formData, setFormData] = useState({
    type: "sales" as VatEntry["type"],
    amount: "",
    vatRate: "5",
    description: "",
    invoiceNo: "",
  });

  const filteredEntries = filterType === "all" 
    ? vatEntries 
    : vatEntries.filter((e) => e.type === filterType);

  const salesVat = vatEntries.filter((e) => e.type === "sales").reduce((sum, e) => sum + e.vatAmount, 0);
  const purchaseVat = vatEntries.filter((e) => e.type === "purchase").reduce((sum, e) => sum + e.vatAmount, 0);
  const serviceVat = vatEntries.filter((e) => e.type === "service").reduce((sum, e) => sum + e.vatAmount, 0);
  const netVat = salesVat - purchaseVat;

  const chartData = [
    { name: "Sales VAT", amount: salesVat, type: "collected" },
    { name: "Purchase VAT", amount: purchaseVat, type: "credit" },
    { name: "Service VAT", amount: serviceVat, type: "paid" },
    { name: "Net Payable", amount: netVat, type: "net" },
  ];

  const handleSubmit = () => {
    const amount = parseFloat(formData.amount);
    const vatRate = parseFloat(formData.vatRate);
    
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }

    const vatAmount = amount * (vatRate / 100);
    
    toast({
      title: "VAT Entry Added",
      description: `${formData.type.toUpperCase()} VAT: ${formatCurrency(vatAmount)}`,
    });
    
    setShowAddDialog(false);
    setFormData({
      type: "sales",
      amount: "",
      vatRate: "5",
      description: "",
      invoiceNo: "",
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">VAT Management</h1>
          <p className="text-muted-foreground">মূসক ব্যবস্থাপনা • Value Added Tax</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export Report
          </Button>
          <Button variant="glow" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add VAT Entry
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in stagger-1">
        <GlassCard className="p-4" glow="accent">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Sales VAT (Collected)</p>
            <TrendingUp className="w-5 h-5 text-accent" />
          </div>
          <p className="text-2xl font-display font-bold text-accent">{formatCurrency(salesVat)}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="secondary">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Purchase VAT (Credit)</p>
            <TrendingDown className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-2xl font-display font-bold text-secondary">{formatCurrency(purchaseVat)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Service VAT</p>
            <Receipt className="w-5 h-5 text-muted-foreground" />
          </div>
          <p className="text-2xl font-display font-bold">{formatCurrency(serviceVat)}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="primary">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Net VAT Payable</p>
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <p className="text-2xl font-display font-bold gradient-text">{formatCurrency(netVat)}</p>
        </GlassCard>
      </div>

      {/* Chart */}
      <GlassCard className="p-6 animate-fade-in stagger-2">
        <h3 className="font-display font-semibold text-lg mb-6">VAT Summary</h3>
        <div className="h-64">
          <ResponsiveContainer width="100%" height="100%">
            <BarChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
              <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={12} />
              <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `৳${v / 1000}k`} />
              <Tooltip
                contentStyle={{
                  backgroundColor: "hsl(220, 15%, 12%)",
                  border: "1px solid hsl(220, 15%, 25%)",
                  borderRadius: "8px",
                }}
                formatter={(value: number) => formatCurrency(value)}
              />
              <Bar dataKey="amount" radius={[4, 4, 0, 0]}>
                {chartData.map((entry, index) => (
                  <Cell
                    key={`cell-${index}`}
                    fill={
                      entry.type === "collected"
                        ? "hsl(158, 65%, 45%)"
                        : entry.type === "credit"
                        ? "hsl(18, 75%, 45%)"
                        : entry.type === "net"
                        ? "hsl(38, 95%, 55%)"
                        : "hsl(220, 15%, 40%)"
                    }
                  />
                ))}
              </Bar>
            </BarChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      {/* Filter & Table */}
      <GlassCard className="p-6 animate-fade-in stagger-3">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">VAT Entries</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterType} onValueChange={setFilterType}>
              <SelectTrigger className="w-[150px] bg-muted/50">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="sales">Sales VAT</SelectItem>
                <SelectItem value="purchase">Purchase VAT</SelectItem>
                <SelectItem value="service">Service VAT</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Type</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-left p-4 font-medium">Invoice</th>
                <th className="text-right p-4 font-medium">Amount</th>
                <th className="text-center p-4 font-medium">Rate</th>
                <th className="text-right p-4 font-medium">VAT</th>
              </tr>
            </thead>
            <tbody>
              {filteredEntries.map((entry) => (
                <tr key={entry.id} className="border-b border-border/50 table-row-hover">
                  <td className="p-4 text-muted-foreground">{entry.date}</td>
                  <td className="p-4">{getTypeBadge(entry.type)}</td>
                  <td className="p-4">{entry.description}</td>
                  <td className="p-4 text-muted-foreground">{entry.invoiceNo || "-"}</td>
                  <td className="p-4 text-right font-medium">{formatCurrency(entry.amount)}</td>
                  <td className="p-4 text-center">
                    <Badge variant="outline">{entry.vatRate}%</Badge>
                  </td>
                  <td className="p-4 text-right">
                    <span className={`font-display font-semibold ${entry.type === "sales" ? "text-accent" : "text-secondary"}`}>
                      {entry.type === "purchase" ? "-" : "+"}
                      {formatCurrency(entry.vatAmount)}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add VAT Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Add VAT Entry</DialogTitle>
            <DialogDescription>মূসক এন্ট্রি যোগ করুন</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>VAT Type</Label>
              <Select value={formData.type} onValueChange={(v) => setFormData({ ...formData, type: v as VatEntry["type"] })}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="sales">Sales VAT (Output)</SelectItem>
                  <SelectItem value="purchase">Purchase VAT (Input Credit)</SelectItem>
                  <SelectItem value="service">Service VAT</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Amount (৳)</Label>
                <Input
                  type="number"
                  placeholder="0.00"
                  value={formData.amount}
                  onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                  className="bg-muted/50"
                />
              </div>
              <div className="space-y-2">
                <Label>VAT Rate (%)</Label>
                <Select value={formData.vatRate} onValueChange={(v) => setFormData({ ...formData, vatRate: v })}>
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="5">5%</SelectItem>
                    <SelectItem value="7.5">7.5%</SelectItem>
                    <SelectItem value="10">10%</SelectItem>
                    <SelectItem value="15">15%</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Invoice Number (Optional)</Label>
              <Input
                placeholder="INV-2024-XXX"
                value={formData.invoiceNo}
                onChange={(e) => setFormData({ ...formData, invoiceNo: e.target.value })}
                className="bg-muted/50"
              />
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="Description of this VAT entry..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-muted/50"
              />
            </div>

            {formData.amount && (
              <div className="p-4 rounded-lg bg-primary/10 border border-primary/20">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">VAT Amount</span>
                  <span className="font-display font-bold text-primary">
                    {formatCurrency(parseFloat(formData.amount || "0") * (parseFloat(formData.vatRate) / 100))}
                  </span>
                </div>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleSubmit}>
              Add Entry
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
