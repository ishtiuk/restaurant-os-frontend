import React from "react";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Users,
  Building2,
  Shield,
  Activity,
  Settings,
  Database,
  Key,
  RefreshCw,
} from "lucide-react";

const adminModules = [
  {
    title: "User Management",
    titleBn: "ব্যবহারকারী",
    icon: Users,
    description: "Manage employees and roles",
    count: "12 users",
    color: "primary",
  },
  {
    title: "Branch Management",
    titleBn: "শাখা",
    icon: Building2,
    description: "Multi-location settings",
    count: "3 branches",
    color: "secondary",
  },
  {
    title: "Permissions",
    titleBn: "অনুমতি",
    icon: Shield,
    description: "Role-based access control",
    count: "4 roles",
    color: "accent",
  },
  {
    title: "System Logs",
    titleBn: "লগ",
    icon: Activity,
    description: "Audit trail and activity",
    count: "2,450 entries",
    color: "primary",
  },
  {
    title: "Database",
    titleBn: "ডাটাবেস",
    icon: Database,
    description: "Backup and restore",
    count: "Last: 2h ago",
    color: "secondary",
  },
  {
    title: "API Keys",
    titleBn: "এপিআই",
    icon: Key,
    description: "Integration credentials",
    count: "3 active",
    color: "accent",
  },
];

const recentActivity = [
  { user: "Admin", action: "Updated pricing for Kacchi Biriyani", time: "5 min ago" },
  { user: "Manager", action: "Added new supplier: Fresh Foods BD", time: "1 hour ago" },
  { user: "Cashier 1", action: "Processed refund #RF001", time: "2 hours ago" },
  { user: "Admin", action: "Created backup", time: "3 hours ago" },
  { user: "Manager", action: "Updated stock for 15 items", time: "5 hours ago" },
];

export default function Admin() {
  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-3xl font-display font-bold gradient-text">Admin Panel</h1>
          <p className="text-muted-foreground">সিস্টেম অ্যাডমিনিস্ট্রেশন • System Administration</p>
        </div>
        <Badge variant="warning" className="self-start">
          <Shield className="w-3 h-3 mr-1" />
          Super Admin
        </Badge>
      </div>

      {/* Admin Modules */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminModules.map((module, index) => (
          <GlassCard
            key={module.title}
            hover
            glow={module.color as "primary" | "accent" | "secondary"}
            className="p-5 cursor-pointer animate-fade-in"
            style={{ animationDelay: `${index * 0.1}s` }}
          >
            <div className="flex items-center gap-4">
              <div className={`w-12 h-12 rounded-xl bg-${module.color}/20 flex items-center justify-center`}>
                <module.icon className={`w-6 h-6 text-${module.color}`} />
              </div>
              <div className="flex-1">
                <h3 className="font-semibold">{module.title}</h3>
                <p className="text-sm text-muted-foreground">{module.description}</p>
              </div>
            </div>
            <div className="mt-4 pt-4 border-t border-border flex items-center justify-between">
              <span className="text-sm text-muted-foreground">{module.count}</span>
              <Button variant="ghost" size="sm">
                Manage
              </Button>
            </div>
          </GlassCard>
        ))}
      </div>

      {/* Quick Actions & Activity */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Quick Actions */}
        <GlassCard className="p-6 animate-fade-in stagger-2">
          <h3 className="font-display font-semibold text-lg mb-4">Quick Actions</h3>
          <div className="grid grid-cols-2 gap-3">
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Database className="w-5 h-5" />
              <span>Backup Now</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <RefreshCw className="w-5 h-5" />
              <span>Sync Data</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Users className="w-5 h-5" />
              <span>Add User</span>
            </Button>
            <Button variant="outline" className="h-auto py-4 flex-col gap-2">
              <Settings className="w-5 h-5" />
              <span>System Config</span>
            </Button>
          </div>
        </GlassCard>

        {/* Recent Activity */}
        <GlassCard className="p-6 animate-fade-in stagger-3">
          <div className="flex items-center justify-between mb-4">
            <h3 className="font-display font-semibold text-lg">Recent Activity</h3>
            <Button variant="ghost" size="sm">View All</Button>
          </div>
          <div className="space-y-3">
            {recentActivity.map((activity, index) => (
              <div key={index} className="flex items-start gap-3 p-3 rounded-lg bg-muted/30">
                <div className="w-8 h-8 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground text-xs font-bold flex-shrink-0">
                  {activity.user.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm">
                    <span className="font-medium">{activity.user}</span>{" "}
                    <span className="text-muted-foreground">{activity.action}</span>
                  </p>
                  <p className="text-xs text-muted-foreground">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </GlassCard>
      </div>

      {/* System Status */}
      <GlassCard className="p-6 animate-fade-in stagger-4">
        <h3 className="font-display font-semibold text-lg mb-4">System Status</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="p-4 rounded-lg bg-accent/10 border border-accent/20">
            <p className="text-sm text-muted-foreground">Server Status</p>
            <div className="flex items-center gap-2 mt-1">
              <div className="w-2 h-2 rounded-full bg-accent animate-pulse" />
              <span className="font-medium text-accent">Online</span>
            </div>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">Database</p>
            <p className="font-medium mt-1">PostgreSQL 15</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">Last Backup</p>
            <p className="font-medium mt-1">2 hours ago</p>
          </div>
          <div className="p-4 rounded-lg bg-muted/30">
            <p className="text-sm text-muted-foreground">API Version</p>
            <p className="font-medium mt-1">v2.1.0</p>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
