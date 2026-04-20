import { useMemo, useState } from "react";
import { Link, useParams } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { ArrowLeft, Headphones, Video, LifeBuoy } from "lucide-react";
import { cn } from "@/lib/utils";
import MediaPlayerCard from "@/components/coaching/MediaPlayerCard";
import EpisodeRow from "@/components/coaching/EpisodeRow";

const BUCKET = "coaching-media";
const publicUrl = (path?: string | null) =>
  path ? supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl : null;

export default function CoachingTopic() {
  const { topicId } = useParams<{ topicId: string }>();
  const { user } = useAuth();
  const qc = useQueryClient();
  const [mode, setMode] = useState<"audio" | "video">("audio");
  const [activeEpisodeId, setActiveEpisodeId] = useState<string | null>(null);

  const { data: topic } = useQuery({
    queryKey: ["coaching-topic", topicId],
    enabled: !!topicId,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_topics")
        .select("*, coaching_episodes(*)")
        .eq("id", topicId!)
        .maybeSingle();
      if (error) throw error;
      return data;
    },
  });

  const { data: progress = [] } = useQuery({
    queryKey: ["coaching-topic-progress", topicId, user?.id],
    enabled: !!topicId && !!user,
    queryFn: async () => {
      const { data, error } = await supabase
        .from("coaching_progress")
        .select("*")
        .eq("user_id", user!.id);
      if (error) throw error;
      return data;
    },
  });

  const episodes = useMemo(() => {
    const all = ((topic as any)?.coaching_episodes ?? []) as any[];
    return all
      .filter((e) => e.media_type === mode)
      .sort((a, b) => a.episode_number - b.episode_number);
  }, [topic, mode]);

  const activeEpisode = useMemo(
    () => episodes.find((e) => e.id === activeEpisodeId) ?? episodes[0] ?? null,
    [episodes, activeEpisodeId],
  );

  const progressById = useMemo(() => {
    const m = new Map<string, any>();
    for (const p of progress as any[]) m.set(p.episode_id, p);
    return m;
  }, [progress]);

  const saveProgress = useMutation({
    mutationFn: async (vars: { episodeId: string; position: number; completed: boolean }) => {
      if (!user) return;
      await supabase
        .from("coaching_progress")
        .upsert(
          {
            user_id: user.id,
            episode_id: vars.episodeId,
            last_position_seconds: Math.floor(vars.position),
            completed: vars.completed,
          },
          { onConflict: "user_id,episode_id" },
        );
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["coaching-topic-progress", topicId, user?.id] });
      qc.invalidateQueries({ queryKey: ["coaching-progress", user?.id] });
    },
  });

  const requestSupport = useMutation({
    mutationFn: async () => {
      if (!user || !topic) throw new Error("Not ready");
      const { error } = await supabase.from("tasks").insert({
        user_id: user.id,
        title: `Coaching: ${(topic as any).title}`,
        description: activeEpisode?.key_takeaway ?? (topic as any).description ?? null,
        task_type: "todo",
        priority: "normal",
        status: "todo",
      } as any);
      if (error) throw error;
    },
    onSuccess: () => toast.success("Support request added to your tasks"),
    onError: () => toast.error("Couldn't create the request. Try again."),
  });

  // Throttle progress saves to roughly every 5 seconds
  const lastSavedRef = useState<{ t: number }>({ t: 0 })[0];
  const handleProgress = (positionSeconds: number, completed: boolean) => {
    if (!activeEpisode) return;
    const now = Date.now();
    if (!completed && now - lastSavedRef.t < 5000) return;
    lastSavedRef.t = now;
    saveProgress.mutate({
      episodeId: activeEpisode.id,
      position: positionSeconds,
      completed,
    });
  };

  return (
    <div className="animate-fade-in space-y-6">
      <Link
        to="/coaching"
        className="inline-flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4" /> All topics
      </Link>

      {!topic ? (
        <div className="text-sm text-muted-foreground">Loading...</div>
      ) : (
        <>
          <header className="space-y-1">
            <h1 className="text-2xl font-heading font-bold text-foreground">
              {(topic as any).title}
            </h1>
            {(topic as any).description && (
              <p className="text-muted-foreground max-w-2xl">{(topic as any).description}</p>
            )}
          </header>

          <MediaPlayerCard
            title={activeEpisode?.title}
            mediaUrl={publicUrl(activeEpisode?.media_path)}
            mediaType={mode}
            durationSeconds={activeEpisode?.duration_seconds ?? 0}
            onProgress={handleProgress}
          />

          <div className="inline-flex p-1 rounded-full bg-muted">
            {(["audio", "video"] as const).map((m) => (
              <button
                key={m}
                onClick={() => {
                  setMode(m);
                  setActiveEpisodeId(null);
                }}
                className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-colors inline-flex items-center gap-1.5",
                  mode === m
                    ? "bg-background text-foreground shadow-sm"
                    : "text-muted-foreground hover:text-foreground",
                )}
              >
                {m === "audio" ? <Headphones className="w-3.5 h-3.5" /> : <Video className="w-3.5 h-3.5" />}
                {m === "audio" ? "Listen" : "Watch"}
              </button>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
            <aside className="lg:col-span-2 space-y-4">
              <div className="rounded-xl border border-border bg-card p-5 space-y-3">
                <p className="text-xs uppercase tracking-wider text-muted-foreground font-mono">
                  Key Takeaway
                </p>
                <p className="text-sm text-foreground leading-relaxed">
                  {activeEpisode?.key_takeaway ||
                    "Pick an episode to see the key takeaway."}
                </p>
              </div>
              <Button
                onClick={() => requestSupport.mutate()}
                disabled={requestSupport.isPending || !topic}
                variant="outline"
                className="w-full"
              >
                <LifeBuoy className="w-4 h-4 mr-2" />
                Request support from List Bar
              </Button>
            </aside>

            <div className="lg:col-span-3 space-y-2">
              {episodes.length === 0 ? (
                <div className="rounded-xl border border-dashed border-border p-8 text-center text-sm text-muted-foreground">
                  No {mode} episodes for this topic yet.
                </div>
              ) : (
                episodes.map((ep) => {
                  const p = progressById.get(ep.id);
                  return (
                    <EpisodeRow
                      key={ep.id}
                      number={ep.episode_number}
                      title={ep.title}
                      durationSeconds={ep.duration_seconds}
                      mediaType={ep.media_type}
                      active={activeEpisode?.id === ep.id}
                      completed={!!p?.completed}
                      onPlay={() => setActiveEpisodeId(ep.id)}
                    />
                  );
                })
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
