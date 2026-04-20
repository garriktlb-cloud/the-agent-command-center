import { useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Input } from "@/components/ui/input";
import { Search, Sparkles } from "lucide-react";
import TopicCard from "@/components/coaching/TopicCard";
import ContinueCard from "@/components/coaching/ContinueCard";

const BUCKET = "coaching-media";

const publicUrl = (path?: string | null) => {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

export default function Coaching() {
  const { user } = useAuth();
  const [query, setQuery] = useState("");

  const { data: topics = [], isLoading } = useQuery({
    queryKey: ["coaching-topics"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_topics")
        .select("*, coaching_episodes(id, title, episode_number, duration_seconds)")
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["coaching-progress", user?.id],
    enabled: !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_progress")
        .select("*, coaching_episodes(topic_id)")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const continueRow = useMemo(() => {
    if (!topics.length) return [];
    const byTopic = new Map<
      string,
      { positionSum: number; durationSum: number; latest: any }
    >();
    for (const p of progress as any[]) {
      const tid = p.coaching_episodes?.topic_id;
      if (!tid) continue;
      const ep = (topics as any[]).find((t) => t.id === tid)?.coaching_episodes
        ?.find((e: any) => e.id === p.episode_id);
      const dur = ep?.duration_seconds ?? 0;
      const cur = byTopic.get(tid) ?? { positionSum: 0, durationSum: 0, latest: null };
      cur.positionSum += p.completed ? dur : p.last_position_seconds ?? 0;
      cur.durationSum += dur;
      // Track the latest in-progress episode (not yet completed)
      if (!p.completed) {
        const prevUpdated = cur.latest?.updated_at ?? "";
        if (!cur.latest || (p.updated_at ?? "") > prevUpdated) {
          cur.latest = { ...p, _episode: ep };
        }
      }
      byTopic.set(tid, cur);
    }
    return (topics as any[])
      .map((t) => {
        const stats = byTopic.get(t.id);
        const totalDur = (t.coaching_episodes ?? []).reduce(
          (s: number, e: any) => s + (e.duration_seconds || 0),
          0,
        );
        const pct = stats && totalDur > 0
          ? Math.min(100, Math.round((stats.positionSum / totalDur) * 100))
          : 0;
        const latestEp = stats?.latest?._episode;
        const remaining = latestEp
          ? Math.max(0, (latestEp.duration_seconds ?? 0) - (stats!.latest.last_position_seconds ?? 0))
          : 0;
        const episodeLabel = latestEp
          ? `Episode ${latestEp.episode_number}`
          : null;
        return { ...t, _progress: pct, _remaining: remaining, _episodeLabel: episodeLabel };
      })
      .filter((t) => t._progress > 0 && t._progress < 100)
      .slice(0, 3);
  }, [topics, progress]);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return topics as any[];
    return (topics as any[]).filter(
      (t) =>
        t.title.toLowerCase().includes(q) ||
        (t.description ?? "").toLowerCase().includes(q),
    );
  }, [topics, query]);

  return (
    <div className="animate-fade-in space-y-10">
      <header className="space-y-2">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-accent/20 text-accent-foreground text-xs font-medium">
          <Sparkles className="w-3.5 h-3.5" /> Coaching
        </div>
        <h1 className="text-3xl font-heading font-bold text-foreground">
          Coaching with The List Bar
        </h1>
        <p className="text-muted-foreground max-w-2xl">
          Learn quickly. Apply immediately. Bite-sized lessons from operators who run real listings every day.
        </p>
      </header>

      {continueRow.length > 0 && (
        <section className="space-y-4">
          <h2 className="text-lg font-heading font-semibold text-foreground">Continue learning</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
            {continueRow.map((t) => (
              <ContinueCard
                key={t.id}
                id={t.id}
                title={t.title}
                episodeLabel={t._episodeLabel}
                remainingSeconds={t._remaining}
                progress={t._progress}
              />
            ))}
          </div>
        </section>
      )}

      <section className="space-y-4">
        <div className="flex items-center justify-between gap-4 flex-wrap">
          <h2 className="text-lg font-heading font-semibold text-foreground">Browse topics</h2>
          <div className="relative max-w-xs w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <Input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Search topics..."
              className="pl-9"
            />
          </div>
        </div>

        {isLoading ? (
          <div className="text-sm text-muted-foreground">Loading...</div>
        ) : filtered.length === 0 ? (
          <div className="rounded-xl border border-dashed border-border p-12 text-center">
            <p className="text-sm text-muted-foreground">
              {topics.length === 0
                ? "No coaching topics yet. Check back soon."
                : "No topics match your search."}
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {filtered.map((t: any) => (
              <TopicCard
                key={t.id}
                id={t.id}
                title={t.title}
                description={t.description}
                thumbnailUrl={publicUrl(t.thumbnail_path)}
                episodeCount={t.coaching_episodes?.length ?? 0}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
