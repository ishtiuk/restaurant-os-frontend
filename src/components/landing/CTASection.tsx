import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowRight, Rocket } from "lucide-react";

export function CTASection() {
  return (
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-4xl mx-auto">
        <GlassCard glow="primary" className="p-12 text-center space-y-6 relative overflow-hidden">
          {/* Background decoration */}
          <div className="absolute inset-0 overflow-hidden pointer-events-none">
            <div className="absolute -top-20 -right-20 w-64 h-64 bg-primary/10 rounded-full blur-3xl" />
            <div className="absolute -bottom-20 -left-20 w-64 h-64 bg-accent/10 rounded-full blur-3xl" />
          </div>
          
          <div className="relative z-10 space-y-6">
            <div className="w-16 h-16 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
              <Rocket className="w-8 h-8 text-primary" />
            </div>
            
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              Ready to get started?
            </h2>
            
            <p className="text-xl text-muted-foreground max-w-xl mx-auto">
              Join hundreds of restaurants that have already transformed their operations 
              with our POS system.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-4">
              <Link to="/login">
                <Button size="lg" variant="glow" className="text-lg px-8">
                  Start Your Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Contact Sales
              </Button>
            </div>
          </div>
        </GlassCard>
      </div>
    </section>
  );
}
