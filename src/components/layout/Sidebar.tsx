import { NavLink, useLocation, useNavigate } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  Package,
  ShoppingCart,
  Truck,
  Users,
  UserCircle,
  Wallet,
  BarChart3,
  Settings,
  Shield,
  X,
  Utensils,
  LogOut,
  User,
  Clock,
  History,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";
import { usePermissions } from "@/contexts/PermissionsContext";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const mainNavigation = [
  { path: "/dashboard", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { path: "/sales", label: "POS Sales", labelBn: "বিক্রয়", icon: ShoppingCart },
  { path: "/tables", label: "Tables", labelBn: "টেবিল", icon: Utensils },
  { path: "/items", label: "Items", labelBn: "আইটেম", icon: Package },
];

const operationsNavigation = [
  { path: "/purchases", label: "Purchases", labelBn: "ক্রয়", icon: Truck },
  { path: "/suppliers", label: "Suppliers", labelBn: "সরবরাহকারী", icon: Users },
  { path: "/customers", label: "Customers", labelBn: "গ্রাহক", icon: UserCircle },
  { path: "/staff", label: "Staff", labelBn: "কর্মী", icon: User },
  { path: "/attendance", label: "Attendance", labelBn: "হাজিরা", icon: Clock },
];

const analyticsNavigation = [
  { path: "/reports", label: "Reports", labelBn: "রিপোর্ট", icon: BarChart3 },
  { path: "/sales-history", label: "Sales History", labelBn: "বিক্রয় ইতিহাস", icon: History },
  { path: "/finance", label: "Finance", labelBn: "আর্থিক", icon: Wallet },
  { path: "/settings", label: "Settings", labelBn: "সেটিংস", icon: Settings },
];

export function Sidebar({ className, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const { canAccess } = usePermissions();
  const location = useLocation();
  const navigate = useNavigate();

  // Define allowed pages for non-superadmin users
  const allowedPagesForNonSuperadmin = [
    "/dashboard",
    "/sales",
    "/tables",
    "/items",
    "/purchases",
    "/suppliers",
    "/staff",
    "/reports",
    "/sales-history",
    "/finance",
    "/finance/transactions",
    "/finance/banks",
    "/settings",
  ];

  // Filter navigation based on user role
  const isSuperadmin = user?.role === "superadmin";
  
  const filteredMainNavigation = mainNavigation.filter((item) => {
    if (!canAccess(item.path)) return false;
    if (isSuperadmin) return true;
    return allowedPagesForNonSuperadmin.includes(item.path);
  });

  const filteredOperationsNavigation = operationsNavigation.filter((item) => {
    if (!canAccess(item.path)) return false;
    if (isSuperadmin) return true;
    return allowedPagesForNonSuperadmin.includes(item.path);
  });

  const filteredAnalyticsNavigation = analyticsNavigation.filter((item) => {
    if (!canAccess(item.path)) return false;
    if (isSuperadmin) return true;
    return allowedPagesForNonSuperadmin.includes(item.path);
  });

  return (
    <aside
      className={cn(
        "w-64 bg-sidebar border-r border-sidebar-border flex flex-col h-screen",
        className
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-11 h-11 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Utensils className="w-6 h-6 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-xl gradient-text">RestaurantOS</h1>
            <p className="text-xs text-muted-foreground">রেস্টুরেন্ট ম্যানেজমেন্ট সিস্টেম</p>
          </div>
        </div>
        {onClose && (
          <Button
            variant="ghost"
            size="icon"
            onClick={onClose}
            className="lg:hidden"
          >
            <X className="w-5 h-5" />
          </Button>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 min-h-0 py-4 px-3 overflow-y-auto custom-scrollbar space-y-4">
        <div>
          <p className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1">Main</p>
          <ul className="space-y-1">
            {filteredMainNavigation.map((item) => {
              const isActive = location.pathname === item.path;
              return (
                <li key={item.path}>
                  <NavLink
                    to={item.path}
                    onClick={onClose}
                    className={cn(
                      "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                      isActive
                        ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
                        : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                    )}
                  >
                    <item.icon className={cn("w-5 h-5", isActive && "text-sidebar-primary")} />
                    <span>{item.label}</span>
                  </NavLink>
                </li>
              );
            })}
          </ul>
        </div>

        {filteredOperationsNavigation.length > 0 && (
          <div>
            <p className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1">Operations</p>
            <ul className="space-y-1">
              {filteredOperationsNavigation.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive && "text-sidebar-primary")} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {filteredAnalyticsNavigation.length > 0 && (
          <div>
            <p className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1">Analytics & Settings</p>
            <ul className="space-y-1">
              {filteredAnalyticsNavigation.map((item) => {
                const isActive = location.pathname === item.path;
                return (
                  <li key={item.path}>
                    <NavLink
                      to={item.path}
                      onClick={onClose}
                      className={cn(
                        "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                        isActive
                          ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
                          : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                      )}
                    >
                      <item.icon className={cn("w-5 h-5", isActive && "text-sidebar-primary")} />
                      <span>{item.label}</span>
                    </NavLink>
                  </li>
                );
              })}
            </ul>
          </div>
        )}

        {user?.role === "superadmin" && (
          <div>
            <p className="px-3 text-[11px] uppercase tracking-wide text-muted-foreground/70 mb-1">System Admin</p>
            <ul className="space-y-1">
              <li>
                <NavLink
                  to="/admin"
                  onClick={onClose}
                  className={cn(
                    "flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200",
                    location.pathname === "/admin"
                      ? "bg-sidebar-accent text-sidebar-primary border-l-2 border-sidebar-primary"
                      : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-sidebar-accent-foreground"
                  )}
                >
                  <Shield className={cn("w-5 h-5", location.pathname === "/admin" && "text-sidebar-primary")} />
                  <span>Admin Panel</span>
                </NavLink>
              </li>
            </ul>
          </div>
        )}

      </nav>

      {/* Footer pinned */}
      <div className="sticky bottom-0 z-10 border-t border-sidebar-border bg-sidebar/95 backdrop-blur supports-[backdrop-filter]:bg-sidebar/75 p-4 space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground truncate">{user ? `${user.role} role` : "Not signed in"}</p>
          </div>
          <ThemeToggle />
          <Button
            variant="ghost"
            size="icon"
            onClick={() => {
              logout();
              navigate("/login");
            }}
            title="Logout"
          >
            <LogOut className="w-4 h-4" />
          </Button>
        </div>
      </div>
    </aside>
  );
}
