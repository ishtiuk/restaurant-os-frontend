import React, { useMemo, useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";
import {
  Users,
  Building2,
  Shield,
  Plus,
  Search,
  RefreshCw,
  UserPlus,
} from "lucide-react";

type Tenant = {
  id: string;
  name: string;
  plan: "basic" | "standard" | "pro";
  isActive: boolean;
  note?: string;
  createdAt: string;
};

type AdminUser = {
  id: string;
  name: string;
  email: string;
  role: "admin" | "manager";
  tenantId: string;
  isActive: boolean;
};

const planOptions: Tenant["plan"][] = ["basic", "standard", "pro"];

const seedTenants: Tenant[] = [
  { id: "t-1", name: "Demo Restaurant", plan: "standard", isActive: true, createdAt: "2024-12-01", note: "Demo data" },
];

const seedUsers: AdminUser[] = [
  { id: "u-1", name: "Owner Admin", email: "owner@demo.com", role: "admin", tenantId: "t-1", isActive: true },
  { id: "u-2", name: "Floor Manager", email: "manager@demo.com", role: "manager", tenantId: "t-1", isActive: true },
];

export default function Admin() {
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState<"tenants" | "users">("tenants");
  const [tenants, setTenants] = useState<Tenant[]>(seedTenants);
  const [users, setUsers] = useState<AdminUser[]>(seedUsers);
  const [tenantSearch, setTenantSearch] = useState("");
  const [userSearch, setUserSearch] = useState("");
  const [selectedTenantFilter, setSelectedTenantFilter] = useState<string>("all");

  const [tenantModalOpen, setTenantModalOpen] = useState(false);
  const [editingTenant, setEditingTenant] = useState<Tenant | null>(null);
  const [tenantForm, setTenantForm] = useState({
    name: "",
    plan: "basic" as Tenant["plan"],
    isActive: true,
    note: "",
  });

  const [userModalOpen, setUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<AdminUser | null>(null);
  const [userForm, setUserForm] = useState({
    name: "",
    email: "",
    role: "admin" as AdminUser["role"],
    tenantId: "",
    isActive: true,
  });

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
        const matchTenant = selectedTenantFilter === "all" || u.tenantId === selectedTenantFilter;
        return matchText && matchTenant;
      }),
    [users, userSearch, selectedTenantFilter]
  );

  const openTenantModal = (tenant?: Tenant) => {
    if (tenant) {
      setEditingTenant(tenant);
      setTenantForm({
        name: tenant.name,
        plan: tenant.plan,
        isActive: tenant.isActive,
        note: tenant.note || "",
      });
    } else {
      setEditingTenant(null);
      setTenantForm({ name: "", plan: "basic", isActive: true, note: "" });
    }
    setTenantModalOpen(true);
  };

  const openUserModal = (u?: AdminUser) => {
    if (u) {
      setEditingUser(u);
      setUserForm({
        name: u.name,
        email: u.email,
        role: u.role,
        tenantId: u.tenantId,
        isActive: u.isActive,
      });
    } else {
      setEditingUser(null);
      setUserForm({ name: "", email: "", role: "admin", tenantId: "", isActive: true });
    }
    setUserModalOpen(true);
  };

  const saveTenant = () => {
    if (!tenantForm.name.trim()) {
      toast({ title: "Tenant name required", variant: "destructive" });
      return;
    }
    if (editingTenant) {
      setTenants((prev) =>
        prev.map((t) =>
          t.id === editingTenant.id ? { ...t, ...tenantForm } : t
        )
      );
      toast({ title: "Tenant updated" });
    } else {
      setTenants((prev) => [
        {
          id: `t-${Date.now()}`,
          name: tenantForm.name,
          plan: tenantForm.plan,
          isActive: tenantForm.isActive,
          note: tenantForm.note,
          createdAt: new Date().toISOString().slice(0, 10),
        },
        ...prev,
      ]);
      toast({ title: "Tenant created" });
    }
    setTenantModalOpen(false);
  };

  const saveUser = () => {
    if (!userForm.name.trim() || !userForm.email.trim()) {
      toast({ title: "Name and email required", variant: "destructive" });
      return;
    }
    if (!userForm.tenantId) {
      toast({ title: "Select a tenant", variant: "destructive" });
      return;
    }
    if (user?.role === "admin" && userForm.role !== "manager") {
      toast({ title: "Admins can only create managers", variant: "destructive" });
      return;
    }
    if (editingUser) {
      setUsers((prev) =>
        prev.map((u) => (u.id === editingUser.id ? { ...u, ...userForm } : u))
      );
      toast({ title: "User updated" });
    } else {
      setUsers((prev) => [
        {
          id: `u-${Date.now()}`,
          ...userForm,
        },
        ...prev,
      ]);
      toast({ title: "User created" });
    }
    setUserModalOpen(false);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Admin Panel</h1>
          <p className="text-muted-foreground">Superadmin creates tenants and admins; admins create managers.</p>
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
                <Button variant="ghost" onClick={() => setTenants(seedTenants)}>
                  <RefreshCw className="w-4 h-4 mr-2" />
                  Reset
                </Button>
              </div>
            </div>
          </GlassCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {filteredTenants.map((t) => (
              <GlassCard key={t.id} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-semibold">{t.name}</h3>
                    <p className="text-xs text-muted-foreground">Created {t.createdAt}</p>
                  </div>
                  <Badge variant={t.isActive ? "success" : "outline"}>{t.isActive ? "Active" : "Inactive"}</Badge>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  Plan:
                  <Badge variant="outline" className="ml-1">
                    {t.plan}
                  </Badge>
                </div>
                {t.note && <p className="text-sm text-muted-foreground">{t.note}</p>}
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" size="sm" onClick={() => openTenantModal(t)}>
                    Edit
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
              const tenant = tenants.find((t) => t.id === u.tenantId);
              return (
                <GlassCard key={u.id} className="p-4 space-y-2">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="font-semibold">{u.name}</h3>
                      <p className="text-xs text-muted-foreground">{u.email}</p>
                    </div>
                    <Badge variant={u.isActive ? "success" : "outline"}>{u.isActive ? "Active" : "Inactive"}</Badge>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Role: {u.role}
                  </div>
                  <div className="flex items-center gap-2 text-sm text-muted-foreground">
                    Tenant: {tenant?.name || "Unknown"}
                  </div>
                  <div className="flex gap-2 pt-2">
                    <Button variant="outline" size="sm" onClick={() => openUserModal(u)}>
                      Edit
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => setUsers((prev) => prev.filter((x) => x.id !== u.id))}>
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
              <Select value={tenantForm.plan} onValueChange={(v) => setTenantForm({ ...tenantForm, plan: v as Tenant["plan"] })}>
                <SelectTrigger className="bg-muted/50">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {planOptions.map((p) => (
                    <SelectItem key={p} value={p}>
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

      {/* User Modal */}
      <Dialog open={userModalOpen} onOpenChange={setUserModalOpen}>
        <DialogContent className="glass-card max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display gradient-text">
              {editingUser ? "Edit User" : "Add User"}
            </DialogTitle>
            <DialogDescription>Superadmin creates Admin; Admin creates Manager.</DialogDescription>
          </DialogHeader>
          <div className="space-y-3">
            <div className="space-y-1">
              <Label>Name</Label>
              <Input value={userForm.name} onChange={(e) => setUserForm({ ...userForm, name: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Email</Label>
              <Input value={userForm.email} onChange={(e) => setUserForm({ ...userForm, email: e.target.value })} />
            </div>
            <div className="space-y-1">
              <Label>Role</Label>
              <Select
                value={userForm.role}
                onValueChange={(v) => setUserForm({ ...userForm, role: v as AdminUser["role"] })}
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
