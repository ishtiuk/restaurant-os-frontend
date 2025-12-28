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
  XCircle,
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
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { subDays, startOfMonth, endOfMonth, startOfYear, endOfYear, format } from "date-fns";
import { cn } from "@/lib/utils";
import { useTimezone } from "@/contexts/TimezoneContext";
import { getStartOfDay, getEndOfDay, getDateOnly, formatDate, formatWithTimezone } from "@/utils/date";
import { reportsApi, type SalesSummaryResponse, type SalesTrendResponse, type TopProductsResponse, type LowStockResponse } from "@/lib/api/reports";
import { salesApi, type SaleDto } from "@/lib/api/sales";
import { tablesApi, type VoidedOrderItemDto } from "@/lib/api/tables";
import { toast } from "@/hooks/use-toast";
import { isFeatureEnabled } from "@/utils/features";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

// Convert English digits to Bengali numerals
const toBengaliNumeral = (num: number | string): string => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num)
    .split("")
    .map((digit) => {
      const parsed = parseInt(digit, 10);
      return !isNaN(parsed) && parsed >= 0 && parsed <= 9 ? bengaliDigits[parsed] : digit;
    })
    .join("");
};

type DateRangePreset = "today" | "last7days" | "last30days" | "last90days" | "thisMonth" | "lastMonth" | "thisYear" | "custom";

export default function Reports() {
  const { timezone } = useTimezone();
  const [dateRangePreset, setDateRangePreset] = useState<DateRangePreset>("last7days");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  
  const [salesSummary, setSalesSummary] = useState<SalesSummaryResponse | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsResponse | null>(null);
  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null);
  const [voidedItems, setVoidedItems] = useState<VoidedOrderItemDto[]>([]);
  
  const [loading, setLoading] = useState(true);
  const [loadingSummary, setLoadingSummary] = useState(false);
  const [loadingTrend, setLoadingTrend] = useState(false);
  const [loadingTopProducts, setLoadingTopProducts] = useState(false);
  const [loadingLowStock, setLoadingLowStock] = useState(false);
  const [loadingVoidedItems, setLoadingVoidedItems] = useState(false);

  // Get date range based on preset (timezone-aware)
  const getDateRange = (preset: DateRangePreset): { start: Date; end: Date } => {
    const today = new Date();
    switch (preset) {
      case "today":
        return { start: getStartOfDay(today, timezone), end: getEndOfDay(today, timezone) };
      case "last7days":
        return { start: getStartOfDay(subDays(today, 7), timezone), end: getEndOfDay(today, timezone) };
      case "last30days":
        return { start: getStartOfDay(subDays(today, 30), timezone), end: getEndOfDay(today, timezone) };
      case "last90days":
        return { start: getStartOfDay(subDays(today, 90), timezone), end: getEndOfDay(today, timezone) };
      case "thisMonth":
        return { start: getStartOfDay(startOfMonth(today), timezone), end: getEndOfDay(endOfMonth(today), timezone) };
      case "lastMonth":
        const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
        return { start: getStartOfDay(startOfMonth(lastMonth), timezone), end: getEndOfDay(endOfMonth(lastMonth), timezone) };
      case "thisYear":
        return { start: getStartOfDay(startOfYear(today), timezone), end: getEndOfDay(endOfYear(today), timezone) };
      case "custom":
        // Use custom dates if available, otherwise fall back to last 7 days
        if (customStartDate && customEndDate) {
          return {
            start: getStartOfDay(new Date(customStartDate + "T12:00:00"), timezone),
            end: getEndOfDay(new Date(customEndDate + "T12:00:00"), timezone),
          };
        }
        // Fall through to default
      default:
        return { start: getStartOfDay(subDays(today, 7), timezone), end: getEndOfDay(today, timezone) };
    }
  };

  // Load all reports
  const loadReports = async () => {
    const range = getDateRange(dateRangePreset);
    // getStartOfDay/getEndOfDay return UTC Date objects representing start/end of user's local day
    // Convert to UTC date strings (YYYY-MM-DD) for backend API
    // Backend interprets these as UTC dates and filters: created_at >= start_date 00:00:00 UTC AND <= end_date 23:59:59.999 UTC
    // Note: Backend's end_date 23:59:59.999 UTC may include a few hours of the next day in user's timezone, but that's acceptable
    const startDateStr = range.start.toISOString().split('T')[0];
    const endDateStr = range.end.toISOString().split('T')[0];

    setLoadingSummary(true);
    setLoadingTrend(true);
    setLoadingTopProducts(true);
    setLoadingLowStock(true);

    try {
      // Load all reports in parallel, including sales list for client-side filtering
      const [summary, trend, top, low, salesData] = await Promise.all([
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
        // Fetch all sales using pagination to ensure we get all sales in the date range
        // Backend has max limit of 1000, so we need to fetch in batches
        (async () => {
          let allSales: SaleDto[] = [];
          let offset = 0;
          const limit = 1000;
          
          while (true) {
            try {
              const response = await salesApi.list(limit, offset);
              allSales = [...allSales, ...response.data];
              // If we got fewer than limit, we've reached the end
              if (response.data.length < limit) {
                break;
              }
              offset += limit;
              // Safety check: don't fetch more than 10000 sales (10 pages)
              if (allSales.length >= 10000) {
                break;
              }
            } catch (error) {
              console.error("Error fetching sales:", error);
              break;
            }
          }
          
          return { data: allSales, total: allSales.length };
        })().catch(() => ({ data: [], total: 0 })),
      ]);

      // Filter sales by date in user's timezone and recalculate summary and trend
      // (Backend aggregations use UTC dates, so we need client-side grouping by local dates)
      if (salesData.data) {
        const startDateStrTZ = getDateOnly(range.start, timezone);
        const endDateStrTZ = getDateOnly(range.end, timezone);
        const filteredSales = salesData.data.filter((sale: SaleDto) => {
          const saleDate = getDateOnly(sale.created_at, timezone);
          return saleDate >= startDateStrTZ && saleDate <= endDateStrTZ && sale.status === "completed";
        });

        // Recalculate summary from filtered sales
        const recalculatedSummary: SalesSummaryResponse = {
          period: {
            start_date: startDateStr,
            end_date: endDateStr,
            total_sales: filteredSales.reduce((sum, sale) => sum + sale.total, 0),
            total_orders: filteredSales.length,
            average_order_value: filteredSales.length > 0 ? filteredSales.reduce((sum, sale) => sum + sale.total, 0) / filteredSales.length : 0,
          }
        };
        setSalesSummary(recalculatedSummary);

        // Calculate sales trend grouped by local date
        const salesByDate: Record<string, { total_sales: number; order_count: number }> = {};
        filteredSales.forEach((sale: SaleDto) => {
          const saleDate = getDateOnly(sale.created_at, timezone);
          if (!salesByDate[saleDate]) {
            salesByDate[saleDate] = { total_sales: 0, order_count: 0 };
          }
          salesByDate[saleDate].total_sales += sale.total;
          salesByDate[saleDate].order_count += 1;
        });

        // Convert to array and sort by date
        const trendDataPoints = Object.entries(salesByDate)
          .map(([period, data]) => ({
            period,
            total_sales: data.total_sales,
            order_count: data.order_count,
          }))
          .sort((a, b) => a.period.localeCompare(b.period));

        setSalesTrend({ data: trendDataPoints });
      } else if (summary) {
        // Fallback to backend data if sales list is not available
        setSalesSummary(summary);
        if (trend) setSalesTrend(trend);
      }
      if (top) setTopProducts(top);
      if (low) setLowStock(low);
      
      // Load voided items (only if feature is enabled)
      if (isFeatureEnabled("void_management")) {
        setLoadingVoidedItems(true);
        try {
          const voided = await tablesApi.listVoidedItems({
            start_date: startDateStr,
            end_date: endDateStr,
          });
          setVoidedItems(voided);
        } catch (err) {
          console.error("Failed to load voided items:", err);
          toast({ title: "Failed to load voided items", variant: "destructive" });
        } finally {
          setLoadingVoidedItems(false);
        }
      }
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
  }, [dateRangePreset, customStartDate, customEndDate]);

  const handlePresetChange = (preset: DateRangePreset) => {
    setDateRangePreset(preset);
  };

  // Format sales trend data for chart (timezone-aware using utility)
  const chartData = salesTrend?.data.map((point) => ({
    // point.period is "YYYY-MM-DD" from backend, treat as UTC by appending "T00:00:00Z"
    date: formatDate(point.period + "T00:00:00Z", timezone),
    revenue: point.total_sales,
  })) || [];

  const reportCards = [
    { title: "Sales Report", icon: TrendingUp, description: "Daily, weekly, monthly sales analysis", color: "primary" },
    { title: "Inventory Report", icon: Package, description: "Stock levels and movement", color: "accent" },
    { title: "Category Performance", icon: PieChart, description: "Sales by category breakdown", color: "secondary" },
    { title: "Profit & Loss", icon: BarChart3, description: "Revenue vs expenses analysis", color: "primary" },
  ];

  const getDateRangeLabel = () => {
    // Use formatDate utility for consistent display (formatDate accepts Date objects directly)
    const range = getDateRange(dateRangePreset);
    return `${formatDate(range.start, timezone)} - ${formatDate(range.end, timezone)}`;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Reports</h1>
          <p className="text-muted-foreground">রিপোর্ট ও বিশ্লেষণ • Analytics & Reports</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Popover>
            <PopoverTrigger asChild>
          <Button variant="outline">
                <CalendarIcon className="w-4 h-4 mr-2" />
                {getDateRangeLabel()}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <div className="p-3">
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
                  <Button
                    variant={dateRangePreset === "custom" ? "default" : "outline"}
                    size="sm"
                    onClick={() => handlePresetChange("custom")}
                    className="col-span-2"
                  >
                    Custom Range
                  </Button>
                </div>
              </div>
            </PopoverContent>
          </Popover>
          {dateRangePreset === "custom" && (
            <>
              <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-muted/50 hover:bg-muted/70",
                      !customStartDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customStartDate ? formatDate(customStartDate + "T12:00:00", timezone) : "Start Date"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customStartDate ? new Date(customStartDate + "T12:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setCustomStartDate(format(date, "yyyy-MM-dd"));
                        setStartDateOpen(false);
                      } else {
                        setCustomStartDate("");
                      }
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
              <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
                <PopoverTrigger asChild>
                  <Button
                    variant="outline"
                    className={cn(
                      "justify-start text-left font-normal bg-muted/50 hover:bg-muted/70",
                      !customEndDate && "text-muted-foreground"
                    )}
                  >
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {customEndDate ? formatDate(customEndDate + "T12:00:00", timezone) : "End Date"}
          </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={customEndDate ? new Date(customEndDate + "T12:00:00") : undefined}
                    onSelect={(date) => {
                      if (date) {
                        setCustomEndDate(format(date, "yyyy-MM-dd"));
                        setEndDateOpen(false);
                      } else {
                        setCustomEndDate("");
                      }
                    }}
                    disabled={(date) => {
                      // Disable dates before start date
                      if (customStartDate) {
                        return date < new Date(customStartDate + "T12:00:00");
                      }
                      return false;
                    }}
                    initialFocus
                  />
                </PopoverContent>
              </Popover>
            </>
          )}
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
              {toBengaliNumeral(salesSummary.period.total_orders)}
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

      {/* Voided Items Report - Only show if void_management feature is enabled */}
      {isFeatureEnabled("void_management") && (
      <GlassCard className="p-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-2">
            <XCircle className="w-5 h-5 text-destructive" />
            <h2 className="text-xl font-display font-bold">Voided Items Report</h2>
            {voidedItems.length > 0 && (
              <Badge variant="destructive">{voidedItems.length}</Badge>
            )}
          </div>
        </div>
        {loadingVoidedItems ? (
          <div className="flex items-center justify-center h-48">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : voidedItems.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Voided Items</p>
                <p className="text-2xl font-bold text-destructive">{voidedItems.length}</p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Total Amount Voided</p>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(
                    voidedItems.reduce((sum, item) => {
                      // Use voided_quantity if available, otherwise calculate from original_quantity and quantity
                      const voidedQty = item.voided_quantity ?? ((item.original_quantity || 0) - (item.quantity || 0));
                      return sum + (item.unit_price * voidedQty);
                    }, 0)
                  )}
                </p>
              </div>
              <div className="p-4 bg-destructive/10 rounded-lg">
                <p className="text-sm text-muted-foreground">Void Rate</p>
                <p className="text-2xl font-bold text-destructive">
                  {voidedItems.length > 0 ? ((voidedItems.length / (voidedItems.length + 100)) * 100).toFixed(1) : 0}%
                </p>
              </div>
            </div>
            <div className="rounded-md border border-destructive/20 overflow-x-auto max-h-[600px] overflow-y-auto">
              <table className="w-full">
                <thead className="bg-destructive/10 sticky top-0 z-10">
                  <tr>
                    <th className="text-left p-3 text-xs font-semibold">Table</th>
                    <th className="text-left p-3 text-xs font-semibold">Item Name</th>
                    <th className="text-right p-3 text-xs font-semibold">Original Qty</th>
                    <th className="text-right p-3 text-xs font-semibold">Voided Qty</th>
                    <th className="text-left p-3 text-xs font-semibold">Reason</th>
                    <th className="text-left p-3 text-xs font-semibold">Waiter</th>
                    <th className="text-left p-3 text-xs font-semibold">Voided By</th>
                    <th className="text-left p-3 text-xs font-semibold">Date & Time</th>
                  </tr>
                </thead>
                <tbody>
                  {voidedItems.map((item, idx) => {
                    // Use voided_quantity if available, otherwise calculate from original_quantity and quantity
                    const voidedQty = item.voided_quantity ?? ((item.original_quantity || 0) - (item.quantity || 0));
                    return (
                      <tr key={idx} className="border-t border-destructive/10 hover:bg-destructive/5">
                        <td className="p-3 text-sm font-medium">{item.table_no || "N/A"}</td>
                        <td className="p-3 text-sm line-through text-muted-foreground">{item.item_name}</td>
                        <td className="p-3 text-sm text-right">{item.original_quantity || 0}</td>
                        <td className="p-3 text-sm text-right text-destructive font-semibold">-{voidedQty}</td>
                        <td className="p-3 text-sm text-muted-foreground max-w-[200px] truncate" title={item.void_reason || ""}>
                          {item.void_reason || "N/A"}
                        </td>
                        <td className="p-3 text-xs text-muted-foreground">{item.waiter_name || "N/A"}</td>
                        <td className="p-3 text-xs text-muted-foreground">{item.voided_by_name || "N/A"}</td>
                        <td className="p-3 text-xs text-muted-foreground">
                          {item.voided_at ? formatWithTimezone(item.voided_at, timezone) : "N/A"}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        ) : (
          <div className="flex items-center justify-center h-48 text-muted-foreground">
            No voided items in this period
          </div>
        )}
      </GlassCard>
      )}
    </div>
  );
}
