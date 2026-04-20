import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { Play } from "lucide-react";

interface Props {
  id: string;
  title: string;
  episodeLabel?: string | null;
  remainingSeconds?: number;
  progress: number; // 0-100
}

const formatRemaining = (seconds: number) => {
  if (!seconds || seconds <= 0) return "Almost done";
  const mins = Math.round(seconds / 60);
  if (mins < 1) return "<1 min left";
  if (mins < 60) return `${mins} min left`;
  const hrs = Math.floor(mins / 60);
  const rem = mins % 60;
  return rem ? `${hrs}h ${rem}m left` : `${hrs}h left`;
};

export default function ContinueCard({
  id,
  title,
  episodeLabel,
  remainingSeconds = 0,
  progress,
}: Props) {
  return (
    <Link
      to={`/coaching/${id}`}
      className="group flex items-center gap-4 rounded-lg border border-border bg-card p-4 hover:shadow-md hover:border-primary/30 transition-all"
    >
      <div className="flex-shrink-0 w-10 h-10 rounded-full bg-primary/10 group-hover:bg-primary/20 transition-colors flex items-center justify-center">
        <Play className="w-4 h-4 text-primary fill-primary ml-0.5" />
      </div>
      <div className="flex-1 min-w-0 space-y-1.5">
        <h4 className="text-sm font-medium text-foreground truncate leading-tight">
          {title}
        </h4>
        <div className="flex items-center gap-2 text-xs text-muted-foreground">
          {episodeLabel && <span className="truncate">{episodeLabel}</span>}
          {episodeLabel && <span>·</span>}
          <span className="flex-shrink-0">{formatRemaining(remainingSeconds)}</span>
        </div>
        <Progress value={progress} className="h-1" />
      </div>
    </Link>
  );
}
