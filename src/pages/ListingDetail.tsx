import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { ArrowLeft, CheckCircle2, Circle, Plus } from "lucide-react";
import { MarketingDetailsForm } from "@/components/forms/MarketingDetailsForm";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Listing = Tables<"listings">;
type ChecklistItem = Tables<"listing_checklist_items">;
type OpenHouse = Tables<"open_houses">;

const stageLabels: Record<string, string> = {
  new: "New",
  signed: "Signed Contract",
  photography_scheduled: "Photography Scheduled",
  coming_soon: "Coming Soon",
  active: "Active",
  live: "Live",
  under_contract: "Under Contract",
};

const stageOrder = ["signed", "photography_scheduled", "coming_soon", "active", "live"];

function getReadiness(status: string, customItems: ChecklistItem[]) {
  const builtInTotal = 9;
  const idx = stageOrder.indexOf(status);
  const builtInDone = idx === -1 ? 0 : [4, 5, 7, 9][Math.min(idx, 3)] || 0;
  const customDone = customItems.filter((i) => i.done).length;
  const total = builtInTotal + customItems.length;
  const done = Math.min(builtInDone, builtInTotal) + customDone;
  return total === 0 ? 0 : Math.round((done / total) * 100);
}

function getMilestones(listing: Listing) {
  const milestones = [
    { label: "Listing agreement", key: "signed", date: listing.created_at },
    { label: "Photography", key: "photography_scheduled", date: null },
    { label: "MLS input", key: "coming_soon", date: null },
    { label: "Go Live", key: "active", date: listing.listing_date },
  ];
  const currentIdx = stageOrder.indexOf(listing.status);
  return milestones.map((m) => ({
    ...m,
    done: stageOrder.indexOf(m.key) <= currentIdx && currentIdx >= 0,
  }));
}

function getBuiltInChecklist(listing: Listing) {
  const currentIdx = stageOrder.indexOf(listing.status);
  return [
    {
      section: "Pre-Launch",
      items: [
        { label: "Listing agreement signed", done: currentIdx >= 0 },
        { label: "Seller disclosures collected", done: currentIdx >= 0 },
        { label: "Pricing strategy confirmed with agent", done: currentIdx >= 0 },
        { label: "Showing instructions confirmed", done: currentIdx >= 0 },
      ],
    },
    {
      section: "Marketing",
      items: [
        { label: "Photography scheduled and completed", done: currentIdx >= 1 },
        { label: "MLS input complete", done: currentIdx >= 2 },
        { label: "Signage installation confirmed", done: currentIdx >= 3 },
      ],
    },
    {
      section: "Go Live",
      items: [
        { label: "Activate listing on MLS", done: currentIdx >= 4 },
        { label: "Confirm go-live with agent", done: currentIdx >= 4 },
      ],
    },
  ];
}

export default function ListingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const queryClient = useQueryClient();

  const [newItemLabel, setNewItemLabel] = useState("");
  const [newItemSection, setNewItemSection] = useState("Custom");
  const [addItemOpen, setAddItemOpen] = useState(false);

  const [ohOpen, setOhOpen] = useState(false);
  const [ohDate, setOhDate] = useState("");
  const [ohStart, setOhStart] = useState("13:00");
  const [ohEnd, setOhEnd] = useState("15:00");

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("*").eq("id", id!).single();
      if (error) throw error;
      return data as Listing;
    },
    enabled: !!id,
  });

  const { data: customItems = [] } = useQuery({
    queryKey: ["listing_checklist_items", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listing_checklist_items")
        .select("*")
        .eq("listing_id", id!)
        .order("sort_order")
        .order("created_at");
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!id,
  });

  const { data: openHouses = [] } = useQuery({
    queryKey: ["open_houses", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("open_houses")
        .select("*")
        .eq("listing_id", id!)
        .order("date");
      if (error) throw error;
      return data as OpenHouse[];
    },
    enabled: !!id,
  });

  const addItemMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("listing_checklist_items").insert({
        listing_id: id!,
        user_id: user!.id,
        label: newItemLabel.trim(),
        section: newItemSection.trim() || "Custom",
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["listing_checklist_items", id] });
      setNewItemLabel("");
      setNewItemSection("Custom");
      setAddItemOpen(false);
      toast.success("Checklist item added");
    },
    onError: () => toast.error("Failed to add item"),
  });

  const toggleItemMutation = useMutation({
    mutationFn: async ({ itemId, done }: { itemId: string; done: boolean }) => {
      const { error } = await supabase
        .from("listing_checklist_items")
        .update({ done, completed_at: done ? new Date().toISOString() : null })
        .eq("id", itemId);
      if (error) throw error;
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["listing_checklist_items", id] }),
  });

  const addOpenHouseMutation = useMutation({
    mutationFn: async () => {
      const { error } = await supabase.from("open_houses").insert({
        listing_id: id!,
        user_id: user!.id,
        date: ohDate,
        start_time: ohStart,
        end_time: ohEnd,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["open_houses", id] });
      setOhDate("");
      setOhStart("13:00");
      setOhEnd("15:00");
      setOhOpen(false);
      toast.success("Open house added");
    },
    onError: () => toast.error("Failed to add open house"),
  });

  if (isLoading) {
    return (
      <div className="space-y-4 animate-fade-in">
        <Skeleton className="h-20 w-full rounded-lg" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="animate-fade-in">
        <p className="text-muted-foreground">Listing not found.</p>
        <Button variant="ghost" className="mt-4" onClick={() => navigate("/listings")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back to Listings
        </Button>
      </div>
    );
  }

  const builtInChecklist = getBuiltInChecklist(listing);
  const readiness = getReadiness(listing.status, customItems);
  const milestones = getMilestones(listing);

  // Group custom items by section
  const customBySection: Record<string, ChecklistItem[]> = {};
  customItems.forEach((item) => {
    if (!customBySection[item.section]) customBySection[item.section] = [];
    customBySection[item.section].push(item);
  });

  const allDone =
    builtInChecklist.flatMap((s) => s.items).filter((i) => i.done).length +
    customItems.filter((i) => i.done).length;
  const allTotal =
    builtInChecklist.flatMap((s) => s.items).length + customItems.length;
  const remaining = allTotal - allDone;

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="rounded-lg bg-primary text-primary-foreground p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start gap-3">
            <Button
              variant="ghost"
              size="icon"
              className="text-primary-foreground/70 hover:text-primary-foreground hover:bg-primary-foreground/10 -ml-2 mt-0.5"
              onClick={() => navigate("/listings")}
            >
              <ArrowLeft className="h-4 w-4" />
            </Button>
            <div>
              <p className="text-xs uppercase tracking-wider text-primary-foreground/60 mb-1">
                Listing · {stageLabels[listing.status] || listing.status}
              </p>
              <h1 className="text-2xl font-heading font-bold">{listing.address}</h1>
              <p className="text-sm text-primary-foreground/70 mt-0.5">
                {listing.seller_name ? `${listing.seller_name} · ` : ""}
                {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
              </p>
            </div>
          </div>
          <div className="flex gap-3">
            <div className="bg-primary-foreground/10 rounded-lg px-4 py-2 text-center">
              <p className="text-xl font-bold">{readiness}%</p>
              <p className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Launch ready</p>
            </div>
            {listing.listing_date && (
              <div className="bg-primary-foreground/10 rounded-lg px-4 py-2 text-center">
                <p className="text-xl font-bold">
                  {new Date(listing.listing_date + "T00:00:00").toLocaleDateString("en-US", {
                    month: "short",
                    day: "numeric",
                  })}
                </p>
                <p className="text-[10px] uppercase tracking-wider text-primary-foreground/60">Go live</p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start px-0 h-auto pb-0">
          {["checklist", "details", "docs"].map((tab) => (
            <TabsTrigger
              key={tab}
              value={tab}
              className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2 capitalize"
            >
              {tab}
            </TabsTrigger>
          ))}
        </TabsList>

        {/* ── Checklist Tab ── */}
        <TabsContent value="checklist" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left */}
            <div className="lg:col-span-2 space-y-6">
              {/* Launch Readiness */}
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="font-heading font-semibold">Launch Readiness</h2>
                  <span className="text-sm font-semibold">{readiness}%</span>
                </div>
                <Progress value={readiness} className="h-2 mb-2" />
                <p className="text-xs text-muted-foreground">
                  {remaining} step{remaining !== 1 ? "s" : ""} remaining before ready to go live
                </p>
              </div>

              {/* Checklist */}
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold">Listing Checklist</h2>
                  <Dialog open={addItemOpen} onOpenChange={setAddItemOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add Item
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add checklist item</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 pt-2">
                        <Input
                          placeholder="Item label, e.g. Confirm lockbox code"
                          value={newItemLabel}
                          onChange={(e) => setNewItemLabel(e.target.value)}
                        />
                        <Input
                          placeholder="Section (default: Custom)"
                          value={newItemSection}
                          onChange={(e) => setNewItemSection(e.target.value)}
                        />
                        <Button
                          className="w-full"
                          disabled={!newItemLabel.trim() || addItemMutation.isPending}
                          onClick={() => addItemMutation.mutate()}
                        >
                          {addItemMutation.isPending ? "Adding…" : "Add Item"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>

                <div className="space-y-5">
                  {/* Built-in sections */}
                  {builtInChecklist.map((section) => (
                    <div key={section.section}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">
                        {section.section}
                      </p>
                      <div className="space-y-3">
                        {section.items.map((item) => (
                          <ChecklistRow key={item.label} label={item.label} done={item.done} interactive />
                        ))}
                      </div>
                    </div>
                  ))}

                  {/* Custom sections */}
                  {Object.entries(customBySection).map(([section, items]) => (
                    <div key={section}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">
                        {section}
                      </p>
                      <div className="space-y-3">
                        {items.map((item) => (
                          <ChecklistRow
                            key={item.id}
                            label={item.label}
                            done={item.done}
                            completedAt={item.completed_at}
                            onClick={() =>
                              toggleItemMutation.mutate({ itemId: item.id, done: !item.done })
                            }
                            interactive
                          />
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <NotesEditor listingId={listing.id} initialNotes={listing.notes || ""} />
            </div>

            {/* Right */}
            <div className="space-y-6">
              {/* Milestones */}
              <div className="rounded-lg border bg-card p-5">
                <h2 className="font-heading font-semibold mb-4">Launch Milestones</h2>
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div key={m.label} className="flex items-center justify-between text-sm">
                      <span className={m.done ? "text-muted-foreground" : "font-medium"}>{m.label}</span>
                      <span className="text-xs text-muted-foreground">
                        {m.done && m.date
                          ? new Date(m.date).toLocaleDateString("en-US", {
                              month: "short",
                              day: "numeric",
                            })
                          : m.done
                          ? "✓"
                          : "—"}
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Quick Details */}
              <div className="rounded-lg border bg-card p-5">
                <h2 className="font-heading font-semibold mb-4">Listing Details</h2>
                <div className="space-y-4">
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">
                      Property
                    </p>
                    <dl className="space-y-2">
                      <DetailRow
                        label="Address"
                        value={`${listing.address}${listing.city ? `, ${listing.city}` : ""}${listing.state ? ` ${listing.state}` : ""}`}
                      />
                      <DetailRow
                        label="List price"
                        value={listing.price ? `$${listing.price.toLocaleString()}` : "—"}
                      />
                      <DetailRow label="Type" value={listing.listing_type === "seller" ? "Seller" : "Buyer"} />
                      <DetailRow label="MLS #" value={listing.mls_number || "—"} />
                    </dl>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">
                      Parties
                    </p>
                    <dl className="space-y-2">
                      <DetailRow label="Seller" value={listing.seller_name || "—"} />
                    </dl>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">
                      Dates
                    </p>
                    <dl className="space-y-2">
                      <DetailRow label="List date" value={listing.listing_date || "—"} />
                      <DetailRow label="Expiration" value={listing.expiration_date || "—"} />
                    </dl>
                  </div>
                </div>
              </div>

              {/* Open Houses */}
              <div className="rounded-lg border bg-card p-5">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="font-heading font-semibold">Open Houses</h2>
                  <Dialog open={ohOpen} onOpenChange={setOhOpen}>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Plus className="h-3.5 w-3.5 mr-1" /> Add
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="sm:max-w-md">
                      <DialogHeader>
                        <DialogTitle>Add open house</DialogTitle>
                      </DialogHeader>
                      <div className="space-y-3 pt-2">
                        <div>
                          <label className="text-xs text-muted-foreground">Date</label>
                          <Input type="date" value={ohDate} onChange={(e) => setOhDate(e.target.value)} />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-muted-foreground">Start</label>
                            <Input type="time" value={ohStart} onChange={(e) => setOhStart(e.target.value)} />
                          </div>
                          <div>
                            <label className="text-xs text-muted-foreground">End</label>
                            <Input type="time" value={ohEnd} onChange={(e) => setOhEnd(e.target.value)} />
                          </div>
                        </div>
                        <Button
                          className="w-full"
                          disabled={!ohDate || addOpenHouseMutation.isPending}
                          onClick={() => addOpenHouseMutation.mutate()}
                        >
                          {addOpenHouseMutation.isPending ? "Adding…" : "Add Open House"}
                        </Button>
                      </div>
                    </DialogContent>
                  </Dialog>
                </div>
                {openHouses.length === 0 ? (
                  <p className="text-sm text-muted-foreground">No open houses scheduled.</p>
                ) : (
                  <div className="space-y-3">
                    {openHouses.map((oh) => (
                      <div key={oh.id} className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium">
                            {new Date(oh.date + "T00:00:00").toLocaleDateString("en-US", {
                              weekday: "long",
                              month: "short",
                              day: "numeric",
                            })}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {oh.start_time.slice(0, 5)} – {oh.end_time.slice(0, 5)}
                          </p>
                        </div>
                        <Badge variant="outline" className="text-[10px]">
                          {oh.status}
                        </Badge>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ── Details Tab ── */}
        <TabsContent value="details" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Property Details Form */}
            <div className="rounded-lg border bg-card p-6">
              <MarketingDetailsForm listingId={listing.id} listing={listing} />
            </div>

            {/* Contract / Listing Info (read-only) */}
            <div className="rounded-lg border bg-card p-6">
              <h3 className="font-heading font-semibold mb-6">Contract Info</h3>
              <div className="space-y-6">
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                    Property
                  </p>
                  <dl className="space-y-3">
                    <DetailRow label="Address" value={listing.address} />
                    <DetailRow label="City" value={listing.city || "—"} />
                    <DetailRow label="State" value={listing.state || "—"} />
                    <DetailRow label="Zip" value={listing.zip || "—"} />
                    <DetailRow label="List price" value={listing.price ? `$${listing.price.toLocaleString()}` : "—"} />
                    <DetailRow label="MLS #" value={listing.mls_number || "—"} />
                    <DetailRow label="Listing type" value={listing.listing_type === "seller" ? "Seller" : "Buyer"} />
                  </dl>
                </div>
                <div>
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                    Parties & Dates
                  </p>
                  <dl className="space-y-3">
                    <DetailRow label="Seller" value={listing.seller_name || "—"} />
                    <DetailRow label="Status" value={stageLabels[listing.status] || listing.status} />
                    <DetailRow label="List date" value={listing.listing_date || "—"} />
                    <DetailRow label="Expiration" value={listing.expiration_date || "—"} />
                  </dl>
                </div>
              </div>
              {listing.notes && (
                <div className="mt-8">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">
                    Notes
                  </p>
                  <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.notes}</p>
                </div>
              )}
            </div>
          </div>
        </TabsContent>

        {/* ── Docs Tab ── */}
        <TabsContent value="docs" className="mt-6">
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  );
}

/* ── Sub-components ── */

function ChecklistRow({
  label,
  done,
  completedAt,
  onClick,
  interactive,
}: {
  label: string;
  done: boolean;
  completedAt?: string | null;
  onClick?: () => void;
  interactive?: boolean;
}) {
  return (
    <div
      className={`flex items-start gap-3 ${interactive ? "cursor-pointer" : ""}`}
      onClick={onClick}
      role={interactive ? "button" : undefined}
    >
      {done ? (
        <CheckCircle2 className="h-4 w-4 text-foreground/50 mt-0.5 shrink-0" />
      ) : (
        <Circle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
      )}
      <div>
        <p className={`text-sm ${done ? "text-muted-foreground" : "font-medium"}`}>{label}</p>
        {done && (
          <p className="text-xs text-muted-foreground/60">
            {completedAt
              ? `Completed ${new Date(completedAt).toLocaleDateString("en-US", { month: "short", day: "numeric" })}`
              : "Completed"}
          </p>
        )}
      </div>
    </div>
  );
}

function DetailRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline justify-between gap-4">
      <dt className="text-xs text-muted-foreground shrink-0">{label}</dt>
      <dd className="text-sm font-medium text-right">{value}</dd>
    </div>
  );
}

function NotesEditor({ listingId, initialNotes }: { listingId: string; initialNotes: string }) {
  const [notes, setNotes] = useState(initialNotes);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  const save = async () => {
    setSaving(true);
    const { error } = await supabase.from("listings").update({ notes }).eq("id", listingId);
    setSaving(false);
    if (!error) {
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    }
  };

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-2">
        <h2 className="font-heading font-semibold">Notes</h2>
        <Button size="sm" variant="outline" onClick={save} disabled={saving}>
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </Button>
      </div>
      <Textarea
        value={notes}
        onChange={(e) => setNotes(e.target.value)}
        placeholder="Add internal notes, agent preferences, or coordination details…"
        rows={4}
        className="text-sm resize-none"
      />
    </div>
  );
}
