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
import { Receipt, Wallet, CreditCard, Building2, Smartphone } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { financeApi } from "@/lib/api/finance";
import { useTimezone } from "@/contexts/TimezoneContext";
import { getDateOnly, getStartOfDay } from "@/utils/date";
import { format } from "date-fns";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const expenseCategories = [
  { id: "rent", name: "Rent", nameBn: "ভাড়া" },
  { id: "utilities", name: "Utilities", nameBn: "ইউটিলিটি" },
  { id: "salaries", name: "Salaries", nameBn: "বেতন" },
  { id: "supplies", name: "Supplies", nameBn: "সরবরাহ" },
  { id: "marketing", name: "Marketing", nameBn: "মার্কেটিং" },
  { id: "maintenance", name: "Maintenance", nameBn: "রক্ষণাবেক্ষণ" },
  { id: "other", name: "Other", nameBn: "অন্যান্য" },
];

const paymentMethods = [
  { id: "cash", name: "Cash", nameBn: "নগদ", icon: Wallet },
  { id: "card", name: "Card", nameBn: "কার্ড", icon: CreditCard },
  { id: "bank_transfer", name: "Bank Transfer", nameBn: "ব্যাংক ট্রান্সফার", icon: Building2 },
  { id: "online", name: "Online", nameBn: "অনলাইন", icon: Smartphone },
];

interface AddExpenseProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  banks: Array<{ id: string; name: string; balance: number }>;
  onSuccess?: () => void;
}

export function AddExpense({ open, onOpenChange, banks, onSuccess }: AddExpenseProps) {
  const { timezone } = useTimezone();
  const [category, setCategory] = useState("");
  const [amount, setAmount] = useState("");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [bankAccountId, setBankAccountId] = useState("");
  const [date, setDate] = useState(getDateOnly(new Date(), timezone));
  const [description, setDescription] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const expenseAmount = parseFloat(amount);

    // Validation
    if (!category) {
      toast({
        title: "Category Required",
        description: "Please select an expense category",
        variant: "destructive",
      });
      return;
    }

    if (!expenseAmount || expenseAmount <= 0) {
      toast({
        title: "Invalid Amount",
        description: "Please enter a valid amount greater than 0",
        variant: "destructive",
      });
      return;
    }

    if (!paymentMethod) {
      toast({
        title: "Payment Method Required",
        description: "Please select a payment method",
        variant: "destructive",
      });
      return;
    }

    if (paymentMethod === "bank_transfer" && !bankAccountId) {
      toast({
        title: "Bank Account Required",
        description: "Please select a bank account for bank transfer",
        variant: "destructive",
      });
      return;
    }

    if (!date) {
      toast({
        title: "Date Required",
        description: "Please select a date",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);

    try {
      // Convert user's selected date to UTC for API
      let dateForApi: string | undefined;
      if (date) {
        const userDate = new Date(date + "T12:00:00"); // Use noon to avoid DST issues
        const utcDate = getStartOfDay(userDate, timezone);
        dateForApi = format(utcDate, "yyyy-MM-dd");
      }

      const expenseData = {
        category,
        amount: expenseAmount,
        payment_method: paymentMethod,
        bank_account_id: paymentMethod === "bank_transfer" ? bankAccountId : undefined,
        date: dateForApi,
        description: description || undefined,
      };

      await financeApi.createExpense(expenseData);

      toast({
        title: "Expense Added",
        description: `Successfully recorded expense of ${formatCurrency(expenseAmount)}`,
      });

      // Reset form and close
      setCategory("");
      setAmount("");
      setPaymentMethod("");
      setBankAccountId("");
      setDate(getDateOnly(new Date(), timezone));
      setDescription("");
      onOpenChange(false);
      onSuccess?.();
    } catch (error: any) {
      toast({
        title: "Failed to Add Expense",
        description: error?.message || "An error occurred. Please try again.",
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
            <Receipt className="w-5 h-5 text-secondary" />
            Add Expense
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Category */}
          <div className="space-y-2">
            <Label htmlFor="category">Category *</Label>
            <Select value={category} onValueChange={setCategory}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {expenseCategories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name} ({cat.nameBn})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
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
            />
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method *</Label>
            <div className="grid grid-cols-2 gap-2">
              {paymentMethods.map((method) => {
                const Icon = method.icon;
                return (
                  <Button
                    key={method.id}
                    type="button"
                    variant={paymentMethod === method.id ? "default" : "outline"}
                    className={`h-auto py-3 ${paymentMethod === method.id ? "ring-2 ring-primary" : ""}`}
                    onClick={() => setPaymentMethod(method.id)}
                  >
                    <div className="flex flex-col items-center gap-1">
                      <Icon className="w-5 h-5" />
                      <span className="text-xs">{method.name}</span>
                    </div>
                  </Button>
                );
              })}
            </div>
          </div>

          {/* Bank Account (conditional) */}
          {paymentMethod === "bank_transfer" && (
            <div className="space-y-2">
              <Label htmlFor="bank">Bank Account *</Label>
              <Select value={bankAccountId} onValueChange={setBankAccountId}>
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
            </div>
          )}

          {/* Date */}
          <div className="space-y-2">
            <Label htmlFor="date">Date *</Label>
            <Input
              id="date"
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className="bg-muted/50"
            />
          </div>

          {/* Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Description/Notes (Optional)</Label>
            <Textarea
              id="description"
              placeholder="Enter description..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
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
              {isSubmitting ? "Saving..." : "Add Expense"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}
