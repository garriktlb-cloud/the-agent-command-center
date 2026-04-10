import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { CheckCircle2, Circle } from "lucide-react";

interface ListingCardProps {
  address: string;
  agent: string;
  status: string;
  statusColor: "blue" | "green" | "amber" | "purple";
  readiness: number;
  checklist: { label: string; done: boolean }[];
  nextAction: string;
}

const statusColors = {
  blue: "bg-info text-info-foreground",
  green: "bg-success text-success-foreground",
  amber: "bg-warning text-warning-foreground",
  purple: "bg-accent text-accent-foreground",
};

export default function ListingCard({
  address,
  agent,
  status,
  statusColor,
  readiness,
  checklist,
  nextAction,
}: ListingCardProps) {
  return (
    <div className="rounded-lg border bg-card p-4 hover:shadow-md transition-shadow">
      <div className="flex items-start justify-between mb-2">
        <h4 className="font-heading font-semibold text-sm">{address}</h4>
        <Badge className={statusColors[statusColor]} variant="secondary">
          {status}
        </Badge>
      </div>
      <p className="text-xs text-muted-foreground mb-3">{agent}</p>

      <div className="flex items-center justify-between text-xs mb-1">
        <span className="text-muted-foreground">Launch readiness</span>
        <span className="font-semibold">{readiness}%</span>
      </div>
      <Progress value={readiness} className="h-1.5 mb-3" />

      <div className="space-y-1.5 mb-3">
        {checklist.map((item) => (
          <div key={item.label} className="flex items-center gap-2 text-xs">
            {item.done ? (
              <CheckCircle2 className="h-3.5 w-3.5 text-success" />
            ) : (
              <Circle className="h-3.5 w-3.5 text-muted-foreground" />
            )}
            <span className={item.done ? "text-muted-foreground" : ""}>{item.label}</span>
          </div>
        ))}
      </div>

      <div className="border-t pt-2">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-0.5">Next Action</p>
        <p className="text-xs font-medium">{nextAction}</p>
      </div>
    </div>
  );
}
