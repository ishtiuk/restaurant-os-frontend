import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { suppliers } from "@/data/mockData";
import { Plus, Search, Phone, Mail, MapPin, Wallet } from "lucide-react";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

export default function Suppliers() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Suppliers</h1>
          <p className="text-muted-foreground">সরবরাহকারী ম্যানেজমেন্ট • Vendor Management</p>
        </div>
        <Button variant="glow">
          <Plus className="w-4 h-4 mr-2" />
          Add Supplier
        </Button>
      </div>

      {/* Search */}
      <GlassCard className="p-4 animate-fade-in stagger-1">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder="Search suppliers..." className="pl-10 bg-muted/50" />
        </div>
      </GlassCard>

      {/* Suppliers Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {suppliers.map((supplier, index) => (
          <GlassCard
            key={supplier.id}
            hover
            glow="secondary"
            className="p-5 animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="font-semibold text-lg">{supplier.name}</h3>
                <p className="text-sm text-muted-foreground">Since {supplier.createdAt}</p>
              </div>
              {supplier.dueBalance > 0 ? (
                <Badge variant="warning">Due: {formatCurrency(supplier.dueBalance)}</Badge>
              ) : (
                <Badge variant="success">Paid</Badge>
              )}
            </div>

            <div className="space-y-2 text-sm">
              <div className="flex items-center gap-2 text-muted-foreground">
                <Phone className="w-4 h-4" />
                <span>{supplier.phone}</span>
              </div>
              {supplier.email && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Mail className="w-4 h-4" />
                  <span>{supplier.email}</span>
                </div>
              )}
              {supplier.address && (
                <div className="flex items-center gap-2 text-muted-foreground">
                  <MapPin className="w-4 h-4" />
                  <span>{supplier.address}</span>
                </div>
              )}
            </div>

            <div className="flex gap-2 mt-4 pt-4 border-t border-border">
              <Button variant="outline" size="sm" className="flex-1">
                View History
              </Button>
              <Button variant="glass" size="sm" className="flex-1">
                New Order
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>
    </div>
  );
}
