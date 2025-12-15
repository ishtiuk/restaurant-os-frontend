import React, { useState } from "react";
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
  Building2,
  Receipt,
  Globe,
  Shield,
  Save,
  Users,
  Plus,
  Trash2,
  Tag,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAppData } from "@/contexts/AppDataContext";

interface POSUser {
  id: string;
  name: string;
  nameBn?: string;
  email: string;
  phone: string;
  role: 'owner' | 'manager' | 'waiter' | 'cashier' | 'chef';
  pin: string;
  isActive: boolean;
  createdAt: string;
}

export default function Settings() {
  const { staff, categories, addCategory, removeCategory } = useAppData();
  const [language, setLanguage] = useState("en");
  const [isAddUserModalOpen, setIsAddUserModalOpen] = useState(false);
  const [users, setUsers] = useState<POSUser[]>([
    {
      id: "1",
      name: "Restaurant Owner",
      nameBn: "মালিক",
      email: "owner@restaurant.com",
      phone: "01711111111",
      role: "owner",
      pin: "1234",
      isActive: true,
      createdAt: new Date().toISOString(),
    },
  ]);
  const [newCategory, setNewCategory] = useState({ name: "", nameBn: "", icon: "🍽️" });

  const handleSave = () => {
    toast({
      title: "Settings saved!",
      description: "Your changes have been applied.",
    });
  };

  const handleAddCategory = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!newCategory.name.trim()) {
      toast({ title: "Category name required", variant: "destructive" });
      return;
    }
    await addCategory({
      name: newCategory.name.trim(),
      nameBn: newCategory.nameBn.trim() || undefined,
      icon: newCategory.icon || "🍽️",
    });
    setNewCategory({ name: "", nameBn: "", icon: "🍽️" });
    toast({ title: "Category added", description: newCategory.name });
  };

  const handleDeleteCategory = async (categoryId: string, name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    await removeCategory(categoryId);
    toast({ title: "Category deleted", description: name });
  };

  const handleAddUser = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newUser: POSUser = {
      id: String(Date.now()),
      name: formData.get("name") as string,
      nameBn: formData.get("nameBn") as string,
      email: formData.get("email") as string,
      phone: formData.get("phone") as string,
      role: formData.get("role") as POSUser["role"],
      pin: formData.get("pin") as string,
      isActive: true,
      createdAt: new Date().toISOString(),
    };
    setUsers(prev => [...prev, newUser]);
    setIsAddUserModalOpen(false);
    toast({
      title: "User created!",
      description: `${newUser.name} has been added as ${newUser.role}.`,
    });
  };

  const handleToggleUser = (userId: string) => {
    setUsers(prev => 
      prev.map(u => u.id === userId ? { ...u, isActive: !u.isActive } : u)
    );
    toast({
      title: "User status updated",
      description: "User access has been modified.",
    });
  };

  const handleRemoveUser = (userId: string) => {
    if (users.find(u => u.id === userId)?.role === "owner") {
      toast({
        title: "Cannot remove owner",
        description: "Owner account cannot be deleted.",
        variant: "destructive",
      });
      return;
    }
    if (confirm("Are you sure you want to remove this user?")) {
      setUsers(prev => prev.filter(u => u.id !== userId));
      toast({
        title: "User removed",
        description: "User has been deleted from the system.",
      });
    }
  };

  const getRoleBadge = (role: POSUser["role"]) => {
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
            <Input defaultValue="Dhaka Spice House" className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Phone Number</Label>
            <Input defaultValue="+880 1712-345678" className="bg-muted/50" />
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Address</Label>
            <Input defaultValue="123 Gulshan Avenue, Dhaka 1212" className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>VAT Registration No.</Label>
            <Input defaultValue="BIN-123456789" className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Trade License</Label>
            <Input defaultValue="TL-2024-001234" className="bg-muted/50" />
          </div>
        </div>
      </GlassCard>

        {/* Categories Management */}
        <GlassCard className="p-6 animate-fade-in stagger-2">
          <div className="flex items-center gap-3 mb-6">
            <div className="w-10 h-10 rounded-lg bg-accent/20 flex items-center justify-center">
              <Tag className="w-5 h-5 text-accent" />
            </div>
            <div>
              <h3 className="font-semibold">Menu Categories</h3>
              <p className="text-sm text-muted-foreground">Create and manage item categories</p>
            </div>
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
            <h3 className="font-semibold">Invoice Settings</h3>
            <p className="text-sm text-muted-foreground">চালান সেটিংস</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Invoice Prefix</Label>
            <Input defaultValue="INV-" className="bg-muted/50" />
          </div>
          <div className="space-y-2">
            <Label>Paper Size</Label>
            <Select defaultValue="a4">
              <SelectTrigger className="bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="a4">A4</SelectItem>
                <SelectItem value="thermal">Thermal (80mm)</SelectItem>
                <SelectItem value="thermal58">Thermal (58mm)</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2 md:col-span-2">
            <Label>Footer Text</Label>
            <Input defaultValue="Thank you for dining with us! আমাদের সাথে খাওয়ার জন্য ধন্যবাদ!" className="bg-muted/50" />
          </div>
        </div>
      </GlassCard>

      {/* Localization */}
      <GlassCard className="p-6 animate-fade-in stagger-3">
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
          <Button variant="glow" size="lg" onClick={handleSave}>
            <Save className="w-4 h-4 mr-2" />
            Save Changes
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
                    user.isActive
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
                        {user.nameBn && (
                          <span className="text-sm text-muted-foreground">({user.nameBn})</span>
                        )}
                        {getRoleBadge(user.role)}
                      </div>
                      <p className="text-sm text-muted-foreground">{user.email}</p>
                      <p className="text-xs text-muted-foreground">{user.phone} • PIN: {user.pin}</p>
                    </div>
                  </div>

                  <div className="flex items-center gap-2">
                    <div className="flex items-center gap-2">
                      <span className="text-sm text-muted-foreground">
                        {user.isActive ? "Active" : "Inactive"}
                      </span>
                      <Switch
                        checked={user.isActive}
                        onCheckedChange={() => handleToggleUser(user.id)}
                        disabled={user.role === "owner"}
                      />
                    </div>
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => handleRemoveUser(user.id)}
                      disabled={user.role === "owner"}
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
              <Label htmlFor="pin">4-Digit PIN *</Label>
              <Input
                id="pin"
                name="pin"
                type="text"
                placeholder="1234"
                maxLength={4}
                pattern="[0-9]{4}"
                required
                className="bg-muted/50"
              />
              <p className="text-xs text-muted-foreground">Used for quick login at POS</p>
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
    </div>
  );
}
