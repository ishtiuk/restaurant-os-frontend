import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Badge } from "@/components/ui/badge";
import { Check, Sparkles } from "lucide-react";

const pricingPlans = [
  {
    name: "Basic",
    price: "৳2,999",
    period: "/month",
    description: "Perfect for small restaurants getting started",
    features: [
      "Up to 2 staff accounts",
      "Basic POS features",
      "Order management",
      "Daily reports",
      "Email support",
    ],
    highlighted: false,
  },
  {
    name: "Professional",
    price: "৳5,999",
    period: "/month",
    description: "For growing restaurants with more needs",
    features: [
      "Up to 10 staff accounts",
      "Advanced POS features",
      "Table management",
      "Inventory tracking",
      "Advanced analytics",
      "Priority support",
      "Multi-location support",
    ],
    highlighted: true,
  },
  {
    name: "Enterprise",
    price: "Custom",
    period: "",
    description: "Customizable features for large operations",
    features: [
      "Unlimited staff accounts",
      "All Professional features",
      "Custom integrations",
      "Dedicated account manager",
      "On-site training",
      "24/7 phone support",
      "Custom reporting",
      "API access",
    ],
    highlighted: false,
  },
];

export function PricingSection() {
  return (
    <section id="pricing" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Background decoration */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-primary/5 rounded-full blur-[120px] pointer-events-none" />

      <div className="max-w-7xl mx-auto relative">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <Badge variant="glass" className="px-4 py-1.5">Pricing</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            <span className="gradient-text">Simple, Transparent</span> Pricing
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            Choose the plan that fits your restaurant's needs. All plans include free updates and basic support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-6 lg:gap-8 items-start">
          {pricingPlans.map((plan, index) => (
            <div
              key={plan.name}
              className={`relative animate-fade-in hover-lift ${plan.highlighted
                  ? "md:-mt-4 md:mb-4"
                  : ""
                }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Popular badge - moved outside to prevent clipping */}
              {plan.highlighted && (
                <div className="absolute -top-4 left-1/2 -translate-x-1/2 z-20">
                  <Badge className="bg-primary hover:bg-primary text-primary-foreground px-4 py-1.5 shadow-xl shadow-primary/25 border border-primary-foreground/20">
                    <Sparkles className="w-3.5 h-3.5 mr-1.5 fill-current" />
                    Most Popular
                  </Badge>
                </div>
              )}

              <GlassCard
                className={`p-6 sm:p-8 h-full ${plan.highlighted
                    ? "ring-2 ring-primary/50"
                    : ""
                  }`}
              >
                <div className={`text-center mb-6 sm:mb-8 ${plan.highlighted ? 'pt-4' : ''}`}>
                  <h3 className="text-xl font-display font-bold text-foreground mb-2">
                    {plan.name}
                  </h3>
                  <div className="flex items-baseline justify-center gap-1 mb-3">
                    <span className="text-4xl sm:text-5xl font-bold text-foreground tracking-tight">{plan.price}</span>
                    <span className="text-muted-foreground text-sm">{plan.period}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{plan.description}</p>
                </div>

                <ul className="space-y-3 mb-6 sm:mb-8">
                  {plan.features.map((feature) => (
                    <li key={feature} className="flex items-start gap-3">
                      <div className="w-5 h-5 rounded-full bg-accent/10 flex items-center justify-center shrink-0 mt-0.5">
                        <Check className="w-3 h-3 text-accent" />
                      </div>
                      <span className="text-sm text-foreground">{feature}</span>
                    </li>
                  ))}
                </ul>

                <Link to="/login" className="block mt-auto">
                  <Button
                    variant={plan.highlighted ? "glow" : "outline"}
                    className={`w-full ${plan.highlighted ? 'btn-glow-hover' : 'hover:bg-primary/5 hover:border-primary/30'}`}
                    size="lg"
                  >
                    {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                  </Button>
                </Link>
              </GlassCard>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}