import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Staff, StaffPayment } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import {
  Plus,
  Search,
  Phone,
  Mail,
  Calendar,
  Wallet,
  TrendingUp,
  TrendingDown,
  Clock,
  User,
  Eye,
  ChefHat,
  Truck,
  HandCoins,
} from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "@/hooks/use-toast";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

const getRoleIcon = (role: Staff["role"]) => {
  switch (role) {
    case "chef":
      return <ChefHat className="w-4 h-4" />;
    case "delivery":
      return <Truck className="w-4 h-4" />;
    case "manager":
      return <User className="w-4 h-4" />;
    default:
      return <User className="w-4 h-4" />;
  }
};

const getRoleBadge = (role: Staff["role"]) => {
  const colors: Record<string, string> = {
    chef: "bg-primary/20 text-primary",
    waiter: "bg-accent/20 text-accent",
    cashier: "bg-secondary/20 text-secondary",
    cleaner: "bg-muted text-muted-foreground",
    manager: "bg-primary/30 text-primary",
    delivery: "bg-accent/30 text-accent",
  };
  return (
    <Badge className={`${colors[role] || "bg-muted text-muted-foreground"} border-0`}>
      {getRoleIcon(role)}
      <span className="ml-1 capitalize">{role}</span>
    </Badge>
  );
};

export default function StaffPage() {
  const { staff, staffPayments, attendance, createStaffPayment, createStaff } = useAppData();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    type: "salary",
    description: "",
  });
  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    role: "waiter",
    salary: "20000",
    email: "",
    address: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.role.includes(searchQuery.toLowerCase())
  );

  const totalSalaryDue = staff.reduce((sum, s) => sum + s.salary, 0);
  const totalPaid = staffPayments
    .filter((p) => p.type === "salary" || p.type === "bonus")
    .reduce((sum, p) => sum + p.amount, 0);
  const totalAdvances = staffPayments.filter((p) => p.type === "advance").reduce((sum, p) => sum + p.amount, 0);

  const getStaffPayments = (staffId: string) => staffPayments.filter((p) => p.staffId === staffId);
  const getStaffAttendance = (staffId: string) => attendance.filter((a) => a.staffId === staffId);

  const calculateBalance = (staff: Staff) => {
    const payments = getStaffPayments(staff.id);
    const totalPaid = payments.filter((p) => p.type === "salary" || p.type === "bonus").reduce((sum, p) => sum + p.amount, 0);
    const advances = payments.filter((p) => p.type === "advance").reduce((sum, p) => sum + p.amount, 0);
    const deductions = payments.filter((p) => p.type === "deduction").reduce((sum, p) => sum + p.amount, 0);
    return staff.salary - totalPaid + advances - deductions;
  };

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowDetailDialog(true);
  };

  const handleOpenPay = (staff: Staff) => {
    setSelectedStaff(staff);
    setPaymentForm({ amount: "", type: "salary", description: "" });
    setShowPaymentDialog(true);
  };

  const handleCreatePayment = async () => {
    if (!selectedStaff) return;
    const amount = parseFloat(paymentForm.amount);
    if (!amount || amount <= 0) {
      toast({ title: "Enter amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await createStaffPayment({
      staffId: selectedStaff.id,
      amount,
      type: paymentForm.type as StaffPayment["type"],
      description: paymentForm.description || paymentForm.type,
      date: new Date().toISOString().slice(0, 10),
    });
    setSubmitting(false);
    setShowPaymentDialog(false);
    toast({ title: "Payment recorded" });
  };

  const handleCreateStaff = async () => {
    if (!staffForm.name || !staffForm.phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    await createStaff({
      name: staffForm.name,
      phone: staffForm.phone,
      role: staffForm.role as Staff["role"],
      salary: Number(staffForm.salary) || 0,
      joiningDate: new Date().toISOString().slice(0, 10),
      isActive: true,
      email: staffForm.email || undefined,
      address: staffForm.address || undefined,
    });
    setSubmitting(false);
    setShowAddDialog(false);
    setStaffForm({ name: "", phone: "", role: "waiter", salary: "20000", email: "", address: "" });
    toast({ title: "Staff added" });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Staff Management</h1>
          <p className="text-muted-foreground">কর্মী ব্যবস্থাপনা • Employees & Salaries</p>
        </div>
        <Button variant="glow" onClick={() => setShowAddDialog(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Add Staff
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 animate-fade-in stagger-1">
        <GlassCard className="p-4">
          <p className="text-sm text-muted-foreground">Total Staff</p>
          <p className="text-2xl font-display font-bold">{staff.length}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="primary">
          <p className="text-sm text-muted-foreground">Monthly Salary</p>
          <p className="text-2xl font-display font-bold text-primary">{formatCurrency(totalSalaryDue)}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="accent">
          <p className="text-sm text-muted-foreground">Paid This Month</p>
          <p className="text-2xl font-display font-bold text-accent">{formatCurrency(totalPaid)}</p>
        </GlassCard>
        <GlassCard className="p-4" glow="secondary">
          <p className="text-sm text-muted-foreground">Advances</p>
          <p className="text-2xl font-display font-bold text-secondary">{formatCurrency(totalAdvances)}</p>
        </GlassCard>
      </div>

      {/* Search */}
      <GlassCard className="p-4 animate-fade-in stagger-2">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Search staff by name, phone, or role..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-10 bg-muted/50"
          />
        </div>
      </GlassCard>

      {/* Staff Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in stagger-3">
        {filteredStaff.map((staff) => {
          const balance = calculateBalance(staff);
          const attendance = getStaffAttendance(staff.id);
          const presentDays = attendance.filter((a) => a.status === "present").length;

          return (
            <GlassCard key={staff.id} hover className="p-5">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-3">
                  <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg">
                    {staff.name.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-semibold">{staff.name}</h3>
                    {staff.nameBn && <p className="text-sm text-muted-foreground">{staff.nameBn}</p>}
                  </div>
                </div>
                {getRoleBadge(staff.role)}
              </div>

              <div className="space-y-2 text-sm mb-4">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Phone className="w-4 h-4" />
                  <span>{staff.phone}</span>
                </div>
                {staff.email && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Mail className="w-4 h-4" />
                    <span>{staff.email}</span>
                  </div>
                )}
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Calendar className="w-4 h-4" />
                  <span>Joined {staff.joiningDate}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-semibold">{formatCurrency(staff.salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={`font-semibold ${balance > 0 ? "text-destructive" : "text-accent"}`}>
                    {balance > 0 ? `Due: ${formatCurrency(balance)}` : "Paid"}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Attendance</span>
                  <span className="font-semibold">{presentDays} days</span>
                </div>
              </div>

              <div className="flex gap-2 mt-4">
                <Button variant="outline" size="sm" className="flex-1" onClick={() => handleViewStaff(staff)}>
                  <Eye className="w-4 h-4 mr-1" />
                  Details
                </Button>
                <Button variant="glass" size="sm" className="flex-1" onClick={() => handleOpenPay(staff)}>
                  <HandCoins className="w-4 h-4 mr-1" />
                  Pay
                </Button>
              </div>
            </GlassCard>
          );
        })}
      </div>

      {/* Staff Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">{selectedStaff?.name}</DialogTitle>
            <DialogDescription>{selectedStaff?.nameBn}</DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <Tabs defaultValue="payments" className="mt-4">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                <TabsTrigger value="attendance">Attendance</TabsTrigger>
              </TabsList>

              <TabsContent value="payments" className="mt-4">
                <div className="space-y-3 max-h-[400px] overflow-auto custom-scrollbar">
                  {getStaffPayments(selectedStaff.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No payment records</p>
                    </div>
                  ) : (
                    getStaffPayments(selectedStaff.id).map((payment) => (
                      <div key={payment.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div
                            className={`w-10 h-10 rounded-lg flex items-center justify-center ${
                              payment.type === "salary" || payment.type === "bonus"
                                ? "bg-accent/20"
                                : payment.type === "advance"
                                ? "bg-primary/20"
                                : "bg-destructive/20"
                            }`}
                          >
                            {payment.type === "deduction" ? (
                              <TrendingDown className="w-5 h-5 text-destructive" />
                            ) : (
                              <TrendingUp className="w-5 h-5 text-accent" />
                            )}
                          </div>
                          <div>
                            <p className="font-medium capitalize">{payment.type}</p>
                            <p className="text-sm text-muted-foreground">{payment.description}</p>
                            <p className="text-xs text-muted-foreground">{payment.date}</p>
                          </div>
                        </div>
                        <span
                          className={`font-display font-semibold ${
                            payment.type === "deduction" ? "text-destructive" : "text-accent"
                          }`}
                        >
                          {payment.type === "deduction" ? "-" : "+"}
                          {formatCurrency(payment.amount)}
                        </span>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>

              <TabsContent value="attendance" className="mt-4">
                <div className="space-y-2 max-h-[400px] overflow-auto custom-scrollbar">
                  {getStaffAttendance(selectedStaff.id).length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Clock className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No attendance records</p>
                    </div>
                  ) : (
                    getStaffAttendance(selectedStaff.id).map((record) => (
                      <div key={record.id} className="flex items-center justify-between p-3 rounded-lg bg-muted/30">
                        <div className="flex items-center gap-3">
                          <div className="text-sm text-muted-foreground">{record.date}</div>
                          <Badge
                            variant={
                              record.status === "present"
                                ? "success"
                                : record.status === "absent"
                                ? "danger"
                                : "warning"
                            }
                          >
                            {record.status}
                          </Badge>
                        </div>
                        <div className="text-sm text-muted-foreground">
                          {record.checkIn && record.checkOut && `${record.checkIn} - ${record.checkOut}`}
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </TabsContent>
            </Tabs>
          )}
        </DialogContent>
      </Dialog>

      {/* Payment Dialog */}
      <Dialog open={showPaymentDialog} onOpenChange={setShowPaymentDialog}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Pay {selectedStaff?.name}</DialogTitle>
            <DialogDescription>Record a salary/advance/bonus/deduction</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Type</Label>
              <Select value={paymentForm.type} onValueChange={(v) => setPaymentForm((f) => ({ ...f, type: v }))}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="salary">Salary</SelectItem>
                  <SelectItem value="advance">Advance</SelectItem>
                  <SelectItem value="bonus">Bonus</SelectItem>
                  <SelectItem value="deduction">Deduction</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Amount</Label>
              <Input
                type="number"
                value={paymentForm.amount}
                onChange={(e) => setPaymentForm((f) => ({ ...f, amount: e.target.value }))}
                placeholder="0.00"
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1">
              <Label>Description</Label>
              <Input
                value={paymentForm.description}
                onChange={(e) => setPaymentForm((f) => ({ ...f, description: e.target.value }))}
                placeholder="Optional note"
                className="bg-muted/50"
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowPaymentDialog(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleCreatePayment} disabled={submitting || !selectedStaff}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Add Staff Dialog */}
      <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Add Staff</DialogTitle>
            <DialogDescription>Frontend-only staff record</DialogDescription>
          </DialogHeader>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={staffForm.name} onChange={(e) => setStaffForm((f) => ({ ...f, name: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Phone</Label>
              <Input value={staffForm.phone} onChange={(e) => setStaffForm((f) => ({ ...f, phone: e.target.value }))} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select value={staffForm.role} onValueChange={(v) => setStaffForm((f) => ({ ...f, role: v }))}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="chef">Chef</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="cleaner">Cleaner</SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="delivery">Delivery</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Salary</Label>
              <Input
                type="number"
                value={staffForm.salary}
                onChange={(e) => setStaffForm((f) => ({ ...f, salary: e.target.value }))}
                className="bg-muted/50"
              />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Email</Label>
              <Input value={staffForm.email} onChange={(e) => setStaffForm((f) => ({ ...f, email: e.target.value }))} />
            </div>
            <div className="space-y-1 md:col-span-2">
              <Label>Address</Label>
              <Input value={staffForm.address} onChange={(e) => setStaffForm((f) => ({ ...f, address: e.target.value }))} />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowAddDialog(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleCreateStaff} disabled={submitting}>
              {submitting ? "Saving..." : "Save"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
