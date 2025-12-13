import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardStats, items } from "@/data/mockData";
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Download,
  Calendar,
  PieChart,
} from "lucide-react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export default function Reports() {
  const lowStockItems = items.filter((item) => item.stockQty <= 10);

  const reportCards = [
    { title: "Sales Report", icon: TrendingUp, description: "Daily, weekly, monthly sales analysis", color: "primary" },
    { title: "Inventory Report", icon: Package, description: "Stock levels and movement", color: "accent" },
    { title: "Category Performance", icon: PieChart, description: "Sales by category breakdown", color: "secondary" },
    { title: "Profit & Loss", icon: BarChart3, description: "Revenue vs expenses analysis", color: "primary" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Reports</h1>
          <p className="text-muted-foreground">রিপোর্ট ও বিশ্লেষণ • Analytics & Reports</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            Date Range
          </Button>
          <Button variant="glow">
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in stagger-1">
        {reportCards.map((report, index) => (
          <GlassCard
            key={report.title}
            hover
            glow={report.color as "primary" | "accent" | "secondary"}
            className="p-5 cursor-pointer"
          >
            <div className="flex items-center gap-3 mb-3">
              <div className={`w-10 h-10 rounded-lg bg-${report.color}/20 flex items-center justify-center`}>
                <report.icon className={`w-5 h-5 text-${report.color}`} />
              </div>
              <h3 className="font-semibold">{report.title}</h3>
            </div>
            <p className="text-sm text-muted-foreground">{report.description}</p>
          </GlassCard>
        ))}
      </div>

      {/* Sales Trend */}
      <GlassCard className="p-6 animate-fade-in stagger-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h3 className="font-display font-semibold text-lg">Sales Trend</h3>
            <p className="text-sm text-muted-foreground">বিক্রয় প্রবণতা</p>
          </div>
          <Badge variant="glass">Last 7 days</Badge>
        </div>
        <div className="h-72">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={dashboardStats.revenueByDay}>
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
              <Line
                type="monotone"
                dataKey="revenue"
                stroke="hsl(38, 95%, 55%)"
                strokeWidth={3}
                dot={{ fill: "hsl(38, 95%, 55%)", strokeWidth: 2, r: 4 }}
                activeDot={{ r: 6 }}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <h3 className="font-display font-semibold text-lg mb-4">Top Selling Products</h3>
          <div className="space-y-3">
            {dashboardStats.topItems.map((item, index) => (
              <div key={item.name} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center font-display font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                    <p className="font-medium">{item.name}</p>
                    <p className="text-sm text-muted-foreground">{item.quantity} units sold</p>
                  </div>
                </div>
                <span className="font-display font-semibold text-primary">{formatCurrency(item.revenue)}</span>
              </div>
            ))}
          </div>
        </GlassCard>

        {/* Low Stock Alert */}
        <GlassCard className="p-6 animate-fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Low Stock Alert</h3>
            <Badge variant="danger">{lowStockItems.length} items</Badge>
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
                    <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="font-medium text-destructive">{item.stockQty} left</p>
                  <p className="text-sm text-muted-foreground">{item.unit}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
