import * as React from "react";
import { cn } from "@/lib/utils";

interface GlassCardProps extends React.HTMLAttributes<HTMLDivElement> {
  hover?: boolean;
  glow?: "primary" | "accent" | "secondary" | "none";
}

const GlassCard = React.forwardRef<HTMLDivElement, GlassCardProps>(
  ({ className, hover = false, glow = "none", children, ...props }, ref) => {
    const glowClasses = {
      primary: "hover:shadow-[0_0_30px_hsl(var(--glow-primary)/0.2)]",
      accent: "hover:shadow-[0_0_30px_hsl(var(--glow-accent)/0.2)]",
      secondary: "hover:shadow-[0_0_30px_hsl(var(--glow-secondary)/0.2)]",
      none: "",
    };

    return (
      <div
        ref={ref}
        className={cn(
          hover ? "glass-card-hover" : "glass-card",
          glow !== "none" && glowClasses[glow],
          className
        )}
        {...props}
      >
        {children}
      </div>
    );
  }
);
GlassCard.displayName = "GlassCard";

export { GlassCard };
