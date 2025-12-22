import React, { useState, useEffect } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Staff, StaffPayment } from "@/types";
import { useAppData } from "@/contexts/AppDataContext";
import { staffApi } from "@/lib/api/staff";
import {
  Pagination,
  PaginationContent,
  PaginationItem,
  PaginationLink,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
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
  Edit,
  Trash2,
  MoreVertical,
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
import { Switch } from "@/components/ui/switch";
import { toast } from "@/hooks/use-toast";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate, getDateOnly } from "@/utils/date";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

const formatCurrency = (amount: number) => `৳${amount.toLocaleString("bn-BD")}`;

// Convert English digits to Bengali numerals
const toBengaliNumeral = (num: number | string): string => {
  const bengaliDigits = ["০", "১", "২", "৩", "৪", "৫", "৬", "৭", "৮", "৯"];
  return String(num)
    .split("")
    .map((digit) => {
      const parsed = parseInt(digit, 10);
      return !isNaN(parsed) && parsed >= 0 && parsed <= 9 ? bengaliDigits[parsed] : digit;
    })
    .join("");
};

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
  // TODO: Re-enable attendance when backend is implemented
  // const { staff, staffPayments, attendance, createStaffPayment, createStaff } = useAppData();
  const { staff, staffPayments, createStaffPayment, createStaff, updateStaff, deleteStaff } = useAppData();
  const { timezone } = useTimezone();
  // eslint-disable-next-line @typescript-eslint/no-unused-vars
  const attendance: never[] = []; // Placeholder - attendance not implemented yet
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedStaff, setSelectedStaff] = useState<Staff | null>(null);
  const [showDetailDialog, setShowDetailDialog] = useState(false);
  const [showPaymentDialog, setShowPaymentDialog] = useState(false);
  const [showAddDialog, setShowAddDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [staffToDelete, setStaffToDelete] = useState<Staff | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [paymentForm, setPaymentForm] = useState({
    amount: "",
    type: "salary",
    payment_method: "cash" as "cash" | "bank_transfer" | "check" | "online" | undefined,
    description: "",
  });
  const [staffForm, setStaffForm] = useState({
    name: "",
    phone: "",
    role: "waiter",
    salary: "20000",
    email: "",
    address: "",
    isActive: true,
  });
  const [submitting, setSubmitting] = useState(false);
  const [staffPaymentPage, setStaffPaymentPage] = useState(1);
  const [staffPaymentPageSize] = useState(10);
  const [staffPaymentTotal, setStaffPaymentTotal] = useState(0);
  const [currentStaffPayments, setCurrentStaffPayments] = useState<StaffPayment[]>([]);

  // Set loading to false once data is loaded
  useEffect(() => {
    // Data is loaded when staff array is populated (even if empty)
    if (staff !== undefined) {
      setLoading(false);
    }
  }, [staff]);

  // Load staff payments with pagination when viewing a staff member
  useEffect(() => {
    const loadStaffPayments = async () => {
      if (!selectedStaff) {
        setCurrentStaffPayments([]);
        return;
      }
      try {
        const offset = (staffPaymentPage - 1) * staffPaymentPageSize;
        const paymentsData = await staffApi.listPayments({
          staff_id: selectedStaff.id,
          limit: staffPaymentPageSize,
          offset: offset,
        });
        const mappedPayments: StaffPayment[] = paymentsData.map((p) => ({
          id: p.id,
          staffId: p.staff_id,
          amount: Number(p.amount),
          type: p.type as StaffPayment["type"],
          paymentMethod: p.payment_method ?? null,
          description: p.description ?? p.type,
          date: p.date,
          createdAt: p.created_at,
        }));
        setCurrentStaffPayments(mappedPayments);
        // Estimate total
        if (paymentsData.length === staffPaymentPageSize) {
          setStaffPaymentTotal((staffPaymentPage + 1) * staffPaymentPageSize);
        } else {
          setStaffPaymentTotal((staffPaymentPage - 1) * staffPaymentPageSize + paymentsData.length);
        }
      } catch (error: any) {
        console.error("Failed to load staff payments", error);
        setCurrentStaffPayments([]);
      }
    };
    loadStaffPayments();
  }, [selectedStaff, staffPaymentPage, staffPaymentPageSize]);

  const filteredStaff = staff.filter(
    (s) =>
      s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      s.phone.includes(searchQuery) ||
      s.role.includes(searchQuery.toLowerCase())
  );

  // Filter only active staff for stats
  const activeStaff = staff.filter((s) => s.isActive);
  const totalSalaryDue = activeStaff.reduce((sum, s) => sum + s.salary, 0);
  const totalPaid = staffPayments
    .filter((p) => {
      const paymentStaff = staff.find((s) => s.id === p.staffId);
      return paymentStaff?.isActive && (p.type === "salary" || p.type === "bonus");
    })
    .reduce((sum, p) => sum + p.amount, 0);
  const totalAdvances = staffPayments
    .filter((p) => {
      const paymentStaff = staff.find((s) => s.id === p.staffId);
      return paymentStaff?.isActive && p.type === "advance";
    })
    .reduce((sum, p) => sum + p.amount, 0);

  const getStaffPayments = (staffId: string) => staffPayments.filter((p) => p.staffId === staffId);
  
  // TODO: Re-enable when attendance backend is implemented
  // const getStaffAttendance = (staffId: string) => attendance.filter((a) => a.staffId === staffId);
  const getStaffAttendance = (_staffId: string) => [] as never[]; // Placeholder - returns empty array

  const calculateBalance = (staff: Staff) => {
    const payments = getStaffPayments(staff.id);
    
    // Get current month and year in user's timezone
    const now = new Date();
    const currentMonth = now.toLocaleString('en-US', { month: '2-digit', year: 'numeric', timeZone: timezone });
    const [month, year] = currentMonth.split('/');
    const currentMonthYear = `${year}-${month}`;
    
    // Filter payments for current month only
    const currentMonthPayments = payments.filter((p) => {
      const paymentDate = new Date(p.date + 'T12:00:00');
      const paymentMonth = paymentDate.toLocaleString('en-US', { month: '2-digit', year: 'numeric', timeZone: timezone });
      const [pMonth, pYear] = paymentMonth.split('/');
      return `${pYear}-${pMonth}` === currentMonthYear;
    });
    
    const totalPaid = currentMonthPayments.filter((p) => p.type === "salary" || p.type === "bonus").reduce((sum, p) => sum + p.amount, 0);
    const advances = currentMonthPayments.filter((p) => p.type === "advance").reduce((sum, p) => sum + p.amount, 0);
    const deductions = currentMonthPayments.filter((p) => p.type === "deduction").reduce((sum, p) => sum + p.amount, 0);
    
    // Due = Monthly Salary - (Salary Payments + Bonus) - Advances - Deductions
    // Deductions reduce what's due (they're already taken from salary)
    // Advances reduce what's due (they're pre-payments that need to be deducted)
    // Positive = money still due to staff this month, Negative = overpaid this month
    return staff.salary - totalPaid - advances - deductions;
  };

  const handleViewStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setShowDetailDialog(true);
  };

  const handleOpenPay = (staff: Staff) => {
    setSelectedStaff(staff);
    setPaymentForm({ amount: "", type: "salary", payment_method: "cash", description: "" });
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
    setError(null);
    try {
      await createStaffPayment({
        staffId: selectedStaff.id,
        amount,
        type: paymentForm.type as StaffPayment["type"],
        paymentMethod: paymentForm.payment_method,
        description: paymentForm.description || paymentForm.type,
        date: getDateOnly(new Date(), timezone),
      });
      setShowPaymentDialog(false);
      setPaymentForm({ amount: "", type: "salary", payment_method: "cash", description: "" });
      
      // Reload payments for the current staff member
      const loadStaffPayments = async () => {
        try {
          const offset = (staffPaymentPage - 1) * staffPaymentPageSize;
          const paymentsData = await staffApi.listPayments({
            staff_id: selectedStaff.id,
            limit: staffPaymentPageSize,
            offset: offset,
          });
          const mappedPayments: StaffPayment[] = paymentsData.map((p) => ({
            id: p.id,
            staffId: p.staff_id,
            amount: Number(p.amount),
            type: p.type as StaffPayment["type"],
            description: p.description ?? p.type,
            date: p.date,
            createdAt: p.created_at,
          }));
          setCurrentStaffPayments(mappedPayments);
          // Estimate total
          if (paymentsData.length === staffPaymentPageSize) {
            setStaffPaymentTotal((staffPaymentPage + 1) * staffPaymentPageSize);
          } else {
            setStaffPaymentTotal((staffPaymentPage - 1) * staffPaymentPageSize + paymentsData.length);
          }
        } catch (error: any) {
          console.error("Failed to load staff payments", error);
        }
      };
      await loadStaffPayments();
      
      toast({ title: "Payment recorded" });
    } catch (err: any) {
      setError(err?.message || "Failed to record payment");
      toast({ title: "Failed to record payment", description: err?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleCreateStaff = async () => {
    if (!staffForm.name || !staffForm.phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }
    const salary = Number(staffForm.salary);
    if (isNaN(salary) || salary < 0) {
      toast({ title: "Invalid salary amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await createStaff({
        name: staffForm.name,
        phone: staffForm.phone,
        role: staffForm.role as Staff["role"],
        salary,
        joiningDate: getDateOnly(new Date(), timezone),
        isActive: true,
        email: staffForm.email || undefined,
        address: staffForm.address || undefined,
      });
      setShowAddDialog(false);
      setStaffForm({ name: "", phone: "", role: "waiter", salary: "20000", email: "", address: "", isActive: true });
      toast({ title: "Staff added" });
    } catch (err: any) {
      setError(err?.message || "Failed to add staff");
      toast({ title: "Failed to add staff", description: err?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleEditStaff = (staff: Staff) => {
    setSelectedStaff(staff);
    setStaffForm({
      name: staff.name,
      phone: staff.phone,
      role: staff.role,
      salary: staff.salary.toString(),
      email: staff.email || "",
      address: staff.address || "",
      isActive: staff.isActive,
    });
    setShowEditDialog(true);
  };

  const handleUpdateStaff = async () => {
    if (!selectedStaff || !staffForm.name || !staffForm.phone) {
      toast({ title: "Name & phone required", variant: "destructive" });
      return;
    }
    const salary = Number(staffForm.salary);
    if (isNaN(salary) || salary < 0) {
      toast({ title: "Invalid salary amount", variant: "destructive" });
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      await updateStaff(selectedStaff.id, {
        name: staffForm.name,
        phone: staffForm.phone,
        role: staffForm.role as Staff["role"],
        salary,
        email: staffForm.email || undefined,
        address: staffForm.address || undefined,
        isActive: staffForm.isActive,
      });
      setShowEditDialog(false);
      setSelectedStaff(null);
      setStaffForm({ name: "", phone: "", role: "waiter", salary: "20000", email: "", address: "", isActive: true });
      toast({ title: "Staff updated" });
    } catch (err: any) {
      setError(err?.message || "Failed to update staff");
      toast({ title: "Failed to update staff", description: err?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeactivateStaff = async () => {
    if (!staffToDelete) return;
    setSubmitting(true);
    setError(null);
    try {
      await updateStaff(staffToDelete.id, {
        isActive: false,
      });
      setShowDeleteDialog(false);
      setStaffToDelete(null);
      toast({ title: "Staff deactivated" });
    } catch (err: any) {
      setError(err?.message || "Failed to deactivate staff");
      toast({ title: "Failed to deactivate staff", description: err?.message, variant: "destructive" });
    } finally {
      setSubmitting(false);
    }
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
          <p className="text-2xl font-display font-bold">{toBengaliNumeral(activeStaff.length)}</p>
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

      {/* Error Message */}
      {error && (
        <GlassCard className="p-4 bg-destructive/10 border-destructive/20">
          <p className="text-destructive">{error}</p>
        </GlassCard>
      )}

      {/* Loading State */}
      {loading && (
        <GlassCard className="p-8 text-center">
          <p className="text-muted-foreground">Loading staff data...</p>
        </GlassCard>
      )}

      {/* Staff Grid */}
      {!loading && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 animate-fade-in stagger-3">
          {filteredStaff.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <User className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
              <p className="text-muted-foreground text-lg">No staff members found</p>
              <p className="text-sm text-muted-foreground mt-2">
                {searchQuery ? "Try a different search term" : "Add your first staff member to get started"}
              </p>
            </div>
          ) : (
            filteredStaff.map((staff) => {
          const balance = calculateBalance(staff);
          // TODO: Re-enable when attendance backend is implemented
          // const attendance = getStaffAttendance(staff.id);
          // const presentDays = attendance.filter((a) => a.status === "present").length;
          const presentDays = 0; // Placeholder - attendance not implemented yet

          return (
            <GlassCard key={staff.id} hover className={`p-5 ${!staff.isActive ? "opacity-60" : ""}`}>
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
                <div className="flex items-center gap-2">
                  {getRoleBadge(staff.role)}
                  {!staff.isActive && (
                    <Badge variant="outline" className="bg-muted text-muted-foreground border-muted-foreground/30">
                      Deactivated
                    </Badge>
                  )}
                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon" className="h-8 w-8">
                        <MoreVertical className="w-4 h-4" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      <DropdownMenuItem onClick={() => handleEditStaff(staff)}>
                        <Edit className="w-4 h-4 mr-2" />
                        Edit
                      </DropdownMenuItem>
                      {staff.isActive ? (
                        <DropdownMenuItem
                          onClick={() => {
                            setStaffToDelete(staff);
                            setShowDeleteDialog(true);
                          }}
                          className="text-destructive"
                        >
                          <Trash2 className="w-4 h-4 mr-2" />
                          Deactivate
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={async () => {
                            try {
                              await updateStaff(staff.id, { isActive: true });
                              toast({ title: "Staff reactivated" });
                            } catch (err: any) {
                              toast({ title: "Failed to reactivate staff", description: err?.message, variant: "destructive" });
                            }
                          }}
                          className="text-accent"
                        >
                          <User className="w-4 h-4 mr-2" />
                          Reactivate
                        </DropdownMenuItem>
                      )}
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
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
                  <span>Joined {formatDate(staff.joiningDate, timezone)}</span>
                </div>
              </div>

              <div className="p-3 rounded-lg bg-muted/30 space-y-2">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Salary</span>
                  <span className="font-semibold">{formatCurrency(staff.salary)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Balance</span>
                  <span className={`font-semibold text-base ${balance > 0 ? "text-accent" : balance < 0 ? "text-destructive" : ""}`}>
                    {balance > 0 
                      ? `Due: ${formatCurrency(balance)}` 
                      : balance < 0 
                      ? `Overpaid: ${formatCurrency(Math.abs(balance))}` 
                      : "Paid"}
                  </span>
                </div>
                {/* TODO: Re-enable when attendance backend is implemented */}
                {/* <div className="flex justify-between">
                  <span className="text-muted-foreground">Attendance</span>
                  <span className="font-semibold">{presentDays} days</span>
                </div> */}
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
          })
          )}
        </div>
      )}

      {/* Staff Detail Dialog */}
      <Dialog open={showDetailDialog} onOpenChange={setShowDetailDialog}>
        <DialogContent className="max-w-2xl glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">{selectedStaff?.name}</DialogTitle>
            <DialogDescription>{selectedStaff?.nameBn}</DialogDescription>
          </DialogHeader>

          {selectedStaff && (
            <Tabs defaultValue="payments" className="mt-4">
              {/* TODO: Re-enable attendance tab when backend is implemented - change grid-cols-2 to grid-cols-1 */}
              <TabsList className="grid w-full grid-cols-1">
                <TabsTrigger value="payments">Payment History</TabsTrigger>
                {/* <TabsTrigger value="attendance">Attendance</TabsTrigger> */}
              </TabsList>

              <TabsContent value="payments" className="mt-4">
                <div className="space-y-3">
                  {currentStaffPayments.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      <Wallet className="w-12 h-12 mx-auto mb-2 opacity-50" />
                      <p>No payment records</p>
                    </div>
                  ) : (
                    <>
                      <div className="max-h-[400px] overflow-auto custom-scrollbar space-y-3">
                        {currentStaffPayments.map((payment) => (
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
                                <p className="text-xs text-muted-foreground">{formatDate(payment.date, timezone)}</p>
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
                        ))}
                      </div>
                      {staffPaymentTotal > staffPaymentPageSize && (
                        <Pagination className="mt-4">
                          <PaginationContent>
                            <PaginationItem>
                              <PaginationPrevious
                                onClick={() => {
                                  if (staffPaymentPage > 1) {
                                    setStaffPaymentPage(staffPaymentPage - 1);
                                  }
                                }}
                                className={staffPaymentPage === 1 ? "pointer-events-none opacity-50" : "cursor-pointer"}
                              />
                            </PaginationItem>
                            {Array.from({ length: Math.ceil(staffPaymentTotal / staffPaymentPageSize) }, (_, i) => i + 1)
                              .filter((page) => {
                                const totalPages = Math.ceil(staffPaymentTotal / staffPaymentPageSize);
                                return (
                                  page === 1 ||
                                  page === totalPages ||
                                  (page >= staffPaymentPage - 1 && page <= staffPaymentPage + 1)
                                );
                              })
                              .map((page, idx, arr) => {
                                const showEllipsisBefore = idx > 0 && arr[idx - 1] < page - 1;
                                return (
                                  <React.Fragment key={page}>
                                    {showEllipsisBefore && (
                                      <PaginationItem>
                                        <span className="px-2">...</span>
                                      </PaginationItem>
                                    )}
                                    <PaginationItem>
                                      <PaginationLink
                                        onClick={() => setStaffPaymentPage(page)}
                                        isActive={staffPaymentPage === page}
                                        className="cursor-pointer"
                                      >
                                        {page}
                                      </PaginationLink>
                                    </PaginationItem>
                                  </React.Fragment>
                                );
                              })}
                            <PaginationItem>
                              <PaginationNext
                                onClick={() => {
                                  if (staffPaymentPage < Math.ceil(staffPaymentTotal / staffPaymentPageSize)) {
                                    setStaffPaymentPage(staffPaymentPage + 1);
                                  }
                                }}
                                className={
                                  staffPaymentPage >= Math.ceil(staffPaymentTotal / staffPaymentPageSize)
                                    ? "pointer-events-none opacity-50"
                                    : "cursor-pointer"
                                }
                              />
                            </PaginationItem>
                          </PaginationContent>
                        </Pagination>
                      )}
                    </>
                  )}
                </div>
              </TabsContent>

              {/* TODO: Re-enable when attendance backend is implemented */}
              {/* <TabsContent value="attendance" className="mt-4">
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
                          <div className="text-sm text-muted-foreground">{formatDate(record.date, timezone)}</div>
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
              </TabsContent> */}
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
              <Label>Payment Method</Label>
              <Select 
                value={paymentForm.payment_method || "cash"} 
                onValueChange={(v) => setPaymentForm((f) => ({ ...f, payment_method: v as "cash" | "bank_transfer" | "check" | "online" }))}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cash">Cash</SelectItem>
                  <SelectItem value="bank_transfer">Bank Transfer</SelectItem>
                  <SelectItem value="check">Check</SelectItem>
                  <SelectItem value="online">Online</SelectItem>
                </SelectContent>
              </Select>
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
            <DialogDescription>Add a new staff member to the system</DialogDescription>
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

      {/* Edit Staff Dialog */}
      <Dialog open={showEditDialog} onOpenChange={setShowEditDialog}>
        <DialogContent className="max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Edit Staff</DialogTitle>
            <DialogDescription>Update staff member information</DialogDescription>
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
            <div className="space-y-1 md:col-span-2 flex items-center justify-between p-3 rounded-lg bg-muted/30">
              <div>
                <Label>Active Status</Label>
                <p className="text-sm text-muted-foreground">Deactivated staff won't be counted in statistics</p>
              </div>
              <Switch
                checked={staffForm.isActive}
                onCheckedChange={(checked) => setStaffForm((f) => ({ ...f, isActive: checked }))}
              />
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <Button variant="outline" onClick={() => setShowEditDialog(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleUpdateStaff} disabled={submitting}>
              {submitting ? "Saving..." : "Update"}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Deactivate Staff Member</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to deactivate <strong>{staffToDelete?.name}</strong>? 
              Deactivated staff will not be counted in statistics and will not appear in active staff lists.
              Payment records will be preserved. You can reactivate them later by editing their profile.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setStaffToDelete(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivateStaff} disabled={submitting} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {submitting ? "Deactivating..." : "Deactivate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
