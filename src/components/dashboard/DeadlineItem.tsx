import { AlertCircle, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface DeadlineItemProps {
  label: string;
  property: string;
  date: string;
  urgency: "red" | "amber" | "normal";
}

export default function DeadlineItem({ label, property, date, urgency }: DeadlineItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-md border px-3 py-2.5 text-sm",
      urgency === "red" && "border-foreground/20 bg-foreground/[0.03]",
      urgency === "amber" && "border-foreground/10 bg-card",
      urgency === "normal" && "border-border bg-card"
    )}>
      {urgency === "red" ? (
        <AlertCircle className="h-4 w-4 shrink-0 text-foreground/60" />
      ) : (
        <Clock className="h-4 w-4 shrink-0 text-muted-foreground" />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground">{property}</p>
      </div>
      <span className={cn(
        "text-xs font-semibold shrink-0",
        urgency === "red" ? "text-foreground" : "text-muted-foreground"
      )}>
        {date}
      </span>
    </div>
  );
}
