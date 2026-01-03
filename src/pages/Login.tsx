import React, { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Utensils, Eye, EyeOff, LogIn } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { useAuth } from "@/contexts/AuthContext";

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const { login, isAuthenticated } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  // Redirect authenticated users to dashboard
  // BUT: Don't redirect if we're on license-activation path (user might be redirected here)
  useEffect(() => {
    if (isAuthenticated) {
      const from = (location.state as { from?: string })?.from || "/dashboard";
      navigate(from, { replace: true });
    }
  }, [isAuthenticated, navigate, location]);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      await login({ email, password });
      toast({
        title: "Welcome back!",
        description: "স্বাগতম! Login successful.",
      });

      // Wait a moment for state to update, then navigate
      const from = (location.state as { from?: string })?.from || "/dashboard";

      // Use setTimeout to ensure React has processed the state update
      setTimeout(() => {
        navigate(from, { replace: true });
      }, 50);
    } catch (err: any) {
      // IMPORTANT: Clear any partial auth state before handling error
      // This prevents the useEffect from redirecting authenticated users

      // Check if it's a license error (402 Payment Required)
      // Check multiple possible error formats to be robust

      toast({
        title: "Login failed",
        description: err?.message || err?.response?.data?.detail || "Please check your credentials",
        variant: "destructive",
      });
      toast({
        title: "Login failed",
        description: err?.message || err?.response?.data?.detail || "Please check your credentials",
        variant: "destructive",
      });

    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-dark">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-accent/10 rounded-full blur-3xl" />
      </div>

      <GlassCard className="w-full max-w-md p-8 animate-scale-in">
        {/* Logo */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-hero mx-auto mb-4 flex items-center justify-center glow-primary">
            <Utensils className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text">Restauranflow</h1>
          <p className="text-muted-foreground mt-1">রেস্টুরেন্ট ম্যানেজমেন্ট সিস্টেম</p>
        </div>

        {/* Login Form */}
        <form onSubmit={handleLogin} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="email">Email / Username</Label>
            <Input
              id="email"
              type="text"
              placeholder="admin@restaurant.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="bg-muted/50"
              required
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="password">Password</Label>
            <div className="relative">
              <Input
                id="password"
                type={showPassword ? "text" : "password"}
                placeholder="••••••••"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="bg-muted/50 pr-10"
                required
              />
              <Button
                type="button"
                variant="ghost"
                size="icon"
                className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                onClick={() => setShowPassword(!showPassword)}
              >
                {showPassword ? (
                  <EyeOff className="w-4 h-4 text-muted-foreground" />
                ) : (
                  <Eye className="w-4 h-4 text-muted-foreground" />
                )}
              </Button>
            </div>
          </div>

          <Button
            type="submit"
            variant="glow"
            size="xl"
            className="w-full"
            disabled={isLoading}
          >
            {isLoading ? (
              <div className="w-5 h-5 border-2 border-primary-foreground/30 border-t-primary-foreground rounded-full animate-spin" />
            ) : (
              <>
                <LogIn className="w-4 h-4 mr-2" />
                Sign In
              </>
            )}
          </Button>
        </form>

        {/* Role Info */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground mb-3">Demo Accounts</p>
          <div className="grid grid-cols-3 gap-2 text-center text-xs">
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="font-medium">Admin</p>
              <p className="text-muted-foreground">Full access</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="font-medium">Manager</p>
              <p className="text-muted-foreground">Reports & Staff</p>
            </div>
            <div className="p-2 rounded-lg bg-muted/30">
              <p className="font-medium">Cashier</p>
              <p className="text-muted-foreground">POS only</p>
            </div>
          </div>
        </div>
      </GlassCard>
    </div>
  );
}
