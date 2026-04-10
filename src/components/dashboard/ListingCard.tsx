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
  imageUrl?: string;
}

export default function ListingCard({
  address,
  agent,
  status,
  readiness,
  checklist,
  nextAction,
  imageUrl,
}: ListingCardProps) {
  return (
    <div className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow">
      {/* Property Image */}
      <div className="h-28 bg-muted relative overflow-hidden">
        {imageUrl ? (
          <img src={imageUrl} alt={address} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-foreground/10 to-foreground/5 flex items-center justify-center">
            <svg className="h-8 w-8 text-foreground/20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
              <path d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-6h6v6" />
            </svg>
          </div>
        )}
      </div>

      <div className="p-4">
        <div className="flex items-start justify-between mb-2">
          <h4 className="font-heading font-semibold text-sm">{address}</h4>
          <Badge variant="outline" className="bg-foreground/5 text-foreground/70 border-foreground/15 text-[10px] shrink-0 ml-2">
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
                <CheckCircle2 className="h-3.5 w-3.5 text-foreground/50" />
              ) : (
                <Circle className="h-3.5 w-3.5 text-muted-foreground/50" />
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
    </div>
  );
}
