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
import { Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { financeApi, type MfsAccountResponse } from "@/lib/api/finance";

interface EditMfsAccountProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mfs: MfsAccountResponse | null;
  onSuccess?: () => void;
}

export function EditMfsAccount({ open, onOpenChange, mfs, onSuccess }: EditMfsAccountProps) {
  const [accountNumber, setAccountNumber] = useState("");
  const [accountName, setAccountName] = useState("");
  const [isActive, setIsActive] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Load MFS data when modal opens
  useEffect(() => {
    if (mfs && open) {
      setAccountNumber(mfs.account_number);
      setAccountName(mfs.account_name || "");
      setIsActive(mfs.is_active);
    }
  }, [mfs, open]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!mfs) return;

    // Validation
    if (!accountNumber.trim()) {
      toast({
        title: "Account Number Required",
        description: "Please enter the account number",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      const mfsData = {
        account_number: accountNumber.trim(),
        account_name: accountName.trim() || undefined,
        is_active: isActive,
      };

      await financeApi.updateMfsAccount(mfs.id, mfsData);

      toast({
        title: "MFS Account Updated",
        description: `Successfully updated ${mfs.provider.toUpperCase()} account`,
      });

      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Failed to Update MFS Account",
        description: error?.message || "An error occurred. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!mfs) return null;

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
            Edit {getProviderLabel(mfs.provider)} Account
          </DialogTitle>
          <p className="text-sm text-muted-foreground mt-2">
            Update MFS account details. Provider cannot be changed.
          </p>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Provider (Read-only) */}
          <div className="space-y-2">
            <Label>Provider</Label>
            <Input
              value={getProviderLabel(mfs.provider)}
              disabled
              className="bg-muted/30"
            />
            <p className="text-xs text-muted-foreground">Provider cannot be changed</p>
          </div>

          {/* Account Number */}
          <div className="space-y-2">
            <Label htmlFor="accountNumber">Phone Number / Account Number *</Label>
            <Input
              id="accountNumber"
              placeholder="e.g., 01712345678"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              className="bg-muted/50 font-mono"
            />
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
              {isSubmitting ? "Saving..." : "Update MFS Account"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

