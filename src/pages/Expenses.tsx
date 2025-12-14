import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { expenses, expenseCategories } from "@/data/mockData";
import { Expense, ExpenseCategory } from "@/types";
import {
  Plus,
  Download,
  Filter,
  Calendar,
  TrendingDown,
  Wallet,
  CreditCard,
  Smartphone,
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
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
} from "recharts";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const COLORS = [
  "hsl(38, 95%, 55%)",
  "hsl(18, 75%, 45%)",
  "hsl(158, 65%, 45%)",
  "hsl(220, 15%, 40%)",
  "hsl(280, 60%, 50%)",
  "hsl(45, 90%, 50%)",
  "hsl(200, 80%, 50%)",
  "hsl(340, 70%, 50%)",
];

export default function ExpensesPage() {
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");

  const [formData, setFormData] = useState({
    categoryId: "",
    amount: "",
    description: "",
    paymentMethod: "cash" as Expense["paymentMethod"],
  });

  const filteredExpenses = filterCategory === "all"
    ? expenses
    : expenses.filter((e) => e.categoryId === filterCategory);

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);

  const categoryTotals = expenseCategories.map((cat) => ({
    ...cat,
    total: expenses.filter((e) => e.categoryId === cat.id).reduce((sum, e) => sum + e.amount, 0),
  }));

  const pieData = categoryTotals
    .filter((c) => c.total > 0)
    .map((c) => ({
      name: c.name,
      value: c.total,
    }));

  const barData = categoryTotals.map((c) => ({
    name: c.name,
    spent: c.total,
    budget: c.budget || 0,
  }));

  const handleSubmit = () => {
    const amount = parseFloat(formData.amount);
    if (!amount || amount <= 0) {
      toast({ title: "Invalid amount", variant: "destructive" });
      return;
    }
    if (!formData.categoryId) {
      toast({ title: "Select a category", variant: "destructive" });
      return;
    }

    const category = expenseCategories.find((c) => c.id === formData.categoryId);
    toast({
      title: "Expense Added",
      description: `${category?.name}: ${formatCurrency(amount)}`,
    });

    setShowAddDialog(false);
    setFormData({
      categoryId: "",
      amount: "",
      description: "",
      paymentMethod: "cash",
    });
  };

  const getPaymentIcon = (method: Expense["paymentMethod"]) => {
    switch (method) {
      case "cash":
        return <Wallet className="w-4 h-4" />;
      case "card":
        return <CreditCard className="w-4 h-4" />;
      default:
        return <Smartphone className="w-4 h-4" />;
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Expenses</h1>
          <p className="text-muted-foreground">খরচ ব্যবস্থাপনা • Expense Management</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
          <Button variant="glow" onClick={() => setShowAddDialog(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
        </div>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in stagger-1">
        <GlassCard className="p-4" glow="secondary">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <TrendingDown className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-2xl font-display font-bold text-secondary">{formatCurrency(totalExpenses)}</p>
        </GlassCard>
        {categoryTotals.slice(0, 3).map((cat) => (
          <GlassCard key={cat.id} className="p-4">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">{cat.icon} {cat.name}</p>
            </div>
            <p className="text-2xl font-display font-bold">{formatCurrency(cat.total)}</p>
            {cat.budget && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-muted-foreground mb-1">
                  <span>Budget</span>
                  <span>{formatCurrency(cat.budget)}</span>
                </div>
                <div className="h-1.5 bg-muted rounded-full overflow-hidden">
                  <div
                    className={`h-full rounded-full ${
                      cat.total > cat.budget ? "bg-destructive" : "bg-accent"
                    }`}
                    style={{ width: `${Math.min((cat.total / cat.budget) * 100, 100)}%` }}
                  />
                </div>
              </div>
            )}
          </GlassCard>
        ))}
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Pie Chart */}
        <GlassCard className="p-6 animate-fade-in stagger-2">
          <h3 className="font-display font-semibold text-lg mb-6">Expense Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={pieData}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={80}
                  paddingAngle={4}
                  dataKey="value"
                >
                  {pieData.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 15%, 12%)",
                    border: "1px solid hsl(220, 15%, 25%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {pieData.map((item, index) => (
              <div key={item.name} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: COLORS[index % COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground truncate">{item.name}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Bar Chart - Budget vs Spent */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <h3 className="font-display font-semibold text-lg mb-6">Budget vs Spent</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData.filter((d) => d.budget > 0)}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={10} angle={-45} textAnchor="end" height={60} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 15%, 12%)",
                    border: "1px solid hsl(220, 15%, 25%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="budget" fill="hsl(220, 15%, 30%)" radius={[4, 4, 0, 0]} name="Budget" />
                <Bar dataKey="spent" fill="hsl(18, 75%, 45%)" radius={[4, 4, 0, 0]} name="Spent" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>
      </div>

      {/* Expenses Table */}
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">Recent Expenses</h3>
          <div className="flex items-center gap-2">
            <Filter className="w-4 h-4 text-muted-foreground" />
            <Select value={filterCategory} onValueChange={setFilterCategory}>
              <SelectTrigger className="w-[180px] bg-muted/50">
                <SelectValue placeholder="Filter" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Categories</SelectItem>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.icon} {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium">Date</th>
                <th className="text-left p-4 font-medium">Category</th>
                <th className="text-left p-4 font-medium">Description</th>
                <th className="text-center p-4 font-medium">Payment</th>
                <th className="text-right p-4 font-medium">Amount</th>
              </tr>
            </thead>
            <tbody>
              {filteredExpenses.map((expense) => (
                <tr key={expense.id} className="border-b border-border/50 table-row-hover">
                  <td className="p-4 text-muted-foreground">{expense.date}</td>
                  <td className="p-4">
                    <Badge variant="glass">
                      {expenseCategories.find((c) => c.id === expense.categoryId)?.icon} {expense.categoryName}
                    </Badge>
                  </td>
                  <td className="p-4">{expense.description}</td>
                  <td className="p-4 text-center">
                    <Badge variant="outline" className="gap-1">
                      {getPaymentIcon(expense.paymentMethod)}
                      <span className="capitalize">{expense.paymentMethod}</span>
                    </Badge>
                  </td>
                  <td className="p-4 text-right font-display font-semibold text-secondary">
                    -{formatCurrency(expense.amount)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Add Expense Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Add Expense</DialogTitle>
            <DialogDescription>খরচ যোগ করুন</DialogDescription>
          </DialogHeader>

          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>Category</Label>
              <Select value={formData.categoryId} onValueChange={(v) => setFormData({ ...formData, categoryId: v })}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {expenseCategories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.icon} {cat.name}
                    </SelectItem>
                  ))}
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
                <Label>Payment Method</Label>
                <Select
                  value={formData.paymentMethod}
                  onValueChange={(v) => setFormData({ ...formData, paymentMethod: v as Expense["paymentMethod"] })}
                >
                  <SelectTrigger className="bg-muted/50">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="cash">Cash</SelectItem>
                    <SelectItem value="card">Card</SelectItem>
                    <SelectItem value="bkash">bKash</SelectItem>
                    <SelectItem value="nagad">Nagad</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-2">
              <Label>Description</Label>
              <Textarea
                placeholder="What was this expense for..."
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                className="bg-muted/50"
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleSubmit}>
              Add Expense
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
