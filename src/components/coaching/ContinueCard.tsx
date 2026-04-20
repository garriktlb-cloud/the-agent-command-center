import { Link } from "react-router-dom";
import { Progress } from "@/components/ui/progress";
import { BookOpen } from "lucide-react";

interface Props {
  id: string;
  title: string;
  thumbnailUrl?: string | null;
  progress: number; // 0-100
}

export default function ContinueCard({ id, title, thumbnailUrl, progress }: Props) {
  return (
    <Link
      to={`/coaching/${id}`}
      className="group rounded-lg border border-border bg-card overflow-hidden hover:shadow-md transition-shadow flex flex-col"
    >
      <div className="aspect-[16/9] bg-muted relative overflow-hidden">
        {thumbnailUrl ? (
          <img src={thumbnailUrl} alt={title} className="w-full h-full object-cover" loading="lazy" />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
            <BookOpen className="w-7 h-7 text-primary/40" />
          </div>
        )}
      </div>
      <div className="p-3 space-y-2">
        <h4 className="text-sm font-medium text-foreground line-clamp-2 leading-tight">{title}</h4>
        <Progress value={progress} className="h-1" />
      </div>
    </Link>
  );
}
