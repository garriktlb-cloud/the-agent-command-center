import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft } from "lucide-react";
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
        <Skeleton className="h-8 w-48" />
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

  const info = [
    ["Address", listing.address],
    ["City", listing.city],
    ["State", listing.state],
    ["Zip", listing.zip],
    ["Seller", (listing as any).seller_name || "—"],
    ["Listing Type", listing.listing_type],
    ["MLS #", listing.mls_number || "—"],
    ["Price", listing.price ? `$${listing.price.toLocaleString()}` : "—"],
    ["Listing Date", listing.listing_date || "—"],
    ["Expiration", listing.expiration_date || "—"],
  ];

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" onClick={() => navigate("/listings")}>
          <ArrowLeft className="h-4 w-4" />
        </Button>
        <div>
          <h1 className="text-2xl font-heading font-bold">{listing.address}</h1>
          <p className="text-sm text-muted-foreground">
            {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
          </p>
        </div>
        <Badge variant="outline" className="ml-auto">
          {stageLabels[listing.status] || listing.status}
        </Badge>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <h2 className="font-heading font-semibold mb-4">Listing Details</h2>
        <dl className="grid grid-cols-2 md:grid-cols-3 gap-x-8 gap-y-4">
          {info.map(([label, value]) => (
            <div key={label}>
              <dt className="text-xs text-muted-foreground uppercase tracking-wider">{label}</dt>
              <dd className="text-sm font-medium mt-0.5">{value}</dd>
            </div>
          ))}
        </dl>
      </div>

      {listing.notes && (
        <div className="rounded-lg border bg-card p-6">
          <h2 className="font-heading font-semibold mb-2">Notes</h2>
          <p className="text-sm text-muted-foreground whitespace-pre-wrap">{listing.notes}</p>
        </div>
      )}
    </div>
  );
}
