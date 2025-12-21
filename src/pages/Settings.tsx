import React, { useEffect, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
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
  Building2,
  Receipt,
  Globe,
  Shield,
  Save,
  Users,
  Plus,
  Trash2,
  Tag,
  Lock,
  UtensilsCrossed,
  Clock,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppData } from "@/contexts/AppDataContext";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatWithTimezone, formatDate } from "@/utils/date";
import { useLicense, LICENSE_STORAGE_KEY, parseLicenseToken } from "@/contexts/LicenseContext";
import { usersApi, type StaffUser, type StaffRole } from "@/lib/api/users";
import { useAuth } from "@/contexts/AuthContext";
import { tablesApi } from "@/lib/api/tables";
import { tenantApi, type TenantSettingsDto } from "@/lib/api/tenant";
import { savePrintSettings } from "@/utils/printUtils";

export default function Settings() {
  const { staff, categories, addCategory, removeCategory, refreshCategories, tables, refreshTables } = useAppData();
  const { license, refreshFromStorage } = useLicense();
  const { user } = useAuth();
  const { timezone, setTimezone } = useTimezone();
  const [language, setLanguage] = useState("en");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<StaffUser[]>([]);
  const [newCategory, setNewCategory] = useState({ name: "", nameBn: "", icon: "🍽️" });
  const [licenseInput, setLicenseInput] = useState("");
  const [permissionsModalOpen, setPermissionsModalOpen] = useState(false);
  const [selectedUser, setSelectedUser] = useState<StaffUser | null>(null);
  const [userPermissions, setUserPermissions] = useState<Record<string, boolean>>({});
  const [numberOfTables, setNumberOfTables] = useState<number>(0);
  const [isCreatingTables, setIsCreatingTables] = useState(false);
  const [tenantSettings, setTenantSettings] = useState<TenantSettingsDto | null>(null);
  const [isLoadingSettings, setIsLoadingSettings] = useState(true);
  const [isSavingSettings, setIsSavingSettings] = useState(false);
  const [businessProfile, setBusinessProfile] = useState({
    name: "",
    nameBn: "",
    phone: "",
    address: "",
    vatRegistrationNo: "",
    tradeLicense: "",
  });
  const [invoiceSettings, setInvoiceSettings] = useState({
    invoicePrefix: "INV-",
    paperSize: "thermal" as "thermal" | "thermal58",
    footerText: "",
  });
  const [deleteCategoryDialogOpen, setDeleteCategoryDialogOpen] = useState(false);
  const [categoryToDelete, setCategoryToDelete] = useState<{ id: string; name: string } | null>(null);
  const [deleteUserDialogOpen, setDeleteUserDialogOpen] = useState(false);
  const [userToDelete, setUserToDelete] = useState<string | null>(null);

  const TIMEZONES = [
    { value: "Asia/Dhaka", label: "Asia/Dhaka (Bangladesh)" },
    { value: "Asia/Kolkata", label: "Asia/Kolkata (India)" },
    { value: "Asia/Dubai", label: "Asia/Dubai (UAE)" },
    { value: "Asia/Singapore", label: "Asia/Singapore" },
    { value: "Asia/Tokyo", label: "Asia/Tokyo (Japan)" },
    { value: "Europe/London", label: "Europe/London (UK)" },
    { value: "America/New_York", label: "America/New_York (US Eastern)" },
    { value: "America/Los_Angeles", label: "America/Los_Angeles (US Pacific)" },
    { value: "UTC", label: "UTC" },
  ];

  useEffect(() => {
    // Load staff users from backend when authenticated
    const loadUsers = async () => {
      try {
        const data = await usersApi.list();
        setUsers(data);
      } catch (err) {
        console.error("Failed to load users", err);
      }
    };
    if (user?.token) {
      loadUsers();
    }
  }, [user?.token]);

  useEffect(() => {
    // Load current table count
    if (tables && tables.length > 0) {
      setNumberOfTables(tables.length);
    }
  }, [tables]);

  useEffect(() => {
    // Load tenant settings
    const loadSettings = async () => {
      if (!user?.token) return;
      setIsLoadingSettings(true);
      try {
        const settings = await tenantApi.getSettings();
        setTenantSettings(settings);
        setBusinessProfile({
          name: settings.name || "",
          nameBn: settings.name_bn || "",
          phone: settings.phone || "",
          address: settings.address || "",
          vatRegistrationNo: settings.vat_registration_no || "",
          tradeLicense: settings.trade_license || "",
        });
        setInvoiceSettings({
          invoicePrefix: settings.invoice_prefix || "INV-",
          paperSize: (settings.paper_size === "thermal58" ? "thermal58" : "thermal"),
          footerText: settings.footer_text || "",
        });
        
        // Sync timezone from backend (TimezoneContext will also fetch, but this ensures sync)
        if (settings.timezone) {
          setTimezone(settings.timezone);
        }
        
        // Sync to localStorage for print system
        savePrintSettings({
          paperSize: settings.paper_size === 'thermal58' ? '58mm' : '80mm',
          invoicePrefix: settings.invoice_prefix || 'INV-',
          footerText: settings.footer_text || '',
          restaurantName: settings.name || '',
          restaurantNameBn: settings.name_bn || '',
          address: settings.address || '',
          phone: settings.phone || '',
        });
      } catch (err) {
        console.error("Failed to load settings", err);
        toast({
          title: "Failed to load settings",
          description: "Using default values.",
          variant: "destructive",
        });
      } finally {
        setIsLoadingSettings(false);
      }
    };
    if (user?.token) {
      loadSettings();
    }
  }, [user?.token]);

  const handleSave = async () => {
    if (!user?.token) return;
    setIsSavingSettings(true);
    try {
      await tenantApi.updateSettings({
        name: businessProfile.name || undefined,
        name_bn: businessProfile.nameBn || undefined,
        phone: businessProfile.phone || undefined,
        address: businessProfile.address || undefined,
        vat_registration_no: businessProfile.vatRegistrationNo || undefined,
        trade_license: businessProfile.tradeLicense || undefined,
        invoice_prefix: invoiceSettings.invoicePrefix || undefined,
        paper_size: invoiceSettings.paperSize,
        footer_text: invoiceSettings.footerText || undefined,
      });
      toast({
        title: "Settings saved!",
        description: "Your changes have been applied.",
      });
      // Reload settings to get updated values
      const updated = await tenantApi.getSettings();
      setTenantSettings(updated);
      
      // Sync print settings to localStorage for immediate use by print system
      savePrintSettings({
        paperSize: updated.paper_size === 'thermal58' ? '58mm' : '80mm',
        invoicePrefix: updated.invoice_prefix || 'INV-',
        footerText: updated.footer_text || '',
        restaurantName: updated.name || '',
        restaurantNameBn: updated.name_bn || '',
        address: updated.address || '',
        phone: updated.phone || '',
      });
      
      // Also update business profile state
      setBusinessProfile({
        name: updated.name || "",
        nameBn: updated.name_bn || "",
        phone: updated.phone || "",
        address: updated.address || "",
        vatRegistrationNo: updated.vat_registration_no || "",
        tradeLicense: updated.trade_license || "",
      });
      setInvoiceSettings({
        invoicePrefix: updated.invoice_prefix || "INV-",
        paperSize: (updated.paper_size === "thermal58" ? "thermal58" : "thermal"),
        footerText: updated.footer_text || "",
      });
    } catch (err: any) {
      toast({
        title: "Failed to save settings",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsSavingSettings(false);
    }
  };

  const handleCreateTables = async () => {
    if (!numberOfTables || numberOfTables < 1) {
      toast({
        title: "Invalid number",
        description: "Please enter a number between 1 and 100.",
        variant: "destructive",
      });
      return;
    }

    setIsCreatingTables(true);
    try {
      const currentCount = tables.length;
      const needed = numberOfTables - currentCount;

      if (needed <= 0) {
        toast({
          title: "Tables already exist",
          description: `You already have ${currentCount} table${currentCount !== 1 ? "s" : ""}. Increase the number to create more.`,
        });
        setIsCreatingTables(false);
        return;
      }

      await tablesApi.bulkCreate({
        count: needed,
        default_capacity: 4,
      });

      toast({
        title: "Tables created!",
        description: `Successfully created ${needed} table${needed !== 1 ? "s" : ""}. Refreshing...`,
      });

      // Refresh tables from API
      await refreshTables();
      // Update the numberOfTables to reflect the new total (will be updated by useEffect when tables change)
      setIsCreatingTables(false);
    } catch (err: any) {
      toast({
        title: "Failed to create tables",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setIsCreatingTables(false);
    }
  };

  const handleActivateLicense = () => {
    const token = licenseInput.trim();
    if (!token) {
      toast({
        title: "Activation code required",
        description: "Paste the activation code you received.",
        variant: "destructive",
      });
      return;
    }

    const parsed = parseLicenseToken(token);

    if (parsed.status === "invalid") {
      toast({
        title: "Invalid activation code",
        description: parsed.error || "Please check the code and try again.",
        variant: "destructive",
      });
      return;
    }

    if (parsed.status === "expired") {
      toast({
        title: "Activation code expired",
        description: "Please contact your provider for a new code.",
        variant: "destructive",
      });
      // Still store it so we can show expiry info
      try {
        localStorage.setItem(LICENSE_STORAGE_KEY, token);
      } catch {
        // ignore
      }
      refreshFromStorage();
      return;
    }

    try {
      localStorage.setItem(LICENSE_STORAGE_KEY, token);
    } catch {
      // ignore storage failure
    }

    toast({
      title: "Subscription activated",
      description: parsed.validUntil
        ? `Valid until ${formatWithTimezone(parsed.validUntil, timezone)}`
        : "Activation successful.",
    });
    setLicenseInput("");
    refreshFromStorage();
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast({ title: "Category name required", variant: "destructive" });
      return;
    }
    try {
      const categoryName = newCategory.name.trim();
      await addCategory({
        name: categoryName,
        nameBn: newCategory.nameBn.trim() || undefined,
        icon: newCategory.icon || "🍽️",
      });
      setNewCategory({ name: "", nameBn: "", icon: "🍽️" });
      toast({ title: "Category added", description: categoryName });
    } catch (err: any) {
      toast({
        title: "Failed to add category",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleDeleteCategory = (categoryId: string, name: string) => {
    setCategoryToDelete({ id: categoryId, name });
    setDeleteCategoryDialogOpen(true);
  };

  const confirmDeleteCategory = async () => {
    if (!categoryToDelete) return;
    try {
      await removeCategory(categoryToDelete.id);
      toast({ 
        title: "Category deleted", 
        description: `"${categoryToDelete.name}" has been removed successfully.` 
      });
      setDeleteCategoryDialogOpen(false);
      setCategoryToDelete(null);
    } catch (err: any) {
      // Handle 409 error (category has items) or other errors
      const errorMessage = err?.response?.data?.detail || err?.message || "Failed to delete category";
      const isConflictError = err?.response?.status === 409 || errorMessage.toLowerCase().includes("products are using it");
      
      toast({
        title: isConflictError ? "Cannot delete category" : "Error",
        description: isConflictError 
          ? `"${categoryToDelete.name}" cannot be deleted because it contains items. Please remove or reassign all items in this category first.`
          : errorMessage,
        variant: "destructive",
      });
      
      // Don't close the dialog on error so user can see the message
      // They can manually close it or try again
    }
  };

  const handleAddUser = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    try {
      const created = await usersApi.create({
      name: formData.get("name") as string,
        name_bn: (formData.get("nameBn") as string) || undefined,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
        role: formData.get("role") as StaffRole,
        password: formData.get("password") as string,
      });
      setUsers((prev) => [created, ...prev]);
    setIsAddUserModalOpen(false);
    toast({
      title: "User created!",
        description: `${created.name} has been added as ${created.role}.`,
    });
    } catch (err: any) {
      toast({
        title: "Failed to create user",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleToggleUser = (userId: string) => {
    const target = users.find((u) => u.id === userId);
    if (!target) return;
    usersApi
      .update(userId, { is_active: !target.is_active })
      .then((updated) => {
        setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
    toast({
      title: "User status updated",
      description: "User access has been modified.",
        });
      })
      .catch((err: any) => {
        toast({
          title: "Failed to update user",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
    });
  };

  const handleRemoveUser = (userId: string) => {
    // Staff users don't have "owner" role - only manager, waiter, cashier, chef
    // Owner role is handled separately in the backend and won't appear in this list
    setUserToDelete(userId);
    setDeleteUserDialogOpen(true);
  };

  const confirmRemoveUser = () => {
    if (!userToDelete) return;
    usersApi.remove(userToDelete)
      .then(() => {
      setUsers(prev => prev.filter(u => u.id !== userToDelete));
      toast({
        title: "User removed",
        description: "User has been deleted from the system.",
      });
      })
      .catch((err: any) => {
        toast({
          title: "Failed to remove user",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
      });
  };

  const getRoleBadge = (role: StaffRole | "owner") => {
    const roleColors = {
      owner: "bg-primary/20 text-primary border-primary/30",
      manager: "bg-secondary/20 text-secondary border-secondary/30",
      waiter: "bg-accent/20 text-accent border-accent/30",
      cashier: "bg-blue-500/20 text-blue-500 border-blue-500/30",
      chef: "bg-orange-500/20 text-orange-500 border-orange-500/30",
    };
    const roleName = {
      owner: "Owner",
      manager: "Manager",
      waiter: "Waiter",
      cashier: "Cashier",
      chef: "Chef",
    };
    return <Badge className={roleColors[role]}>{roleName[role]}</Badge>;
  };

  // All available routes for permissions
  const allRoutes = [
    { path: "/dashboard", label: "Dashboard", labelBn: "ড্যাশবোর্ড" },
    { path: "/sales", label: "POS Sales", labelBn: "বিক্রয়" },
    { path: "/tables", label: "Tables", labelBn: "টেবিল" },
    { path: "/items", label: "Items", labelBn: "আইটেম" },
    { path: "/purchases", label: "Purchases", labelBn: "ক্রয়" },
    { path: "/suppliers", label: "Suppliers", labelBn: "সরবরাহকারী" },
    { path: "/customers", label: "Customers", labelBn: "গ্রাহক" },
    { path: "/staff", label: "Staff", labelBn: "কর্মী" },
    { path: "/attendance", label: "Attendance", labelBn: "হাজিরা" },
    { path: "/reports", label: "Reports", labelBn: "রিপোর্ট" },
    { path: "/finance", label: "Finance", labelBn: "আর্থিক" },
    { path: "/expenses", label: "Expenses", labelBn: "খরচ" },
    { path: "/vat", label: "VAT", labelBn: "ভ্যাট" },
    { path: "/sales-history", label: "Sales History", labelBn: "বিক্রয় ইতিহাস" },
  ];

  const openPermissionsModal = async (user: StaffUser) => {
    setSelectedUser(user);
    try {
      const perms = await usersApi.getPermissions(user.id);
      setUserPermissions(perms);
    } catch (err: any) {
      toast({
        title: "Failed to load permissions",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
      setUserPermissions({});
    }
    setPermissionsModalOpen(true);
  };

  const handleSavePermissions = async () => {
    if (!selectedUser) return;
    try {
      await usersApi.updatePermissions(selectedUser.id, userPermissions);
      toast({
        title: "Permissions updated",
        description: `Access permissions for ${selectedUser.name} have been saved.`,
      });
      setPermissionsModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to update permissions",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const togglePermission = (path: string) => {
    setUserPermissions((prev) => ({
      ...prev,
      [path]: !prev[path],
    }));
  };

  return (
    <div className="space-y-6 max-w-6xl">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground">সেটিংস ম্যানেজমেন্ট • System Configuration</p>
      </div>

      <Tabs defaultValue="business" className="space-y-4">
        <TabsList className="glass-card">
          <TabsTrigger value="business" className="gap-2">
            <Building2 className="h-4 w-4" />
            Business
          </TabsTrigger>
          <TabsTrigger value="users" className="gap-2">
            <Users className="h-4 w-4" />
            Users
          </TabsTrigger>
          <TabsTrigger value="subscription" className="gap-2">
            <Shield className="h-4 w-4" />
            Subscription
          </TabsTrigger>
        </TabsList>

        {/* Business Tab */}
        <TabsContent value="business" className="space-y-6">

      {/* Business Profile */}
      <GlassCard className="p-6 animate-fade-in stagger-1">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Business Profile</h3>
            <p className="text-sm text-muted-foreground">ব্যবসার তথ্য</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Restaurant Name</Label>
            <Input
              value={businessProfile.name}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, name: e.target.value }))}
              placeholder="Enter restaurant name"
              className="bg-muted/50"
              disabled={isLoadingSettings}
            />
          </div>
          <div className="space-y-2">
            <Label>Restaurant Name (Bengali)</Label>
            <Input
              value={businessProfile.nameBn}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, nameBn: e.target.value }))}
              placeholder="রেস্টুরেন্টের নাম"
              className="bg-muted/50 font-bengali"
              disabled={isLoadingSettings}
            />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input
              value={businessProfile.phone}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, phone: e.target.value }))}
              placeholder="Enter phone number"
              className="bg-muted/50"
              disabled={isLoadingSettings}
            />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input
              value={businessProfile.address}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, address: e.target.value }))}
              placeholder="Enter address"
              className="bg-muted/50"
              disabled={isLoadingSettings}
            />
          </div>
          <div className="space-y-2">
            <Label>VAT Registration No.</Label>
            <Input
              value={businessProfile.vatRegistrationNo}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, vatRegistrationNo: e.target.value }))}
              placeholder="Enter VAT registration number"
              className="bg-muted/50"
              disabled={isLoadingSettings}
            />
          </div>
          <div className="space-y-2">
            <Label>Trade License</Label>
            <Input
              value={businessProfile.tradeLicense}
              onChange={(e) => setBusinessProfile((prev) => ({ ...prev, tradeLicense: e.target.value }))}
              placeholder="Enter trade license number"
              className="bg-muted/50"
              disabled={isLoadingSettings}
            />
          </div>
        </div>
      </GlassCard>

      {/* Table Management */}
      <GlassCard className="p-6 animate-fade-in stagger-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <UtensilsCrossed className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Table Management</h3>
            <p className="text-sm text-muted-foreground">টেবিল ব্যবস্থাপনা • Configure restaurant tables</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="numberOfTables">Number of Tables</Label>
            <Input
              id="numberOfTables"
              type="number"
              min="1"
              max="100"
              value={numberOfTables || ""}
              onChange={(e) => setNumberOfTables(parseInt(e.target.value) || 0)}
              placeholder="Enter number of tables"
              className="bg-muted/50"
            />
            <p className="text-xs text-muted-foreground">
              Current: {tables.length} table{tables.length !== 1 ? "s" : ""}. Enter the total number of tables you want.
            </p>
          </div>
          <div className="space-y-2 flex items-end">
            <Button
              variant="glow"
              onClick={handleCreateTables}
              disabled={isCreatingTables || !numberOfTables || numberOfTables <= tables.length}
              className="w-full"
            >
              {isCreatingTables ? (
                <>
                  <Clock className="w-4 h-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tables
                </>
              )}
            </Button>
          </div>
        </div>
        {numberOfTables > 0 && numberOfTables <= tables.length && (
          <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/60">
            <p className="text-sm text-muted-foreground">
              You already have {tables.length} table{tables.length !== 1 ? "s" : ""}. Increase the number above to create more tables.
            </p>
          </div>
        )}
      </GlassCard>

        {/* Categories Management */}
        <GlassCard className="p-6 animate-fade-in stagger-2">
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
                <Tag className="w-5 h-5 text-accent" />
              </div>
              <div>
                <h3 className="font-semibold">Menu Categories</h3>
                <p className="text-sm text-muted-foreground">Create and manage item categories</p>
              </div>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={async () => {
                await refreshCategories();
                toast({
                  title: "Categories refreshed",
                  description: "Item counts have been updated.",
                });
              }}
            >
              <Clock className="w-4 h-4 mr-2" />
              Refresh
            </Button>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {/* Add category form */}
            <div className="space-y-3">
              <Label>Category Name *</Label>
              <Input
                value={newCategory.name}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, name: e.target.value }))}
                placeholder="e.g. Beverages"
                className="bg-muted/50"
              />
              <Label>Category Name (Bengali)</Label>
              <Input
                value={newCategory.nameBn}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, nameBn: e.target.value }))}
                placeholder="e.g. পানীয়"
                className="bg-muted/50 font-bengali"
              />
              <Label>Icon</Label>
              <Input
                value={newCategory.icon}
                onChange={(e) => setNewCategory((prev) => ({ ...prev, icon: e.target.value }))}
                placeholder="🍽️"
                className="bg-muted/50"
              />
              <Button variant="glow" onClick={(e) => handleAddCategory(e as any)}>
                <Plus className="w-4 h-4 mr-2" />
                Add Category
              </Button>
            </div>

            {/* Categories list */}
            <div className="lg:col-span-2 space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {categories.map((cat) => (
                  <div key={cat.id} className="p-3 rounded-xl border border-border/60 bg-muted/30 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 rounded-lg bg-muted flex items-center justify-center text-lg">
                        {cat.icon || "🍽️"}
                      </div>
                      <div>
                        <p className="font-semibold">{cat.name}</p>
                        {cat.nameBn && <p className="text-xs text-muted-foreground font-bengali">{cat.nameBn}</p>}
                        <p className="text-xs text-muted-foreground">{cat.itemCount ?? 0} items</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        size="icon"
                        variant="ghost"
                        className="h-8 w-8 text-destructive"
                        onClick={() => handleDeleteCategory(cat.id, cat.name)}
                        title="Delete category"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </GlassCard>

      {/* Invoice Settings */}
      <GlassCard className="p-6 animate-fade-in stagger-2">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Receipt className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Invoice & Print Settings</h3>
            <p className="text-sm text-muted-foreground">চালান ও প্রিন্ট সেটিংস • Thermal Printer Configuration</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Invoice Prefix</Label>
            <Input
              value={invoiceSettings.invoicePrefix}
              onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, invoicePrefix: e.target.value }))}
              placeholder="INV-"
              className="bg-muted/50"
              disabled={isLoadingSettings}
            />
          </div>
          <div className="space-y-2">
            <Label>Paper Size</Label>
            <Select
              value={invoiceSettings.paperSize}
              onValueChange={(value) => {
                setInvoiceSettings((prev) => ({ ...prev, paperSize: value as "thermal" | "thermal58" }));
              }}
              disabled={isLoadingSettings}
            >
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="thermal">
                  <div className="flex flex-col">
                    <span>Thermal 80mm</span>
                    <span className="text-xs text-muted-foreground">Standard thermal receipt</span>
                  </div>
                </SelectItem>
                <SelectItem value="thermal58">
                  <div className="flex flex-col">
                    <span>Thermal 58mm</span>
                    <span className="text-xs text-muted-foreground">Compact thermal receipt</span>
                  </div>
                </SelectItem>
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              Only thermal paper sizes are supported for POS receipts and KOT slips.
            </p>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Footer Text</Label>
            <Input
              value={invoiceSettings.footerText}
              onChange={(e) => setInvoiceSettings((prev) => ({ ...prev, footerText: e.target.value }))}
              placeholder="ধন্যবাদ, আবার আসবেন"
              className="bg-muted/50"
              disabled={isLoadingSettings}
            />
          </div>
        </div>
        
        <div className="mt-4 p-3 rounded-lg bg-muted/30 border border-border/60">
          <p className="text-sm text-muted-foreground flex items-center gap-2">
            <Receipt className="w-4 h-4" />
            All receipts (POS, KOT, Table Bills) will use the selected thermal paper size for consistent printing.
          </p>
        </div>
      </GlassCard>

      {/* Timezone Settings */}
      <GlassCard className="p-6 animate-fade-in stagger-3">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-blue-500/20 flex items-center justify-center">
            <Clock className="w-5 h-5 text-blue-500" />
          </div>
          <div>
            <h3 className="font-semibold">Timezone Settings</h3>
            <p className="text-sm text-muted-foreground">সময় অঞ্চল • Configure timezone for date/time display</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="space-y-2">
            <Label>Select Timezone</Label>
            <Select value={timezone} onValueChange={setTimezone}>
              <SelectTrigger className="bg-muted/50 w-full md:w-[300px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((tz) => (
                  <SelectItem key={tz.value} value={tz.value}>
                    {tz.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <p className="text-xs text-muted-foreground">
              All dates and times throughout the application will be displayed in the selected timezone. 
              This does not affect data storage - all data remains in UTC.
            </p>
          </div>
        </div>
      </GlassCard>

      {/* Localization */}
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
            <Globe className="w-5 h-5 text-accent" />
          </div>
          <div>
            <h3 className="font-semibold">Localization</h3>
            <p className="text-sm text-muted-foreground">স্থানীয়করণ</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Currency</Label>
            <Select defaultValue="bdt">
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bdt">৳ BDT (Bangladeshi Taka)</SelectItem>
                <SelectItem value="usd">$ USD (US Dollar)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Language</Label>
            <Select value={language} onValueChange={setLanguage}>
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="en">English</SelectItem>
                <SelectItem value="bn">বাংলা (Bengali)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Date Format</Label>
            <Select defaultValue="dd-mm-yyyy">
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dd-mm-yyyy">DD-MM-YYYY</SelectItem>
                <SelectItem value="mm-dd-yyyy">MM-DD-YYYY</SelectItem>
                <SelectItem value="yyyy-mm-dd">YYYY-MM-DD</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>Number Format</Label>
            <Select defaultValue="bn">
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="bn">Bengali (১,২৩,৪৫৬)</SelectItem>
                <SelectItem value="en">English (1,23,456)</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </div>
      </GlassCard>

        {/* Save Button for Business Tab */}
        <div className="flex justify-end">
          <Button variant="glow" size="lg" onClick={handleSave} disabled={isSavingSettings || isLoadingSettings}>
            {isSavingSettings ? (
              <>
                <Clock className="w-4 h-4 mr-2 animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Save Changes
              </>
            )}
          </Button>
        </div>
        </TabsContent>

        {/* Users Tab */}
        <TabsContent value="users" className="space-y-6">
          <GlassCard className="p-6">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Users className="w-5 h-5 text-primary" />
                  User Management
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  ব্যবহারকারী পরিচালনা • Manage team access and roles
                </p>
              </div>
              <Button variant="glow" onClick={() => setIsAddUserModalOpen(true)}>
                <Plus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>

            <div className="space-y-3">
              {users.map((user) => (
                <div
                  key={user.id}
                  className={`flex items-center justify-between p-4 rounded-xl border-2 transition-all ${
                    user.is_active
                      ? "bg-muted/30 border-border"
                      : "bg-muted/10 border-border/50 opacity-60"
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold text-lg">
                      {user.name[0]}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <p className="font-semibold">{user.name}</p>
                        {user.name_bn && (
                          <span className="text-sm text-muted-foreground">({user.name_bn})</span>
                        )}
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {user.is_active ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={user.is_active}
                        onCheckedChange={() => handleToggleUser(user.id)}
                      />
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => openPermissionsModal(user)}
                      title="Manage permissions"
                    >
                      <Lock className="w-4 h-4 mr-1" />
                      Permissions
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(user.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            {users.length === 0 && (
              <div className="text-center py-12 text-muted-foreground">
                <Users className="w-12 h-12 mx-auto mb-3 opacity-50" />
                <p>No users yet. Add your first team member.</p>
              </div>
            )}
          </GlassCard>

          <GlassCard className="p-6 bg-primary/5 border-primary/20">
            <div className="flex items-start gap-3">
              <Shield className="w-5 h-5 text-primary mt-0.5" />
              <div>
                <h4 className="font-semibold text-primary mb-1">User Roles</h4>
                <ul className="text-sm text-muted-foreground space-y-1">
                  <li><strong>Owner:</strong> Full system access, cannot be removed</li>
                  <li><strong>Manager:</strong> Access to reports, settings, and void transactions</li>
                  <li><strong>Cashier:</strong> POS access for takeaway/delivery sales</li>
                  <li><strong>Waiter:</strong> Tables management, take orders, send KOTs</li>
                  <li><strong>Chef:</strong> View KOTs and order status (future feature)</li>
                </ul>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

        {/* Subscription / Activation Tab */}
        <TabsContent value="subscription" className="space-y-6">
          <GlassCard className="p-6 animate-fade-in">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold flex items-center gap-2">
                  <Shield className="w-5 h-5 text-primary" />
                  Subscription & Activation
                </h3>
                <p className="text-sm text-muted-foreground mt-1">
                  সাবস্ক্রিপশন ও অ্যাক্টিভেশন • Manage your offline license
                </p>
              </div>
            </div>

            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">Current status:</span>
                {license.status === "active" && (
                  <Badge variant="success">
                    Active{license.validUntil && (
                      <> • until {formatDate(license.validUntil, timezone)}</>
                    )}
                  </Badge>
                )}
                {license.status === "expired" && (
                  <Badge variant="destructive">
                    Expired{license.validUntil && (
                      <> • {formatDate(license.validUntil, timezone)}</>
                    )}
                  </Badge>
                )}
                {license.status === "invalid" && (
                  <Badge variant="destructive">Invalid code</Badge>
                )}
                {license.status === "none" && (
                  <Badge variant="outline">Not activated</Badge>
                )}
              </div>
              {license.plan && (
                <p className="text-sm text-muted-foreground">
                  Plan: <span className="font-medium text-foreground">{license.plan}</span>
                </p>
              )}
              {license.customerName && (
                <p className="text-sm text-muted-foreground">
                  Licensed to:{" "}
                  <span className="font-medium text-foreground">{license.customerName}</span>
                </p>
              )}

              <div className="space-y-2 pt-4">
                <Label htmlFor="activation-code">Activation Code</Label>
                <textarea
                  id="activation-code"
                  className="w-full min-h-[120px] rounded-md border border-border bg-muted/50 px-3 py-2 text-sm font-mono focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-primary"
                  placeholder="Paste the activation code (license token) provided by your vendor..."
                  value={licenseInput}
                  onChange={(e) => setLicenseInput(e.target.value)}
                />
                <p className="text-xs text-muted-foreground">
                  Your provider will send you a time-limited activation code (for example monthly).
                  Paste it here to activate or renew your subscription. Works fully offline.
                </p>
              </div>

              <div className="flex justify-end gap-2 pt-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => {
                    setLicenseInput("");
                  }}
                >
                  Clear
                </Button>
                <Button type="button" variant="glow" onClick={handleActivateLicense}>
                  Activate / Renew
                </Button>
              </div>
            </div>
          </GlassCard>
        </TabsContent>

      </Tabs>

      {/* Add User Dialog */}
      <Dialog open={isAddUserModalOpen} onOpenChange={setIsAddUserModalOpen}>
        <DialogContent className="sm:max-w-md glass-card">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">Add New User</DialogTitle>
            <DialogDescription>নতুন ব্যবহারকারী যোগ করুন • Create a new team member account</DialogDescription>
          </DialogHeader>
          <form onSubmit={handleAddUser} className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="name">Full Name *</Label>
              <Input id="name" name="name" placeholder="e.g. Abdul Karim" required className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="nameBn">Bengali Name (Optional)</Label>
              <Input id="nameBn" name="nameBn" placeholder="আব্দুল করিম" className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="phone">Phone Number *</Label>
              <Input id="phone" name="phone" type="tel" placeholder="01712345678" required className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email *</Label>
              <Input id="email" name="email" type="email" placeholder="user@restaurant.com" required className="bg-muted/50" />
            </div>

            <div className="space-y-2">
              <Label htmlFor="role">Role *</Label>
              <Select name="role" defaultValue="waiter" required>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="manager">Manager</SelectItem>
                  <SelectItem value="cashier">Cashier</SelectItem>
                  <SelectItem value="waiter">Waiter</SelectItem>
                  <SelectItem value="chef">Chef</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label htmlFor="password">Password *</Label>
              <Input
                id="password"
                name="password"
                type="password"
                placeholder="Set a strong password"
                required
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">
                This password will be used when logging in to the system.
              </p>
            </div>

            <div className="flex gap-2 justify-end pt-4">
              <Button type="button" variant="outline" onClick={() => setIsAddUserModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" variant="glow">
                <Plus className="w-4 h-4 mr-2" />
                Create User
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>

      {/* Permissions Management Dialog */}
      <Dialog open={permissionsModalOpen} onOpenChange={setPermissionsModalOpen}>
        <DialogContent className="sm:max-w-2xl glass-card max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              Manage Permissions: {selectedUser?.name}
            </DialogTitle>
            <DialogDescription>
              Control which pages {selectedUser?.name} can access. Toggle routes on/off.
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {allRoutes.map((route) => (
                <div
                  key={route.path}
                  className="flex items-center justify-between p-3 rounded-lg border border-border bg-muted/30"
                >
                  <div>
                    <p className="font-medium text-sm">{route.label}</p>
                    <p className="text-xs text-muted-foreground font-bengali">{route.labelBn}</p>
                  </div>
                  <Switch
                    checked={userPermissions[route.path] ?? false}
                    onCheckedChange={() => togglePermission(route.path)}
                  />
                </div>
              ))}
            </div>
            <div className="pt-4 border-t border-border">
              <p className="text-xs text-muted-foreground">
                <strong>Note:</strong> Users will only see pages they have access to in the sidebar. 
                If a user tries to access a restricted page directly, they will be redirected to the dashboard.
              </p>
            </div>
          </div>
          <div className="flex gap-2 justify-end pt-4">
            <Button variant="outline" onClick={() => setPermissionsModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={handleSavePermissions}>
              <Save className="w-4 h-4 mr-2" />
              Save Permissions
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirmation Dialog */}
      <AlertDialog open={deleteCategoryDialogOpen} onOpenChange={setDeleteCategoryDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-display gradient-text">
              <Trash2 className="w-5 h-5 text-destructive" />
              Delete Category?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to delete the category <strong>"{categoryToDelete?.name}"</strong>?</p>
              <p className="text-sm text-muted-foreground">
                This action cannot be undone. Items in this category will need to be reassigned to another category.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDeleteCategory}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete User Confirmation Dialog */}
      <AlertDialog open={deleteUserDialogOpen} onOpenChange={setDeleteUserDialogOpen}>
        <AlertDialogContent className="glass-card">
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 font-display gradient-text">
              <Trash2 className="w-5 h-5 text-destructive" />
              Remove User?
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Are you sure you want to remove this user?</p>
              {userToDelete && (
                <div className="p-3 rounded-lg bg-muted/50 border border-border mt-2">
                  <p className="text-sm text-muted-foreground">
                    The user will lose access to the system immediately.
                  </p>
                </div>
              )}
              <p className="text-sm text-muted-foreground">
                This action cannot be undone.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-0">
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmRemoveUser}
              className="bg-destructive hover:bg-destructive/90 text-destructive-foreground"
            >
              Remove
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
