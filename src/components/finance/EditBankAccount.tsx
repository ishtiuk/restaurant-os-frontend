import React, { useState, useEffect } from "react";
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { financeApi, type BankAccountResponse } from "@/lib/api/finance";

interface EditBankAccountProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  bank: BankAccountResponse | null;
  onSuccess?: () => void;
}

export function EditBankAccount({ open, onOpenChange, bank, onSuccess }: EditBankAccountProps) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("");
  const [branch, setBranch] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load bank data when modal opens
  useEffect(() => {
    if (bank && open) {
      setBankName(bank.name);
      setAccountNumber(bank.account_number);
      setAccountType(bank.account_type);
      setBranch(bank.branch || "");
      setIsActive(bank.is_active);
    }
  }, [bank, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!bank) return;

    // Validation
    if (!bankName.trim()) {
      toast({
        title: "Bank Name Required",
        description: "Please enter the bank name",
        variant: "destructive",
      });
      return;
    }

    if (!accountNumber.trim()) {
      toast({
        title: "Account Number Required",
        description: "Please enter the account number",
        variant: "destructive",
      });
      return;
    }

    if (!accountType) {
      toast({
        title: "Account Type Required",
        description: "Please select an account type",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const bankData = {
        name: bankName.trim(),
        account_number: accountNumber.trim(),
        account_type: accountType as "current" | "savings",
        branch: branch.trim() || undefined,
        is_active: isActive,
      };

      await financeApi.updateBankAccount(bank.id, bankData);

      toast({
        title: "Bank Account Updated",
        description: `Successfully updated ${bankName}`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Failed to Update Bank Account",
        description: error?.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!bank) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Edit Bank Account
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Bank Name */}
          <div className="space-y-2">
            <Label htmlFor="bankName">Bank Name *</Label>
            <Input
              id="bankName"
              placeholder="e.g., Sonali Bank"
              value={bankName}
              onChange={(e) => setBankName(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="e.g., 1234567890"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="bg-muted/50 font-mono"
            />
          </div>

          {/* Account Type */}
          <div className="space-y-2">
            <Label htmlFor="accountType">Account Type *</Label>
            <Select value={accountType} onValueChange={setAccountType}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select account type" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="current">Current Account (চলতি)</SelectItem>
                <SelectItem value="savings">Savings Account (সঞ্চয়ী)</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Branch */}
          <div className="space-y-2">
            <Label htmlFor="branch">Branch Name (Optional)</Label>
            <Input
              id="branch"
              placeholder="e.g., Dhanmondi"
              value={branch}
              onChange={(e) => setBranch(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Active Status */}
          <div className="space-y-2">
            <Label htmlFor="isActive">Status</Label>
            <Select value={isActive ? "active" : "inactive"} onValueChange={(value) => setIsActive(value === "active")}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
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
              {isSubmitting ? "Saving..." : "Update Bank Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

