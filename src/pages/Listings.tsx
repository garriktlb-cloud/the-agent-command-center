import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Plus, Search, LayoutList, Columns3, Eye } from "lucide-react";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { NewListingForm } from "@/components/forms/NewListingForm";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
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

const stageColors: Record<string, string> = {
  new: "bg-muted text-muted-foreground",
  signed: "bg-primary/10 text-primary",
  photography_scheduled: "bg-accent/20 text-accent-foreground",
  coming_soon: "bg-secondary text-secondary-foreground",
  active: "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400",
  live: "bg-emerald-500/15 text-emerald-700 dark:text-emerald-400",
  under_contract: "bg-amber-500/10 text-amber-700 dark:text-amber-400",
};

const kanbanStages = ["signed", "photography_scheduled", "coming_soon", "active", "live", "under_contract"] as const;

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPrice(p: number | null) {
  if (!p) return "—";
  return `$${p.toLocaleString()}`;
}

/* ── Table View ─────────────────────────────────────────── */
function ListingsTable({ listings, onView }: { listings: Listing[]; onView: (id: string) => void }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[22%]">Address</TableHead>
            <TableHead className="w-[14%]">Seller</TableHead>
            <TableHead className="w-[14%]">Associate</TableHead>
            <TableHead className="w-[12%]">Est. List Date</TableHead>
            <TableHead className="w-[14%]">Stage</TableHead>
            <TableHead className="w-[12%] text-right">Est. Price</TableHead>
            <TableHead className="w-[12%] text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {listings.map((l) => (
            <TableRow key={l.id} className="group">
              <TableCell>
                <p className="font-medium text-sm truncate">{l.address}</p>
                <p className="text-xs text-muted-foreground truncate">
                  {[l.city, l.state, l.zip].filter(Boolean).join(", ")}
                </p>
              </TableCell>
              <TableCell className="text-sm">{(l as any).seller_name || "—"}</TableCell>
              <TableCell className="text-sm text-muted-foreground">—</TableCell>
              <TableCell className="text-sm">{formatDate(l.listing_date)}</TableCell>
              <TableCell>
                <Badge variant="outline" className={`border-0 text-[11px] font-medium ${stageColors[l.status] || ""}`}>
                  {stageLabels[l.status] || l.status}
                </Badge>
              </TableCell>
              <TableCell className="text-sm font-semibold text-right">{formatPrice(l.price)}</TableCell>
              <TableCell className="text-right">
                <Button
                  variant="ghost"
                  size="sm"
                  className=""
                  onClick={() => onView(l.id)}
                >
                  <Eye className="h-4 w-4 mr-1" />
                  View Details
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── Kanban View ────────────────────────────────────────── */
function KanbanCard({ listing, onView }: { listing: Listing; onView: (id: string) => void }) {
  return (
    <div
      className="rounded-lg border bg-card p-3 hover:shadow-sm transition-shadow cursor-pointer"
      onClick={() => onView(listing.id)}
    >
      <p className="font-medium text-sm truncate">{listing.address}</p>
      <p className="text-xs text-muted-foreground truncate mb-2">
        {[listing.city, listing.state].filter(Boolean).join(", ")}
      </p>
      {listing.price && (
        <p className="text-sm font-semibold">{formatPrice(listing.price)}</p>
      )}
      <p className="text-xs text-muted-foreground mt-1">
        {(listing as any).seller_name || "No seller assigned"}
      </p>
    </div>
  );
}

function KanbanBoard({ listings, onView }: { listings: Listing[]; onView: (id: string) => void }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {kanbanStages.map((stage) => {
        const items = listings.filter((l) => l.status === stage);
        return (
          <div key={stage} className="flex-shrink-0 w-64">
            <div className="flex items-center gap-2 mb-3">
              <Badge variant="outline" className={`border-0 text-[11px] font-medium ${stageColors[stage] || ""}`}>
                {stageLabels[stage]}
              </Badge>
              <span className="text-xs text-muted-foreground">{items.length}</span>
            </div>
            <div className="space-y-2 min-h-[120px] rounded-lg bg-muted/30 p-2">
              {items.length === 0 ? (
                <p className="text-xs text-muted-foreground text-center py-8">No listings</p>
              ) : (
                items.map((l) => <KanbanCard key={l.id} listing={l} onView={onView} />)
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}

/* ── Page ────────────────────────────────────────────────── */
export default function Listings() {
  const [view, setView] = useState<"table" | "kanban">("table");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const navigate = useNavigate();

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

  const filtered = listings?.filter((l) =>
    !search || l.address.toLowerCase().includes(search.toLowerCase())
  );

  const handleView = (id: string) => navigate(`/listings/${id}`);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Listings</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Prep, launch, and marketing coordination.</p>
        </div>
        <Dialog open={newOpen} onOpenChange={setNewOpen}>
          <DialogTrigger asChild>
            <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Listing</Button>
          </DialogTrigger>
          <DialogContent className="sm:max-w-lg">
            <DialogHeader>
              <DialogTitle>New Listing</DialogTitle>
            </DialogHeader>
            <NewListingForm onSuccess={() => setNewOpen(false)} />
          </DialogContent>
        </Dialog>
      </div>

      <div className="flex items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "kanban")}>
          <TabsList>
            <TabsTrigger value="table"><LayoutList className="h-4 w-4 mr-1" />Table</TabsTrigger>
            <TabsTrigger value="kanban"><Columns3 className="h-4 w-4 mr-1" />Kanban</TabsTrigger>
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
        view === "table" ? (
          <ListingsTable listings={filtered} onView={handleView} />
        ) : (
          <KanbanBoard listings={filtered} onView={handleView} />
        )
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No listings yet. Click "New Listing" to add one.</p>
        </div>
      )}
    </div>
  );
}
