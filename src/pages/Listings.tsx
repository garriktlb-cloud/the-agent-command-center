import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";

type Listing = Tables<"listings">;

const statusLabels: Record<string, string> = {
  new: "New Listing",
  signed: "Signed",
  coming_soon: "Coming Soon",
  active: "Active",
  live: "Live",
  under_contract: "Under Contract",
};

function ListingRow({ listing }: { listing: Listing }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <p className="font-medium text-sm truncate">{listing.address}</p>
        <p className="text-xs text-muted-foreground truncate">
          {[listing.city, listing.state, listing.zip].filter(Boolean).join(", ")}
        </p>
      </div>
      <Badge variant="outline" className="bg-foreground/5 text-foreground/70 border-foreground/15 text-[10px]">
        {statusLabels[listing.status] || listing.status}
      </Badge>
      <span className="text-xs text-muted-foreground w-24 text-right uppercase">{listing.listing_type}</span>
      {listing.price && (
        <span className="text-sm font-semibold w-24 text-right">
          ${listing.price.toLocaleString()}
        </span>
      )}
      {listing.mls_number && (
        <span className="text-xs text-muted-foreground w-24 text-right">MLS {listing.mls_number}</span>
      )}
    </div>
  );
}

export default function Listings() {
  const [tab, setTab] = useState("listings");
  const [search, setSearch] = useState("");

  const { data: listings, isLoading } = useQuery({
    queryKey: ["listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Listing[];
    },
  });

  const filtered = listings?.filter((l) => {
    const matchesTab = tab === "under-contract" ? l.status === "under_contract" : l.status !== "under_contract";
    const matchesSearch = !search || l.address.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Listings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Prep, launch, and marketing coordination.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Listing</Button>
      </div>

      <div className="flex items-center gap-3">
        <Tabs value={tab} onValueChange={setTab}>
          <TabsList>
            <TabsTrigger value="listings">Listings</TabsTrigger>
            <TabsTrigger value="under-contract">Under Contract</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search listings..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="space-y-2">
          {filtered.map((l) => <ListingRow key={l.id} listing={l} />)}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No listings yet. Click "New Listing" to add one.</p>
        </div>
      )}
    </div>
  );
}
