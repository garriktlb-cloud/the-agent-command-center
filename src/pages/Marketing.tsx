import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Input } from "@/components/ui/input";
import { Search, Megaphone } from "lucide-react";
import MarketingInsightCard from "@/components/marketing/MarketingInsightCard";

const BUCKET = "marketing-images";

const publicUrl = (path?: string | null) => {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

export default function Marketing() {
  const [query, setQuery] = useState("");

  const { data: insights = [] } = useQuery({
    queryKey: ["marketing-insights"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_insights")
        .select("*")
        .order("sort_order");
      if (error) throw error;
      return data;
    },
  });

  const filtered = useMemo(() => {
    if (!query.trim()) return insights;
    const q = query.toLowerCase();
    return insights.filter(
      (i) =>
        i.title.toLowerCase().includes(q) ||
        i.hook_text.toLowerCase().includes(q)
    );
  }, [insights, query]);

  return (
    <div className="animate-fade-in space-y-8">
      {/* Header banner */}
      <div className="rounded-xl bg-[hsl(var(--primary))] p-8 md:p-10 text-primary-foreground">
        <div className="flex items-center gap-2 mb-2">
          <Megaphone className="h-5 w-5" />
          <span className="text-xs font-medium uppercase tracking-wider opacity-80">
            Marketing Center
          </span>
        </div>
        <h1 className="text-2xl md:text-3xl font-heading font-bold mb-1">
          What top agents are saying right now
        </h1>
        <p className="text-sm opacity-80 max-w-lg">
          Curated insights, language, and posts to help you communicate like a
          top-producing agent.
        </p>
      </div>

      {/* Search */}
      <div className="relative max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
        <Input
          placeholder="Search insights…"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="pl-9"
        />
      </div>

      {/* Grid */}
      {filtered.length === 0 ? (
        <p className="text-sm text-muted-foreground">No insights found.</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {filtered.map((insight) => (
            <MarketingInsightCard
              key={insight.id}
              id={insight.id}
              hookText={insight.hook_text}
              imageUrl={publicUrl(insight.image_path)}
            />
          ))}
        </div>
      )}
    </div>
  );
}
