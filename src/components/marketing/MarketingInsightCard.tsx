import { Link } from "react-router-dom";

interface MarketingInsightCardProps {
  id: string;
  hookText: string;
  imageUrl: string | null;
}

export default function MarketingInsightCard({ id, hookText, imageUrl }: MarketingInsightCardProps) {
  return (
    <Link to={`/marketing/${id}`} className="group block">
      <div className="rounded-lg overflow-hidden border border-border bg-card transition-shadow hover:shadow-md">
        {/* Image area — 4:3 */}
        <div className="aspect-[4/3] bg-[hsl(var(--primary))] relative flex items-center justify-center overflow-hidden">
          {imageUrl ? (
            <img
              src={imageUrl}
              alt=""
              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            />
          ) : (
            <span className="text-primary-foreground/60 font-heading text-lg tracking-wide">
              The List Bar
            </span>
          )}
        </div>
        {/* Hook text */}
        <div className="p-4">
          <p className="font-heading font-semibold text-sm leading-snug text-foreground line-clamp-3">
            {hookText}
          </p>
        </div>
      </div>
    </Link>
  );
}
