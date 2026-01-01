import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { 
  UtensilsCrossed, 
  ClipboardList, 
  BarChart3, 
  LayoutGrid,
  type LucideIcon
} from "lucide-react";

interface Feature {
  icon: LucideIcon;
  title: string;
  description: string;
}

const features: Feature[] = [
  {
    icon: UtensilsCrossed,
    title: "Easy Menu Management",
    description: "Create and update your menu items with categories, modifiers, and pricing in just a few clicks."
  },
  {
    icon: ClipboardList,
    title: "Real-Time Orders",
    description: "Track orders from kitchen to table with live updates. Never miss an order again."
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description: "Gain insights into sales trends, peak hours, and top-selling items to make smarter decisions."
  },
  {
    icon: LayoutGrid,
    title: "Table Management",
    description: "Visualize your floor plan, manage reservations, and track table status in real-time."
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 px-4 sm:px-6 lg:px-8 bg-muted/30">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="glass">Features</Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            Everything your restaurant needs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            Powerful tools designed specifically for restaurant operations, 
            from small cafes to large chains.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {features.map((feature, index) => (
            <GlassCard
              key={feature.title}
              hover
              className="p-6 space-y-4 animate-fade-in"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <div className="w-14 h-14 rounded-xl bg-primary/20 flex items-center justify-center">
                <feature.icon className="w-7 h-7 text-primary" />
              </div>
              <h3 className="text-lg font-display font-semibold">{feature.title}</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                {feature.description}
              </p>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
