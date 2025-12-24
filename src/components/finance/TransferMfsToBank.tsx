import React, { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Smartphone, Building2, ArrowRight } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { financeApi } from "@/lib/api/finance";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

interface TransferMfsToBankProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mfsAccounts: Array<{ id: string; provider: string; account_number: string; balance: number }>;
  banks: Array<{ id: string; name: string; balance: number }>;
  onSuccess?: () => void;
}

export function TransferMfsToBank({
  open,
  onOpenChange,
  mfsAccounts,
  banks,
  onSuccess,
}: TransferMfsToBankProps) {
  const [selectedMfs, setSelectedMfs] = useState("");
  const [selectedBank, setSelectedBank] = useState("");
  const [amount, setAmount] = useState("");
  const [reference, setReference] = useState("");
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const transferAmount = parseFloat(amount);

    // Validation
    if (!selectedMfs) {
      toast({
        title: "MFS Account Required",
        description: "Please select an MFS account",
        variant: "destructive",
      });
      return;
    }

    if (!selectedBank) {
      toast({
        title: "Bank Account Required",
        description: "Please select a bank account",
        variant: "destructive",
      });
      return;
    }

    if (!transferAmount || transferAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    const selectedMfsData = mfsAccounts.find((m) => m.id === selectedMfs);
    if (selectedMfsData && transferAmount > selectedMfsData.balance) {
      toast({
        title: "Insufficient Balance",
        description: `Transfer amount cannot exceed MFS balance (${formatCurrency(selectedMfsData.balance)})`,
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const transferData = {
        from_mfs_id: selectedMfs,
        to_bank_id: selectedBank,
        amount: transferAmount,
        reference: reference || undefined,
        notes: notes || undefined,
      };

      await financeApi.createMfsTransfer(transferData);

      toast({
        title: "Transfer Initiated",
        description: `Successfully initiated transfer of ${formatCurrency(transferAmount)} from MFS to bank`,
      });

      // Reset form and close
      setSelectedMfs("");
      setSelectedBank("");
      setAmount("");
      setReference("");
      setNotes("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Transfer Failed",
        description: error?.response?.data?.detail || error?.message || "Failed to initiate transfer. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const selectedMfsData = mfsAccounts.find((m) => m.id === selectedMfs);
  const selectedBankData = banks.find((b) => b.id === selectedBank);

  const getProviderLabel = (provider: string) => {
    switch (provider.toLowerCase()) {
      case "bkash": return "bKash";
      case "nagad": return "Nagad";
      case "rocket": return "Rocket";
      default: return provider.toUpperCase();
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Smartphone className="w-5 h-5 text-teal-400" />
            Transfer MFS to Bank
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* From - MFS */}
          <div className="space-y-2">
            <Label>From MFS Account *</Label>
            <Select value={selectedMfs} onValueChange={setSelectedMfs}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select MFS account" />
              </SelectTrigger>
              <SelectContent>
                {mfsAccounts.map((mfs) => (
                  <SelectItem key={mfs.id} value={mfs.id}>
                    <div className="flex items-center gap-2">
                      <Smartphone className="w-4 h-4 text-teal-400" />
                      {getProviderLabel(mfs.provider)} - {mfs.account_number} ({formatCurrency(mfs.balance)})
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedMfsData && (
              <div className="p-4 rounded-lg bg-teal-500/10 border border-teal-500/20">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 rounded-lg bg-teal-500/20 flex items-center justify-center">
                      <Smartphone className="w-5 h-5 text-teal-400" />
                    </div>
                    <div>
                      <p className="font-medium">{getProviderLabel(selectedMfsData.provider)}</p>
                      <p className="text-sm text-muted-foreground">{selectedMfsData.account_number}</p>
                    </div>
                  </div>
                  <p className="text-xl font-display font-bold text-teal-400">{formatCurrency(selectedMfsData.balance)}</p>
                </div>
              </div>
            )}
          </div>

          {/* Arrow */}
          <div className="flex justify-center">
            <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
              <ArrowRight className="w-5 h-5 text-muted-foreground rotate-90" />
            </div>
          </div>

          {/* To - Bank Selection */}
          <div className="space-y-2">
            <Label htmlFor="bank">To Bank Account *</Label>
            <Select value={selectedBank} onValueChange={setSelectedBank}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select bank account" />
              </SelectTrigger>
              <SelectContent>
                {banks.map((bank) => (
                  <SelectItem key={bank.id} value={bank.id}>
                    <div className="flex items-center gap-2">
                      <Building2 className="w-4 h-4 text-purple-400" />
                      {bank.name} - {formatCurrency(bank.balance)}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {selectedBankData && (
              <p className="text-sm text-muted-foreground">
                Current balance: {formatCurrency(selectedBankData.balance)}
              </p>
            )}
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount (৳) *</Label>
            <Input
              id="amount"
              type="number"
              placeholder="Enter amount"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              className="bg-muted/50"
              min="1"
              max={selectedMfsData?.balance || undefined}
            />
            {selectedMfsData && (
              <p className="text-xs text-muted-foreground">
                Maximum: {formatCurrency(selectedMfsData.balance)}
              </p>
            )}
          </div>

          {/* Reference */}
          <div className="space-y-2">
            <Label htmlFor="reference">Reference (Optional)</Label>
            <Input
              id="reference"
              placeholder="e.g., Daily transfer"
              value={reference}
              onChange={(e) => setReference(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label htmlFor="notes">Notes (Optional)</Label>
            <Textarea
              id="notes"
              placeholder="Additional notes..."
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              className="bg-muted/50"
              rows={2}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
            >
              Cancel
            </Button>
            <Button type="submit" variant="glow" disabled={isSubmitting}>
              {isSubmitting ? "Processing..." : "Transfer"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

