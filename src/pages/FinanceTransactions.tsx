import React, { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Download,
  Calendar as CalendarIcon,
  Wallet,
  CreditCard,
  Building2,
  Smartphone,
  ArrowUpRight,
  ArrowDownRight,
  ArrowLeft,
  Clock,
  CheckCircle,
  Plus,
  Filter,
  Loader2,
} from "lucide-react";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import { AddExpense } from "@/components/finance/AddExpense";
import { financeApi, type TransactionResponse, type BankAccountResponse } from "@/lib/api/finance";
import { format, startOfMonth, subDays } from "date-fns";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate, getStartOfDay, getEndOfDay, getDateOnly } from "@/utils/date";

const formatCurrency = (amount: number) => `৳${Math.abs(amount).toLocaleString("bn-BD")}`;

const ITEMS_PER_PAGE = 20;

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

export default function FinanceTransactions() {
  const { timezone } = useTimezone();
  const [typeFilter, setTypeFilter] = useState("all");
  const [paymentFilter, setPaymentFilter] = useState("all");
  const [statusFilter, setStatusFilter] = useState("all");
  
  // Default to this month on load
  const getDefaultDateRange = useMemo(() => {
    const now = new Date();
    const monthStart = getStartOfDay(startOfMonth(now), timezone);
    const today = getEndOfDay(now, timezone);
    return {
      start: format(monthStart, "yyyy-MM-dd"),
      end: format(today, "yyyy-MM-dd"),
    };
  }, [timezone]);
  
  const [startDate, setStartDate] = useState(getDefaultDateRange.start);
  const [endDate, setEndDate] = useState(getDefaultDateRange.end);
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [startDateOpen, setStartDateOpen] = useState(false);
  const [endDateOpen, setEndDateOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [banks, setBanks] = useState<BankAccountResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Reset pagination when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [startDate, endDate, typeFilter, paymentFilter, statusFilter]);

  // Fetch transactions
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const params: any = {
          limit: 1000, // Get all for filtering
          offset: 0,
        };
        // Convert user's selected dates for API
        // Backend creates: start_date 00:00:00 UTC to end_date 23:59:59.999 UTC
        // Convert user's selected dates to UTC date range for backend API
        // getStartOfDay/getEndOfDay return UTC Date objects representing start/end of user's local day
        if (startDate) {
          const utcStart = getStartOfDay(new Date(startDate + "T12:00:00"), timezone);
          // Convert UTC Date object to UTC date string (YYYY-MM-DD)
          params.start_date = utcStart.toISOString().split('T')[0];
        }
        if (endDate) {
          const utcEnd = getEndOfDay(new Date(endDate + "T12:00:00"), timezone);
          // Convert UTC Date object to UTC date string (YYYY-MM-DD)
          // Backend will filter: created_at <= end_date 23:59:59.999 UTC
          // Note: This may include a few hours of the next day in user's timezone, but ensures we capture all of the selected day
          params.end_date = utcEnd.toISOString().split('T')[0];
        }
        if (typeFilter !== "all") params.transaction_type = typeFilter;
        if (paymentFilter !== "all") params.payment_method = paymentFilter;
        if (statusFilter !== "all") params.status = statusFilter;

        const [transactionsData, banksData] = await Promise.all([
          financeApi.getTransactions(params).catch(() => []),
          financeApi.listBankAccounts(true).catch(() => []),
        ]);

        setTransactions(transactionsData);
        setTotalCount(transactionsData.length);
        setBanks(banksData);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load transactions",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadTransactions();
  }, [startDate, endDate, typeFilter, paymentFilter, statusFilter, timezone]);

  // Filter and sort transactions client-side
  const filteredTransactions = useMemo(() => {
    // First, filter by date in user's timezone (backend filtering may include edge cases)
    let filtered = [...transactions];
    
    if (startDate) {
      const startDateStr = getDateOnly(new Date(startDate + "T12:00:00"), timezone);
      filtered = filtered.filter((t) => {
        const txnDate = getDateOnly(t.date, timezone);
        return txnDate >= startDateStr;
      });
    }
    
    if (endDate) {
      const endDateStr = getDateOnly(new Date(endDate + "T12:00:00"), timezone);
      filtered = filtered.filter((t) => {
        const txnDate = getDateOnly(t.date, timezone);
        return txnDate <= endDateStr;
      });
    }
    
    // Sort client-side
    // Ensure UTC parsing by appending 'Z' if missing for accurate date comparison
    const parseUTCDate = (dateStr: string) => {
      const utcStr = dateStr.endsWith('Z') ? dateStr : dateStr + 'Z';
      return new Date(utcStr).getTime();
    };
    
    const sorted = filtered.sort((a, b) => {
      if (sortField === "date") {
        return sortOrder === "desc" 
          ? parseUTCDate(b.date) - parseUTCDate(a.date)
          : parseUTCDate(a.date) - parseUTCDate(b.date);
      } else {
        return sortOrder === "desc" 
          ? Math.abs(b.amount) - Math.abs(a.amount)
          : Math.abs(a.amount) - Math.abs(b.amount);
      }
    });

    return sorted.map((t) => ({
      id: t.id,
      date: t.date,
      type: t.type,
      description: t.description,
      amount: t.amount,
      paymentMethod: t.payment_method,
      status: t.status,
    }));
  }, [transactions, startDate, endDate, sortField, sortOrder, timezone]);

  const totalPages = Math.ceil(filteredTransactions.length / ITEMS_PER_PAGE);
  const paginatedTransactions = filteredTransactions.slice(
    (currentPage - 1) * ITEMS_PER_PAGE,
    currentPage * ITEMS_PER_PAGE
  );

  const handleSort = (field: "date" | "amount") => {
    if (sortField === field) {
      setSortOrder(sortOrder === "desc" ? "asc" : "desc");
    } else {
      setSortField(field);
      setSortOrder("desc");
    }
  };

  const handleExport = () => {
    // Generate CSV
    const headers = ["Date", "Type", "Description", "Payment Method", "Amount", "Status"];
    const rows = filteredTransactions.map((t) => [
      formatDate(t.date, timezone), // Format date in user's timezone for CSV
      t.type,
      t.description,
      t.paymentMethod.replace("_", " "),
      t.type === "expense" ? -Math.abs(t.amount) : t.amount,
      t.status,
    ]);
    
    const csv = [headers.join(","), ...rows.map((r) => r.map((cell) => `"${cell}"`).join(","))].join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    // Use timezone-aware date for filename
    const todayDate = getDateOnly(new Date(), timezone);
    a.download = `transactions-${todayDate}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setPaymentFilter("all");
    setStatusFilter("all");
    // Reset to default (this month) instead of empty
    setStartDate(getDefaultDateRange.start);
    setEndDate(getDefaultDateRange.end);
    setCurrentPage(1);
  };

  // Calculate totals
  const totals = useMemo(() => {
    const income = filteredTransactions.filter((t) => t.type === "income").reduce((sum, t) => sum + t.amount, 0);
    const expense = Math.abs(filteredTransactions.filter((t) => t.type === "expense").reduce((sum, t) => sum + t.amount, 0));
    return { income, expense, net: income - expense };
  }, [filteredTransactions]);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div className="flex items-center gap-4">
          <Link to="/finance">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="w-5 h-5" />
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-display font-bold gradient-text">Transactions</h1>
            <p className="text-muted-foreground">লেনদেন তালিকা • Transaction Ledger</p>
          </div>
        </div>
        <div className="flex gap-2">
          <Button variant="glow" onClick={() => setExpenseOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Add Expense
          </Button>
          <Button variant="outline" onClick={handleExport}>
            <Download className="w-4 h-4 mr-2" />
            Export CSV
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 animate-fade-in stagger-1">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Income</p>
          <p className="text-2xl font-display font-bold text-accent">{formatCurrency(totals.income)}</p>
          <p className="text-xs text-muted-foreground mt-1">For selected period</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-display font-bold text-secondary">{formatCurrency(totals.expense)}</p>
          <p className="text-xs text-muted-foreground mt-1">For selected period</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Net Balance</p>
          <p className={`text-2xl font-display font-bold ${totals.net >= 0 ? "text-accent" : "text-secondary"}`}>
            {totals.net >= 0 ? "+" : "-"}{formatCurrency(totals.net)}
          </p>
          <p className="text-xs text-muted-foreground mt-1">For selected period</p>
        </GlassCard>
      </div>

      {/* Filters */}
      <GlassCard className="p-4 animate-fade-in stagger-2">
        <div className="flex items-center gap-2 mb-4">
          <Filter className="w-5 h-5 text-muted-foreground" />
          <h3 className="font-medium">Filters</h3>
          <Button variant="ghost" size="sm" onClick={clearFilters} className="ml-auto">
            Clear All
          </Button>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Start Date</label>
            <Popover open={startDateOpen} onOpenChange={setStartDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-muted/50 hover:bg-muted/70",
                    !startDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {startDate ? (
                    formatDate(startDate + "T12:00:00", timezone)
                  ) : (
                    <span>dd/mm/yyyy</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={startDate ? new Date(startDate + "T12:00:00") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setStartDate(format(date, "yyyy-MM-dd"));
                      setStartDateOpen(false);
                    } else {
                      setStartDate("");
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">End Date</label>
            <Popover open={endDateOpen} onOpenChange={setEndDateOpen}>
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className={cn(
                    "w-full justify-start text-left font-normal bg-muted/50 hover:bg-muted/70",
                    !endDate && "text-muted-foreground"
                  )}
                >
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  {endDate ? (
                    formatDate(endDate + "T12:00:00", timezone)
                  ) : (
                    <span>dd/mm/yyyy</span>
                  )}
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={endDate ? new Date(endDate + "T12:00:00") : undefined}
                  onSelect={(date) => {
                    if (date) {
                      setEndDate(format(date, "yyyy-MM-dd"));
                      setEndDateOpen(false);
                    } else {
                      setEndDate("");
                    }
                  }}
                  initialFocus
                />
              </PopoverContent>
            </Popover>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Type</label>
            <Select value={typeFilter} onValueChange={setTypeFilter}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Types</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Payment Method</label>
            <Select value={paymentFilter} onValueChange={setPaymentFilter}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Methods</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="card">Card</SelectItem>
                <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                <SelectItem value="online">Online</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">Status</label>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Status</SelectItem>
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="reconciled">Reconciled</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

      {/* Transactions Table */}
      <GlassCard className="p-6 animate-fade-in stagger-3">
        <div className="flex items-center justify-between mb-4">
          <p className="text-sm text-muted-foreground">
            Showing {paginatedTransactions.length} of {filteredTransactions.length} transactions
          </p>
        </div>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
          </div>
        ) : paginatedTransactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-border">
                  <th 
                    className="text-left py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("date")}
                  >
                    Date {sortField === "date" && (sortOrder === "desc" ? "↓" : "↑")}
                  </th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Description</th>
                  <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Payment</th>
                  <th 
                    className="text-right py-3 px-2 text-sm font-medium text-muted-foreground cursor-pointer hover:text-foreground"
                    onClick={() => handleSort("amount")}
                  >
                    Amount {sortField === "amount" && (sortOrder === "desc" ? "↓" : "↑")}
                  </th>
                  <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedTransactions.map((txn) => (
                  <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                    <td className="py-3 px-2 text-muted-foreground">{formatDate(txn.date, timezone)}</td>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination className="mt-4">
            <PaginationContent>
              <PaginationItem>
                <PaginationPrevious
                  onClick={() => {
                    if (currentPage > 1) {
                      setCurrentPage(currentPage - 1);
                    }
                  }}
                  className={currentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                />
              </PaginationItem>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter((page) => {
                  return (
                    page === 1 ||
                    page === totalPages ||
                    (page >= currentPage - 1 && page <= currentPage + 1)
                  );
                })
                .map((page, idx, arr) => {
                  const showEllipsisBefore = idx > 0 && arr[idx - 1] < page - 1;
                  return (
                    <React.Fragment key={page}>
                      {showEllipsisBefore && (
                        <PaginationItem>
                          <span className="px-2">...</span>
                        </PaginationItem>
                      )}
                      <PaginationItem>
                        <PaginationLink
                          onClick={() => setCurrentPage(page)}
                          isActive={currentPage === page}
                          className="cursor-pointer"
                        >
                          {page}
                        </PaginationLink>
                      </PaginationItem>
                    </React.Fragment>
                  );
                })}
              <PaginationItem>
                <PaginationNext
                  onClick={() => {
                    if (currentPage < totalPages) {
                      setCurrentPage(currentPage + 1);
                    }
                  }}
                  className={
                    currentPage >= totalPages
                      ? "pointer-events-none opacity-50"
                      : "cursor-pointer"
                  }
                />
              </PaginationItem>
            </PaginationContent>
          </Pagination>
        )}
      </GlassCard>

      {/* Modal */}
      <AddExpense 
        open={expenseOpen} 
        onOpenChange={setExpenseOpen} 
        banks={banks.map((b) => ({ id: b.id, name: b.name, balance: 0 }))}
        onSuccess={() => {
          // Reload transactions
          const loadTransactions = async () => {
            try {
              const params: any = {
                limit: 1000,
                offset: 0,
              };
              // Convert user's selected dates for API (same logic as main useEffect)
              if (startDate) {
                const utcStart = getStartOfDay(new Date(startDate + "T12:00:00"), timezone);
                params.start_date = format(utcStart, "yyyy-MM-dd");
              }
              if (endDate) {
                const utcEnd = getEndOfDay(new Date(endDate + "T12:00:00"), timezone);
                const utcEndDate = new Date(utcEnd);
                utcEndDate.setUTCDate(utcEndDate.getUTCDate() - 1);
                params.end_date = format(utcEndDate, "yyyy-MM-dd");
              }
              if (typeFilter !== "all") params.transaction_type = typeFilter;
              if (paymentFilter !== "all") params.payment_method = paymentFilter;
              if (statusFilter !== "all") params.status = statusFilter;

              const transactionsData = await financeApi.getTransactions(params);
              setTransactions(transactionsData);
              setTotalCount(transactionsData.length);
            } catch (error) {
              // Silent fail on refresh
            }
          };
          loadTransactions();
        }}
      />
    </div>
  );
}
