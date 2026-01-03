import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ArrowRight, CheckCircle2, Play, Sparkles } from "lucide-react";

// Screenshot data with Cloudinary URLs
const screenshots = [
  {
    title: "Insightful Dashboard",
    description: "Get a complete overview of your business metrics in real-time.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/f_auto,q_auto/v1767370424/restaurant-os/screenshots/restaurant-os/screenshots/dashboard.webp"
  },
  {
    title: "Table Management",
    description: "Visual table layout to manage occupancy and reservations efficiently.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/f_auto,q_auto/v1767370425/restaurant-os/screenshots/restaurant-os/screenshots/tables.webp"
  },
  {
    title: "POS & Billing",
    description: "Fast and intuitive point-of-sale system for seamless transactions.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/f_auto,q_auto/v1767370427/restaurant-os/screenshots/restaurant-os/screenshots/pos.webp"
  },
  {
    title: "Advanced Reports",
    description: "Deep dive into sales trends, product performance, and more.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/f_auto,q_auto/v1767370429/restaurant-os/screenshots/restaurant-os/screenshots/reports.webp"
  },
  {
    title: "Inventory Control",
    description: "Manage products, stock levels, and suppliers with ease.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/f_auto,q_auto/v1767370433/restaurant-os/screenshots/restaurant-os/screenshots/items.webp"
  },
];

export function HeroSection() {
  const [currentScreenshot, setCurrentScreenshot] = useState(0);
  const [isHovered, setIsHovered] = useState(false);

  // Auto-slide effect - pause on hover
  useEffect(() => {
    if (isHovered) return;
    const timer = setInterval(() => {
      setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
    }, 5000);
    return () => clearInterval(timer);
  }, [isHovered]);

  return (
    <section className="pt-28 sm:pt-36 pb-16 sm:pb-24 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Premium Background Effects */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        {/* Primary gradient orb */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-primary/8 rounded-full blur-[120px]" />
        {/* Accent gradient orbs */}
        <div className="absolute top-1/3 -left-32 w-[400px] h-[400px] bg-accent/10 rounded-full blur-[100px] animate-float" />
        <div className="absolute bottom-1/4 -right-32 w-[500px] h-[500px] bg-secondary/8 rounded-full blur-[100px]" />
        {/* Subtle grid pattern */}
        <div
          className="absolute inset-0 opacity-[0.015]"
          style={{
            backgroundImage: `radial-gradient(circle at 1px 1px, hsl(var(--foreground)) 1px, transparent 0)`,
            backgroundSize: '48px 48px'
          }}
        />
      </div>

      <div className="max-w-7xl mx-auto relative">
        {/* Hero Content */}
        <div className="text-center space-y-6 sm:space-y-8">
          {/* Eyebrow badge */}
          <div className="animate-fade-in">
            <Badge
              variant="glass"
              className="px-4 py-2 text-sm font-medium border-primary/20 bg-primary/5 backdrop-blur-xl"
            >
              <Sparkles className="w-3.5 h-3.5 mr-2 text-primary" />
              Trusted by 500+ restaurants
            </Badge>
          </div>

          {/* Main headline - refined typography */}
          <h1 className="animate-fade-in stagger-1 text-3xl sm:text-5xl md:text-6xl lg:text-7xl font-display font-bold tracking-tight leading-[1.1]">
            <span className="gradient-text-animated">Simplify</span>{" "}
            <span className="text-foreground">Your Restaurant</span>
            <br className="hidden sm:block" />
            <span className="text-foreground sm:hidden"> </span>
            <span className="text-foreground">Operations</span>
          </h1>

          {/* Subheadline - better readability */}
          <p className="animate-fade-in stagger-2 text-sm sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto leading-relaxed px-2 sm:px-4">
            The all-in-one POS system that helps you manage orders, track inventory,
            and grow your restaurant with powerful real-time analytics.
          </p>

          {/* CTA Buttons - Enhanced visual weight */}
          <div className="animate-fade-in stagger-3 flex flex-col sm:flex-row items-center justify-center gap-3 sm:gap-4 pt-2">
            <div className="flex flex-col items-center gap-1.5">
              <Link to="/login">
                <Button
                  size="lg"
                  variant="glow"
                  className="text-base sm:text-lg px-8 sm:px-10 py-5 sm:py-6 w-full sm:w-auto group btn-glow-hover animate-glow-pulse"
                >
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2 transition-transform group-hover:translate-x-1" />
                </Button>
              </Link>
              <span className="text-xs text-muted-foreground/70 sm:absolute sm:mt-14">Setup in under 5 minutes</span>
            </div>
            <Button
              size="lg"
              variant="outline"
              className="text-base sm:text-lg px-6 sm:px-8 py-5 sm:py-6 w-full sm:w-auto group border-border/50 hover:border-primary/30 hover:bg-primary/5 transition-all duration-300"
            >
              <Play className="w-4 h-4 mr-2 transition-transform group-hover:scale-110" />
              Watch Demo
            </Button>
          </div>

          {/* Trust signals - refined styling */}
          <div className="animate-fade-in stagger-4 flex flex-wrap items-center justify-center gap-x-6 gap-y-3 pt-4 text-sm text-muted-foreground">
            {[
              "No credit card required",
              "14-day free trial",
              "Cancel anytime"
            ].map((text, i) => (
              <div key={i} className="flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-accent" />
                <span>{text}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Hero Image Showcase */}
        <div
          className="mt-12 sm:mt-16 lg:mt-20 relative animate-slide-up stagger-5 max-w-5xl mx-auto"
          onMouseEnter={() => setIsHovered(true)}
          onMouseLeave={() => setIsHovered(false)}
        >
          {/* Outer glow container with perspective */}
          <div className="relative rounded-2xl p-[1px] bg-gradient-to-b from-border/80 via-border/40 to-border/10 overflow-hidden shadow-2xl shadow-primary/5">
            {/* Inner card with premium styling */}
            <div className="rounded-2xl bg-card/90 backdrop-blur-md p-1 sm:p-1.5 relative overflow-hidden">
              {/* Window chrome - macOS style */}
              <div className="flex items-center gap-1.5 px-3 py-2 border-b border-border/30 bg-muted/30">
                <div className="w-2.5 h-2.5 rounded-full bg-destructive/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-primary/80" />
                <div className="w-2.5 h-2.5 rounded-full bg-accent/80" />
                <span className="ml-3 text-xs text-muted-foreground/50 font-medium">RestaurantOSx — Dashboard</span>
              </div>

              {/* Screenshot container */}
              <div className="rounded-b-xl bg-muted overflow-hidden relative group">
                {/* Aspect ratio container - tighter on mobile */}
                <div className="aspect-[4/3] sm:aspect-video bg-black/90 relative flex items-center justify-center">
                  {screenshots.map((screenshot, index) => (
                    <div
                      key={screenshot.title}
                      className={`absolute inset-0 transition-opacity duration-700 ease-out ${index === currentScreenshot ? "opacity-100" : "opacity-0"
                        }`}
                    >
                      <img
                        src={screenshot.url}
                        alt={screenshot.title}
                        className="w-full h-full object-cover sm:object-contain"
                        loading={index === 0 ? "eager" : "lazy"}
                      />

                      {/* Caption Overlay - refined gradient */}
                      <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent p-4 sm:p-6 lg:p-8 pt-16 sm:pt-20">
                        <div className="flex items-end justify-between gap-4">
                          <div className="space-y-1">
                            <h3 className="text-white font-display font-semibold text-lg sm:text-xl lg:text-2xl">
                              {screenshot.title}
                            </h3>
                            <p className="text-white/70 text-sm sm:text-base max-w-md hidden sm:block">
                              {screenshot.description}
                            </p>
                          </div>
                          <Badge
                            className="bg-white/10 hover:bg-white/20 text-white border-white/20 backdrop-blur-sm shrink-0"
                          >
                            {index + 1}/{screenshots.length}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Navigation Dots - Enhanced */}
                <div className="absolute bottom-3 sm:bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-1.5 sm:gap-2 z-10">
                  {screenshots.map((_, index) => (
                    <button
                      key={index}
                      onClick={() => setCurrentScreenshot(index)}
                      className={`h-1.5 sm:h-2 rounded-full transition-all duration-300 ${index === currentScreenshot
                        ? "bg-white w-6 sm:w-8"
                        : "bg-white/30 hover:bg-white/50 w-1.5 sm:w-2"
                        }`}
                      aria-label={`Go to slide ${index + 1}`}
                    />
                  ))}
                </div>

                {/* Arrow Navigation - Refined */}
                <button
                  onClick={() => setCurrentScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length)}
                  className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  aria-label="Previous slide"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5 rotate-180" />
                </button>
                <button
                  onClick={() => setCurrentScreenshot((prev) => (prev + 1) % screenshots.length)}
                  className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-black/40 hover:bg-black/60 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-300 hover:scale-110"
                  aria-label="Next slide"
                >
                  <ArrowRight className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            </div>
          </div>

          {/* Decorative floating elements */}
          <div className="absolute -bottom-4 -left-4 sm:-bottom-6 sm:-left-6 w-20 h-20 sm:w-32 sm:h-32 bg-primary/20 rounded-full blur-2xl animate-float" />
          <div className="absolute -top-4 -right-4 sm:-top-6 sm:-right-6 w-16 h-16 sm:w-24 sm:h-24 bg-accent/20 rounded-full blur-2xl animate-float" style={{ animationDelay: '2s' }} />
        </div>
      </div>
    </section>
  );
}