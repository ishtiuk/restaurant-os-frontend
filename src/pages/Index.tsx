import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/ThemeToggle";
import { 
  BarChart3, 
  ShoppingCart, 
  Package, 
  Users, 
  Shield, 
  Zap, 
  Globe,
  CheckCircle2,
  ArrowRight,
  Star,
  Play,
  Smartphone,
  Cloud,
  Receipt
} from "lucide-react";

const features = [
  {
    icon: ShoppingCart,
    title: "Lightning Fast POS",
    titleBn: "দ্রুত পস সিস্টেম",
    description: "Keyboard-first design for rapid order entry. Process sales in seconds, not minutes."
  },
  {
    icon: Package,
    title: "Smart Inventory",
    titleBn: "স্মার্ট ইনভেন্টরি",
    description: "Real-time stock tracking with low-stock alerts and automated reorder suggestions."
  },
  {
    icon: BarChart3,
    title: "Deep Analytics",
    titleBn: "বিস্তারিত রিপোর্ট",
    description: "Understand your business with powerful reports on sales, costs, and trends."
  },
  {
    icon: Users,
    title: "Customer Management",
    titleBn: "কাস্টমার ম্যানেজমেন্ট",
    description: "Build loyalty with customer profiles, purchase history, and rewards."
  },
  {
    icon: Shield,
    title: "Role-Based Access",
    titleBn: "নিরাপত্তা ব্যবস্থা",
    description: "Control who sees what with granular permissions for staff, managers, and admins."
  },
  {
    icon: Globe,
    title: "Multi-Branch Ready",
    titleBn: "মাল্টি-ব্রাঞ্চ",
    description: "Scale from one location to many with centralized management."
  }
];

const pricingPlans = [
  {
    name: "Starter",
    nameBn: "স্টার্টার",
    price: "৳1,999",
    period: "/month",
    description: "Perfect for small restaurants",
    features: [
      "1 Branch",
      "2 Users",
      "Basic POS",
      "Inventory Management",
      "Email Support"
    ],
    popular: false
  },
  {
    name: "Professional",
    nameBn: "প্রফেশনাল",
    price: "৳4,999",
    period: "/month",
    description: "For growing businesses",
    features: [
      "Up to 3 Branches",
      "10 Users",
      "Advanced POS",
      "Full Analytics",
      "Customer Management",
      "Priority Support"
    ],
    popular: true
  },
  {
    name: "Enterprise",
    nameBn: "এন্টারপ্রাইজ",
    price: "Custom",
    period: "",
    description: "For large chains",
    features: [
      "Unlimited Branches",
      "Unlimited Users",
      "White-label Option",
      "API Access",
      "Dedicated Support",
      "Custom Integrations"
    ],
    popular: false
  }
];

const testimonials = [
  {
    name: "Karim Ahmed",
    role: "Owner, Dhaka Biriyani House",
    content: "InventoryOS transformed how we manage our restaurant. Sales are up 30% since we started using it.",
    rating: 5
  },
  {
    name: "Fatima Rahman",
    role: "Manager, Spice Garden",
    content: "The POS is incredibly fast. My staff learned it in just one day. Best investment we've made.",
    rating: 5
  },
  {
    name: "Rafiq Hassan",
    role: "Owner, Chittagong Seafood",
    content: "Finally, software that understands Bangladeshi restaurant needs. bKash integration is perfect!",
    rating: 5
  }
];

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 glass-card border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                <Receipt className="w-5 h-5 text-primary" />
              </div>
              <span className="text-xl font-display font-bold gradient-text">InventoryOS</span>
            </div>
            <div className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-muted-foreground hover:text-foreground transition-colors">Features</a>
              <a href="#pricing" className="text-muted-foreground hover:text-foreground transition-colors">Pricing</a>
              <a href="#testimonials" className="text-muted-foreground hover:text-foreground transition-colors">Reviews</a>
            </div>
            <div className="flex items-center gap-3">
              <ThemeToggle />
              <Link to="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link to="/login">
                <Button variant="glow">Start Free Trial</Button>
              </Link>
            </div>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-32 pb-20 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
        {/* Background Effects */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-3xl" />
          <div className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-accent/20 rounded-full blur-3xl" />
        </div>
        
        <div className="max-w-7xl mx-auto relative">
          <div className="text-center space-y-8 animate-fade-in">
            <Badge variant="glass" className="px-4 py-2">
              <Zap className="w-4 h-4 mr-2" />
              বাংলাদেশের সেরা রেস্তোরাঁ সফটওয়্যার
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-7xl font-display font-bold tracking-tight">
              <span className="gradient-text">Restaurant POS</span>
              <br />
              <span className="text-foreground">Built for Bangladesh</span>
            </h1>
            
            <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
              The complete inventory and point-of-sale system designed for Bangladeshi restaurants. 
              Fast, reliable, and powered by local payment methods.
            </p>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" variant="glow" className="text-lg px-8 py-6">
                  Start 14-Day Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Play className="w-5 h-5 mr-2" />
                Watch Demo
              </Button>
            </div>
            
            <div className="flex items-center justify-center gap-8 pt-8 text-sm text-muted-foreground">
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                No credit card required
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                Setup in 5 minutes
              </div>
              <div className="flex items-center gap-2">
                <CheckCircle2 className="w-5 h-5 text-accent" />
                Cancel anytime
              </div>
            </div>
          </div>
          
          {/* Hero Image/Preview */}
          <div className="mt-16 relative">
            <GlassCard className="p-2 glow-primary animate-slide-up stagger-2">
              <div className="rounded-lg bg-card overflow-hidden">
                <div className="aspect-video bg-gradient-to-br from-card to-muted flex items-center justify-center">
                  <div className="text-center space-y-4 p-8">
                    <div className="w-20 h-20 rounded-2xl bg-primary/20 flex items-center justify-center mx-auto">
                      <BarChart3 className="w-10 h-10 text-primary" />
                    </div>
                    <p className="text-xl font-display text-foreground">Dashboard Preview</p>
                    <p className="text-muted-foreground">Real-time insights at your fingertips</p>
                  </div>
                </div>
              </div>
            </GlassCard>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="glass">Features</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              Everything you need to run your restaurant
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              From point-of-sale to inventory management, we've got you covered.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((feature, index) => (
              <GlassCard 
                key={feature.title} 
                hover 
                className="p-6 space-y-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="w-12 h-12 rounded-xl bg-primary/20 flex items-center justify-center">
                  <feature.icon className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <h3 className="text-lg font-display font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.titleBn}</p>
                </div>
                <p className="text-muted-foreground">{feature.description}</p>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
            {[
              { value: "500+", label: "Restaurants", labelBn: "রেস্তোরাঁ" },
              { value: "৳50Cr+", label: "Sales Processed", labelBn: "বিক্রয় প্রসেস" },
              { value: "99.9%", label: "Uptime", labelBn: "আপটাইম" },
              { value: "24/7", label: "Support", labelBn: "সাপোর্ট" }
            ].map((stat, index) => (
              <div key={stat.label} className="text-center animate-fade-in" style={{ animationDelay: `${index * 0.1}s` }}>
                <div className="text-3xl sm:text-4xl font-display font-bold gradient-text">{stat.value}</div>
                <div className="text-muted-foreground">{stat.label}</div>
                <div className="text-sm text-muted-foreground/70">{stat.labelBn}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="glass">Pricing</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              Simple, transparent pricing
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Choose the plan that fits your business. All plans include a 14-day free trial.
            </p>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {pricingPlans.map((plan, index) => (
              <GlassCard 
                key={plan.name}
                hover
                glow={plan.popular ? "primary" : "none"}
                className={`p-8 space-y-6 relative animate-fade-in ${plan.popular ? 'border-primary/50' : ''}`}
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                {plan.popular && (
                  <Badge className="absolute -top-3 left-1/2 -translate-x-1/2">Most Popular</Badge>
                )}
                <div className="text-center">
                  <h3 className="text-xl font-display font-semibold">{plan.name}</h3>
                  <p className="text-sm text-muted-foreground">{plan.nameBn}</p>
                </div>
                <div className="text-center">
                  <span className="text-4xl font-display font-bold gradient-text">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-center text-muted-foreground">{plan.description}</p>
                <ul className="space-y-3">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-accent flex-shrink-0" />
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>
                <Link to="/login" className="block">
                  <Button 
                    variant={plan.popular ? "glow" : "outline"} 
                    className="w-full"
                  >
                    Get Started
                  </Button>
                </Link>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section id="testimonials" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center space-y-4 mb-16">
            <Badge variant="glass">Testimonials</Badge>
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              Loved by restaurant owners
            </h2>
          </div>
          
          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <GlassCard 
                key={testimonial.name}
                className="p-6 space-y-4 animate-fade-in"
                style={{ animationDelay: `${index * 0.1}s` }}
              >
                <div className="flex gap-1">
                  {Array.from({ length: testimonial.rating }).map((_, i) => (
                    <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                  ))}
                </div>
                <p className="text-foreground">"{testimonial.content}"</p>
                <div>
                  <p className="font-semibold">{testimonial.name}</p>
                  <p className="text-sm text-muted-foreground">{testimonial.role}</p>
                </div>
              </GlassCard>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          <GlassCard glow="primary" className="p-12 text-center space-y-6">
            <h2 className="text-3xl sm:text-4xl font-display font-bold">
              Ready to transform your restaurant?
            </h2>
            <p className="text-xl text-muted-foreground">
              Join 500+ restaurants already using InventoryOS
            </p>
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
              <Link to="/login">
                <Button size="lg" variant="glow" className="text-lg px-8">
                  Start Free Trial
                  <ArrowRight className="w-5 h-5 ml-2" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8">
                Contact Sales
              </Button>
            </div>
            <div className="flex items-center justify-center gap-6 pt-4">
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Smartphone className="w-4 h-4" />
                Works on any device
              </div>
              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                <Cloud className="w-4 h-4" />
                Cloud-based
              </div>
            </div>
          </GlassCard>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-12 px-4 sm:px-6 lg:px-8 border-t border-border">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-8">
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <Receipt className="w-5 h-5 text-primary" />
                </div>
                <span className="text-xl font-display font-bold gradient-text">InventoryOS</span>
              </div>
              <p className="text-sm text-muted-foreground">
                The complete restaurant management solution for Bangladesh.
              </p>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Product</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#features" className="hover:text-foreground transition-colors">Features</a></li>
                <li><a href="#pricing" className="hover:text-foreground transition-colors">Pricing</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Integrations</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Support</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Help Center</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contact Us</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">API Docs</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-semibold mb-4">Legal</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#" className="hover:text-foreground transition-colors">Privacy Policy</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="mt-12 pt-8 border-t border-border text-center text-sm text-muted-foreground">
            <p>© 2024 InventoryOS. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default Index;
