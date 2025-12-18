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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Building2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

interface AddBankAccountProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function AddBankAccount({ open, onOpenChange }: AddBankAccountProps) {
  const [bankName, setBankName] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountType, setAccountType] = useState("");
  const [branch, setBranch] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

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

    // Placeholder API call
    try {
      // Simulate API delay
      await new Promise((resolve) => setTimeout(resolve, 1000));

      const bankData = {
        name: bankName.trim(),
        accountNumber: accountNumber.trim(),
        accountType,
        branch: branch.trim() || undefined,
        openingBalance: parseFloat(openingBalance) || 0,
      };

      console.log("Bank account created:", bankData);

      toast({
        title: "Bank Account Added",
        description: `Successfully added ${bankName}`,
      });

      // Reset form and close
      setBankName("");
      setAccountNumber("");
      setAccountType("");
      setBranch("");
      setOpeningBalance("");
      onOpenChange(false);
    } catch (error) {
      toast({
        title: "Failed to Add Bank Account",
        description: "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="glass-card max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Building2 className="w-5 h-5 text-purple-400" />
            Add Bank Account
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

          {/* Opening Balance */}
          <div className="space-y-2">
            <Label htmlFor="openingBalance">Opening Balance (৳)</Label>
            <Input
              id="openingBalance"
              type="number"
              placeholder="0"
              value={openingBalance}
              onChange={(e) => setOpeningBalance(e.target.value)}
              className="bg-muted/50"
              min="0"
            />
            {openingBalance && parseFloat(openingBalance) > 0 && (
              <p className="text-sm text-muted-foreground">
                Opening balance: {formatCurrency(parseFloat(openingBalance))}
              </p>
            )}
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
              {isSubmitting ? "Saving..." : "Add Bank Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
