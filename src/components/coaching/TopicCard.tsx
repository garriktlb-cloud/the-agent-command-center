import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { ArrowRight, BookOpen } from "lucide-react";

interface Props {
  id: string;
  title: string;
  description?: string | null;
  thumbnailUrl?: string | null;
  episodeCount?: number;
}

export default function TopicCard({ id, title, description, thumbnailUrl, episodeCount }: Props) {
  return (
    <div className="group rounded-xl border border-border bg-card overflow-hidden hover:shadow-lg transition-shadow flex flex-col">
      <div className="aspect-[16/10] bg-muted relative overflow-hidden">
        {thumbnailUrl ? (
          <img
            src={thumbnailUrl}
            alt={title}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
            loading="lazy"
          />
        ) : (
          <div className="w-full h-full flex items-center justify-center bg-gradient-to-br from-primary/10 to-accent/20">
            <BookOpen className="w-10 h-10 text-primary/40" />
          </div>
        )}
      </div>
      <div className="p-5 flex flex-col gap-3 flex-1">
        <div className="flex-1">
          <h3 className="font-heading font-semibold text-base text-foreground leading-tight">{title}</h3>
          {description && (
            <p className="text-sm text-muted-foreground mt-1.5 line-clamp-2">{description}</p>
          )}
          {episodeCount !== undefined && (
            <p className="text-xs text-muted-foreground mt-2">{episodeCount} episode{episodeCount === 1 ? "" : "s"}</p>
          )}
        </div>
        <Button asChild variant="outline" size="sm" className="self-start">
          <Link to={`/coaching/${id}`}>
            Explore <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Link>
        </Button>
      </div>
    </div>
  );
}
