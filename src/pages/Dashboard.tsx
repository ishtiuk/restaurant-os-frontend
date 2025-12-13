import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { dashboardStats, items, purchaseOrders } from "@/data/mockData";
import {
  TrendingUp,
  TrendingDown,
  ShoppingCart,
  Wallet,
  CreditCard,
  Smartphone,
  AlertTriangle,
  Package,
  ArrowRight,
  Clock,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
} from "recharts";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const CHART_COLORS = ["hsl(38, 95%, 55%)", "hsl(18, 75%, 45%)", "hsl(158, 65%, 45%)", "hsl(220, 15%, 40%)"];

export default function Dashboard() {
  const lowStockItems = items.filter((item) => item.stockQty <= 10);
  const pendingOrders = purchaseOrders.filter((po) => po.status === "pending");

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-1 animate-fade-in">
        <h1 className="text-3xl font-display font-bold gradient-text">Dashboard</h1>
        <p className="text-muted-foreground">আজকের অপারেশন সারসংক্ষেপ • Today's Overview</p>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <GlassCard hover glow="primary" className="kpi-card animate-fade-in stagger-1">
          <div className="flex items-center justify-between">
            <p className="kpi-label">Today's Sales</p>
            <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
          </div>
          <p className="kpi-value gradient-text-gold">{formatCurrency(dashboardStats.todaySales)}</p>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="success">+12.5%</Badge>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        </GlassCard>

        <GlassCard hover glow="accent" className="kpi-card animate-fade-in stagger-2">
          <div className="flex items-center justify-between">
            <p className="kpi-label">Orders</p>
            <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center">
              <ShoppingCart className="w-5 h-5 text-accent" />
            </div>
          </div>
          <p className="kpi-value text-accent">{dashboardStats.todayOrders}</p>
          <div className="flex items-center gap-2 text-sm">
            <Badge variant="success">+8</Badge>
            <span className="text-muted-foreground">vs yesterday</span>
          </div>
        </GlassCard>

        <GlassCard hover className="kpi-card animate-fade-in stagger-3">
          <div className="flex items-center justify-between">
            <p className="kpi-label">Cash Sales</p>
            <div className="w-10 h-10 rounded-xl bg-muted flex items-center justify-center">
              <Wallet className="w-5 h-5 text-foreground" />
            </div>
          </div>
          <p className="kpi-value">{formatCurrency(dashboardStats.cashSales)}</p>
          <p className="text-sm text-muted-foreground">55% of total</p>
        </GlassCard>

        <GlassCard hover className="kpi-card animate-fade-in stagger-4">
          <div className="flex items-center justify-between">
            <p className="kpi-label">Digital Sales</p>
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <p className="kpi-value">{formatCurrency(dashboardStats.cardSales + dashboardStats.mobileSales)}</p>
          <p className="text-sm text-muted-foreground">45% of total</p>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Revenue Trend */}
        <GlassCard className="p-6 lg:col-span-2 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-6">
            <div>
              <h3 className="font-display font-semibold text-lg">Revenue Trend</h3>
              <p className="text-sm text-muted-foreground">গত ৭ দিনের আয়</p>
            </div>
            <Badge variant="glass">Last 7 days</Badge>
          </div>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={dashboardStats.revenueByDay}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="hsl(38, 95%, 55%)" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis dataKey="date" stroke="hsl(220, 10%, 55%)" fontSize={12} />
                <YAxis stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `৳${v / 1000}k`} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 15%, 12%)",
                    border: "1px solid hsl(220, 15%, 25%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => [formatCurrency(value), "Revenue"]}
                />
                <Area
                  type="monotone"
                  dataKey="revenue"
                  stroke="hsl(38, 95%, 55%)"
                  strokeWidth={2}
                  fillOpacity={1}
                  fill="url(#colorRevenue)"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Payment Methods */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <div className="mb-6">
            <h3 className="font-display font-semibold text-lg">Payment Methods</h3>
            <p className="text-sm text-muted-foreground">পেমেন্ট মাধ্যম</p>
          </div>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={dashboardStats.salesByPayment}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="amount"
                >
                  {dashboardStats.salesByPayment.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
            {dashboardStats.salesByPayment.map((item, index) => (
              <div key={item.method} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: CHART_COLORS[index] }}
                />
                <span className="text-sm text-muted-foreground">{item.method}</span>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* Alerts & Top Items */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Alerts */}
        <GlassCard className="p-6 animate-fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg">Alerts</h3>
              <p className="text-sm text-muted-foreground">সতর্কতা</p>
            </div>
            <Badge variant="danger">{lowStockItems.length + pendingOrders.length}</Badge>
          </div>
          <div className="space-y-3">
            {lowStockItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">Stock: {item.stockQty} {item.unit}</p>
                  </div>
                </div>
                <Badge variant="danger">Low Stock</Badge>
              </div>
            ))}
            {pendingOrders.map((po) => (
              <div
                key={po.id}
                className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                    <p className="font-medium">{po.supplierName}</p>
                    <p className="text-sm text-muted-foreground">{formatCurrency(po.total)}</p>
                  </div>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Top Selling Items */}
        <GlassCard className="p-6 animate-fade-in stagger-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg">Top Selling Items</h3>
              <p className="text-sm text-muted-foreground">সেরা বিক্রিত আইটেম</p>
            </div>
            <Button variant="ghost" size="sm">
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {dashboardStats.topItems.map((item, index) => (
              <div
                key={item.name}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center font-display font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} sold</p>
                  </div>
                </div>
                <p className="font-display font-semibold text-primary">{formatCurrency(item.revenue)}</p>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
