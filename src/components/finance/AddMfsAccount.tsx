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
import { Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { financeApi } from "@/lib/api/finance";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

interface AddMfsAccountProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSuccess?: () => void;
}

export function AddMfsAccount({ open, onOpenChange, onSuccess }: AddMfsAccountProps) {
  const [provider, setProvider] = useState("");
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [openingBalance, setOpeningBalance] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Validation
    if (!provider) {
      toast({
        title: "Provider Required",
        description: "Please select an MFS provider",
        variant: "destructive",
      });
      return;
    }

    if (!accountNumber.trim()) {
      toast({
        title: "Account Number Required",
        description: "Please enter the phone number or account number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const mfsData = {
        provider: provider as "bkash" | "nagad" | "rocket",
        account_number: accountNumber.trim(),
        account_name: accountName.trim() || undefined,
        opening_balance: parseFloat(openingBalance) || 0,
      };

      await financeApi.createMfsAccount(mfsData);

      toast({
        title: "MFS Account Added",
        description: `Successfully added ${provider.toUpperCase()} account`,
      });

      // Reset form and close
      setProvider("");
      setAccountNumber("");
      setAccountName("");
      setOpeningBalance("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Failed to Add MFS Account",
        description: error?.response?.data?.detail || error?.message || "An error occurred. Please try again.",
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
            <Smartphone className="w-5 h-5 text-teal-400" />
            Add MFS Account
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Add a Mobile Financial Services (MFS) account for bKash, Nagad, or Rocket.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider */}
          <div className="space-y-2">
            <Label htmlFor="provider">MFS Provider *</Label>
            <Select value={provider} onValueChange={setProvider}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select provider" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bkash">bKash</SelectItem>
                <SelectItem value="nagad">Nagad</SelectItem>
                <SelectItem value="rocket">Rocket</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Account Number (Phone Number) */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Phone Number / Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="e.g., 01712345678"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="bg-muted/50 font-mono"
            />
            <p className="text-xs text-muted-foreground">
              Enter the phone number or account number for this MFS account
            </p>
          </div>

          {/* Account Name */}
          <div className="space-y-2">
            <Label htmlFor="accountName">Account Holder Name (Optional)</Label>
            <Input
              id="accountName"
              placeholder="e.g., Restaurant Name"
              value={accountName}
              onChange={(e) => setAccountName(e.target.value)}
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
              {isSubmitting ? "Saving..." : "Add MFS Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

