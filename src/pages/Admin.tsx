import React, { useEffect, useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import { useTimezone } from "@/contexts/TimezoneContext";
import { formatDate } from "@/utils/date";
import { adminApi, type AdminTenant, type AdminUser, type TenantCreateInput } from "@/lib/api/admin";
import {
  Users,
  Building2,
  Shield,
  Plus,
  Search,
  RefreshCw,
  UserPlus,
  Settings2,
  RotateCcw,
} from "lucide-react";

// All available features in the system (real features from the app)
const ALL_FEATURES = [
  { id: "dashboard", name: "Dashboard", category: "Main" },
  { id: "pos_sales", name: "POS Sales", category: "Main" },
  { id: "tables", name: "Tables", category: "Main" },
  { id: "items", name: "Items", category: "Main" },
  { id: "purchases", name: "Purchases", category: "Operations" },
  { id: "suppliers", name: "Suppliers", category: "Operations" },
  { id: "staff", name: "Staff", category: "Operations" },
  { id: "customers", name: "Customers", category: "Operations" },
  { id: "reports", name: "Reports", category: "Analytics" },
  { id: "sales_history", name: "Sales History", category: "Analytics" },
  { id: "finance", name: "Finance", category: "Analytics" },
  { id: "void_management", name: "Void Management", category: "Operations" },
] as const;

// Default features by plan
const PLAN_FEATURES: Record<string, string[]> = {
  basic: ["dashboard", "pos_sales", "items", "reports", "sales_history"],
  professional: ["dashboard", "pos_sales", "tables", "items", "purchases", "suppliers", "staff", "reports", "sales_history", "finance"],
  enterprise: ALL_FEATURES.map(f => f.id),
};

const FEATURE_CATEGORIES = [...new Set(ALL_FEATURES.map(f => f.category))];

type TenantPlan = "basic" | "professional" | "enterprise";

type UITenant = AdminTenant & {
  plan: TenantPlan;
  note?: string;
  enabledFeatures: string[];
};

type UIAdminUser = AdminUser & {
  // frontend view role: "admin" (owner) or "manager"
  uiRole: "admin" | "manager";
};

const planOptions: TenantPlan[] = ["basic", "professional", "enterprise"];

export default function Admin() {
  const { user } = useAuth();
  const { timezone } = useTimezone();
  const [activeTab, setActiveTab] = useState<"tenants" | "users">("tenants");
  const [tenants, setTenants] = useState<UITenant[]>([]);
  const [users, setUsers] = useState<UIAdminUser[]>([]);
  const [tenantSearch, setTenantSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all");

  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<UITenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: "",
    plan: "starter" as TenantPlan,
    isActive: true,
    note: "",
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UIAdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    password: "",
    phone: "",
    role: "admin" as UIAdminUser["uiRole"],
    tenantId: "",
    isActive: true,
  });

  // Feature management state
  const [featureModalOpen, setFeatureModalOpen] = useState(false);
  const [featureEditTenant, setFeatureEditTenant] = useState<UITenant | null>(null);
  const [selectedFeatures, setSelectedFeatures] = useState<string[]>([]);

  const loadTenantsAndUsers = async () => {
    if (user?.role !== "superadmin") return;
    try {
      const [tenantRes, userRes] = await Promise.all([
        adminApi.listTenants(),
        adminApi.listUsers(),
      ]);
      const mappedTenants: UITenant[] = tenantRes.map((t) => ({
        ...t,
        plan: "basic", // default; can be extended later
        enabledFeatures: [...PLAN_FEATURES["basic"]],
      }));
      const mappedUsers: UIAdminUser[] = userRes.map((u) => ({
        ...u,
        uiRole: u.role === "owner" ? "admin" : "manager",
      }));
      setTenants(mappedTenants);
      setUsers(mappedUsers);
    } catch (err) {
      console.error("Failed to load tenants/users", err);
    }
  };

  useEffect(() => {
    if (user?.role === "superadmin") {
      loadTenantsAndUsers();
    }
  }, [user?.role]);

  const filteredTenants = useMemo(
    () =>
      tenants.filter((t) => t.name.toLowerCase().includes(tenantSearch.toLowerCase())),
    [tenants, tenantSearch]
  );

  const filteredUsers = useMemo(
    () =>
      users.filter((u) => {
        const matchText =
          u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
          u.email.toLowerCase().includes(userSearch.toLowerCase());
        const matchTenant = selectedTenantFilter === "all" || u.tenant_id === selectedTenantFilter;
        return matchText && matchTenant;
      }),
    [users, userSearch, selectedTenantFilter]
  );

  const openTenantModal = (tenant?: UITenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setTenantForm({
        name: tenant.name,
        plan: tenant.plan,
        isActive: tenant.is_active,
        note: tenant.note || "",
      });
    } else {
      setEditingTenant(null);
      setTenantForm({ name: "", plan: "basic", isActive: true, note: "" });
    }
    setTenantModalOpen(true);
  };

  const openFeatureModal = (tenant: UITenant) => {
    setFeatureEditTenant(tenant);
    setSelectedFeatures([...tenant.enabledFeatures]);
    setFeatureModalOpen(true);
  };

  const toggleFeature = (featureId: string) => {
    setSelectedFeatures((prev) =>
      prev.includes(featureId)
        ? prev.filter((f) => f !== featureId)
        : [...prev, featureId]
    );
  };

  const applyPlanDefaults = () => {
    if (featureEditTenant) {
      setSelectedFeatures([...PLAN_FEATURES[featureEditTenant.plan]]);
    }
  };

  const saveFeatures = () => {
    if (!featureEditTenant) return;
    setTenants((prev) =>
      prev.map((t) =>
        t.id === featureEditTenant.id ? { ...t, enabledFeatures: selectedFeatures } : t
      )
    );
    toast({ title: "Features updated" });
    setFeatureModalOpen(false);
  };

  const openUserModal = (u?: UIAdminUser) => {
    if (u) {
      setEditingUser(u);
      setUserForm({
        name: u.name,
        email: u.email,
        password: "", // Never show password for security
        phone: u.phone || "",
        role: u.uiRole,
        tenantId: u.tenant_id,
        isActive: u.is_active,
      });
    } else {
      setEditingUser(null);
      setUserForm({
        name: "",
        email: "",
        password: "",
        phone: "",
        role: "admin",
        tenantId: "",
        isActive: true,
      });
    }
    setUserModalOpen(true);
  };

  const saveTenant = async () => {
    if (!tenantForm.name.trim()) {
      toast({ title: "Tenant name required", variant: "destructive" });
      return;
    }
    if (editingTenant) {
      try {
        const updated = await adminApi.updateTenant(editingTenant.id, {
          name: tenantForm.name,
          // Backend has no plan/notes yet; only map basic fields
          is_active: tenantForm.isActive,
        });
        setTenants((prev) =>
          prev.map((t) =>
            t.id === updated.id
              ? {
                  ...t,
                  ...updated,
                  plan: tenantForm.plan,
                  note: tenantForm.note,
                }
              : t
          )
        );
        toast({ title: "Tenant updated" });
      } catch (err: any) {
        toast({
          title: "Failed to update tenant",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
      }
    } else {
      try {
        const payload: TenantCreateInput = {
          name: tenantForm.name,
          // email/phone/address can be filled later via edit
        };
        const created = await adminApi.createTenant(payload);
        const newPlan = tenantForm.plan;
        const mapped: UITenant = {
          ...created,
          plan: newPlan,
          note: tenantForm.note,
          enabledFeatures: [...PLAN_FEATURES[newPlan]],
        };
        setTenants((prev) => [mapped, ...prev]);
        toast({ title: "Tenant created" });
      } catch (err: any) {
        toast({
          title: "Failed to create tenant",
          description: err?.message || "Please try again.",
          variant: "destructive",
        });
      }
    }
    setTenantModalOpen(false);
  };

  const saveUser = async () => {
    if (!userForm.name.trim() || !userForm.email.trim() || !userForm.password.trim()) {
      toast({ title: "Name, email and password required", variant: "destructive" });
      return;
    }
    if (!userForm.tenantId) {
      toast({ title: "Select a tenant", variant: "destructive" });
      return;
    }
    // Tenant owners (role = "owner") can only create manager-level admin users
    if (user?.role === "owner" && userForm.role !== "manager") {
      toast({ title: "Owners can only create managers", variant: "destructive" });
      return;
    }
    const backendRole = userForm.role === "admin" ? "admin" : "manager";
    try {
      if (editingUser) {
        const updated = await adminApi.updateUser(editingUser.id, {
          name: userForm.name,
          email: userForm.email,
          role: backendRole,
          is_active: userForm.isActive,
        });
        const mapped: UIAdminUser = {
          ...updated,
          uiRole: updated.role === "owner" ? "admin" : "manager",
        };
        setUsers((prev) => prev.map((u) => (u.id === mapped.id ? mapped : u)));
        toast({ title: "User updated" });
      } else {
        const created = await adminApi.createUser({
          tenant_id: userForm.tenantId,
          email: userForm.email,
          password: userForm.password,
          name: userForm.name,
          ...(userForm.phone?.trim() && { phone: userForm.phone.trim() }), // Only include if provided
          role: backendRole,
        });
        const mapped: UIAdminUser = {
          ...created,
          uiRole: created.role === "owner" ? "admin" : "manager",
        };
        setUsers((prev) => [mapped, ...prev]);
        toast({ title: "User created" });
      }
      setUserModalOpen(false);
    } catch (err: any) {
      toast({
        title: "Failed to save user",
        description: err?.message || "Please try again.",
        variant: "destructive",
      });
    }
  };

  const getPlanBadgeVariant = (plan: TenantPlan) => {
    switch (plan) {
      case "basic": return "outline";
      case "professional": return "secondary";
      case "enterprise": return "default";
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Admin Panel</h1>
          <p className="text-muted-foreground">
            System superadmin provisions tenants and restaurant owners (admins); owners create their managers.
          </p>
        </div>
        <Badge variant="warning" className="self-start">
          <Shield className="w-3 h-3 mr-1" />
          {user?.role === "superadmin" ? "Super Admin" : "Admin"}
        </Badge>
      </div>

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as "tenants" | "users")}>
        <TabsList>
          <TabsTrigger value="tenants">
            <Building2 className="w-4 h-4 mr-1" />
            Tenants
          </TabsTrigger>
          <TabsTrigger value="users">
            <Users className="w-4 h-4 mr-1" />
            Users
          </TabsTrigger>
        </TabsList>

        <TabsContent value="tenants" className="space-y-4 pt-4">
          <GlassCard className="p-4">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              <div className="relative w-full sm:max-w-xs">
                <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
                <Input
                  placeholder="Search tenants..."
                  value={tenantSearch}
                  onChange={(e) => setTenantSearch(e.target.value)}
                  className="pl-9"
                />
              </div>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => openTenantModal()}>
                  <Plus className="w-4 h-4 mr-2" />
                  Add Tenant
                </Button>
                <Button variant="ghost" onClick={loadTenantsAndUsers}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTenants.map((t) => (
              <GlassCard key={t.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">Created {formatDate(t.created_at, timezone)}</p>
                  </div>
                  <Badge variant={t.is_active ? "success" : "outline"}>{t.is_active ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Plan:
                  <Badge variant={getPlanBadgeVariant(t.plan)} className="ml-1 capitalize">
                    {t.plan}
                  </Badge>
                </div>
                {t.note && <p className="text-sm text-muted-foreground">{t.note}</p>}
                <div className="flex gap-2 pt-2 flex-wrap">
                  <Button variant="outline" size="sm" onClick={() => openTenantModal(t)}>
                    Edit
                  </Button>
                  <Button variant="secondary" size="sm" onClick={() => openFeatureModal(t)}>
                    <Settings2 className="w-3 h-3 mr-1" />
                    Features
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setTenants((prev) => prev.filter((x) => x.id !== t.id))}
                  >
                    Delete
                  </Button>
                </div>
              </GlassCard>
            ))}
            {filteredTenants.length === 0 && (
              <GlassCard className="p-8 text-center text-muted-foreground">No tenants found</GlassCard>
            )}
          </div>
        </TabsContent>

        <TabsContent value="users" className="space-y-4 pt-4">
          <GlassCard className="p-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div className="relative w-full sm:max-w-xs">
              <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search users..."
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                className="pl-9"
              />
            </div>
            <div className="flex gap-2 items-center">
              <Select value={selectedTenantFilter} onValueChange={setSelectedTenantFilter}>
                <SelectTrigger className="w-48">
                  <SelectValue placeholder="Filter tenant" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All tenants</SelectItem>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => openUserModal()}>
                <UserPlus className="w-4 h-4 mr-2" />
                Add User
              </Button>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredUsers.map((u) => {
              const tenant = tenants.find((t) => t.id === u.tenant_id);
              return (
                <GlassCard key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{u.name}</h3>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant={u.is_active ? "success" : "outline"}>{u.is_active ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Role: {u.uiRole}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Tenant: {tenant?.name || "Unknown"}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openUserModal(u)}>
                      Edit
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={async () => {
                        try {
                          await adminApi.deleteUser(u.id);
                          setUsers((prev) => prev.filter((x) => x.id !== u.id));
                        } catch (err: any) {
                          toast({
                            title: "Failed to remove user",
                            description: err?.message || "Please try again.",
                            variant: "destructive",
                          });
                        }
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </GlassCard>
              );
            })}
            {filteredUsers.length === 0 && (
              <GlassCard className="p-8 text-center text-muted-foreground">No users found</GlassCard>
            )}
          </div>
        </TabsContent>
      </Tabs>

      {/* Tenant Modal */}
      <Dialog open={tenantModalOpen} onOpenChange={setTenantModalOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              {editingTenant ? "Edit Tenant" : "Add Tenant"}
            </DialogTitle>
            <DialogDescription>Superadmin can create tenants; Admin can view but not create.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={tenantForm.name} onChange={(e) => setTenantForm({ ...tenantForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Plan</Label>
              <Select value={tenantForm.plan} onValueChange={(v) => setTenantForm({ ...tenantForm, plan: v as TenantPlan })}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((p) => (
                    <SelectItem key={p} value={p} className="capitalize">
                      {p}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Notes</Label>
              <Textarea
                value={tenantForm.note}
                onChange={(e) => setTenantForm({ ...tenantForm, note: e.target.value })}
                placeholder="Internal note..."
                className="bg-muted/50"
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setTenantModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={saveTenant} disabled={user?.role !== "superadmin"}>
              {editingTenant ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Feature Management Modal */}
      <Dialog open={featureModalOpen} onOpenChange={setFeatureModalOpen}>
        <DialogContent className="glass-card max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              Manage Features: {featureEditTenant?.name}
            </DialogTitle>
            <DialogDescription>
              Enable or disable features for this tenant. Current plan: <Badge variant={featureEditTenant ? getPlanBadgeVariant(featureEditTenant.plan) : "outline"} className="capitalize ml-1">{featureEditTenant?.plan}</Badge>
            </DialogDescription>
          </DialogHeader>
          
          <div className="flex gap-2 mb-4">
            <Button variant="outline" size="sm" onClick={applyPlanDefaults}>
              <RotateCcw className="w-3 h-3 mr-1" />
              Reset to Plan Defaults
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedFeatures(ALL_FEATURES.map(f => f.id))}
            >
              Enable All
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setSelectedFeatures([])}
            >
              Disable All
            </Button>
          </div>

          <div className="space-y-6">
            {FEATURE_CATEGORIES.map((category) => (
              <div key={category} className="space-y-3">
                <h4 className="text-sm font-semibold text-muted-foreground uppercase tracking-wide">{category}</h4>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {ALL_FEATURES.filter(f => f.category === category).map((feature) => {
                    const isEnabled = selectedFeatures.includes(feature.id);
                    const isPlanDefault = PLAN_FEATURES[featureEditTenant?.plan || "basic"].includes(feature.id);
                    return (
                      <div
                        key={feature.id}
                        className={`flex items-center gap-3 p-3 rounded-lg border transition-colors cursor-pointer ${
                          isEnabled 
                            ? "bg-primary/10 border-primary/30" 
                            : "bg-muted/30 border-border/50 opacity-60"
                        }`}
                        onClick={() => toggleFeature(feature.id)}
                      >
                        <Checkbox
                          checked={isEnabled}
                          onCheckedChange={() => toggleFeature(feature.id)}
                        />
                        <div className="flex-1">
                          <span className="text-sm font-medium">{feature.name}</span>
                          {isPlanDefault && (
                            <Badge variant="outline" className="ml-2 text-xs">Plan Default</Badge>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>

          <DialogFooter className="mt-6">
            <Button variant="outline" onClick={() => setFeatureModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={saveFeatures} disabled={user?.role !== "superadmin"}>
              Save Features
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* User Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              {editingUser ? "Edit User" : "Add User"}
            </DialogTitle>
            <DialogDescription>System superadmin creates restaurant admins; admins create managers.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input
                value={userForm.email}
                onChange={(e) => setUserForm({ ...userForm, email: e.target.value })}
                type="email"
              />
            </div>
            <div className="space-y-1">
              <Label>Password</Label>
              <Input
                value={userForm.password}
                onChange={(e) => setUserForm({ ...userForm, password: e.target.value })}
                type="password"
              />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(v) => setUserForm({ ...userForm, role: v as UIAdminUser["uiRole"] })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin" disabled={user?.role !== "superadmin"}>
                    Admin (tenant owner)
                  </SelectItem>
                  <SelectItem value="manager">Manager</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1">
              <Label>Tenant</Label>
              <Select
                value={userForm.tenantId}
                onValueChange={(v) => setUserForm({ ...userForm, tenantId: v })}
              >
                <SelectTrigger className="bg-muted/50">
                  <SelectValue placeholder="Select tenant" />
                </SelectTrigger>
                <SelectContent>
                  {tenants.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setUserModalOpen(false)}>
              Cancel
            </Button>
            <Button variant="glow" onClick={saveUser}>
              {editingUser ? "Update" : "Create"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
