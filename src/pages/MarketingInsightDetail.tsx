import { useParams, Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Download, Copy, Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useState } from "react";
import { toast } from "@/hooks/use-toast";

const BUCKET = "marketing-images";

const publicUrl = (path?: string | null) => {
  if (!path) return null;
  return supabase.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
};

export default function MarketingInsightDetail() {
  const { id } = useParams<{ id: string }>();
  const [copied, setCopied] = useState(false);

  const { data: insight, isLoading } = useQuery({
    queryKey: ["marketing-insight", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("marketing_insights")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!id,
  });

  const handleCopy = async () => {
    if (!insight?.social_caption) return;
    await navigator.clipboard.writeText(insight.social_caption);
    setCopied(true);
    toast({ title: "Caption copied to clipboard" });
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = async () => {
    const url = publicUrl(insight?.image_path);
    if (!url) return;
    const res = await fetch(url);
    const blob = await res.blob();
    const a = document.createElement("a");
    a.href = URL.createObjectURL(blob);
    a.download = `${insight?.title?.replace(/\s+/g, "-").toLowerCase() ?? "image"}.jpg`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  if (isLoading) {
    return (
      <div className="animate-fade-in p-8 text-sm text-muted-foreground">
        Loading…
      </div>
    );
  }

  if (!insight) {
    return (
      <div className="animate-fade-in p-8">
        <p className="text-sm text-muted-foreground">Insight not found.</p>
        <Link to="/marketing" className="text-primary text-sm mt-2 inline-block">
          ← Back to Marketing
        </Link>
      </div>
    );
  }

  const imgUrl = publicUrl(insight.image_path);

  return (
    <div className="animate-fade-in space-y-6 max-w-5xl">
      {/* Back */}
      <Link
        to="/marketing"
        className="inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground transition-colors"
      >
        <ArrowLeft className="h-4 w-4" /> Back to Marketing
      </Link>

      <h1 className="text-2xl font-heading font-bold">{insight.title}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Left — image */}
        <div className="space-y-3">
          <div className="aspect-[4/3] rounded-lg bg-[hsl(var(--primary))] relative flex items-center justify-center overflow-hidden">
            {imgUrl ? (
              <img
                src={imgUrl}
                alt={insight.title}
                className="absolute inset-0 w-full h-full object-cover"
              />
            ) : null}
            {/* Overlay hook text */}
            <div className="relative z-10 px-6 text-center">
              <p className="text-primary-foreground font-heading font-bold text-xl md:text-2xl leading-snug drop-shadow-lg">
                {insight.hook_text}
              </p>
            </div>
            {imgUrl && (
              <div className="absolute inset-0 bg-black/40" />
            )}
          </div>

          {imgUrl && (
            <Button variant="outline" size="sm" onClick={handleDownload} className="gap-2">
              <Download className="h-4 w-4" /> Download Image
            </Button>
          )}
        </div>

        {/* Right — content sections */}
        <div className="space-y-6">
          {insight.insight_body && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Insight
              </h3>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {insight.insight_body}
              </p>
            </section>
          )}

          {insight.talk_track && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                What to Say
              </h3>
              <p className="text-sm leading-relaxed text-foreground whitespace-pre-line">
                {insight.talk_track}
              </p>
            </section>
          )}

          {insight.social_caption && (
            <section>
              <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-2">
                Post This
              </h3>
              <div className="rounded-md border border-border bg-muted/40 p-4 text-sm leading-relaxed whitespace-pre-line">
                {insight.social_caption}
              </div>
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCopy}
                className="mt-2 gap-2"
              >
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                {copied ? "Copied!" : "Copy Caption"}
              </Button>
            </section>
          )}
        </div>
      </div>
    </div>
  );
}
