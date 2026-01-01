import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { GlassCard } from "@/components/ui/GlassCard";
import { Check } from "lucide-react";

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
    <section id="pricing" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <h2 className="text-3xl sm:text-4xl font-display font-bold gradient-text">
            Simple, Transparent Pricing
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Choose the plan that fits your restaurant's needs. All plans include free updates and basic support.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {pricingPlans.map((plan, index) => (
            <GlassCard
              key={plan.name}
              className={`p-6 relative animate-fade-in ${
                plan.highlighted 
                  ? "ring-2 ring-primary glow-primary pt-10" 
                  : ""
              }`}
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {plan.highlighted && (
                <div className="absolute top-3 left-1/2 -translate-x-1/2 px-4 py-1 bg-primary text-primary-foreground text-sm font-medium rounded-full">
                  Most Popular
                </div>
              )}

              <div className="text-center mb-6">
                <h3 className="text-xl font-display font-bold text-foreground mb-2">
                  {plan.name}
                </h3>
                <div className="flex items-baseline justify-center gap-1">
                  <span className="text-4xl font-bold text-foreground">{plan.price}</span>
                  <span className="text-muted-foreground">{plan.period}</span>
                </div>
                <p className="text-sm text-muted-foreground mt-2">{plan.description}</p>
              </div>

              <ul className="space-y-3 mb-6">
                {plan.features.map((feature) => (
                  <li key={feature} className="flex items-start gap-3">
                    <Check className="w-5 h-5 text-accent shrink-0 mt-0.5" />
                    <span className="text-sm text-foreground">{feature}</span>
                  </li>
                ))}
              </ul>

              <Link to="/login" className="block">
                <Button
                  variant={plan.highlighted ? "glow" : "outline"}
                  className="w-full"
                >
                  {plan.name === "Enterprise" ? "Contact Sales" : "Get Started"}
                </Button>
              </Link>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
