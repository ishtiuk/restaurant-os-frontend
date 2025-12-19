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
  Calendar,
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
  ChevronLeft,
  ChevronRight,
  Loader2,
} from "lucide-react";
import { AddExpense } from "@/components/finance/AddExpense";
import { financeApi, type TransactionResponse, type BankAccountResponse } from "@/lib/api/finance";
import { format } from "date-fns";
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
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const [sortField, setSortField] = useState<"date" | "amount">("date");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const [expenseOpen, setExpenseOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [transactions, setTransactions] = useState<TransactionResponse[]>([]);
  const [banks, setBanks] = useState<BankAccountResponse[]>([]);
  const [totalCount, setTotalCount] = useState(0);

  // Fetch transactions
  useEffect(() => {
    const loadTransactions = async () => {
      setLoading(true);
      try {
        const params: any = {
          limit: 1000, // Get all for filtering
          offset: 0,
        };
        // Convert user's selected dates to UTC dates for API
        if (startDate) {
          const userDate = new Date(startDate + "T12:00:00"); // Use noon to avoid DST issues
          const utcStart = getStartOfDay(userDate, timezone);
          params.start_date = format(utcStart, "yyyy-MM-dd");
        }
        if (endDate) {
          const userDate = new Date(endDate + "T12:00:00"); // Use noon to avoid DST issues
          const utcEnd = getEndOfDay(userDate, timezone);
          params.end_date = format(utcEnd, "yyyy-MM-dd");
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

  const filteredTransactions = useMemo(() => {
    let filtered = transactions.map((t) => ({
      id: t.id,
      date: t.date, // Keep original date for proper formatting
      type: t.type,
      description: t.description,
      amount: t.amount,
      paymentMethod: t.payment_method,
      status: t.status,
    }));

    // Type filter
    if (typeFilter !== "all") {
      filtered = filtered.filter((t) => t.type === typeFilter);
    }

    // Payment method filter
    if (paymentFilter !== "all") {
      filtered = filtered.filter((t) => t.paymentMethod === paymentFilter);
    }

    // Status filter
    if (statusFilter !== "all") {
      filtered = filtered.filter((t) => t.status === statusFilter);
    }

    // Date range filter (timezone-aware)
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

    // Sort
    filtered.sort((a, b) => {
      if (sortField === "date") {
        return sortOrder === "desc" 
          ? new Date(b.date).getTime() - new Date(a.date).getTime()
          : new Date(a.date).getTime() - new Date(b.date).getTime();
      } else {
        return sortOrder === "desc" 
          ? Math.abs(b.amount) - Math.abs(a.amount)
          : Math.abs(a.amount) - Math.abs(b.amount);
      }
    });

    return filtered;
  }, [transactions, sortField, sortOrder, typeFilter, paymentFilter, statusFilter, startDate, endDate, timezone]);

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
      t.date,
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
    a.download = `transactions-${format(new Date(), "yyyy-MM-dd")}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  };

  const clearFilters = () => {
    setTypeFilter("all");
    setPaymentFilter("all");
    setStatusFilter("all");
    setStartDate("");
    setEndDate("");
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
            Add Transaction
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
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Expenses</p>
          <p className="text-2xl font-display font-bold text-secondary">{formatCurrency(totals.expense)}</p>
        </GlassCard>
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Net Balance</p>
          <p className={`text-2xl font-display font-bold ${totals.net >= 0 ? "text-accent" : "text-secondary"}`}>
            {totals.net >= 0 ? "+" : "-"}{formatCurrency(totals.net)}
          </p>
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
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="bg-muted/50"
            />
          </div>
          <div>
            <label className="text-sm text-muted-foreground mb-1 block">End Date</label>
            <Input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="bg-muted/50"
            />
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
          <div className="flex items-center justify-between mt-4 pt-4 border-t border-border">
            <p className="text-sm text-muted-foreground">
              Page {currentPage} of {totalPages}
            </p>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="w-4 h-4" />
                Previous
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="w-4 h-4" />
              </Button>
            </div>
          </div>
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
              // Convert user's selected dates to UTC dates for API
              if (startDate) {
                const userDate = new Date(startDate + "T12:00:00");
                const utcStart = getStartOfDay(userDate, timezone);
                params.start_date = format(utcStart, "yyyy-MM-dd");
              }
              if (endDate) {
                const userDate = new Date(endDate + "T12:00:00");
                const utcEnd = getEndOfDay(userDate, timezone);
                params.end_date = format(utcEnd, "yyyy-MM-dd");
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
