import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { ArrowRight, CheckCircle2, Sparkles } from "lucide-react";

// Screenshot data with Cloudinary URLs
const screenshots = [
  {
    title: "Insightful Dashboard",
    description: "Get a complete overview of your business metrics in real-time.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/v1767370424/restaurant-os/screenshots/restaurant-os/screenshots/dashboard.webp"
  },
  {
    title: "Table Management",
    description: "Visual table layout to manage occupancy and reservations efficiently.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/v1767370425/restaurant-os/screenshots/restaurant-os/screenshots/tables.webp"
  },
  {
    title: "POS & Billing",
    description: "Fast and intuitive point-of-sale system for seamless transactions.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/v1767370427/restaurant-os/screenshots/restaurant-os/screenshots/pos.webp"
  },
  {
    title: "Advanced Reports",
    description: "Deep dive into sales trends, product performance, and more.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/v1767370429/restaurant-os/screenshots/restaurant-os/screenshots/reports.webp"
  },
  {
    title: "Inventory Control",
    description: "Manage products, stock levels, and suppliers with ease.",
    url: "https://res.cloudinary.com/demdlwbdp/image/upload/v1767370433/restaurant-os/screenshots/restaurant-os/screenshots/items.webp"
  },
];

export function HeroSection() {
  const [currentScreenshot, setCurrentScreenshot] = useState(0);

  // Auto-slide effect
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentScreenshot((prev) => (prev + 1) % screenshots.length);
    }, 5000); // Change slide every 5 seconds

    return () => clearInterval(timer);
  }, []);

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

        {/* Hero Image Placeholder - Constrained width */}
        <div className="mt-16 relative animate-slide-up stagger-2 max-w-5xl mx-auto">
          <GlassCard className="p-2 glow-primary">
            <div className="rounded-lg bg-card overflow-hidden shadow-2xl relative group">
              {/* Carousel Images */}
              <div className="aspect-[16/10] sm:aspect-video bg-muted relative">
                {screenshots.map((screenshot, index) => (
                  <div
                    key={screenshot.title}
                    className={`absolute inset-0 transition-opacity duration-1000 ease-in-out ${index === currentScreenshot ? "opacity-100" : "opacity-0"
                      }`}
                  >
                    <img
                      src={screenshot.url}
                      alt={screenshot.title}
                      className="w-full h-full object-cover object-top"
                    />
                    {/* Caption Overlay */}
                    <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent p-6 sm:p-8 pt-12 flex items-end justify-between transition-opacity duration-300">
                      <div>
                        <h3 className="text-white font-display font-bold text-xl sm:text-2xl mb-1">
                          {screenshot.title}
                        </h3>
                        <p className="text-white/80 text-sm sm:text-base hidden sm:block">
                          {screenshot.description}
                        </p>
                      </div>
                      <Badge variant="glass" className="bg-white/10 hover:bg-white/20 text-white border-white/20 whitespace-nowrap">
                        Preview
                      </Badge>
                    </div>
                  </div>
                ))}
              </div>

              {/* Navigation Dots */}
              <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex items-center gap-2 z-10">
                {screenshots.map((_, index) => (
                  <button
                    key={index}
                    onClick={() => setCurrentScreenshot(index)}
                    className={`w-2 h-2 sm:w-2.5 sm:h-2.5 rounded-full transition-all duration-300 ${index === currentScreenshot
                      ? "bg-white w-6 sm:w-8"
                      : "bg-white/40 hover:bg-white/60"
                      }`}
                    aria-label={`Go to slide ${index + 1}`}
                  />
                ))}
              </div>

              {/* Angle Brackets Navigation (Optional, visible on hover) */}
              <button
                onClick={() => setCurrentScreenshot((prev) => (prev - 1 + screenshots.length) % screenshots.length)}
                className="absolute left-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ArrowRight className="w-5 h-5 rotate-180" />
              </button>
              <button
                onClick={() => setCurrentScreenshot((prev) => (prev + 1) % screenshots.length)}
                className="absolute right-4 top-1/2 -translate-y-1/2 w-10 h-10 rounded-full bg-black/30 hover:bg-black/50 text-white flex items-center justify-center backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-300"
              >
                <ArrowRight className="w-5 h-5" />
              </button>
            </div>
          </GlassCard>
        </div>
      </div>
    </section>
  );
}
