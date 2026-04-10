import { AlertCircle, Clock, FileText, DollarSign, Search, Key, ChevronRight } from "lucide-react";
import { cn } from "@/lib/utils";
import { ReactNode } from "react";

interface DeadlineItemProps {
  label: string;
  property: string;
  date: string;
  urgency: "red" | "amber" | "normal";
  icon?: ReactNode;
}

export default function DeadlineItem({ label, property, date, urgency, icon }: DeadlineItemProps) {
  return (
    <div className={cn(
      "flex items-center gap-3 rounded-md border px-3 py-3 text-sm cursor-pointer hover:shadow-sm transition-shadow",
      urgency === "red" && "border-foreground/20 bg-foreground/[0.03]",
      urgency === "amber" && "border-foreground/10 bg-card",
      urgency === "normal" && "border-border bg-card"
    )}>
      <div className={cn(
        "h-9 w-9 rounded-full flex items-center justify-center shrink-0",
        urgency === "red" ? "bg-foreground/10" : "bg-muted"
      )}>
        {icon || (urgency === "red" ? (
          <AlertCircle className="h-4 w-4 text-foreground/60" />
        ) : (
          <Clock className="h-4 w-4 text-muted-foreground" />
        ))}
      </div>
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
      <ChevronRight className="h-4 w-4 text-muted-foreground shrink-0" />
    </div>
  );
}
