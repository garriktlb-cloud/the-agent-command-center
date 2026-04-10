import { cn } from "@/lib/utils";

interface MetricCardProps {
  label: string;
  value: string | number;
  sublabel?: string;
  variant?: "default" | "primary" | "accent";
}

export default function MetricCard({ label, value, sublabel, variant = "default" }: MetricCardProps) {
  return (
    <div
      className={cn(
        "rounded-lg border p-4 transition-shadow hover:shadow-md",
        variant === "primary" && "bg-primary text-primary-foreground border-primary",
        variant === "accent" && "bg-accent text-accent-foreground border-accent",
        variant === "default" && "bg-card text-card-foreground border-border"
      )}
    >
      <p className={cn(
        "text-xs font-medium uppercase tracking-wider mb-1",
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
  );
}
