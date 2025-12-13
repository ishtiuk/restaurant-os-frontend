import React, { useState } from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Building2,
  Receipt,
  Globe,
  Palette,
  Bell,
  Shield,
  Save,
} from "lucide-react";
import { toast } from "@/hooks/use-toast";

export default function Settings() {
  const [theme, setTheme] = useState("dark");
  const [language, setLanguage] = useState("en");

  const handleSave = () => {
    toast({
      title: "Settings saved!",
      description: "Your changes have been applied.",
    });
  };

  return (
    <div className="space-y-6 max-w-4xl">
      {/* Header */}
      <div className="animate-fade-in">
        <h1 className="text-3xl font-display font-bold gradient-text">Settings</h1>
        <p className="text-muted-foreground">সেটিংস ম্যানেজমেন্ট • System Configuration</p>
      </div>

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

      {/* Appearance */}
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-primary/20 flex items-center justify-center">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="font-semibold">Appearance</h3>
            <p className="text-sm text-muted-foreground">রূপ সেটিংস</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Theme</p>
              <p className="text-sm text-muted-foreground">Choose light or dark mode</p>
            </div>
            <Select value={theme} onValueChange={setTheme}>
              <SelectTrigger className="w-32 bg-muted/50">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="dark">Dark</SelectItem>
                <SelectItem value="light">Light</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Compact Mode</p>
              <p className="text-sm text-muted-foreground">Reduce spacing for more content</p>
            </div>
            <Switch />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Animations</p>
              <p className="text-sm text-muted-foreground">Enable UI animations</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </GlassCard>

      {/* Notifications */}
      <GlassCard className="p-6 animate-fade-in stagger-5">
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-lg bg-secondary/20 flex items-center justify-center">
            <Bell className="w-5 h-5 text-secondary" />
          </div>
          <div>
            <h3 className="font-semibold">Notifications</h3>
            <p className="text-sm text-muted-foreground">বিজ্ঞপ্তি সেটিংস</p>
          </div>
        </div>

        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Low Stock Alerts</p>
              <p className="text-sm text-muted-foreground">Get notified when items are low</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Daily Sales Summary</p>
              <p className="text-sm text-muted-foreground">Receive daily sales report</p>
            </div>
            <Switch defaultChecked />
          </div>

          <div className="flex items-center justify-between">
            <div>
              <p className="font-medium">Order Alerts</p>
              <p className="text-sm text-muted-foreground">Sound notification for new orders</p>
            </div>
            <Switch defaultChecked />
          </div>
        </div>
      </GlassCard>

      {/* Save Button */}
      <div className="flex justify-end">
        <Button variant="glow" size="lg" onClick={handleSave}>
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
      </div>
    </div>
  );
}
