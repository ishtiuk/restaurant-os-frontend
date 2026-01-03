import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
  avatar?: string;
}

const testimonials: Testimonial[] = [
  {
    name: "Sarah Chen",
    role: "Owner, The Golden Wok",
    content: "This POS system transformed our operations. We've reduced order errors by 90% and our staff loves how intuitive it is.",
    rating: 5
  },
  {
    name: "Marcus Johnson",
    role: "Manager, Bella Italia",
    content: "The analytics features alone are worth it. We finally understand our peak hours and can staff accordingly.",
    rating: 5
  },
  {
    name: "Priya Patel",
    role: "Owner, Spice Kitchen",
    content: "Setup was incredibly easy. We were up and running in less than an hour. Customer support is fantastic too!",
    rating: 5
  }
];

export function TestimonialsSection() {
  return (
    <section id="testimonials" className="py-20 sm:py-28 px-4 sm:px-6 lg:px-8 relative overflow-hidden">
      {/* Subtle gradient background */}
      <div className="absolute inset-0 bg-gradient-to-b from-muted/20 via-transparent to-muted/20" />
      
      <div className="max-w-7xl mx-auto relative">
        <div className="text-center space-y-4 mb-12 sm:mb-16">
          <Badge variant="glass" className="px-4 py-1.5">Testimonials</Badge>
          <h2 className="text-3xl sm:text-4xl lg:text-5xl font-display font-bold tracking-tight">
            Trusted by restaurant owners
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto text-base sm:text-lg">
            See what our customers have to say about their experience.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {testimonials.map((testimonial, index) => (
            <GlassCard
              key={testimonial.name}
              hover
              className="p-6 sm:p-8 space-y-5 animate-fade-in hover-lift relative group"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              {/* Quote icon - subtle */}
              <Quote className="w-10 h-10 text-primary/10 absolute top-6 right-6 transition-colors group-hover:text-primary/20" />
              
              {/* Stars */}
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-primary text-primary" />
                ))}
              </div>
              
              {/* Content */}
              <p className="text-foreground leading-relaxed text-sm sm:text-base relative z-10">
                "{testimonial.content}"
              </p>
              
              {/* Author */}
              <div className="pt-4 border-t border-border/50 flex items-center gap-3">
                {/* Avatar placeholder */}
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-primary/20 to-accent/20 flex items-center justify-center text-sm font-semibold text-foreground">
                  {testimonial.name.split(' ').map(n => n[0]).join('')}
                </div>
                <div>
                  <p className="font-semibold text-foreground text-sm">{testimonial.name}</p>
                  <p className="text-xs text-muted-foreground">{testimonial.role}</p>
                </div>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}