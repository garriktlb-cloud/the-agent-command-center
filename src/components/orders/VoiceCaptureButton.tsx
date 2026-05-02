import { useEffect, useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Mic, Square, Loader2, Sparkles, Trash2, Check, Pencil, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { NewOrderDialog } from "./NewOrderDialog";
import { getServiceById, SERVICE_TYPES } from "@/lib/orderServices";
import { cn } from "@/lib/utils";

type Phase = "idle" | "recording" | "processing" | "review";

interface ParsedOrder {
  service_type: string;
  property_hint?: string;
  details: Record<string, any>;
  notes?: string;
  confidence: number;
  // Resolved client-side
  resolved_listing_id?: string | null;
  resolved_transaction_id?: string | null;
}

export function VoiceCaptureButton() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [phase, setPhase] = useState<Phase>("idle");
  const [transcript, setTranscript] = useState("");
  const [orders, setOrders] = useState<ParsedOrder[]>([]);
  const [editIdx, setEditIdx] = useState<number | null>(null);
  const [reviewOpen, setReviewOpen] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const startedAtRef = useRef<number>(0);
  const [elapsed, setElapsed] = useState(0);
  const elapsedTimerRef = useRef<number | null>(null);

  // Listings + transactions used to auto-resolve property_hint
  const { data: listings } = useQuery({
    queryKey: ["listings-for-voice"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("id, address").limit(500);
      if (error) throw error;
      return data;
    },
    enabled: !!user,
  });
  const { data: transactions } = useQuery({
    queryKey: ["transactions-for-voice"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, listing:listings(id, address)")
        .limit(500);
      if (error) throw error;
      return data as any[];
    },
    enabled: !!user,
  });

  useEffect(() => () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    if (elapsedTimerRef.current) window.clearInterval(elapsedTimerRef.current);
  }, []);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      const mr = new MediaRecorder(stream, { mimeType: pickMime() });
      mediaRecorderRef.current = mr;
      chunksRef.current = [];
      mr.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      mr.onstop = handleStop;
      mr.start();
      setPhase("recording");
      startedAtRef.current = Date.now();
      setElapsed(0);
      elapsedTimerRef.current = window.setInterval(() => {
        setElapsed(Math.floor((Date.now() - startedAtRef.current) / 1000));
      }, 250);
    } catch (e) {
      console.error(e);
      toast.error("Microphone access required to capture voice orders.");
      setPhase("idle");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current?.state === "recording") {
      mediaRecorderRef.current.stop();
    }
    if (elapsedTimerRef.current) {
      window.clearInterval(elapsedTimerRef.current);
      elapsedTimerRef.current = null;
    }
  };

  const handleStop = async () => {
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    setPhase("processing");

    const blob = new Blob(chunksRef.current, { type: chunksRef.current[0]?.type || "audio/webm" });
    if (blob.size < 1000) {
      toast.error("Recording too short. Try again.");
      setPhase("idle");
      return;
    }
    const base64 = await blobToBase64(blob);

    try {
      const { data, error } = await supabase.functions.invoke("voice-order-capture", {
        body: { audio_base64: base64, mime_type: blob.type },
      });
      if (error) throw error;

      const t: string = data?.transcript || "";
      const rawOrders: ParsedOrder[] = data?.orders || [];

      // Resolve property hints client-side
      const resolved = rawOrders.map((o) => resolveProperty(o, listings, transactions));

      setTranscript(t);
      setOrders(resolved);
      setReviewOpen(true);
      setPhase("review");

      if (resolved.length === 0) {
        toast.warning("Couldn't identify any orders in that audio. You can try again or use the form.");
      } else {
        toast.success(`Found ${resolved.length} order${resolved.length === 1 ? "" : "s"} — review and submit.`);
      }
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Voice capture failed");
      setPhase("idle");
    }
  };

  const submitAll = async () => {
    if (!user) return;
    try {
      const rows = orders.map((o) => {
        const svc = getServiceById(o.service_type);
        const title = svc ? svc.defaultTitle(o.details) : `${o.service_type} order`;
        return {
          user_id: user.id,
          title,
          description: o.notes || null,
          listing_id: o.resolved_listing_id || null,
          transaction_id: o.resolved_transaction_id || null,
          status: "pending" as const,
          priority: "normal" as const,
          service_type: o.service_type,
          service_details: o.details,
          source: "voice" as const,
          source_transcript: transcript,
          source_confidence: o.confidence,
          due_date: o.details?.preferred_date || o.details?.needed_by || null,
        };
      });
      const { error } = await supabase.from("orders").insert(rows as any);
      if (error) throw error;
      toast.success(`Submitted ${rows.length} order${rows.length === 1 ? "" : "s"} to the team`);
      qc.invalidateQueries({ queryKey: ["orders"] });
      resetAll();
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to submit orders");
    }
  };

  const resetAll = () => {
    setOrders([]);
    setTranscript("");
    setReviewOpen(false);
    setEditIdx(null);
    setPhase("idle");
  };

  const removeOrder = (idx: number) =>
    setOrders((arr) => arr.filter((_, i) => i !== idx));

  const updateOrder = (idx: number, patch: Partial<ParsedOrder>) =>
    setOrders((arr) => arr.map((o, i) => (i === idx ? { ...o, ...patch } : o)));

  return (
    <>
      {/* Floating button */}
      <button
        onClick={phase === "recording" ? stopRecording : startRecording}
        disabled={phase === "processing"}
        className={cn(
          "fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full shadow-lg flex items-center justify-center transition-all",
          phase === "recording"
            ? "bg-destructive text-destructive-foreground animate-pulse"
            : "bg-primary text-primary-foreground hover:scale-105",
          phase === "processing" && "opacity-80 cursor-wait"
        )}
        aria-label={phase === "recording" ? "Stop recording" : "Capture voice order"}
        title={phase === "recording" ? "Stop recording" : "Speak an order"}
      >
        {phase === "processing" ? (
          <Loader2 className="h-6 w-6 animate-spin" />
        ) : phase === "recording" ? (
          <Square className="h-5 w-5 fill-current" />
        ) : (
          <Mic className="h-6 w-6" />
        )}
      </button>

      {/* Recording indicator */}
      {phase === "recording" && (
        <div className="fixed bottom-24 right-6 z-50 rounded-lg bg-card border shadow-md px-3 py-2 text-xs flex items-center gap-2">
          <span className="h-2 w-2 rounded-full bg-destructive animate-pulse" />
          Recording · {formatTime(elapsed)}
        </div>
      )}

      {/* Review dialog */}
      <Dialog open={reviewOpen} onOpenChange={(o) => { if (!o) resetAll(); }}>
        <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-heading flex items-center gap-2">
              <Sparkles className="h-4 w-4" />
              Review captured orders
            </DialogTitle>
            <DialogDescription>
              We parsed your voice note. Edit anything that looks off, then submit to the team.
            </DialogDescription>
          </DialogHeader>

          {transcript && (
            <div className="rounded-md border bg-muted/40 p-3 text-xs">
              <p className="font-medium mb-1">Transcript</p>
              <p className="text-muted-foreground italic">"{transcript}"</p>
            </div>
          )}

          {orders.length === 0 ? (
            <div className="text-center py-8 text-sm text-muted-foreground">
              No orders parsed. Close and try recording again, or use the form.
            </div>
          ) : (
            <div className="space-y-2">
              {orders.map((o, i) => {
                const svc = getServiceById(o.service_type);
                const Icon = svc?.icon;
                const matchedListing = listings?.find((l) => l.id === o.resolved_listing_id);
                return (
                  <div key={i} className="rounded-lg border bg-card p-3">
                    <div className="flex items-start gap-3">
                      <div className="h-8 w-8 rounded-md bg-primary/10 flex items-center justify-center shrink-0">
                        {Icon ? <Icon className="h-4 w-4 text-primary" /> : null}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <p className="font-medium text-sm">
                            {svc ? svc.defaultTitle(o.details) : o.service_type}
                          </p>
                          <Badge variant="outline" className="text-[10px]">
                            {Math.round(o.confidence * 100)}% sure
                          </Badge>
                        </div>
                        <p className="text-xs text-muted-foreground mt-0.5 truncate">
                          {matchedListing
                            ? `Linked: ${matchedListing.address}`
                            : o.property_hint
                              ? `Mentioned: "${o.property_hint}" — not linked`
                              : "No property linked"}
                        </p>
                        {Object.keys(o.details).length > 0 && (
                          <div className="mt-1.5 flex flex-wrap gap-1">
                            {Object.entries(o.details).slice(0, 5).map(([k, v]) => (
                              <span key={k} className="text-[10px] bg-muted px-1.5 py-0.5 rounded">
                                {k}: {String(v)}
                              </span>
                            ))}
                          </div>
                        )}
                        {o.notes && (
                          <p className="text-xs text-muted-foreground mt-1 italic">"{o.notes}"</p>
                        )}
                      </div>
                      <div className="flex flex-col gap-1">
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => setEditIdx(i)} title="Edit">
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button size="icon" variant="ghost" className="h-7 w-7" onClick={() => removeOrder(i)} title="Remove">
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          <div className="flex justify-end gap-2 pt-2 border-t">
            <Button variant="outline" onClick={resetAll}>
              <X className="h-4 w-4 mr-1" /> Cancel
            </Button>
            <Button onClick={submitAll} disabled={orders.length === 0}>
              <Check className="h-4 w-4 mr-1" /> Submit {orders.length || ""}
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Edit single order via NewOrderDialog */}
      {editIdx !== null && orders[editIdx] && (
        <NewOrderDialog
          open={true}
          onOpenChange={(o) => { if (!o) setEditIdx(null); }}
          initialServiceId={orders[editIdx].service_type}
          initialDetails={orders[editIdx].details}
          initialNotes={orders[editIdx].notes}
          initialListingId={orders[editIdx].resolved_listing_id || undefined}
          initialTransactionId={orders[editIdx].resolved_transaction_id || undefined}
          source="voice"
          sourceTranscript={transcript}
          sourceConfidence={orders[editIdx].confidence}
          onCreated={() => {
            // Remove the edited one from review (it's now persisted)
            removeOrder(editIdx);
            setEditIdx(null);
          }}
        />
      )}
    </>
  );
}

/* ---------- helpers ---------- */
function pickMime() {
  const candidates = ["audio/webm;codecs=opus", "audio/webm", "audio/mp4"];
  for (const m of candidates) {
    if (typeof MediaRecorder !== "undefined" && MediaRecorder.isTypeSupported(m)) return m;
  }
  return "audio/webm";
}

function blobToBase64(blob: Blob): Promise<string> {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onloadend = () => {
      const result = reader.result as string;
      // strip "data:...;base64," prefix
      resolve(result.split(",")[1] || "");
    };
    reader.onerror = reject;
    reader.readAsDataURL(blob);
  });
}

function formatTime(s: number) {
  const m = Math.floor(s / 60);
  const r = s % 60;
  return `${m}:${String(r).padStart(2, "0")}`;
}

function resolveProperty(
  o: ParsedOrder,
  listings: { id: string; address: string }[] | undefined,
  transactions: { id: string; listing?: { id: string; address: string } | null }[] | undefined
): ParsedOrder {
  if (!o.property_hint) return o;
  const hint = normalize(o.property_hint);
  // Try listings
  const listing = listings?.find((l) => addressMatches(hint, l.address));
  if (listing) return { ...o, resolved_listing_id: listing.id };
  // Try transactions via their listing address
  const txn = transactions?.find((t) => t.listing && addressMatches(hint, t.listing.address));
  if (txn) return { ...o, resolved_transaction_id: txn.id, resolved_listing_id: txn.listing?.id || null };
  return o;
}

function normalize(s: string) {
  return s.toLowerCase().replace(/[^a-z0-9 ]/g, " ").replace(/\s+/g, " ").trim();
}
function addressMatches(hint: string, address: string) {
  const a = normalize(address);
  // Match if hint shares a number + street word
  const hintTokens = hint.split(" ").filter(Boolean);
  const number = hintTokens.find((t) => /^\d+$/.test(t));
  if (number && a.includes(number)) {
    const word = hintTokens.find((t) => t.length >= 4 && !/^\d+$/.test(t));
    if (word && a.includes(word)) return true;
    return a.includes(number);
  }
  // No number — just check that the longest hint word appears
  const longest = hintTokens.sort((x, y) => y.length - x.length)[0];
  return longest && longest.length >= 4 && a.includes(longest);
}
