import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { customers } from "@/data/mockData";
import { Plus, Search, Phone, Mail, Star, ShoppingBag } from "lucide-react";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate } from "@/utils/date";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export default function Customers() {
  const { timezone } = useTimezone();
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Customers</h1>
          <p className="text-muted-foreground">গ্রাহক ম্যানেজমেন্ট • Customer Management</p>
        </div>
        <Button variant="glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Customer
        </Button>
      </div>

      {/* Search */}
      <GlassCard className="p-4 animate-fade-in stagger-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search customers..." className="pl-10 bg-muted/50" />
        </div>
      </GlassCard>

      {/* Customers Table */}
      <GlassCard className="overflow-hidden animate-fade-in stagger-2">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-border bg-muted/30">
                <th className="text-left p-4 font-medium">Customer</th>
                <th className="text-left p-4 font-medium">Contact</th>
                <th className="text-right p-4 font-medium">Total Purchases</th>
                <th className="text-center p-4 font-medium">Loyalty Points</th>
                <th className="text-right p-4 font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr key={customer.id} className="border-b border-border/50 table-row-hover">
                  <td className="p-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold">
                        {customer.name.charAt(0)}
                      </div>
                      <div>
                        <p className="font-medium">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">Since {formatDate(customer.createdAt, timezone)}</p>
                      </div>
                    </div>
                  </td>
                  <td className="p-4">
                    <div className="space-y-1">
                      <div className="flex items-center gap-2 text-sm">
                        <Phone className="w-3 h-3 text-muted-foreground" />
                        <span>{customer.phone}</span>
                      </div>
                      {customer.email && (
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Mail className="w-3 h-3" />
                          <span>{customer.email}</span>
                        </div>
                      )}
                    </div>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2">
                      <ShoppingBag className="w-4 h-4 text-muted-foreground" />
                      <span className="font-medium">{formatCurrency(customer.totalPurchases)}</span>
                    </div>
                  </td>
                  <td className="p-4 text-center">
                    <Badge variant="glass" className="gap-1">
                      <Star className="w-3 h-3 text-primary" />
                      {customer.loyaltyPoints} pts
                    </Badge>
                  </td>
                  <td className="p-4 text-right">
                    <Button variant="ghost" size="sm">View History</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </GlassCard>
    </div>
  );
}
