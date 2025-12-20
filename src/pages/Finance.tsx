import React, { useState, useEffect, useMemo } from "react";
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
  Calendar as CalendarIcon,
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
  Loader2,
} from "lucide-react";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
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
import { financeApi, type FinanceSummaryResponse, type TransactionResponse, type BankAccountResponse } from "@/lib/api/finance";
import { format, subDays, startOfWeek, startOfMonth } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate, formatWithTimezone, getStartOfDay, getEndOfDay, getDateOnly } from "@/utils/date";

const formatCurrency = (amount: number) => `৳${Math.abs(amount).toLocaleString("bn-BD")}`;

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
  const { timezone } = useTimezone();
  const [dateRange, setDateRange] = useState("this_month");
  const [customStartDate, setCustomStartDate] = useState<string>("");
  const [customEndDate, setCustomEndDate] = useState<string>("");
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [transferOpen, setTransferOpen] = useState(false);
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [summary, setSummary] = useState<FinanceSummaryResponse | null>(null);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [chartTransactions, setChartTransactions] = useState<TransactionResponse[]>([]);
  const [banks, setBanks] = useState<BankAccountResponse[]>([]);

  // Calculate date range based on selection with timezone awareness
  // Returns Date objects (UTC) representing start/end of day in user's timezone
  const getDateRange = () => {
    const now = new Date();
    switch (dateRange) {
      case "today":
        // Use timezone-aware start/end of day
        const todayStart = getStartOfDay(now, timezone);
        const todayEnd = getEndOfDay(now, timezone);
        return {
          startDate: todayStart,
          endDate: todayEnd,
        };
      case "this_week":
        const weekStart = getStartOfDay(startOfWeek(now), timezone);
        const weekEnd = getEndOfDay(now, timezone);
        return {
          startDate: weekStart,
          endDate: weekEnd,
        };
      case "this_month":
        const monthStart = getStartOfDay(startOfMonth(now), timezone);
        const monthEnd = getEndOfDay(now, timezone);
        return {
          startDate: monthStart,
          endDate: monthEnd,
        };
      case "custom":
        // Use custom dates if available, otherwise fall back to this month
        if (customStartDate && customEndDate) {
          // Convert custom date strings to Date objects
          return {
            startDate: getStartOfDay(new Date(customStartDate + "T12:00:00"), timezone),
            endDate: getEndOfDay(new Date(customEndDate + "T12:00:00"), timezone),
          };
        }
        // Fall through to default
      default:
        const defaultStart = getStartOfDay(startOfMonth(now), timezone);
        const defaultEnd = getEndOfDay(now, timezone);
        return {
          startDate: defaultStart,
          endDate: defaultEnd,
        };
    }
  };

  // Fetch data
  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const { startDate: startDateObj, endDate: endDateObj } = getDateRange();
        
        // Convert UTC Date objects to UTC date strings (YYYY-MM-DD) for backend API
        // getStartOfDay/getEndOfDay return UTC Date objects representing start/end of user's local day
        // Backend interprets these as UTC dates and filters: created_at >= start_date 00:00:00 UTC AND <= end_date 23:59:59.999 UTC
        // Note: Backend's end_date 23:59:59.999 UTC may include a few hours of the next day in user's timezone, but that's acceptable
        const startDate = startDateObj.toISOString().split('T')[0];
        const endDate = endDateObj.toISOString().split('T')[0];
        
        // Recent transactions: Always fetch latest 10 from all time (independent of date filter)
        // Summary, chart, and payment breakdown: Use date filter
        const [summaryData, recentTransactionsData, chartTransactionsData, banksData] = await Promise.all([
          financeApi.getSummary(startDate, endDate).catch(() => null),
          financeApi.getTransactions({ limit: 10 }).catch(() => []), // No date filter - always latest
          financeApi.getTransactions({ start_date: startDate, end_date: endDate, limit: 1000 }).catch(() => []),
          financeApi.listBankAccounts(true).catch(() => []),
        ]);

        setTransactions(recentTransactionsData);
        
        // Filter chart transactions by date in user's timezone (backend filtering may include edge cases)
        // Reuse startDateObj and endDateObj from line 147
        const startDateStr = getDateOnly(startDateObj, timezone);
        const endDateStr = getDateOnly(endDateObj, timezone);
        const filteredChartTransactions = chartTransactionsData.filter((t) => {
          const txnDate = getDateOnly(t.date, timezone);
          return txnDate >= startDateStr && txnDate <= endDateStr;
        });
        setChartTransactions(filteredChartTransactions);
        setBanks(banksData);
        
        // Recalculate summary from filtered transactions (backend summary may include edge cases)
        const recalculatedSummary = {
          total_income: filteredChartTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
          total_expense: Math.abs(filteredChartTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)),
          net_profit: 0, // Will be calculated below
          cash_on_hand: summaryData?.cash_on_hand || 0, // Keep from backend (lifetime value)
          bank_balance: summaryData?.bank_balance || 0, // Keep from backend (lifetime value)
          pending_transfers: summaryData?.pending_transfers || 0, // Keep from backend (lifetime value)
        };
        recalculatedSummary.net_profit = recalculatedSummary.total_income - recalculatedSummary.total_expense;
        setSummary(recalculatedSummary);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load finance data",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [dateRange, customStartDate, customEndDate, timezone]);

  const handleExport = () => {
    if (transactions.length === 0) {
      toast({
        title: "No Data to Export",
        description: "There are no transactions to export with the current filters.",
        variant: "destructive",
      });
      return;
    }

    // CSV Headers
    const headers = [
      "Date",
      "Type",
      "Description",
      "Payment Method",
      "Amount",
      "Status",
    ];

    // Convert transactions to CSV rows (use all transactions, not just recent)
    const rows = transactions.map((t) => [
      formatDate(t.date, timezone), // Format date in user's timezone for CSV
      t.type,
      t.description || "",
      t.payment_method.replace("_", " "),
      t.type === "expense" ? -Math.abs(t.amount) : t.amount,
      t.status,
    ]);

    // Combine headers and rows
    const csvContent = [headers, ...rows]
      .map((row) => row.map((cell) => `"${String(cell).replace(/"/g, '""')}"`).join(","))
      .join("\n");

    // Create blob and download
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    const url = URL.createObjectURL(blob);
    link.setAttribute("href", url);
    // Use timezone-aware date for filename
    const todayDate = getDateOnly(new Date(), timezone);
    link.setAttribute("download", `finance_export_${todayDate}.csv`);
    link.style.visibility = "hidden";
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    toast({
      title: "Export Successful",
      description: `Exported ${transactions.length} transactions to CSV file.`,
    });
  };

  const handleRefresh = () => {
    const { startDate: startDateObj, endDate: endDateObj } = getDateRange();
    
    // Convert UTC Date objects to UTC date strings (same logic as loadData)
    const startDate = startDateObj.toISOString().split('T')[0];
    const endDate = endDateObj.toISOString().split('T')[0];
    
    Promise.all([
      financeApi.getSummary(startDate, endDate).catch(() => null),
      financeApi.getTransactions({ limit: 10 }).catch(() => []), // Always latest, no date filter
      financeApi.getTransactions({ start_date: startDate, end_date: endDate, limit: 1000 }).catch(() => []),
      financeApi.listBankAccounts(true).catch(() => []),
    ]).then(([summaryData, recentTransactionsData, chartTransactionsData, banksData]) => {
      setTransactions(recentTransactionsData);
      setBanks(banksData);
      
      // Filter chart transactions by date in user's timezone
      const startDateStr = getDateOnly(startDateObj, timezone);
      const endDateStr = getDateOnly(endDateObj, timezone);
      const filteredChartTransactions = chartTransactionsData.filter((t) => {
        const txnDate = getDateOnly(t.date, timezone);
        return txnDate >= startDateStr && txnDate <= endDateStr;
      });
      setChartTransactions(filteredChartTransactions);
      
      // Recalculate summary from filtered transactions
      const recalculatedSummary = {
        total_income: filteredChartTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0),
        total_expense: Math.abs(filteredChartTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0)),
        net_profit: 0,
        cash_on_hand: summaryData?.cash_on_hand || 0,
        bank_balance: summaryData?.bank_balance || 0,
        pending_transfers: summaryData?.pending_transfers || 0,
      };
      recalculatedSummary.net_profit = recalculatedSummary.total_income - recalculatedSummary.total_expense;
      setSummary(recalculatedSummary);
    });
  };

  // Process transactions for chart based on selected date range (timezone-aware)
  const incomeExpenseData = useMemo(() => {
    const { startDate, endDate } = getDateRange();
    // startDate and endDate are now Date objects (UTC), not strings
    const start = startDate;
    const end = endDate;
    
    // Calculate number of days in the range
    const daysDiff = Math.ceil((end.getTime() - start.getTime()) / (1000 * 60 * 60 * 24)) + 1;
    
    // Generate array of dates in the range (in user's timezone)
    const datesInRange = Array.from({ length: daysDiff }, (_, i) => {
      const date = new Date(start);
      date.setUTCDate(date.getUTCDate() + i);
      return getDateOnly(date, timezone);
    });

    return datesInRange.map((dateStr) => {
      // Filter chart transactions by date in user's timezone
      const dayTransactions = chartTransactions.filter((t) => {
        const txnDate = getDateOnly(t.date, timezone);
        return txnDate === dateStr;
      });
      const income = dayTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
      const expense = dayTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + Math.abs(t.amount), 0);
      
      // Format label based on date range (date only, no time)
      // Parse dateStr as UTC by appending "T00:00:00Z"
      const dateObj = new Date(dateStr + "T00:00:00Z");
      let label: string;
      if (daysDiff <= 7) {
        // For short ranges, show day name
        label = dateObj.toLocaleDateString("en-US", {
          timeZone: timezone,
          weekday: 'short'
        }).slice(0, 3);
      } else if (daysDiff <= 31) {
        // For medium ranges, show day number
        label = dateObj.toLocaleDateString("en-US", {
          timeZone: timezone,
          day: 'numeric'
        });
      } else {
        // For long ranges, show month/day
        label = dateObj.toLocaleDateString("en-US", {
          timeZone: timezone,
          month: 'short',
          day: 'numeric'
        });
      }
      
      return {
        day: label,
        income,
        expense,
      };
    });
  }, [chartTransactions, timezone, dateRange, customStartDate, customEndDate]);

  // Payment method breakdown (use all transactions in date range, not just recent 10)
  const paymentBreakdown = useMemo(() => {
    const methodMap: Record<string, number> = {};
    chartTransactions.forEach((t) => {
      if (t.type === "income") {
        methodMap[t.payment_method] = (methodMap[t.payment_method] || 0) + t.amount;
      }
    });

    const colors: Record<string, string> = {
      cash: "hsl(158, 65%, 45%)",
      card: "hsl(220, 70%, 50%)",
      bank_transfer: "hsl(280, 65%, 50%)",
      online: "hsl(38, 95%, 55%)",
    };

    return Object.entries(methodMap)
      .map(([name, value]) => ({
        name: name === "bank_transfer" ? "Bank Transfer" : name.charAt(0).toUpperCase() + name.slice(1),
        value,
        color: colors[name] || "hsl(220, 15%, 50%)",
      }))
      .filter((item) => item.value > 0);
  }, [chartTransactions]);

  // Recent transactions (last 10)
  const recentTransactions = useMemo(() => {
    return transactions
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
      .slice(0, 10)
      .map((t) => ({
        id: t.id,
        type: t.type,
        description: t.description,
        amount: Math.abs(t.amount),
        date: t.date, // Keep original date for formatting
        status: t.status,
        paymentMethod: t.payment_method,
      }));
  }, [transactions]);

  // Format banks for modals
  const banksForModals = useMemo(() => {
    return banks.map((b) => ({
      id: b.id,
      name: b.name,
      balance: 0, // Will be fetched separately if needed
    }));
  }, [banks]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Finance</h1>
          <p className="text-muted-foreground">আর্থিক ড্যাশবোর্ড • Financial Dashboard</p>
        </div>
        <div className="flex flex-wrap gap-2 items-center">
          <Select value={dateRange} onValueChange={setDateRange}>
            <SelectTrigger className="w-[160px] bg-muted/50">
            <CalendarIcon className="w-4 h-4 mr-2" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="today">Today</SelectItem>
              <SelectItem value="this_week">This Week</SelectItem>
              <SelectItem value="this_month">This Month</SelectItem>
              <SelectItem value="custom">Custom Range</SelectItem>
            </SelectContent>
          </Select>
          {dateRange === "custom" && (
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
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export
          </Button>
        </div>
      </div>

      {/* Summary Cards - 6 tiles */}
      {loading ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(6)].map((_, i) => (
            <GlassCard key={i} className="p-6">
              <div className="flex items-center justify-center h-32">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in stagger-1">
        <GlassCard hover glow="accent" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Income</p>
            <ArrowUpRight className="w-5 h-5 text-accent" />
          </div>
            <p className="text-3xl font-display font-bold text-accent">{formatCurrency(summary?.total_income || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">মোট আয়</p>
        </GlassCard>

        <GlassCard hover glow="secondary" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Total Expenses</p>
            <ArrowDownRight className="w-5 h-5 text-secondary" />
          </div>
            <p className="text-3xl font-display font-bold text-secondary">{formatCurrency(summary?.total_expense || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">মোট খরচ</p>
        </GlassCard>

        <GlassCard hover glow="primary" className="p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm text-muted-foreground">Net Profit</p>
            {(summary?.net_profit || 0) >= 0 ? (
              <TrendingUp className="w-5 h-5 text-primary" />
            ) : (
              <TrendingDown className="w-5 h-5 text-destructive" />
            )}
          </div>
            <p className={`text-3xl font-display font-bold ${(summary?.net_profit || 0) >= 0 ? 'gradient-text-gold' : 'text-destructive'}`}>
              {(summary?.net_profit || 0) < 0 ? '-' : ''}৳{Math.abs(summary?.net_profit || 0).toLocaleString("bn-BD")}
            </p>
            <p className="text-xs text-muted-foreground mt-1">নিট লাভ</p>
          </GlassCard>

          <GlassCard hover className="p-6 border-blue-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Cash on Hand</p>
              <Wallet className="w-5 h-5 text-blue-400" />
            </div>
            <p className="text-3xl font-display font-bold text-blue-400">{formatCurrency(summary?.cash_on_hand || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">হাতে নগদ</p>
          </GlassCard>

          <GlassCard hover className="p-6 border-purple-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Bank Balance</p>
              <Building2 className="w-5 h-5 text-purple-400" />
            </div>
            <p className="text-3xl font-display font-bold text-purple-400">{formatCurrency(summary?.bank_balance || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">ব্যাংক ব্যালেন্স</p>
          </GlassCard>

          <GlassCard hover className="p-6 border-orange-500/20">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm text-muted-foreground">Pending Transfers</p>
              <Clock className="w-5 h-5 text-orange-400" />
            </div>
            <p className="text-3xl font-display font-bold text-orange-400">{formatCurrency(summary?.pending_transfers || 0)}</p>
            <p className="text-xs text-muted-foreground mt-1">বকেয়া স্থানান্তর</p>
        </GlassCard>
        </div>
      )}

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
        {/* Income vs Expenses Chart */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <h3 className="font-display font-semibold text-lg mb-6">
            Income vs Expenses {dateRange === "today" ? "(Today)" : dateRange === "this_week" ? "(This Week)" : dateRange === "this_month" ? "(This Month)" : ""}
          </h3>
          <div className="h-64">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            ) : incomeExpenseData.length > 0 ? (
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
            ) : (
              <div className="flex items-center justify-center h-full text-muted-foreground">
                No data available
              </div>
            )}
          </div>
        </GlassCard>

        {/* Payment Method Breakdown */}
        <GlassCard className="p-6 animate-fade-in stagger-4">
          <h3 className="font-display font-semibold text-lg mb-6">Payment Method Breakdown</h3>
          {loading ? (
            <div className="flex items-center justify-center h-64">
              <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                  </div>
          ) : paymentBreakdown.length > 0 ? (
            <>
              <div className="h-64 mb-4">
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
              <div className="grid grid-cols-2 gap-2">
                {paymentBreakdown.map((item) => (
                  <div key={item.name} className="flex items-center gap-2 text-sm">
                    <div className="w-3 h-3 rounded-full" style={{ backgroundColor: item.color }} />
                    <span className="text-muted-foreground">{item.name}:</span>
                    <span className="font-medium">{formatCurrency(item.value)}</span>
                  </div>
                ))}
                </div>
            </>
          ) : (
            <div className="flex items-center justify-center h-64 text-muted-foreground">
              No payment data available
          </div>
          )}
        </GlassCard>
      </div>

      {/* Latest Transactions */}
      <GlassCard className="p-6 animate-fade-in stagger-5">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="font-display font-semibold text-lg">Latest Transactions</h3>
            <p className="text-xs text-muted-foreground mt-1">Most recent activity (independent of date filter)</p>
          </div>
          <Link to="/finance/transactions">
            <Button variant="ghost" size="sm">
              View All
              <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
        ) : recentTransactions.length > 0 ? (
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
                    <td className="py-3 px-2 text-muted-foreground">{formatDate(txn.date, timezone)}</td>
                    <td className={`py-3 px-2 text-right font-display font-semibold ${txn.type === "income" ? "text-accent" : "text-secondary"}`}>
                      {txn.type === "income" ? "+" : "-"}{formatCurrency(txn.amount)}
                    </td>
                    <td className="py-3 px-2 text-right">{getStatusBadge(txn.status)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            </div>
        ) : (
          <div className="flex items-center justify-center py-12 text-muted-foreground">
            No transactions found
        </div>
        )}
      </GlassCard>

      {/* Modals */}
      <TransferCashToBank
        open={transferOpen}
        onOpenChange={setTransferOpen}
        cashBalance={summary?.cash_on_hand || 0}
        banks={banksForModals}
        onSuccess={handleRefresh}
      />
      <AddExpense
        open={expenseOpen}
        onOpenChange={setExpenseOpen}
        banks={banksForModals}
        onSuccess={handleRefresh}
      />
    </div>
  );
}
