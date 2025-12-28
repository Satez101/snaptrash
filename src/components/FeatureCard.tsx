import { ReactNode } from "react";
import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { cn } from "@/lib/utils";

interface FeatureCardProps {
  to: string;
  icon: ReactNode;
  title: string;
  subtitle: string;
  description: string;
  points?: number;
  variant?: "primary" | "warm";
  className?: string;
}

const FeatureCard = ({
  to,
  icon,
  title,
  subtitle,
  description,
  points,
  variant = "primary",
  className,
}: FeatureCardProps) => {
  return (
    <Link
      to={to}
      className={cn(
        "group relative glass-card-hover p-8 flex flex-col gap-6 overflow-hidden",
        className
      )}
    >
      {/* Background Gradient Effect */}
      <div
        className={cn(
          "absolute inset-0 opacity-0 group-hover:opacity-100 transition-opacity duration-500",
          variant === "primary"
            ? "bg-gradient-to-br from-primary/10 via-transparent to-transparent"
            : "bg-gradient-to-br from-warning/10 via-transparent to-transparent"
        )}
      />

      {/* Points Badge */}
      {points && (
        <div className="absolute top-6 right-6 px-3 py-1 rounded-full bg-accent/10 text-accent text-sm font-semibold">
          +{points}
        </div>
      )}

      {/* Icon */}
      <div
        className={cn(
          "relative w-16 h-16 rounded-2xl flex items-center justify-center transition-all duration-300 group-hover:scale-110",
          variant === "primary"
            ? "bg-gradient-primary group-hover:shadow-[0_0_30px_hsl(var(--primary)/0.5)]"
            : "bg-gradient-warm group-hover:shadow-[0_0_30px_hsl(var(--warning)/0.5)]"
        )}
      >
        <div className="text-primary-foreground animate-float">{icon}</div>
      </div>

      {/* Content */}
      <div className="relative flex flex-col gap-2">
        <span
          className={cn(
            "text-xs font-medium uppercase tracking-wider",
            variant === "primary" ? "text-primary" : "text-warning"
          )}
        >
          {subtitle}
        </span>
        <h3 className="font-display text-2xl font-bold text-foreground">
          {title}
        </h3>
        <p className="text-muted-foreground leading-relaxed">{description}</p>
      </div>

      {/* Action Link */}
      <div
        className={cn(
          "relative flex items-center gap-2 text-sm font-semibold transition-all duration-300 group-hover:gap-3",
          variant === "primary" ? "text-primary" : "text-warning"
        )}
      >
        <span>Get Started</span>
        <ArrowRight className="w-4 h-4" />
      </div>
    </Link>
  );
};

export default FeatureCard;
