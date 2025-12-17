import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  TrendingUp,
  Package,
  AlertTriangle,
  Download,
  Calendar as CalendarIcon,
  PieChart,
  Loader2,
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
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { format, subDays, startOfMonth, endOfMonth, startOfYear, endOfYear } from "date-fns";
import { cn } from "@/lib/utils";
import { reportsApi, type SalesSummaryResponse, type SalesTrendResponse, type TopProductsResponse, type LowStockResponse } from "@/lib/api/reports";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

type DateRangePreset = "today" | "last7days" | "last30days" | "last90days" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

export default function Reports() {
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last7days");
  const [startDate, setStartDate] = useState<Date>(subDays(new Date(), 7));
  const [endDate, setEndDate] = useState<Date>(new Date());
  const [calendarOpen, setCalendarOpen] = useState(false);
  
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsResponse | null>(null);
  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null);
  
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [loadingTopProducts, setLoadingTopProducts] = useState(false);
  const [loadingLowStock, setLoadingLowStock] = useState(false);

  // Get date range based on preset
  const getDateRange = (preset: DateRangePreset): { start: Date; end: Date } => {
    const today = new Date();
    switch (preset) {
      case "today":
        return { start: today, end: today };
      case "last7days":
        return { start: subDays(today, 7), end: today };
      case "last30days":
        return { start: subDays(today, 30), end: today };
      case "last90days":
        return { start: subDays(today, 90), end: today };
      case "thisMonth":
        return { start: startOfMonth(today), end: endOfMonth(today) };
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return { start: startOfMonth(lastMonth), end: endOfMonth(lastMonth) };
      case "thisYear":
        return { start: startOfYear(today), end: endOfYear(today) };
      case "custom":
        return { start: startDate, end: endDate };
      default:
        return { start: subDays(today, 7), end: today };
    }
  };

  // Load all reports
  const loadReports = async () => {
    const range = getDateRange(dateRangePreset);
    const startDateStr = format(range.start, "yyyy-MM-dd");
    const endDateStr = format(range.end, "yyyy-MM-dd");

    setLoadingSummary(true);
    setLoadingTrend(true);
    setLoadingTopProducts(true);
    setLoadingLowStock(true);

    try {
      // Load all reports in parallel
      const [summary, trend, top, low] = await Promise.all([
        reportsApi.getSalesSummary(startDateStr, endDateStr).catch((err) => {
          console.error("Failed to load sales summary:", err);
          toast({ title: "Failed to load sales summary", variant: "destructive" });
          return null;
        }),
        reportsApi.getSalesTrend(startDateStr, endDateStr).catch((err) => {
          console.error("Failed to load sales trend:", err);
          toast({ title: "Failed to load sales trend", variant: "destructive" });
          return null;
        }),
        reportsApi.getTopProducts(startDateStr, endDateStr, 10).catch((err) => {
          console.error("Failed to load top products:", err);
          toast({ title: "Failed to load top products", variant: "destructive" });
          return null;
        }),
        reportsApi.getLowStock(10).catch((err) => {
          console.error("Failed to load low stock:", err);
          toast({ title: "Failed to load low stock", variant: "destructive" });
          return null;
        }),
      ]);

      if (summary) setSalesSummary(summary);
      if (trend) setSalesTrend(trend);
      if (top) setTopProducts(top);
      if (low) setLowStock(low);
    } catch (error) {
      console.error("Failed to load reports:", error);
      toast({ title: "Failed to load reports", variant: "destructive" });
    } finally {
      setLoadingSummary(false);
      setLoadingTrend(false);
      setLoadingTopProducts(false);
      setLoadingLowStock(false);
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReports();
  }, [dateRangePreset, startDate, endDate]);

  const handlePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
    if (preset !== "custom") {
      const range = getDateRange(preset);
      setStartDate(range.start);
      setEndDate(range.end);
    }
  };

  const handleDateRangeSelect = (range: { from: Date | undefined; to: Date | undefined } | undefined) => {
    if (range?.from && range?.to) {
      setStartDate(range.from);
      setEndDate(range.to);
      setDateRangePreset("custom");
      setCalendarOpen(false);
    } else if (range?.from) {
      setStartDate(range.from);
      setEndDate(range.from);
    }
  };

  // Format sales trend data for chart
  const chartData = salesTrend?.data.map((point) => ({
    date: format(new Date(point.period), "MMM dd"),
    revenue: point.total_sales,
  })) || [];

  const reportCards = [
    { title: "Sales Report", icon: TrendingUp, description: "Daily, weekly, monthly sales analysis", color: "primary" },
    { title: "Inventory Report", icon: Package, description: "Stock levels and movement", color: "accent" },
    { title: "Category Performance", icon: PieChart, description: "Sales by category breakdown", color: "secondary" },
    { title: "Profit & Loss", icon: BarChart3, description: "Revenue vs expenses analysis", color: "primary" },
  ];

  const getDateRangeLabel = () => {
    if (dateRangePreset === "custom") {
      return `${format(startDate, "MMM dd")} - ${format(endDate, "MMM dd, yyyy")}`;
    }
    const range = getDateRange(dateRangePreset);
    return `${format(range.start, "MMM dd")} - ${format(range.end, "MMM dd, yyyy")}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Reports</h1>
          <p className="text-muted-foreground">রিপোর্ট ও বিশ্লেষণ • Analytics & Reports</p>
        </div>
        <div className="flex gap-2">
          <Popover open={calendarOpen} onOpenChange={setCalendarOpen}>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {getDateRangeLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3 space-y-2">
                <div className="grid grid-cols-2 gap-2">
                  <Button
                    variant={dateRangePreset === "today" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange("today")}
                  >
                    Today
                  </Button>
                  <Button
                    variant={dateRangePreset === "last7days" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange("last7days")}
                  >
                    Last 7 days
                  </Button>
                  <Button
                    variant={dateRangePreset === "last30days" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange("last30days")}
                  >
                    Last 30 days
                  </Button>
                  <Button
                    variant={dateRangePreset === "thisMonth" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange("thisMonth")}
                  >
                    This Month
                  </Button>
                  <Button
                    variant={dateRangePreset === "lastMonth" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange("lastMonth")}
                  >
                    Last Month
                  </Button>
                  <Button
                    variant={dateRangePreset === "thisYear" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange("thisYear")}
                  >
                    This Year
                  </Button>
                </div>
                <div className="border-t pt-2">
                  <p className="text-sm font-medium mb-2">Custom Range</p>
                  <Calendar
                    mode="range"
                    selected={{ from: startDate, to: endDate }}
                    onSelect={handleDateRangeSelect}
                    numberOfMonths={2}
                  />
                </div>
              </div>
            </PopoverContent>
          </Popover>
          <Button variant="glow" disabled>
            <Download className="w-4 h-4 mr-2" />
            Export All
          </Button>
        </div>
      </div>

      {/* Sales Summary Cards */}
      {salesSummary && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in">
          <GlassCard hover glow="primary" className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Sales</p>
              <TrendingUp className="w-5 h-5 text-primary" />
            </div>
            <p className="text-2xl font-display font-bold gradient-text-gold">
              {formatCurrency(salesSummary.period.total_sales)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              {salesSummary.period.total_orders} orders
            </p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Total Orders</p>
              <Package className="w-5 h-5 text-foreground" />
            </div>
            <p className="text-2xl font-display font-bold">
              {salesSummary.period.total_orders}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              in selected period
            </p>
          </GlassCard>
          <GlassCard hover className="p-5">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Avg Order Value</p>
              <BarChart3 className="w-5 h-5 text-foreground" />
            </div>
            <p className="text-2xl font-display font-bold">
              {formatCurrency(salesSummary.period.average_order_value)}
            </p>
            <p className="text-xs text-muted-foreground mt-1">
              per order
            </p>
          </GlassCard>
        </div>
      )}

      {/* Report Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-fade-in stagger-1">
        {reportCards.map((report) => (
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
          <Badge variant="glass">{getDateRangeLabel()}</Badge>
        </div>
        <div className="h-72">
          {loadingTrend ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : chartData.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
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
          ) : (
            <div className="flex items-center justify-center h-full text-muted-foreground">
              No sales data for selected period
            </div>
          )}
        </div>
      </GlassCard>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Top Products */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <h3 className="font-display font-semibold text-lg mb-4">Top Selling Products</h3>
          {loadingTopProducts ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : topProducts && topProducts.data.length > 0 ? (
            <div className="space-y-3">
              {topProducts.data.map((item) => (
                <div key={item.product_id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center font-display font-bold text-primary-foreground">
                      {item.rank}
                    </div>
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity_sold} units sold</p>
                    </div>
                  </div>
                  <span className="font-display font-semibold text-primary">{formatCurrency(item.total_revenue)}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No products sold in selected period
            </div>
          )}
        </GlassCard>

        {/* Low Stock Alert */}
        <GlassCard className="p-6 animate-fade-in stagger-4">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Low Stock Alert</h3>
            {loadingLowStock ? (
              <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />
            ) : (
              <Badge variant="danger">{lowStock?.total_low_stock || 0} items</Badge>
            )}
          </div>
          {loadingLowStock ? (
            <div className="flex items-center justify-center h-48">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
            </div>
          ) : lowStock && lowStock.data.length > 0 ? (
            <div className="space-y-3">
              {lowStock.data.map((item) => (
                <div
                  key={item.product_id}
                  className={cn(
                    "flex items-center justify-between p-3 rounded-lg border",
                    item.is_critical
                      ? "bg-destructive/10 border-destructive/20"
                      : "bg-warning/10 border-warning/20"
                  )}
                >
                  <div className="flex items-center gap-3">
                    <AlertTriangle className={cn("w-5 h-5", item.is_critical ? "text-destructive" : "text-warning")} />
                    <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">SKU: {item.sku}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className={cn("font-medium", item.is_critical ? "text-destructive" : "text-warning")}>
                      {item.current_stock} left
                    </p>
                    <p className="text-sm text-muted-foreground">{item.unit}</p>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              All items are well stocked
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
