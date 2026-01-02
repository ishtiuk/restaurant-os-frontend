import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, Sparkles } from "lucide-react";

export function CTASection() {
  return (
    <section className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-muted/30 to-muted/50" />
      
      <div className="max-w-4xl mx-auto relative">
        {/* Card with premium glow effect */}
        <div className="relative rounded-3xl p-[1px] bg-gradient-to-b from-primary/30 to-primary/5 overflow-hidden">
          <div className="rounded-3xl bg-card/90 backdrop-blur-xl p-8 sm:p-12 lg:p-16 text-center space-y-6 relative overflow-hidden">
            {/* Background decoration */}
            <div className="absolute inset-0 overflow-hidden pointer-events-none">
              <div className="absolute -top-32 -right-32 w-64 h-64 bg-primary/10 rounded-full blur-[80px]" />
              <div className="absolute -bottom-32 -left-32 w-64 h-64 bg-accent/10 rounded-full blur-[80px]" />
              {/* Subtle grid */}
              <div 
                className="absolute inset-0 opacity-[0.02]"
                style={{
                  backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
                  backgroundSize: '32px 32px'
                }}
              />
            </div>
            
            <div className="relative z-10 space-y-6">
              {/* Icon */}
              <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-2xl bg-gradient-to-br from-primary/20 to-primary/5 flex items-center justify-center mx-auto animate-float">
                <Sparkles className="w-7 h-7 sm:w-8 sm:h-8 text-primary" />
              </div>
              
              {/* Headline */}
              <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
                Ready to transform your
                <br />
                <span className="gradient-text">restaurant?</span>
              </h2>
              
              {/* Description */}
              <p className="text-lg sm:text-xl text-muted-foreground max-w-xl mx-auto">
                Join hundreds of restaurants that have already streamlined their operations 
                with our powerful POS system.
              </p>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-4">
                <Link to="/login">
                  <Button size="lg" variant="glow" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto group btn-glow-hover">
                    Start Your Free Trial
                    <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                  </Button>
                </Link>
                <Button size="lg" variant="outline" className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto hover:bg-primary/5 hover:border-primary/30">
                  Contact Sales
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}