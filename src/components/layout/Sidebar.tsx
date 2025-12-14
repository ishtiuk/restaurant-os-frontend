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
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/ThemeToggle";
import { useAuth } from "@/contexts/AuthContext";

interface SidebarProps {
  className?: string;
  onClose?: () => void;
}

const navItems = [
  { path: "/dashboard", label: "Dashboard", labelBn: "ড্যাশবোর্ড", icon: LayoutDashboard },
  { path: "/items", label: "Items", labelBn: "আইটেম", icon: Package },
  { path: "/sales", label: "POS Sales", labelBn: "বিক্রয়", icon: ShoppingCart },
  { path: "/purchases", label: "Purchases", labelBn: "ক্রয়", icon: Truck },
  { path: "/suppliers", label: "Suppliers", labelBn: "সরবরাহকারী", icon: Users },
  { path: "/customers", label: "Customers", labelBn: "গ্রাহক", icon: UserCircle },
  { path: "/staff", label: "Staff", labelBn: "কর্মী", icon: User },
  { path: "/attendance", label: "Attendance", labelBn: "হাজিরা", icon: Clock },
  { path: "/finance", label: "Finance", labelBn: "আর্থিক", icon: Wallet },
  { path: "/reports", label: "Reports", labelBn: "রিপোর্ট", icon: BarChart3 },
  { path: "/settings", label: "Settings", labelBn: "সেটিংস", icon: Settings },
  { path: "/admin", label: "Admin", labelBn: "অ্যাডমিন", icon: Shield },
];

export function Sidebar({ className, onClose }: SidebarProps) {
  const { user, logout } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();

  return (
    <aside
      className={cn(
        "w-64 bg-sidebar border-r border-sidebar-border flex flex-col",
        className
      )}
    >
      {/* Logo */}
      <div className="h-16 flex items-center justify-between px-6 border-b border-sidebar-border">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-gradient-hero flex items-center justify-center">
            <Utensils className="w-5 h-5 text-primary-foreground" />
          </div>
          <div>
            <h1 className="font-display font-bold text-lg gradient-text">RestaurantOS</h1>
            <p className="text-xs text-muted-foreground">ইনভেন্টরি সিস্টেম</p>
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
      <nav className="flex-1 py-4 px-3 overflow-y-auto custom-scrollbar">
        <ul className="space-y-1">
          {navItems.map((item) => {
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
      </nav>

      {/* Footer */}
      <div className="p-4 border-t border-sidebar-border space-y-3">
        <div className="flex items-center gap-3 rounded-lg bg-muted/40 p-3">
          <div className="w-10 h-10 rounded-full bg-gradient-hero flex items-center justify-center text-primary-foreground font-bold">
            {user?.name?.[0] ?? "U"}
          </div>
          <div className="flex-1 min-w-0">
            <p className="font-medium truncate">{user?.name ?? "Guest"}</p>
            <p className="text-xs text-muted-foreground truncate">{user ? `${user.role} role` : "Not signed in"}</p>
          </div>
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
        <div className="flex items-center justify-between">
          <div className="glass-card p-3 rounded-lg flex-1 mr-2">
            <p className="text-xs text-muted-foreground">Currency</p>
            <p className="font-display font-semibold text-primary">৳ BDT</p>
          </div>
          <ThemeToggle />
        </div>
      </div>
    </aside>
  );
}
