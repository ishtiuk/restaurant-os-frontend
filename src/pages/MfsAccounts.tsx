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
  DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Smartphone,
  ArrowLeft,
  Plus,
  Eye,
  Edit,
  Ban,
  CheckCircle,
  ArrowUpRight,
  ArrowDownRight,
  Loader2,
  Trash2,
} from "lucide-react";
import { AddMfsAccount } from "@/components/finance/AddMfsAccount";
import { EditMfsAccount } from "@/components/finance/EditMfsAccount";
import { financeApi, type MfsAccountResponse, type MfsTransactionResponse } from "@/lib/api/finance";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate } from "@/utils/date";

const formatCurrency = (amount: number) => `৳${Math.abs(amount).toLocaleString("bn-BD")}`;

const getProviderLabel = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "bkash": return "bKash";
    case "nagad": return "Nagad";
    case "rocket": return "Rocket";
    default: return provider.toUpperCase();
  }
};

const getProviderColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "bkash": return "text-teal-400";
    case "nagad": return "text-green-400";
    case "rocket": return "text-blue-400";
    default: return "text-teal-400";
  }
};

const getProviderBgColor = (provider: string) => {
  switch (provider.toLowerCase()) {
    case "bkash": return "bg-teal-500/20";
    case "nagad": return "bg-green-500/20";
    case "rocket": return "bg-blue-500/20";
    default: return "bg-teal-500/20";
  }
};

export default function MfsAccounts() {
  const { timezone } = useTimezone();
  const [mfsAccounts, setMfsAccounts] = useState<MfsAccountResponse[]>([]);
  const [mfsBalances, setMfsBalances] = useState<Record<string, number>>({});
  const [addMfsOpen, setAddMfsOpen] = useState(false);
  const [editMfsOpen, setEditMfsOpen] = useState(false);
  const [mfsToEdit, setMfsToEdit] = useState<MfsAccountResponse | null>(null);
  const [selectedMfs, setSelectedMfs] = useState<MfsAccountResponse | null>(null);
  const [transactionsOpen, setTransactionsOpen] = useState(false);
  const [mfsTransactions, setMfsTransactions] = useState<MfsTransactionResponse[]>([]);
  const [loading, setLoading] = useState(true);
  const [loadingTransactions, setLoadingTransactions] = useState(false);
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [mfsToDelete, setMfsToDelete] = useState<MfsAccountResponse | null>(null);

  // Fetch MFS accounts and balances
  useEffect(() => {
    const loadMfsAccounts = async () => {
      setLoading(true);
      try {
        const mfsData = await financeApi.listMfsAccounts();
        setMfsAccounts(mfsData);

        // Fetch balances for all MFS accounts
        const balancePromises = mfsData.map(async (mfs) => {
          try {
            const balance = await financeApi.getMfsBalance(mfs.id);
            return { id: mfs.id, balance: balance.balance };
          } catch {
            return { id: mfs.id, balance: 0 };
          }
        });
        const balances = await Promise.all(balancePromises);
        const balanceMap: Record<string, number> = {};
        balances.forEach((b) => {
          balanceMap[b.id] = b.balance;
        });
        setMfsBalances(balanceMap);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to load MFS accounts",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    loadMfsAccounts();
  }, []);

  const totalBalance = mfsAccounts
    .filter((m) => m.is_active)
    .reduce((sum, m) => sum + (mfsBalances[m.id] || 0), 0);

  const handleDeleteMfs = (mfsId: string) => {
    const mfs = mfsAccounts.find((m) => m.id === mfsId);
    if (!mfs) return;
    setMfsToDelete(mfs);
    setDeleteDialogOpen(true);
  };

  const confirmDeleteMfs = async () => {
    if (!mfsToDelete) return;

    try {
      await financeApi.deleteMfsAccount(mfsToDelete.id);

      setMfsAccounts((prev) => prev.filter((m) => m.id !== mfsToDelete.id));
      delete mfsBalances[mfsToDelete.id];
      setMfsBalances({ ...mfsBalances });

      toast({
        title: "MFS Account Deleted",
        description: `${getProviderLabel(mfsToDelete.provider)} account has been deleted successfully`,
      });

      setDeleteDialogOpen(false);
      setMfsToDelete(null);
      handleRefresh();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error?.message || "Failed to delete MFS account",
        variant: "destructive",
      });
    }
  };

  const handleEditMfs = (mfs: MfsAccountResponse) => {
    setMfsToEdit(mfs);
    setEditMfsOpen(true);
  };

  const handleViewTransactions = async (mfs: MfsAccountResponse) => {
    setSelectedMfs(mfs);
    setTransactionsOpen(true);
    setLoadingTransactions(true);

    try {
      const transactions = await financeApi.getMfsTransactions(mfs.id, 100);
      setMfsTransactions(transactions);
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to load transactions",
        variant: "destructive",
      });
      setMfsTransactions([]);
    } finally {
      setLoadingTransactions(false);
    }
  };

  const handleRefresh = () => {
    const loadMfsAccounts = async () => {
      try {
        const mfsData = await financeApi.listMfsAccounts();
        setMfsAccounts(mfsData);

        const balancePromises = mfsData.map(async (mfs) => {
          try {
            const balance = await financeApi.getMfsBalance(mfs.id);
            return { id: mfs.id, balance: balance.balance };
          } catch {
            return { id: mfs.id, balance: 0 };
          }
        });
        const balances = await Promise.all(balancePromises);
        const balanceMap: Record<string, number> = {};
        balances.forEach((b) => {
          balanceMap[b.id] = b.balance;
        });
        setMfsBalances(balanceMap);
      } catch (error) {
        toast({
          title: "Error",
          description: "Failed to refresh MFS accounts",
          variant: "destructive",
        });
      }
    };

    loadMfsAccounts();
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
            <h1 className="text-3xl font-display font-bold gradient-text">MFS Accounts</h1>
            <p className="text-muted-foreground">মোবাইল ব্যালেন্স • Mobile Financial Services</p>
          </div>
        </div>
        <Button variant="glow" onClick={() => setAddMfsOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add MFS Account
        </Button>
      </div>

      {/* Total Balance Card */}
      <GlassCard className="p-6 animate-fade-in stagger-1">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-sm text-muted-foreground">Total MFS Balance (Active Accounts)</p>
            <p className="text-4xl font-display font-bold text-teal-400 mt-1">{formatCurrency(totalBalance)}</p>
            <p className="text-xs text-muted-foreground mt-1">মোট MFS ব্যালেন্স (bKash/Nagad/Rocket)</p>
          </div>
          <div className="w-16 h-16 rounded-2xl bg-teal-500/20 flex items-center justify-center">
            <Smartphone className="w-8 h-8 text-teal-400" />
          </div>
        </div>
      </GlassCard>

      {/* MFS Account Cards */}
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
          {mfsAccounts.map((mfs) => {
            const providerColor = getProviderColor(mfs.provider);
            const providerBgColor = getProviderBgColor(mfs.provider);
            return (
              <GlassCard key={mfs.id} hover className={`p-6 ${!mfs.is_active ? "opacity-60" : ""}`}>
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${mfs.is_active ? providerBgColor : "bg-muted"}`}>
                      <Smartphone className={`w-6 h-6 ${mfs.is_active ? providerColor : "text-muted-foreground"}`} />
                    </div>
                    <div>
                      <h3 className="font-semibold">{getProviderLabel(mfs.provider)}</h3>
                      <p className="text-sm text-muted-foreground">{mfs.account_name || "N/A"}</p>
                    </div>
                  </div>
                  <Badge className={mfs.is_active ? "bg-accent/20 text-accent border-accent/30" : "bg-muted text-muted-foreground"}>
                    {mfs.is_active ? <CheckCircle className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                    {mfs.is_active ? "active" : "inactive"}
                  </Badge>
                </div>

                <div className="space-y-2 mb-4">
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Account No:</span>
                    <span className="font-mono">{mfs.account_number}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground text-sm">Balance:</span>
                    <span className={`text-xl font-display font-bold ${providerColor}`}>{formatCurrency(mfsBalances[mfs.id] || 0)}</span>
                  </div>
                </div>

                <div className="flex gap-2 pt-4 border-t border-border">
                  <Button
                    variant="outline"
                    size="sm"
                    className="flex-1"
                    onClick={() => handleViewTransactions(mfs)}
                  >
                    <Eye className="w-4 h-4 mr-1" />
                    Transactions
                  </Button>
                  <Button 
                    variant="ghost" 
                    size="sm"
                    onClick={() => handleEditMfs(mfs)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteMfs(mfs.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </GlassCard>
            );
          })}

          {/* Add MFS Card */}
          <GlassCard
            hover
            className="p-6 border-dashed cursor-pointer flex flex-col items-center justify-center min-h-[250px]"
            onClick={() => setAddMfsOpen(true)}
          >
            <div className="w-16 h-16 rounded-2xl bg-muted flex items-center justify-center mb-4">
              <Plus className="w-8 h-8 text-muted-foreground" />
            </div>
            <p className="font-medium text-muted-foreground">Add New MFS Account</p>
            <p className="text-sm text-muted-foreground mt-1">নতুন MFS অ্যাকাউন্ট যোগ করুন</p>
          </GlassCard>
        </div>
      )}

      {/* MFS Transactions Modal */}
      <Dialog open={transactionsOpen} onOpenChange={setTransactionsOpen}>
        <DialogContent className="max-w-4xl glass-card">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Smartphone className="w-5 h-5 text-teal-400" />
              {selectedMfs && `${getProviderLabel(selectedMfs.provider)} - Transaction History`}
            </DialogTitle>
            <DialogDescription>
              View all transactions for this MFS account including deposits, withdrawals, and transfers.
            </DialogDescription>
          </DialogHeader>
          
          {selectedMfs && (
            <div className="space-y-4">
              {/* MFS Summary */}
              <div className="grid grid-cols-2 gap-4">
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Account Number</p>
                  <p className="font-mono font-medium">{selectedMfs.account_number}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className={`text-xl font-display font-bold ${getProviderColor(selectedMfs.provider)}`}>
                    {formatCurrency(mfsBalances[selectedMfs.id] || 0)}
                  </p>
                </div>
              </div>

              {/* Transactions Table */}
              {loadingTransactions ? (
                <div className="flex items-center justify-center py-12">
                  <Loader2 className="w-6 h-6 animate-spin text-muted-foreground" />
                </div>
              ) : mfsTransactions.length > 0 ? (
                <div className="overflow-x-auto max-h-[500px] overflow-y-auto">
                  <table className="w-full min-w-[800px]">
                    <thead className="sticky top-0 bg-background z-10">
                      <tr className="border-b border-border">
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Date</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Description</th>
                        <th className="text-left py-3 px-4 text-sm font-medium text-muted-foreground">Type</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Amount</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Balance</th>
                        <th className="text-right py-3 px-4 text-sm font-medium text-muted-foreground">Ref No</th>
                      </tr>
                    </thead>
                    <tbody>
                      {mfsTransactions.map((txn) => (
                        <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                          <td className="py-3 px-4 text-muted-foreground whitespace-nowrap">{formatDate(txn.date, timezone)}</td>
                          <td className="py-3 px-4 font-medium">{txn.description || "N/A"}</td>
                          <td className="py-3 px-4">
                            <Badge className={txn.type === "deposit" ? "bg-accent/20 text-accent border-accent/30" : "bg-secondary/20 text-secondary border-secondary/30"}>
                              {txn.type === "deposit" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                              {txn.type}
                            </Badge>
                          </td>
                          <td className={`py-3 px-4 text-right font-display font-semibold whitespace-nowrap ${txn.type === "deposit" ? "text-accent" : "text-secondary"}`}>
                            {txn.type === "deposit" ? "+" : "-"}{formatCurrency(Math.abs(txn.amount))}
                          </td>
                          <td className="py-3 px-4 text-right font-medium whitespace-nowrap">{formatCurrency(txn.balance_after)}</td>
                          <td className="py-3 px-4 text-right text-muted-foreground font-mono text-sm whitespace-nowrap">{txn.reference_no || "N/A"}</td>
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

      {/* Add MFS Modal */}
      <AddMfsAccount open={addMfsOpen} onOpenChange={(open) => {
        setAddMfsOpen(open);
        if (!open) handleRefresh();
      }} />

      {/* Edit MFS Modal */}
      <EditMfsAccount 
        open={editMfsOpen} 
        onOpenChange={(open) => {
          setEditMfsOpen(open);
          if (!open) {
            setMfsToEdit(null);
            handleRefresh();
          }
        }}
        mfs={mfsToEdit}
        onSuccess={handleRefresh}
      />

      {/* Delete MFS Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-display gradient-text">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete MFS Account?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete <strong>{mfsToDelete && getProviderLabel(mfsToDelete.provider)}</strong> account?</p>
              {mfsToDelete && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border mt-2">
                  <div className="flex justify-between text-sm mb-1">
                    <span className="text-muted-foreground">Account Number:</span>
                    <span className="font-mono font-semibold">{mfsToDelete.account_number}</span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span className="text-muted-foreground">Balance:</span>
                    <span className="font-semibold">{formatCurrency(mfsBalances[mfsToDelete.id] || 0)}</span>
                  </div>
                </div>
              )}
              <p className="text-sm text-destructive mt-2">
                This action cannot be undone. All related transactions and transfers will also be deleted.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteMfs}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

