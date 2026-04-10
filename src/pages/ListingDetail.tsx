import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Progress } from "@/components/ui/progress";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft, CheckCircle2, Circle, Clock } from "lucide-react";
import type { Tables } from "@/integrations/supabase/types";

type Listing = Tables<"listings">;

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

function getReadiness(status: string) {
  const idx = stageOrder.indexOf(status);
  if (idx === -1) return 0;
  return Math.round(((idx + 1) / stageOrder.length) * 100);
}

function getMilestones(listing: Listing) {
  const milestones = [
    { label: "Listing agreement", key: "signed", date: listing.created_at },
    { label: "Photography", key: "photography_scheduled", date: null },
    { label: "MLS input", key: "coming_soon", date: null },
    { label: "Go Live", key: "active", date: listing.listing_date },
  ];
  const currentIdx = stageOrder.indexOf(listing.status);
  return milestones.map((m, i) => ({
    ...m,
    done: stageOrder.indexOf(m.key) <= currentIdx && currentIdx >= 0,
  }));
}

function getChecklist(listing: Listing) {
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

  const { data: listing, isLoading } = useQuery({
    queryKey: ["listing", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Listing;
    },
    enabled: !!id,
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

  const readiness = getReadiness(listing.status);
  const milestones = getMilestones(listing);
  const checklist = getChecklist(listing);
  const doneCount = checklist.flatMap((s) => s.items).filter((i) => i.done).length;
  const totalCount = checklist.flatMap((s) => s.items).length;
  const remaining = totalCount - doneCount;

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
                  {new Date(listing.listing_date + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })}
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
          <TabsTrigger
            value="checklist"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2"
          >
            Checklist
          </TabsTrigger>
          <TabsTrigger
            value="details"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2"
          >
            Details
          </TabsTrigger>
          <TabsTrigger
            value="docs"
            className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2"
          >
            Docs
          </TabsTrigger>
        </TabsList>

        {/* Checklist Tab */}
        <TabsContent value="checklist" className="mt-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
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

              {/* Listing Checklist */}
              <div className="rounded-lg border bg-card p-5">
                <h2 className="font-heading font-semibold mb-4">Listing Checklist</h2>
                <div className="space-y-5">
                  {checklist.map((section) => (
                    <div key={section.section}>
                      <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground mb-3 border-b pb-2">
                        {section.section}
                      </p>
                      <div className="space-y-3">
                        {section.items.map((item) => (
                          <div key={item.label} className="flex items-start gap-3">
                            {item.done ? (
                              <CheckCircle2 className="h-4 w-4 text-foreground/50 mt-0.5 shrink-0" />
                            ) : (
                              <Circle className="h-4 w-4 text-muted-foreground/40 mt-0.5 shrink-0" />
                            )}
                            <div>
                              <p className={`text-sm ${item.done ? "text-muted-foreground" : "font-medium"}`}>
                                {item.label}
                              </p>
                              {item.done && (
                                <p className="text-xs text-muted-foreground/60">Completed</p>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Notes */}
              <div className="rounded-lg border bg-card p-5">
                <h2 className="font-heading font-semibold mb-2">Notes</h2>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">
                  {listing.notes || "Add internal notes, agent preferences, or coordination details…"}
                </p>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Launch Milestones */}
              <div className="rounded-lg border bg-card p-5">
                <h2 className="font-heading font-semibold mb-4">Launch Milestones</h2>
                <div className="space-y-3">
                  {milestones.map((m) => (
                    <div key={m.label} className="flex items-center justify-between text-sm">
                      <span className={m.done ? "text-muted-foreground" : "font-medium"}>
                        {m.label}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {m.done && m.date
                          ? new Date(m.date).toLocaleDateString("en-US", { month: "short", day: "numeric" })
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
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">Property</p>
                    <dl className="space-y-2">
                      <DetailRow label="Address" value={`${listing.address}${listing.city ? `, ${listing.city}` : ""}${listing.state ? ` ${listing.state}` : ""}`} />
                      <DetailRow label="List price" value={listing.price ? `$${listing.price.toLocaleString()}` : "—"} />
                      <DetailRow label="Type" value={listing.listing_type === "seller" ? "Seller" : "Buyer"} />
                      <DetailRow label="MLS #" value={listing.mls_number || "—"} />
                    </dl>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">Parties</p>
                    <dl className="space-y-2">
                      <DetailRow label="Seller" value={listing.seller_name || "—"} />
                    </dl>
                  </div>
                  <div>
                    <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-2 border-b pb-1">Dates</p>
                    <dl className="space-y-2">
                      <DetailRow label="List date" value={listing.listing_date || "—"} />
                      <DetailRow label="Expiration" value={listing.expiration_date || "—"} />
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </TabsContent>

        {/* Details Tab */}
        <TabsContent value="details" className="mt-6">
          <div className="rounded-lg border bg-card p-6">
            <h2 className="font-heading font-semibold mb-6">All Listing Details</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-12 gap-y-6">
              <div>
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Property</p>
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
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Parties & Dates</p>
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
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3 border-b pb-1">Notes</p>
                <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.notes}</p>
              </div>
            )}
          </div>
        </TabsContent>

        {/* Docs Tab */}
        <TabsContent value="details" className="mt-6">
          {/* Placeholder */}
        </TabsContent>
        <TabsContent value="docs" className="mt-6">
          <div className="rounded-lg border bg-card p-6 text-center">
            <p className="text-muted-foreground text-sm">No documents uploaded yet.</p>
          </div>
        </TabsContent>
      </Tabs>
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
