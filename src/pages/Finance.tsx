import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { dashboardStats } from "@/data/mockData";
import {
  TrendingUp,
  TrendingDown,
  Download,
  Calendar,
  Wallet,
  CreditCard,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
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
} from "recharts";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const CHART_COLORS = ["hsl(38, 95%, 55%)", "hsl(18, 75%, 45%)", "hsl(158, 65%, 45%)", "hsl(220, 15%, 40%)"];

const cashFlowData = [
  { name: "Sales", amount: 245680, type: "income" },
  { name: "Purchases", amount: -86400, type: "expense" },
  { name: "Salaries", amount: -45000, type: "expense" },
  { name: "Utilities", amount: -12500, type: "expense" },
  { name: "Rent", amount: -35000, type: "expense" },
  { name: "Other Income", amount: 8500, type: "income" },
];

export default function Finance() {
  const totalIncome = cashFlowData.filter((d) => d.type === "income").reduce((sum, d) => sum + d.amount, 0);
  const totalExpense = Math.abs(cashFlowData.filter((d) => d.type === "expense").reduce((sum, d) => sum + d.amount, 0));
  const netProfit = totalIncome - totalExpense;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Finance</h1>
          <p className="text-muted-foreground">আর্থিক সারসংক্ষেপ • Financial Overview</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline">
            <Calendar className="w-4 h-4 mr-2" />
            This Month
          </Button>
          <Button variant="glow">
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in stagger-1">
        <GlassCard hover glow="accent" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <ArrowUpRight className="w-5 h-5 text-accent" />
          </div>
          <p className="text-3xl font-display font-bold text-accent">{formatCurrency(totalIncome)}</p>
        </GlassCard>

        <GlassCard hover glow="secondary" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <ArrowDownRight className="w-5 h-5 text-secondary" />
          </div>
          <p className="text-3xl font-display font-bold text-secondary">{formatCurrency(totalExpense)}</p>
        </GlassCard>

        <GlassCard hover glow="primary" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            <TrendingUp className="w-5 h-5 text-primary" />
          </div>
          <p className="text-3xl font-display font-bold gradient-text-gold">{formatCurrency(netProfit)}</p>
        </GlassCard>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Cash Flow */}
        <GlassCard className="p-6 animate-fade-in stagger-2">
          <h3 className="font-display font-semibold text-lg mb-6">Cash Flow</h3>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={cashFlowData} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="hsl(220, 15%, 20%)" />
                <XAxis type="number" stroke="hsl(220, 10%, 55%)" fontSize={12} tickFormatter={(v) => `৳${Math.abs(v) / 1000}k`} />
                <YAxis type="category" dataKey="name" stroke="hsl(220, 10%, 55%)" fontSize={12} width={80} />
                <Tooltip
                  contentStyle={{
                    backgroundColor: "hsl(220, 15%, 12%)",
                    border: "1px solid hsl(220, 15%, 25%)",
                    borderRadius: "8px",
                  }}
                  formatter={(value: number) => formatCurrency(Math.abs(value))}
                />
                <Bar dataKey="amount" radius={[0, 4, 4, 0]}>
                  {cashFlowData.map((entry, index) => (
                    <Cell
                      key={`cell-${index}`}
                      fill={entry.type === "income" ? "hsl(158, 65%, 45%)" : "hsl(18, 75%, 45%)"}
                    />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </GlassCard>

        {/* Payment Breakdown */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <h3 className="font-display font-semibold text-lg mb-6">Payment Methods</h3>
          <div className="space-y-4">
            {dashboardStats.salesByPayment.map((item, index) => {
              const percentage = (item.amount / dashboardStats.todaySales) * 100;
              return (
                <div key={item.method} className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="flex items-center gap-2">
                      {item.method === "Cash" && <Wallet className="w-4 h-4" />}
                      {item.method === "Card" && <CreditCard className="w-4 h-4" />}
                      {(item.method === "bKash" || item.method === "Nagad") && <Smartphone className="w-4 h-4" />}
                      {item.method}
                    </span>
                    <span className="font-medium">{formatCurrency(item.amount)}</span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full rounded-full transition-all duration-500"
                      style={{
                        width: `${percentage}%`,
                        backgroundColor: CHART_COLORS[index % CHART_COLORS.length],
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </GlassCard>
      </div>

      {/* Recent Transactions */}
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-semibold text-lg">Recent Transactions</h3>
          <Button variant="ghost" size="sm">View All</Button>
        </div>
        <div className="space-y-3">
          {cashFlowData.slice(0, 5).map((item, index) => (
            <div key={index} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div className="flex items-center gap-3">
                <div
                  className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                    item.type === "income" ? "bg-accent/20" : "bg-secondary/20"
                  }`}
                >
                  {item.type === "income" ? (
                    <ArrowUpRight className="w-5 h-5 text-accent" />
                  ) : (
                    <ArrowDownRight className="w-5 h-5 text-secondary" />
                  )}
                </div>
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-muted-foreground">Today</p>
                </div>
              </div>
              <span className={`font-display font-semibold ${item.type === "income" ? "text-accent" : "text-secondary"}`}>
                {item.type === "income" ? "+" : "-"}{formatCurrency(Math.abs(item.amount))}
              </span>
            </div>
          ))}
        </div>
      </GlassCard>
    </div>
  );
}
