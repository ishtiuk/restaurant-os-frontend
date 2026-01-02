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
  gradient: string;
}

const features: Feature[] = [
  {
    icon: UtensilsCrossed,
    title: "Easy Menu Management",
    description: "Create and update your menu items with categories, modifiers, and pricing in just a few clicks.",
    gradient: "from-primary/20 to-primary/5"
  },
  {
    icon: ClipboardList,
    title: "Real-Time Orders",
    description: "Track orders from kitchen to table with live updates. Never miss an order again.",
    gradient: "from-accent/20 to-accent/5"
  },
  {
    icon: BarChart3,
    title: "Powerful Analytics",
    description: "Gain insights into sales trends, peak hours, and top-selling items to make smarter decisions.",
    gradient: "from-secondary/20 to-secondary/5"
  },
  {
    icon: LayoutGrid,
    title: "Table Management",
    description: "Visualize your floor plan, manage reservations, and track table status in real-time.",
    gradient: "from-primary/20 to-primary/5"
  }
];

export function FeaturesSection() {
  return (
    <section id="features" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle background */}
      <div className="absolute inset-0 bg-muted/30" />
      <div className="absolute inset-0 bg-gradient-to-b from-background via-transparent to-background" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <Badge variant="glass" className="px-4 py-1.5">Features</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Everything your restaurant needs
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            Powerful tools designed specifically for restaurant operations, 
            from small cafes to large chains.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {features.map((feature, index) => (
            <GlassCard
              key={feature.title}
              hover
              className="p-5 sm:p-6 space-y-4 animate-fade-in hover-lift group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Icon container with gradient */}
              <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl bg-gradient-to-br ${feature.gradient} flex items-center justify-center transition-transform duration-300 group-hover:scale-110`}>
                <feature.icon className="w-6 h-6 sm:w-7 sm:h-7 text-foreground" />
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