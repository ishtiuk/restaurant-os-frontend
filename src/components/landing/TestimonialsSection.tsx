import { Badge } from "@/components/ui/badge";
import { GlassCard } from "@/components/ui/GlassCard";
import { Star, Quote } from "lucide-react";

interface Testimonial {
  name: string;
  role: string;
  content: string;
  rating: number;
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
    <section id="about" className="py-20 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center space-y-4 mb-16">
          <Badge variant="glass">Testimonials</Badge>
          <h2 className="text-3xl sm:text-4xl font-display font-bold">
            Trusted by restaurant owners
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            See what our customers have to say about their experience.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {testimonials.map((testimonial, index) => (
            <GlassCard
              key={testimonial.name}
              hover
              className="p-6 space-y-4 animate-fade-in relative"
              style={{ animationDelay: `${index * 0.1}s` }}
            >
              <Quote className="w-8 h-8 text-primary/30 absolute top-4 right-4" />
              
              <div className="flex gap-1">
                {Array.from({ length: testimonial.rating }).map((_, i) => (
                  <Star key={i} className="w-5 h-5 fill-primary text-primary" />
                ))}
              </div>
              
              <p className="text-foreground leading-relaxed">
                "{testimonial.content}"
              </p>
              
              <div className="pt-2 border-t border-border">
                <p className="font-semibold text-foreground">{testimonial.name}</p>
                <p className="text-sm text-muted-foreground">{testimonial.role}</p>
              </div>
            </GlassCard>
          ))}
        </div>
      </div>
    </section>
  );
}
