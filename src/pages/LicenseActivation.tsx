import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { GlassCard } from "@/components/ui/GlassCard";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Key, CheckCircle2, XCircle, AlertCircle, Loader2 } from "lucide-react";
import { toast } from "@/hooks/use-toast";
import { licenseApi } from "@/lib/api/license";
import { useAuth } from "@/contexts/AuthContext";

export default function LicenseActivation() {
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  
  // Prevent authenticated users from accessing this page (they should be logged out first)
  useEffect(() => {
    if (isAuthenticated) {
      // If user is authenticated, they shouldn't be here - redirect to dashboard
      // But this shouldn't happen if login properly clears auth state on 402
      navigate("/dashboard", { replace: true });
    }
  }, [isAuthenticated, navigate]);
  const [activationKey, setActivationKey] = useState("");
  const [isActivating, setIsActivating] = useState(false);
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
    valid: boolean;
    message: string;
    expiresAt?: string;
    daysRemaining?: number;
  } | null>(null);

  // Extract tenant_id from activation key if possible (for display)
  useEffect(() => {
    if (activationKey.length > 50) {
      // Try to decode and show preview
      try {
        const parts = activationKey.split(".");
        if (parts.length === 3) {
          const payload = JSON.parse(atob(parts[1] + "===".slice((parts[1].length + 3) % 4)));
          if (payload.exp) {
            const expiresAt = new Date(payload.exp * 1000);
            const now = new Date();
            const daysRemaining = Math.ceil((expiresAt.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
            
            if (daysRemaining > 0) {
              setValidationResult({
                valid: true,
                message: `License valid for ${daysRemaining} days`,
                expiresAt: expiresAt.toISOString(),
                daysRemaining,
              });
            } else {
              setValidationResult({
                valid: false,
                message: "License has expired",
              });
            }
          }
        }
      } catch (e) {
        // Invalid format, clear validation
        setValidationResult(null);
      }
    } else {
      setValidationResult(null);
    }
  }, [activationKey]);

  const handleActivate = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!activationKey.trim()) {
      toast({
        title: "Activation key required",
        description: "Please enter your activation key",
        variant: "destructive",
      });
      return;
    }

    setIsActivating(true);
    try {
      const result = await licenseApi.activate(activationKey.trim());
      
      toast({
        title: "License Activated!",
        description: result.message,
      });
      
      // Redirect to login after successful activation
      setTimeout(() => {
        navigate("/login");
      }, 1500);
    } catch (err: any) {
      const errorMessage = err?.response?.data?.detail || err?.message || "Failed to activate license";
      toast({
        title: "Activation Failed",
        description: errorMessage,
        variant: "destructive",
      });
    } finally {
      setIsActivating(false);
    }
  };

  // Early return if authenticated (shouldn't happen, but safety check)
  if (isAuthenticated) {
    return null; // Will be redirected by useEffect
  }

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-gradient-dark" style={{ minHeight: '100vh' }}>
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 -left-32 w-64 h-64 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 -right-32 w-64 h-64 bg-secondary/20 rounded-full blur-3xl" />
      </div>

      <GlassCard className="w-full max-w-lg p-8 animate-scale-in">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-hero mx-auto mb-4 flex items-center justify-center glow-primary">
            <Key className="w-8 h-8 text-primary-foreground" />
          </div>
          <h1 className="text-2xl font-display font-bold gradient-text">License Activation</h1>
          <p className="text-muted-foreground mt-2">
            Enter your activation key to continue using RestaurantOS
          </p>
        </div>

        {/* Info Alert */}
        <div className="mb-6 p-4 rounded-lg bg-muted/30 border border-border/50">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-primary mt-0.5 flex-shrink-0" />
            <div className="text-sm text-muted-foreground">
              <p className="font-medium text-foreground mb-1">License Required</p>
              <p>
                Your license has expired or is not activated. Please contact your vendor to obtain a new activation key.
                Enter the key below to activate your license.
              </p>
            </div>
          </div>
        </div>

        {/* Activation Form */}
        <form onSubmit={handleActivate} className="space-y-5">
          <div className="space-y-2">
            <Label htmlFor="activation-key">Activation Key</Label>
            <div className="relative">
              <Input
                id="activation-key"
                type="text"
                placeholder="Paste your activation key here..."
                value={activationKey}
                onChange={(e) => setActivationKey(e.target.value)}
                className="bg-muted/50 font-mono text-sm"
                required
                disabled={isActivating}
              />
            </div>
            {validationResult && (
              <div className={`flex items-center gap-2 text-sm mt-2 ${
                validationResult.valid ? "text-green-400" : "text-red-400"
              }`}>
                {validationResult.valid ? (
                  <CheckCircle2 className="w-4 h-4" />
                ) : (
                  <XCircle className="w-4 h-4" />
                )}
                <span>{validationResult.message}</span>
              </div>
            )}
          </div>

          <Button
            type="submit"
            variant="glow"
            size="xl"
            className="w-full"
            disabled={isActivating || !activationKey.trim()}
          >
            {isActivating ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                Activating...
              </>
            ) : (
              <>
                <Key className="w-4 h-4 mr-2" />
                Activate License
              </>
            )}
          </Button>
        </form>

        {/* Help Text */}
        <div className="mt-6 pt-6 border-t border-border">
          <p className="text-xs text-center text-muted-foreground">
            Need help? Contact your vendor or support team to obtain an activation key.
          </p>
        </div>
      </GlassCard>
    </div>
  );
}

