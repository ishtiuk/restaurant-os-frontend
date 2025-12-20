import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAppData } from "@/contexts/AppDataContext";
import { reportsApi, type SalesSummaryResponse, type SalesTrendResponse, type TopProductsResponse, type LowStockResponse } from "@/lib/api/reports";
import { salesApi, type SaleDto } from "@/lib/api/sales";
import { purchasesApi, type PurchaseOrderDto } from "@/lib/api/purchases";
import { suppliersApi, type SupplierDto } from "@/lib/api/suppliers";
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
  Loader2,
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
import { format, subDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import { getStartOfDay, getEndOfDay, getDateOnly, formatDate } from "@/utils/date";

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

const CHART_COLORS = ["hsl(38, 95%, 55%)", "hsl(18, 75%, 45%)", "hsl(158, 65%, 45%)", "hsl(220, 15%, 40%)"];

export default function Dashboard() {
  const { items } = useAppData();
  const { timezone } = useTimezone();
  const [loading, setLoading] = useState(true);
  const [todaySummary, setTodaySummary] = useState<SalesSummaryResponse | null>(null);
  const [yesterdaySummary, setYesterdaySummary] = useState<SalesSummaryResponse | null>(null);
  const [salesTrend, setSalesTrend] = useState<SalesTrendResponse | null>(null);
  const [topProducts, setTopProducts] = useState<TopProductsResponse | null>(null);
  const [lowStock, setLowStock] = useState<LowStockResponse | null>(null);
  const [pendingOrders, setPendingOrders] = useState<PurchaseOrderDto[]>([]);
  const [suppliers, setSuppliers] = useState<SupplierDto[]>([]);
  const [paymentMethodBreakdown, setPaymentMethodBreakdown] = useState<Array<{ method: string; amount: number }>>([]);

  useEffect(() => {
    const loadDashboardData = async () => {
      setLoading(true);
      try {
        const today = new Date();
        const yesterday = subDays(today, 1);
        const last7Days = subDays(today, 7);
        
        // Use timezone-aware date calculations
        // getStartOfDay/getEndOfDay return UTC Date objects representing start/end of user's local day
        const todayStart = getStartOfDay(today, timezone);
        const todayEnd = getEndOfDay(today, timezone);
        const yesterdayStart = getStartOfDay(yesterday, timezone);
        const yesterdayEnd = getEndOfDay(yesterday, timezone);
        const last7DaysStart = getStartOfDay(last7Days, timezone);
        
        // Convert UTC Date objects to UTC date strings (YYYY-MM-DD) for backend API
        // Backend interprets these as UTC dates and filters: created_at >= start_date 00:00:00 UTC AND <= end_date 23:59:59.999 UTC
        // Note: Backend's end_date 23:59:59.999 UTC may include a few hours of the next day in user's timezone, but that's acceptable
        // as it ensures we capture all of the user's selected day
        const todayStr = todayStart.toISOString().split('T')[0];
        const todayEndStr = todayEnd.toISOString().split('T')[0];
        const yesterdayStr = yesterdayStart.toISOString().split('T')[0];
        const yesterdayEndStr = yesterdayEnd.toISOString().split('T')[0];
        const last7DaysStr = last7DaysStart.toISOString().split('T')[0];

        // Load all data in parallel
        const [
          todayData,
          yesterdayData,
          trendData,
          topProductsData,
          lowStockData,
          pendingOrdersData,
          suppliersData,
          todaySalesData,
        ] = await Promise.all([
          reportsApi.getSalesSummary(todayStr, todayEndStr).catch(() => null),
          reportsApi.getSalesSummary(yesterdayStr, yesterdayEndStr).catch(() => null),
          reportsApi.getSalesTrend(last7DaysStr, todayEndStr, "day").catch(() => null),
          reportsApi.getTopProducts(last7DaysStr, todayEndStr, 5).catch(() => null),
          reportsApi.getLowStock(10).catch(() => null),
          purchasesApi.list({ status: "pending", limit: 10 }).catch(() => []),
          suppliersApi.list().catch(() => []),
          // Fetch all sales using pagination to ensure we get all today's sales
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

        if (yesterdayData) setYesterdaySummary(yesterdayData);
        if (topProductsData) setTopProducts(topProductsData);
        if (lowStockData) setLowStock(lowStockData);
        if (Array.isArray(pendingOrdersData)) setPendingOrders(pendingOrdersData);
        if (Array.isArray(suppliersData)) setSuppliers(suppliersData);

        // Filter sales by date in user's timezone and recalculate summaries and trend
        // (Backend aggregations use UTC dates, so we need client-side grouping by local dates)
        if (todaySalesData.data) {
          const todayDateStr = getDateOnly(today, timezone);
          const yesterdayDateStr = getDateOnly(yesterday, timezone);
          const last7DaysDateStr = getDateOnly(last7Days, timezone);
          
          // Filter completed sales
          const completedSales = todaySalesData.data.filter((sale: SaleDto) => sale.status === "completed");
          
          // Filter today's sales
          const todaySales = completedSales.filter((sale: SaleDto) => {
            const saleDate = getDateOnly(sale.created_at, timezone);
            return saleDate === todayDateStr;
          });

          // Filter yesterday's sales
          const yesterdaySales = completedSales.filter((sale: SaleDto) => {
            const saleDate = getDateOnly(sale.created_at, timezone);
            return saleDate === yesterdayDateStr;
          });

          // Recalculate today's summary from filtered sales
          const recalculatedTodaySummary = {
            period: {
              start_date: todayStr,
              end_date: todayEndStr,
              total_sales: todaySales.reduce((sum, sale) => sum + sale.total, 0),
              total_orders: todaySales.length,
              average_order_value: todaySales.length > 0 ? todaySales.reduce((sum, sale) => sum + sale.total, 0) / todaySales.length : 0,
            }
          };
          setTodaySummary(recalculatedTodaySummary);

          // Recalculate yesterday's summary from filtered sales
          const recalculatedYesterdaySummary = {
            period: {
              start_date: yesterdayStr,
              end_date: yesterdayEndStr,
              total_sales: yesterdaySales.reduce((sum, sale) => sum + sale.total, 0),
              total_orders: yesterdaySales.length,
              average_order_value: yesterdaySales.length > 0 ? yesterdaySales.reduce((sum, sale) => sum + sale.total, 0) / yesterdaySales.length : 0,
            }
          };
          setYesterdaySummary(recalculatedYesterdaySummary);

          // Calculate payment method breakdown for today
          const paymentGroups: Record<string, number> = {};
          todaySales.forEach((sale: SaleDto) => {
            const method = sale.payment_method === "card" ? "Card" : 
                          sale.payment_method === "online" ? "Online" : 
                          sale.payment_method === "rocket" ? "Rocket" : "Cash";
            paymentGroups[method] = (paymentGroups[method] || 0) + sale.total;
          });

          setPaymentMethodBreakdown(
            Object.entries(paymentGroups).map(([method, amount]) => ({ method, amount }))
          );

          // Calculate sales trend for last 7 days (grouped by local date)
          const last7DaysSales = completedSales.filter((sale: SaleDto) => {
            const saleDate = getDateOnly(sale.created_at, timezone);
            return saleDate >= last7DaysDateStr && saleDate <= todayDateStr;
          });

          // Group sales by local date
          const salesByDate: Record<string, { total_sales: number; order_count: number }> = {};
          last7DaysSales.forEach((sale: SaleDto) => {
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
        } else if (todayData) {
          // Fallback to backend data if sales list is not available
          setTodaySummary(todayData);
          if (trendData) setSalesTrend(trendData);
        }
      } catch (error) {
        console.error("Failed to load dashboard data:", error);
        toast({
          title: "Failed to load dashboard",
          description: "Please refresh the page",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, [timezone]);

  // Calculate trends
  const todaySales = todaySummary?.period.total_sales || 0;
  const yesterdaySales = yesterdaySummary?.period.total_sales || 0;
  const salesChange = yesterdaySales > 0 ? ((todaySales - yesterdaySales) / yesterdaySales) * 100 : 0;
  const todayOrders = todaySummary?.period.total_orders || 0;
  const yesterdayOrders = yesterdaySummary?.period.total_orders || 0;
  const ordersChange = yesterdayOrders > 0 ? todayOrders - yesterdayOrders : 0;

  // Calculate cash vs digital sales
  const cashSales = paymentMethodBreakdown.find(p => p.method === "Cash")?.amount || 0;
  const digitalSales = paymentMethodBreakdown.filter(p => p.method !== "Cash").reduce((sum, p) => sum + p.amount, 0);
  const totalSalesForBreakdown = cashSales + digitalSales;
  const cashPercentage = totalSalesForBreakdown > 0 ? (cashSales / totalSalesForBreakdown) * 100 : 0;
  const digitalPercentage = totalSalesForBreakdown > 0 ? (digitalSales / totalSalesForBreakdown) * 100 : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

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
          <p className="kpi-value gradient-text-gold">{formatCurrency(todaySales)}</p>
          <div className="flex items-center gap-2 text-sm">
            {salesChange !== 0 && (
              <Badge variant={salesChange > 0 ? "success" : "danger"}>
                {salesChange > 0 ? "+" : ""}{salesChange.toFixed(1)}%
              </Badge>
            )}
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
          <p className="kpi-value text-accent">{toBengaliNumeral(todayOrders)}</p>
          <div className="flex items-center gap-2 text-sm">
            {ordersChange !== 0 && (
              <Badge variant={ordersChange > 0 ? "success" : "danger"}>
                {ordersChange > 0 ? "+" : ""}{ordersChange}
              </Badge>
            )}
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
          <p className="kpi-value">{formatCurrency(cashSales)}</p>
          <p className="text-sm text-muted-foreground">
            {totalSalesForBreakdown > 0 ? `${cashPercentage.toFixed(0)}% of total` : "No sales today"}
          </p>
        </GlassCard>

        <GlassCard hover className="kpi-card animate-fade-in stagger-4">
          <div className="flex items-center justify-between">
            <p className="kpi-label">Digital Sales</p>
            <div className="w-10 h-10 rounded-xl bg-secondary/20 flex items-center justify-center">
              <Smartphone className="w-5 h-5 text-secondary" />
            </div>
          </div>
          <p className="kpi-value">{formatCurrency(digitalSales)}</p>
          <p className="text-sm text-muted-foreground">
            {totalSalesForBreakdown > 0 ? `${digitalPercentage.toFixed(0)}% of total` : "No sales today"}
          </p>
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
            {salesTrend && salesTrend.data.length > 0 ? (
            <ResponsiveContainer width="100%" height="100%">
                <AreaChart
                  data={salesTrend.data.map((point) => ({
                    // point.period is "YYYY-MM-DD" from backend, treat as UTC by appending "T00:00:00Z"
                    date: formatDate(point.period + "T00:00:00Z", timezone),
                    revenue: point.total_sales,
                  }))}
                >
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No sales data for the last 7 days
              </div>
            )}
          </div>
        </GlassCard>

        {/* Payment Methods */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <div className="mb-6">
            <h3 className="font-display font-semibold text-lg">Payment Methods</h3>
            <p className="text-sm text-muted-foreground">পেমেন্ট মাধ্যম</p>
          </div>
          {paymentMethodBreakdown.length > 0 ? (
            <>
          <div className="h-48">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                      data={paymentMethodBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={70}
                  paddingAngle={4}
                  dataKey="amount"
                >
                      {paymentMethodBreakdown.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
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
                {paymentMethodBreakdown.map((item, index) => (
              <div key={item.method} className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full"
                      style={{ backgroundColor: CHART_COLORS[index % CHART_COLORS.length] }}
                />
                <span className="text-sm text-muted-foreground">{item.method}</span>
              </div>
            ))}
          </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-48 text-muted-foreground">
              No payment data for today
            </div>
          )}
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
            <Badge variant="danger">{(lowStock?.data.length || 0) + pendingOrders.length}</Badge>
          </div>
          <div className="space-y-3">
            {lowStock && lowStock.data.length > 0 ? (
              lowStock.data.slice(0, 5).map((item) => (
              <div
                  key={item.product_id}
                className="flex items-center justify-between p-3 rounded-lg bg-destructive/10 border border-destructive/20"
              >
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-destructive" />
                  <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">Stock: {item.current_stock} {item.unit}</p>
                    </div>
                  </div>
                  <Badge variant="danger">{item.is_critical ? "Critical" : "Low Stock"}</Badge>
                </div>
              ))
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No low stock items</p>
            )}
            {pendingOrders.length > 0 ? (
              pendingOrders.slice(0, 5).map((po) => {
                const supplier = suppliers.find((s) => s.id === po.supplier_id);
                const supplierName = supplier?.name || `PO #${po.id.substring(0, 8).toUpperCase()}`;
                return (
              <div
                key={po.id}
                className="flex items-center justify-between p-3 rounded-lg bg-primary/10 border border-primary/20"
              >
                <div className="flex items-center gap-3">
                  <Package className="w-5 h-5 text-primary" />
                  <div>
                        <p className="font-medium">{supplierName}</p>
                        <p className="text-sm text-muted-foreground">{formatCurrency(po.total_amount)}</p>
                  </div>
                </div>
                <Badge variant="warning">Pending</Badge>
              </div>
                );
              })
            ) : (
              <p className="text-sm text-muted-foreground text-center py-4">No pending orders</p>
            )}
          </div>
        </GlassCard>

        {/* Top Selling Items */}
        <GlassCard className="p-6 animate-fade-in stagger-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-display font-semibold text-lg">Top Selling Items</h3>
              <p className="text-sm text-muted-foreground">সেরা বিক্রিত আইটেম</p>
            </div>
            <Button variant="ghost" size="sm" onClick={() => window.location.href = "/reports"}>
              View All <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </div>
          <div className="space-y-3">
            {topProducts && topProducts.data.length > 0 ? (
              topProducts.data.map((item, index) => (
              <div
                  key={item.product_id}
                className="flex items-center justify-between p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-lg bg-gradient-hero flex items-center justify-center font-display font-bold text-primary-foreground">
                    {index + 1}
                  </div>
                  <div>
                      <p className="font-medium">{item.product_name}</p>
                      <p className="text-sm text-muted-foreground">{item.quantity_sold} sold</p>
                    </div>
                  </div>
                  <p className="font-display font-semibold text-primary">{formatCurrency(item.total_revenue)}</p>
                </div>
              ))
            ) : (
              <div className="flex items-center justify-center h-48 text-muted-foreground">
                No sales data for the last 7 days
              </div>
            )}
          </div>
        </GlassCard>
      </div>
    </div>
  );
}
