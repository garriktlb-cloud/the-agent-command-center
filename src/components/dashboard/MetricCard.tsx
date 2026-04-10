import { cn } from "@/lib/utils";
import { ChevronRight } from "lucide-react";
import { ReactNode } from "react";

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: "default" | "primary" | "accent";
  icon?: ReactNode;
  trailing?: ReactNode;
  showArrow?: boolean;
}

export default function MetricCard({ label, value, sublabel, variant = "default", icon, trailing, showArrow }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-shadow hover:shadow-md relative overflow-hidden",
        variant === "primary" && "bg-primary text-primary-foreground border-primary",
        variant === "accent" && "bg-accent text-accent-foreground border-accent",
        variant === "default" && "bg-card text-card-foreground border-border"
      )}
    >
      <div className="flex items-start justify-between">
        <div className="flex-1">
          <p className={cn(
            "text-[10px] font-semibold uppercase tracking-wider mb-1.5",
            variant === "default" ? "text-muted-foreground" : "opacity-80"
          )}>
            {label}
          </p>
          <p className="text-2xl font-heading font-bold">{value}</p>
          {sublabel && (
            <p className={cn(
              "text-xs mt-0.5",
              variant === "default" ? "text-muted-foreground" : "opacity-70"
            )}>
              {sublabel}
            </p>
          )}
        </div>
        <div className="flex items-center gap-1">
          {icon && <div className="opacity-40">{icon}</div>}
          {trailing}
          {showArrow && (
            <ChevronRight className={cn(
              "h-4 w-4",
              variant === "default" ? "text-muted-foreground" : "opacity-60"
            )} />
          )}
        </div>
      </div>
    </div>
  );
}
