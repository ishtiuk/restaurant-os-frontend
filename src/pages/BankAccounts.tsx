import React, { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Building2,
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Wallet,
  Loader2,
} from "lucide-react";
import { AddBankAccount } from "@/components/finance/AddBankAccount";
import { financeApi, type BankAccountResponse, type BankTransactionResponse } from "@/lib/api/finance";
import { format } from "date-fns";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `৳${Math.abs(amount).toLocaleString("bn-BD")}`;

export default function BankAccounts() {
  const [banks, setBanks] = useState<BankAccountResponse[]>([]);
  const [bankBalances, setBankBalances] = useState<Record<string, number>>({});
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<BankAccountResponse | null>(null);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [bankTransactions, setBankTransactions] = useState<BankTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);

  // Fetch banks and balances
  useEffect(() => {
    const loadBanks = async () => {
      setLoading(true);
      try {
        const banksData = await financeApi.listBankAccounts();
        setBanks(banksData);

        // Fetch balances for all banks
        const balancePromises = banksData.map(async (bank) => {
          try {
            const balance = await financeApi.getBankBalance(bank.id);
            return { id: bank.id, balance: balance.balance };
          } catch {
            return { id: bank.id, balance: 0 };
          }
        });
        const balances = await Promise.all(balancePromises);
        const balanceMap: Record<string, number> = {};
        balances.forEach((b) => {
          balanceMap[b.id] = b.balance;
        });
        setBankBalances(balanceMap);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load bank accounts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadBanks();
  }, []);

  const totalBalance = banks
    .filter((b) => b.is_active)
    .reduce((sum, b) => sum + (bankBalances[b.id] || 0), 0);

  const handleToggleStatus = async (bankId: string) => {
    try {
      const bank = banks.find((b) => b.id === bankId);
      if (!bank) return;

      await financeApi.updateBankAccount(bankId, {
        is_active: !bank.is_active,
      });

      setBanks((prev) =>
        prev.map((b) => (b.id === bankId ? { ...b, is_active: !b.is_active } : b))
      );

      toast({
        title: "Status Updated",
        description: `Bank account ${!bank.is_active ? "activated" : "deactivated"}`,
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to update bank status",
        variant: "destructive",
      });
    }
  };

  const handleViewTransactions = async (bank: BankAccountResponse) => {
    setSelectedBank(bank);
    setTransactionsOpen(true);
    setLoadingTransactions(true);

    try {
      const transactions = await financeApi.getBankTransactions(bank.id, 100);
      setBankTransactions(transactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
      setBankTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleRefresh = () => {
    const loadBanks = async () => {
      try {
        const banksData = await financeApi.listBankAccounts();
        setBanks(banksData);

        const balancePromises = banksData.map(async (bank) => {
          try {
            const balance = await financeApi.getBankBalance(bank.id);
            return { id: bank.id, balance: balance.balance };
          } catch {
            return { id: bank.id, balance: 0 };
          }
        });
        const balances = await Promise.all(balancePromises);
        const balanceMap: Record<string, number> = {};
        balances.forEach((b) => {
          balanceMap[b.id] = b.balance;
        });
        setBankBalances(balanceMap);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to refresh bank accounts",
          variant: "destructive",
        });
      }
    };

    loadBanks();
  };

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
            <h1 className="text-3xl font-display font-bold gradient-text">Bank Accounts</h1>
            <p className="text-muted-foreground">ব্যাংক অ্যাকাউন্ট • Bank Management</p>
          </div>
        </div>
        <Button variant="glow" onClick={() => setAddBankOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Bank Account
        </Button>
      </div>

      {/* Total Balance Card */}
      <GlassCard className="p-6 animate-fade-in stagger-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total Bank Balance (Active Accounts)</p>
            <p className="text-4xl font-display font-bold text-purple-400 mt-1">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">মোট ব্যাংক ব্যালেন্স</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-purple-500/20 flex items-center justify-center">
            <Building2 className="w-8 h-8 text-purple-400" />
          </div>
        </div>
      </GlassCard>

      {/* Bank Cards */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {[...Array(3)].map((_, i) => (
            <GlassCard key={i} className="p-6">
              <div className="flex items-center justify-center h-48">
                <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
              </div>
            </GlassCard>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in stagger-2">
          {banks.map((bank) => (
            <GlassCard key={bank.id} hover className={`p-6 ${!bank.is_active ? "opacity-60" : ""}`}>
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                    bank.is_active ? "bg-purple-500/20" : "bg-muted"
                  }`}>
                    <Building2 className={`w-6 h-6 ${bank.is_active ? "text-purple-400" : "text-muted-foreground"}`} />
                  </div>
                  <div>
                    <h3 className="font-semibold">{bank.name}</h3>
                    <p className="text-sm text-muted-foreground">{bank.branch || "N/A"}</p>
                  </div>
                </div>
                <Badge className={bank.is_active ? "bg-accent/20 text-accent border-accent/30" : "bg-muted text-muted-foreground"}>
                  {bank.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                  {bank.is_active ? "active" : "inactive"}
                </Badge>
              </div>

              <div className="space-y-2 mb-4">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Account No:</span>
                  <span className="font-mono">{bank.account_number}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Type:</span>
                  <span className="capitalize">{bank.account_type}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-muted-foreground text-sm">Balance:</span>
                  <span className="text-xl font-display font-bold text-purple-400">{formatCurrency(bankBalances[bank.id] || 0)}</span>
                </div>
              </div>

              <div className="flex gap-2 pt-4 border-t border-border">
                <Button
                  variant="outline"
                  size="sm"
                  className="flex-1"
                  onClick={() => handleViewTransactions(bank)}
                >
                  <Eye className="w-4 h-4 mr-1" />
                  Transactions
                </Button>
                <Button variant="ghost" size="sm">
                  <Edit className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleToggleStatus(bank.id)}
                >
                  {bank.is_active ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
                </Button>
              </div>
            </GlassCard>
          ))}

        {/* Add Bank Card */}
        <GlassCard
          hover
          className="p-6 border-dashed cursor-pointer flex flex-col items-center justify-center min-h-[250px]"
          onClick={() => setAddBankOpen(true)}
        >
          <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
            <Plus className="w-8 h-8 text-muted-foreground" />
          </div>
          <p className="font-medium text-muted-foreground">Add New Bank Account</p>
          <p className="text-sm text-muted-foreground mt-1">নতুন ব্যাংক যোগ করুন</p>
        </GlassCard>
        </div>
      )}

      {/* Bank Transactions Modal */}
      <Dialog open={transactionsOpen} onOpenChange={setTransactionsOpen}>
        <DialogContent className="max-w-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Building2 className="w-5 h-5 text-purple-400" />
              {selectedBank?.name} - Transaction History
            </DialogTitle>
          </DialogHeader>
          
          {selectedBank && (
            <div className="space-y-4">
              {/* Bank Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-mono font-medium">{selectedBank.account_number}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-xl font-display font-bold text-purple-400">{formatCurrency(bankBalances[selectedBank.id] || 0)}</p>
                </div>
              </div>

              {/* Transactions Table */}
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : bankTransactions.length > 0 ? (
                <div className="overflow-x-auto max-h-[400px] overflow-y-auto">
                  <table className="w-full">
                    <thead className="sticky top-0 bg-background">
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Description</th>
                        <th className="text-left py-3 px-2 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Balance</th>
                        <th className="text-right py-3 px-2 text-sm font-medium text-muted-foreground">Ref No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {bankTransactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-2 text-muted-foreground">{format(new Date(txn.date), "yyyy-MM-dd")}</td>
                          <td className="py-3 px-2 font-medium">{txn.description || "N/A"}</td>
                          <td className="py-3 px-2">
                            <Badge className={txn.type === "deposit" ? "bg-accent/20 text-accent border-accent/30" : "bg-secondary/20 text-secondary border-secondary/30"}>
                              {txn.type === "deposit" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                              {txn.type}
                            </Badge>
                          </td>
                          <td className={`py-3 px-2 text-right font-display font-semibold ${txn.type === "deposit" ? "text-accent" : "text-secondary"}`}>
                            {txn.type === "deposit" ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                          </td>
                          <td className="py-3 px-2 text-right font-medium">{formatCurrency(txn.balance_after)}</td>
                          <td className="py-3 px-2 text-right text-muted-foreground font-mono text-sm">{txn.reference_no || "N/A"}</td>
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
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bank Modal */}
      <AddBankAccount open={addBankOpen} onOpenChange={(open) => {
        setAddBankOpen(open);
        if (!open) handleRefresh();
      }} />
    </div>
  );
}
