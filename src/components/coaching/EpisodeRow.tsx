import { Button } from "@/components/ui/button";
import { Play, Headphones, Video, CheckCircle2 } from "lucide-react";
import { cn } from "@/lib/utils";

interface Props {
  number: number;
  title: string;
  durationSeconds: number;
  mediaType: "audio" | "video";
  active?: boolean;
  completed?: boolean;
  onPlay: () => void;
}

const formatDuration = (s: number) => {
  const m = Math.floor(s / 60);
  const sec = s % 60;
  return `${m}:${sec.toString().padStart(2, "0")}`;
};

export default function EpisodeRow({ number, title, durationSeconds, mediaType, active, completed, onPlay }: Props) {
  return (
    <button
      onClick={onPlay}
      className={cn(
        "w-full flex items-center gap-4 p-3 rounded-lg border text-left transition-colors",
        active
          ? "border-primary bg-primary/5"
          : "border-border bg-card hover:bg-muted/50"
      )}
    >
      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center text-xs font-mono font-medium text-muted-foreground shrink-0">
        {completed ? <CheckCircle2 className="w-4 h-4 text-primary" /> : number.toString().padStart(2, "0")}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-foreground truncate">{title}</p>
        <div className="flex items-center gap-2 mt-0.5 text-xs text-muted-foreground">
          {mediaType === "video" ? <Video className="w-3 h-3" /> : <Headphones className="w-3 h-3" />}
          <span>{formatDuration(durationSeconds)}</span>
        </div>
      </div>
      <Button variant="ghost" size="sm" className="shrink-0" tabIndex={-1}>
        <Play className="w-3.5 h-3.5 mr-1" />
        {mediaType === "video" ? "Watch" : "Listen"}
      </Button>
    </button>
  );
}
