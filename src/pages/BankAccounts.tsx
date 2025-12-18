import React, { useState } from "react";
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
} from "lucide-react";
import { AddBankAccount } from "@/components/finance/AddBankAccount";

const formatCurrency = (amount: number) => `৳${Math.abs(amount).toLocaleString("bn-BD")}`;

// Placeholder API data
const banksData = [
  { id: "2", name: "Brac Bank", accountNumber: "9876543210", accountType: "savings", balance: 125000.00, status: "active", branch: "Gulshan" },
];

const bankTransactions: Record<string, Array<{
  id: string;
  date: string;
  description: string;
  type: "deposit" | "withdrawal";
  amount: number;
  balance: number;
  referenceNo: string;
}>> = {
  "1": [
    { id: "1", date: "2024-01-20", description: "Supplier Payment - Dhaka Meat", type: "withdrawal", amount: -15000, balance: 250000, referenceNo: "TXN-001" },
    { id: "2", date: "2024-01-19", description: "Cash Deposit", type: "deposit", amount: 50000, balance: 265000, referenceNo: "DEP-001" },
    { id: "3", date: "2024-01-18", description: "Rent Payment", type: "withdrawal", amount: -35000, balance: 215000, referenceNo: "TXN-002" },
    { id: "4", date: "2024-01-17", description: "Sales Deposit", type: "deposit", amount: 85000, balance: 250000, referenceNo: "DEP-002" },
    { id: "5", date: "2024-01-16", description: "Utility Bill - DESCO", type: "withdrawal", amount: -8500, balance: 165000, referenceNo: "TXN-003" },
  ],
  "2": [
    { id: "1", date: "2024-01-20", description: "Staff Salary Transfer", type: "withdrawal", amount: -45000, balance: 125000, referenceNo: "SAL-001" },
    { id: "2", date: "2024-01-18", description: "Online Sales Collection", type: "deposit", amount: 32000, balance: 170000, referenceNo: "ONL-001" },
    { id: "3", date: "2024-01-15", description: "Card Payment Settlement", type: "deposit", amount: 68000, balance: 138000, referenceNo: "CRD-001" },
  ],
  "3": [
    { id: "1", date: "2024-01-10", description: "Marketing Payment", type: "withdrawal", amount: -25000, balance: 75000, referenceNo: "MKT-001" },
    { id: "2", date: "2024-01-05", description: "Initial Deposit", type: "deposit", amount: 100000, balance: 100000, referenceNo: "INI-001" },
  ],
};

export default function BankAccounts() {
  const [banks, setBanks] = useState(banksData);
  const [addBankOpen, setAddBankOpen] = useState(false);
  const [selectedBank, setSelectedBank] = useState<typeof banksData[0] | null>(null);
  const [transactionsOpen, setTransactionsOpen] = useState(false);

  const totalBalance = banks.filter((b) => b.status === "active").reduce((sum, b) => sum + b.balance, 0);

  const handleToggleStatus = (bankId: string) => {
    setBanks((prev) =>
      prev.map((b) =>
        b.id === bankId ? { ...b, status: b.status === "active" ? "inactive" : "active" } : b
      )
    );
  };

  const handleViewTransactions = (bank: typeof banksData[0]) => {
    setSelectedBank(bank);
    setTransactionsOpen(true);
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
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in stagger-2">
        {banks.map((bank) => (
          <GlassCard key={bank.id} hover className={`p-6 ${bank.status === "inactive" ? "opacity-60" : ""}`}>
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                  bank.status === "active" ? "bg-purple-500/20" : "bg-muted"
                }`}>
                  <Building2 className={`w-6 h-6 ${bank.status === "active" ? "text-purple-400" : "text-muted-foreground"}`} />
                </div>
                <div>
                  <h3 className="font-semibold">{bank.name}</h3>
                  <p className="text-sm text-muted-foreground">{bank.branch}</p>
                </div>
              </div>
              <Badge className={bank.status === "active" ? "bg-accent/20 text-accent border-accent/30" : "bg-muted text-muted-foreground"}>
                {bank.status === "active" ? <CheckCircle className="w-3 h-3 mr-1" /> : <Ban className="w-3 h-3 mr-1" />}
                {bank.status}
              </Badge>
            </div>

            <div className="space-y-2 mb-4">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Account No:</span>
                <span className="font-mono">{bank.accountNumber}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">Type:</span>
                <span className="capitalize">{bank.accountType}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-muted-foreground text-sm">Balance:</span>
                <span className="text-xl font-display font-bold text-purple-400">{formatCurrency(bank.balance)}</span>
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
                {bank.status === "active" ? <Ban className="w-4 h-4" /> : <CheckCircle className="w-4 h-4" />}
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
                  <p className="font-mono font-medium">{selectedBank.accountNumber}</p>
                </div>
                <div className="p-4 rounded-lg bg-muted/30">
                  <p className="text-sm text-muted-foreground">Current Balance</p>
                  <p className="text-xl font-display font-bold text-purple-400">{formatCurrency(selectedBank.balance)}</p>
                </div>
              </div>

              {/* Transactions Table */}
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
                    {(bankTransactions[selectedBank.id] || []).map((txn) => (
                      <tr key={txn.id} className="border-b border-border/50 hover:bg-muted/30 transition-colors">
                        <td className="py-3 px-2 text-muted-foreground">{txn.date}</td>
                        <td className="py-3 px-2 font-medium">{txn.description}</td>
                        <td className="py-3 px-2">
                          <Badge className={txn.type === "deposit" ? "bg-accent/20 text-accent border-accent/30" : "bg-secondary/20 text-secondary border-secondary/30"}>
                            {txn.type === "deposit" ? <ArrowUpRight className="w-3 h-3 mr-1" /> : <ArrowDownRight className="w-3 h-3 mr-1" />}
                            {txn.type}
                          </Badge>
                        </td>
                        <td className={`py-3 px-2 text-right font-display font-semibold ${txn.type === "deposit" ? "text-accent" : "text-secondary"}`}>
                          {txn.type === "deposit" ? "+" : "-"}{formatCurrency(txn.amount)}
                        </td>
                        <td className="py-3 px-2 text-right font-medium">{formatCurrency(txn.balance)}</td>
                        <td className="py-3 px-2 text-right text-muted-foreground font-mono text-sm">{txn.referenceNo}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Add Bank Modal */}
      <AddBankAccount open={addBankOpen} onOpenChange={setAddBankOpen} />
    </div>
  );
}
