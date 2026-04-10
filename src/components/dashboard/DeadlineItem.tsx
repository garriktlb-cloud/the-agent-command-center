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
      urgency === "red" && "border-destructive/30 bg-destructive/5",
      urgency === "amber" && "border-warning/30 bg-warning/5",
      urgency === "normal" && "border-border bg-card"
    )}>
      {urgency === "red" ? (
        <AlertCircle className="h-4 w-4 shrink-0 text-destructive" />
      ) : (
        <Clock className={cn("h-4 w-4 shrink-0", urgency === "amber" ? "text-warning" : "text-muted-foreground")} />
      )}
      <div className="flex-1 min-w-0">
        <p className="font-medium truncate">{label}</p>
        <p className="text-xs text-muted-foreground">{property}</p>
      </div>
      <span className={cn(
        "text-xs font-semibold shrink-0",
        urgency === "red" && "text-destructive",
        urgency === "amber" && "text-warning",
        urgency === "normal" && "text-muted-foreground"
      )}>
        {date}
      </span>
    </div>
  );
}
