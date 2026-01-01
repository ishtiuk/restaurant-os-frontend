import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowRight, CheckCircle2, Sparkles, LayoutDashboard } from "lucide-react";

export function HeroSection() {
  return (
    <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-secondary/10 rounded-full blur-3xl" />
      </div>

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center space-y-8 animate-fade-in">
          <Badge variant="glass" className="px-4 py-2">
            <Sparkles className="w-4 h-4 mr-2" />
            Modern Restaurant Management
          </Badge>

          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold tracking-tight leading-tight">
            <span className="gradient-text">Simplify Your</span>
            <br />
            <span className="text-foreground">Restaurant Operations</span>
          </h1>

          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
            All-in-one POS system that helps you manage orders, track inventory, 
            and grow your restaurant business with powerful analytics.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
            <Link to="/login">
              <Button size="lg" variant="glow" className="text-lg px-8 py-6">
                Start Free Trial
                <ArrowRight className="w-5 h-5 ml-2" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="text-lg px-8 py-6">
              Schedule Demo
            </Button>
          </div>

          <div className="flex flex-wrap items-center justify-center gap-6 pt-6 text-sm text-muted-foreground">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              No credit card required
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              14-day free trial
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-accent" />
              Cancel anytime
            </div>
          </div>
        </div>

        {/* Hero Image Placeholder */}
        <div className="mt-16 relative animate-slide-up stagger-2">
          <GlassCard className="p-2 glow-primary">
            <div className="rounded-lg bg-card overflow-hidden">
              <div className="aspect-video bg-gradient-to-br from-card to-muted flex items-center justify-center">
                <div className="text-center space-y-4 p-8">
                  <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                    <LayoutDashboard className="w-10 h-10 text-primary" />
                  </div>
                  <p className="text-xl font-display text-foreground">Dashboard Preview</p>
                  <p className="text-muted-foreground">Your restaurant data at a glance</p>
                </div>
              </div>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
