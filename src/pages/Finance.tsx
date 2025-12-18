import React, { useState } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  ArrowRight,
  Clock,
  CheckCircle,
  Plus,
  Filter,
} from "lucide-react";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
  PieChart,
  Pie,
  Legend,
} from "recharts";
import { TransferCashToBank } from "@/components/finance/TransferCashToBank";
import { AddExpense } from "@/components/finance/AddExpense";

const formatCurrency = (amount: number) => `৳${Math.abs(amount).toLocaleString("bn-BD")}`;

// Placeholder API data
const financeSummary = {
  totalIncome: 245680.00,
  totalExpense: 178900.00,
  netProfit: 66780.00,
  cashOnHand: 125000.00,
  bankBalance: 450000.00,
  pendingTransfers: 15000.00,
};

const incomeExpenseData = [
  { day: "Sat", income: 32500, expense: 18200 },
  { day: "Sun", income: 38900, expense: 22100 },
  { day: "Mon", income: 28400, expense: 15800 },
  { day: "Tue", income: 35600, expense: 24500 },
  { day: "Wed", income: 42100, expense: 28900 },
  { day: "Thu", income: 31200, expense: 19400 },
  { day: "Fri", income: 36980, expense: 50000 },
];

const paymentBreakdown = [
  { name: "Cash", value: 98500, color: "hsl(158, 65%, 45%)" },
  { name: "Card", value: 67200, color: "hsl(220, 70%, 50%)" },
  { name: "Bank Transfer", value: 52800, color: "hsl(280, 65%, 50%)" },
  { name: "Online", value: 27180, color: "hsl(38, 95%, 55%)" },
];

const recentTransactions = [
  { id: "1", type: "income", description: "Sales - Table 5", amount: 2500, date: "2024-01-20", status: "completed", paymentMethod: "cash" },
  { id: "2", type: "expense", description: "Supplier Payment - Dhaka Meat", amount: -15000, date: "2024-01-20", status: "completed", paymentMethod: "bank_transfer" },
  { id: "3", type: "income", description: "Sales - POS Counter", amount: 4200, date: "2024-01-20", status: "completed", paymentMethod: "card" },
  { id: "4", type: "expense", description: "Utility Bill - DESCO", amount: -8500, date: "2024-01-19", status: "pending", paymentMethod: "bank_transfer" },
  { id: "5", type: "income", description: "Sales - Delivery Order", amount: 1800, date: "2024-01-19", status: "completed", paymentMethod: "online" },
  { id: "6", type: "expense", description: "Staff Salary - January", amount: -45000, date: "2024-01-19", status: "completed", paymentMethod: "bank_transfer" },
  { id: "7", type: "income", description: "Sales - Table 12", amount: 3200, date: "2024-01-19", status: "completed", paymentMethod: "cash" },
  { id: "8", type: "expense", description: "Marketing - Social Media Ads", amount: -5000, date: "2024-01-18", status: "completed", paymentMethod: "card" },
  { id: "9", type: "income", description: "Catering Order", amount: 25000, date: "2024-01-18", status: "completed", paymentMethod: "bank_transfer" },
  { id: "10", type: "expense", description: "Rent - January", amount: -35000, date: "2024-01-18", status: "pending", paymentMethod: "bank_transfer" },
];

const banks = [
  { id: "2", name: "Brac Bank", balance: 200000 },
];

const getPaymentIcon = (method: string) => {
  switch (method) {
    case "cash": return <Wallet className="w-4 h-4" />;
    case "card": return <CreditCard className="w-4 h-4" />;
    case "bank_transfer": return <Building2 className="w-4 h-4" />;
    case "online": return <Smartphone className="w-4 h-4" />;
    default: return <Wallet className="w-4 h-4" />;
  }
};

const getStatusBadge = (status: string) => {
  switch (status) {
    case "completed":
      return <Badge className="bg-accent/20 text-accent border-accent/30"><CheckCircle className="w-3 h-3 mr-1" />Completed</Badge>;
    case "pending":
      return <Badge className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
    case "reconciled":
      return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30"><CheckCircle className="w-3 h-3 mr-1" />Reconciled</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

export default function Finance() {
  const [dateRange, setDateRange] = useState("this_month");
  const [transferOpen, setTransferOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);

  const handleExport = () => {
    // Placeholder for CSV export
    console.log("Exporting to CSV...");
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Finance</h1>
          <p className="text-muted-foreground">আর্থিক ড্যাশবোর্ড • Financial Dashboard</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] bg-muted/50">
              <Calendar className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards - 6 tiles */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in stagger-1">
        <GlassCard hover glow="accent" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <ArrowUpRight className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-bold text-accent">{formatCurrency(financeSummary.totalIncome)}</p>
          <p className="text-xs text-muted-foreground mt-1">মোট আয়</p>
        </GlassCard>

        <GlassCard hover glow="secondary" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <ArrowDownRight className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl font-display font-bold text-secondary">{formatCurrency(financeSummary.totalExpense)}</p>
          <p className="text-xs text-muted-foreground mt-1">মোট খরচ</p>
        </GlassCard>

        <GlassCard hover glow="primary" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-display font-bold gradient-text-gold">{formatCurrency(financeSummary.netProfit)}</p>
          <p className="text-xs text-muted-foreground mt-1">নিট লাভ</p>
        </GlassCard>

        <GlassCard hover className="p-6 border-blue-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Cash on Hand</p>
            <Wallet className="w-5 h-5 text-blue-400" />
          </div>
          <p className="text-3xl font-display font-bold text-blue-400">{formatCurrency(financeSummary.cashOnHand)}</p>
          <p className="text-xs text-muted-foreground mt-1">হাতে নগদ</p>
        </GlassCard>

        <GlassCard hover className="p-6 border-purple-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Bank Balance</p>
            <Building2 className="w-5 h-5 text-purple-400" />
          </div>
          <p className="text-3xl font-display font-bold text-purple-400">{formatCurrency(financeSummary.bankBalance)}</p>
          <p className="text-xs text-muted-foreground mt-1">ব্যাংক ব্যালেন্স</p>
        </GlassCard>

        <GlassCard hover className="p-6 border-orange-500/20">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Pending Transfers</p>
            <Clock className="w-5 h-5 text-orange-400" />
          </div>
          <p className="text-3xl font-display font-bold text-orange-400">{formatCurrency(financeSummary.pendingTransfers)}</p>
          <p className="text-xs text-muted-foreground mt-1">বকেয়া স্থানান্তর</p>
        </GlassCard>
      </div>

      {/* Quick Actions */}
      <div className="flex flex-wrap gap-3 animate-fade-in stagger-2">
        <Button variant="glow" onClick={() => setExpenseOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Expense
        </Button>
        <Button variant="outline" onClick={() => setTransferOpen(true)}>
          <ArrowRight className="w-4 h-4 mr-2" />
          Transfer to Bank
        </Button>
        <Link to="/finance/transactions">
          <Button variant="outline">
            <Filter className="w-4 h-4 mr-2" />
            View All Transactions
          </Button>
        </Link>
        <Link to="/finance/banks">
          <Button variant="outline">
            <Building2 className="w-4 h-4 mr-2" />
            Manage Banks
          </Button>
        </Link>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Income vs Expenses - Last 7 Days */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <h3 className="font-display font-semibold text-lg mb-6">Income vs Expenses (Last 7 Days)</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={incomeExpenseData}>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis dataKey="day" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 15%, 12%)",
                    border: "1px solid hsl(220, 15%, 25%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="income" name="Income" fill="hsl(158, 65%, 45%)" radius={[4, 4, 0, 0]} />
                <Bar dataKey="expense" name="Expense" fill="hsl(18, 75%, 45%)" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Payment Method Breakdown */}
        <GlassCard className="p-6 animate-fade-in stagger-4">
          <h3 className="font-display font-semibold text-lg mb-6">Payment Method Breakdown</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={paymentBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                  label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                  labelLine={false}
                >
                  {paymentBreakdown.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 15%, 18%)",
                    border: "1px solid hsl(220, 15%, 30%)",
                    borderRadius: "8px",
                    color: "hsl(220, 10%, 90%)",
                    padding: "8px 12px",
                    boxShadow: "0 4px 6px rgba(0, 0, 0, 0.3)",
                  }}
                  itemStyle={{
                    color: "hsl(220, 10%, 90%)",
                  }}
                  labelStyle={{
                    color: "hsl(220, 10%, 90%)",
                    fontWeight: 600,
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Amount"]}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {paymentBreakdown.map((item) => (
              <div key={item.name} className="flex items-center gap-2 text-sm">
                <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                <span className="text-muted-foreground">{item.name}:</span>
                <span className="font-medium">{formatCurrency(item.value)}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Recent Transactions */}
      <GlassCard className="p-6 animate-fade-in stagger-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">Recent Transactions</h3>
          <Link to="/finance/transactions">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border">
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Description</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Payment</th>
                <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
              </tr>
            </thead>
            <tbody>
              {recentTransactions.map((txn) => (
                <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                  <td className="py-3 px-2">
                    <Badge className={txn.type === "income" ? "bg-accent/20 text-accent border-accent/30" : "bg-secondary/20 text-secondary border-secondary/30"}>
                      {txn.type === "income" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                      {txn.type === "income" ? "Income" : "Expense"}
                    </Badge>
                  </td>
                  <td className="py-3 px-2 font-medium">{txn.description}</td>
                  <td className="py-3 px-2">
                    <span className="flex items-center gap-2 text-muted-foreground">
                      {getPaymentIcon(txn.paymentMethod)}
                      <span className="capitalize">{txn.paymentMethod.replace("_", " ")}</span>
                    </span>
                  </td>
                  <td className="py-3 px-2 text-muted-foreground">{txn.date}</td>
                  <td className={`py-3 px-2 text-right font-display font-semibold ${txn.type === "income" ? "text-accent" : "text-secondary"}`}>
                    {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                  </td>
                  <td className="py-3 px-2 text-right">{getStatusBadge(txn.status)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>

      {/* Modals */}
      <TransferCashToBank
        open={transferOpen}
        onOpenChange={setTransferOpen}
        cashBalance={financeSummary.cashOnHand}
        banks={banks}
      />
      <AddExpense
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        banks={banks}
      />
    </div>
  );
}
