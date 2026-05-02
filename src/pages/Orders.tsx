import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, Camera, ClipboardCheck, Sparkles, Home, Paintbrush, Truck, Wrench, Hammer, ArrowRight, Plus } from "lucide-react";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import type { Tables } from "@/integrations/supabase/types";
import { format } from "date-fns";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { NewOrderDialog } from "@/components/orders/NewOrderDialog";
import { SERVICE_TYPES as QUICK_SERVICES } from "@/lib/orderServices";

type Order = Tables<"orders">;

const SERVICE_CATEGORIES = [
  { id: "all", label: "All Services", icon: Sparkles },
  { id: "photography", label: "Photography", icon: Camera },
  { id: "inspection", label: "Inspection", icon: ClipboardCheck },
  { id: "staging", label: "Staging", icon: Home },
  { id: "cleaning", label: "Cleaning", icon: Sparkles },
  { id: "painting", label: "Painting", icon: Paintbrush },
  { id: "moving", label: "Moving", icon: Truck },
  { id: "handyman", label: "Handyman", icon: Wrench },
  { id: "repairs", label: "Repairs", icon: Hammer },
];

const SERVICES = [
  {
    id: "listing-photography",
    category: "photography",
    title: "Listing Photography",
    description: "Professional HDR photos, aerial drone shots, and virtual tours for your listing.",
    price: "From $199",
    turnaround: "24-48 hrs",
  },
  {
    id: "twilight-photography",
    category: "photography",
    title: "Twilight Photography",
    description: "Stunning dusk and golden-hour exterior shots that make listings pop.",
    price: "From $149",
    turnaround: "24-48 hrs",
  },
  {
    id: "home-inspection",
    category: "inspection",
    title: "Home Inspection",
    description: "Full property inspection with detailed report covering structure, systems, and safety.",
    price: "From $350",
    turnaround: "2-3 days",
  },
  {
    id: "pre-listing-inspection",
    category: "inspection",
    title: "Pre-Listing Inspection",
    description: "Identify issues before listing to avoid surprises during buyer due diligence.",
    price: "From $299",
    turnaround: "2-3 days",
  },
  {
    id: "full-staging",
    category: "staging",
    title: "Full Home Staging",
    description: "Complete furniture and décor staging for vacant properties. Includes setup and removal.",
    price: "From $1,500",
    turnaround: "3-5 days",
  },
  {
    id: "partial-staging",
    category: "staging",
    title: "Partial Staging",
    description: "Accent staging for key rooms — living room, kitchen, and master bedroom.",
    price: "From $800",
    turnaround: "2-3 days",
  },
  {
    id: "deep-clean",
    category: "cleaning",
    title: "Deep Clean",
    description: "Move-in/move-out deep cleaning covering every room, appliance, and fixture.",
    price: "From $250",
    turnaround: "Same day",
  },
  {
    id: "interior-painting",
    category: "painting",
    title: "Interior Painting",
    description: "Professional interior painting with premium materials and clean finish.",
    price: "From $1,200",
    turnaround: "3-5 days",
  },
  {
    id: "local-moving",
    category: "moving",
    title: "Local Moving",
    description: "Licensed and insured local moving service with packing options available.",
    price: "From $400",
    turnaround: "Scheduled",
  },
  {
    id: "handyman-service",
    category: "handyman",
    title: "General Handyman",
    description: "Minor repairs, fixture installation, touch-ups, and punch-list items.",
    price: "From $125",
    turnaround: "1-2 days",
  },
  {
    id: "major-repairs",
    category: "repairs",
    title: "Major Repairs",
    description: "Roof, plumbing, electrical, and HVAC repairs from licensed contractors.",
    price: "Custom quote",
    turnaround: "Varies",
  },
];

const statusStyles: Record<string, string> = {
  pending: "bg-foreground/5 text-foreground/60 border-foreground/10",
  in_progress: "bg-foreground/8 text-foreground/70 border-foreground/15",
  completed: "bg-foreground/10 text-foreground border-foreground/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

const statusLabels: Record<string, string> = {
  pending: "Pending",
  in_progress: "In Progress",
  completed: "Completed",
  cancelled: "Cancelled",
};

function OrderRow({ order }: { order: Order }) {
  return (
    <div className="flex items-center gap-4 rounded-lg border bg-card px-4 py-3 hover:shadow-sm transition-shadow">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <p className="font-medium text-sm truncate">{order.title}</p>
          {order.source === "voice" && (
            <Badge variant="outline" className="text-[10px] gap-1">
              <Sparkles className="h-2.5 w-2.5" /> Voice
            </Badge>
          )}
        </div>
        <p className="text-xs text-muted-foreground truncate">
          {order.vendor_name || "Awaiting vendor"}{order.description ? ` · ${order.description}` : ""}
        </p>
      </div>
      <Badge variant="outline" className={statusStyles[order.status] || ""}>
        {statusLabels[order.status] || order.status}
      </Badge>
      <span className="text-xs text-muted-foreground w-20 text-right">
        {order.due_date ? format(new Date(order.due_date), "MMM d") : "—"}
      </span>
      <span className="text-sm font-semibold w-16 text-right">
        {order.cost != null ? `$${Number(order.cost).toLocaleString()}` : "—"}
      </span>
    </div>
  );
}

function ServiceCard({ service, onBook }: { service: typeof SERVICES[0]; onBook: () => void }) {
  return (
    <div className="rounded-lg border bg-card p-5 flex flex-col gap-3 hover:shadow-md transition-shadow group">
      <div className="flex-1">
        <h3 className="font-heading font-semibold text-sm">{service.title}</h3>
        <p className="text-xs text-muted-foreground mt-1 leading-relaxed">{service.description}</p>
      </div>
      <div className="flex items-center justify-between pt-2 border-t border-border">
        <div>
          <p className="text-sm font-semibold">{service.price}</p>
          <p className="text-[11px] text-muted-foreground">{service.turnaround}</p>
        </div>
        <Button size="sm" variant="default" onClick={onBook} className="gap-1">
          Book <ArrowRight className="h-3.5 w-3.5" />
        </Button>
      </div>
    </div>
  );
}

export default function Orders() {
  const { user } = useAuth();
  const [mainTab, setMainTab] = useState("book");
  const [historyTab, setHistoryTab] = useState("all");
  const [search, setSearch] = useState("");
  const [activeCategory, setActiveCategory] = useState("all");
  const [bookingService, setBookingService] = useState<typeof SERVICES[0] | null>(null);
  const [bookingNotes, setBookingNotes] = useState("");

  const { data: orders, isLoading } = useQuery({
    queryKey: ["orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
  });

  const { data: listings } = useQuery({
    queryKey: ["listings-for-orders"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("id, address").order("address");
      if (error) throw error;
      return data;
    },
  });

  const filtered = orders?.filter((o) => {
    const matchesTab = historyTab === "all" || o.status === historyTab;
    const matchesSearch = !search || o.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
  });

  const filteredServices = SERVICES.filter((s) => {
    const matchesCat = activeCategory === "all" || s.category === activeCategory;
    const matchesSearch = !search || s.title.toLowerCase().includes(search.toLowerCase()) || s.description.toLowerCase().includes(search.toLowerCase());
    return matchesCat && matchesSearch;
  });

  const counts = orders?.reduce(
    (acc, o) => {
      acc[o.status] = (acc[o.status] || 0) + 1;
      if (o.status !== "completed" && o.status !== "cancelled" && o.cost) {
        acc.unbilled += Number(o.cost);
      }
      return acc;
    },
    { pending: 0, in_progress: 0, completed: 0, unbilled: 0 } as Record<string, number>
  ) || { pending: 0, in_progress: 0, completed: 0, unbilled: 0 };

  const handleBook = async (listingId: string) => {
    if (!user || !bookingService) return;
    const { error } = await supabase.from("orders").insert({
      user_id: user.id,
      title: bookingService.title,
      description: bookingNotes || bookingService.description,
      listing_id: listingId || null,
      status: "pending",
      priority: "normal",
    });
    if (error) {
      toast.error("Failed to place order");
    } else {
      toast.success("Order placed!");
      setBookingService(null);
      setBookingNotes("");
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Book services or manage your order history.</p>
        </div>
      </div>

      <Tabs value={mainTab} onValueChange={setMainTab}>
        <TabsList>
          <TabsTrigger value="book">Book a Service</TabsTrigger>
          <TabsTrigger value="history">Order History</TabsTrigger>
        </TabsList>

        {/* ── Book a Service ── */}
        <TabsContent value="book" className="mt-5 space-y-5">
          {/* Search */}
          <div className="relative w-full max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search services..."
              className="pl-9"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>

          {/* Category icons */}
          <div className="flex gap-2 flex-wrap">
            {SERVICE_CATEGORIES.map((cat) => {
              const Icon = cat.icon;
              const active = activeCategory === cat.id;
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium border transition-colors ${
                    active
                      ? "bg-primary text-primary-foreground border-primary"
                      : "bg-card text-foreground/70 border-border hover:border-foreground/20"
                  }`}
                >
                  <Icon className="h-3.5 w-3.5" />
                  {cat.label}
                </button>
              );
            })}
          </div>

          {/* Service cards grid */}
          {filteredServices.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredServices.map((service) => (
                <ServiceCard
                  key={service.id}
                  service={service}
                  onBook={() => setBookingService(service)}
                />
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No services match your search.</p>
            </div>
          )}
        </TabsContent>

        {/* ── Order History ── */}
        <TabsContent value="history" className="mt-5 space-y-5">
          <div className="flex items-center gap-3">
            <Tabs value={historyTab} onValueChange={setHistoryTab}>
              <TabsList>
                <TabsTrigger value="all">All</TabsTrigger>
                <TabsTrigger value="pending">Pending</TabsTrigger>
                <TabsTrigger value="in_progress">In Progress</TabsTrigger>
                <TabsTrigger value="completed">Completed</TabsTrigger>
              </TabsList>
            </Tabs>
            <div className="ml-auto relative w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input placeholder="Search orders..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
            </div>
          </div>

          <div className="grid grid-cols-4 gap-3">
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Pending</p>
              <p className="text-xl font-heading font-bold mt-1">{counts.pending}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">In Progress</p>
              <p className="text-xl font-heading font-bold mt-1">{counts.in_progress}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Completed</p>
              <p className="text-xl font-heading font-bold mt-1">{counts.completed}</p>
            </div>
            <div className="rounded-lg border bg-card p-3">
              <p className="text-xs text-muted-foreground uppercase tracking-wider">Unbilled</p>
              <p className="text-xl font-heading font-bold mt-1">${counts.unbilled.toLocaleString()}</p>
            </div>
          </div>

          {isLoading ? (
            <div className="space-y-2">
              {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
            </div>
          ) : filtered && filtered.length > 0 ? (
            <div className="space-y-2">
              {filtered.map((o) => <OrderRow key={o.id} order={o} />)}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <p className="text-sm">No orders yet. Book a service to get started.</p>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* ── Booking Dialog ── */}
      <Dialog open={!!bookingService} onOpenChange={(open) => !open && setBookingService(null)}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle className="font-heading">Book: {bookingService?.title}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 pt-2">
            <p className="text-sm text-muted-foreground">{bookingService?.description}</p>
            <div className="flex gap-4 text-sm">
              <span className="font-semibold">{bookingService?.price}</span>
              <span className="text-muted-foreground">· {bookingService?.turnaround}</span>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Link to Listing (optional)</Label>
              <Select onValueChange={() => {}}>
                <SelectTrigger><SelectValue placeholder="Select a listing..." /></SelectTrigger>
                <SelectContent>
                  {listings?.map((l) => (
                    <SelectItem key={l.id} value={l.id}>{l.address}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <Label className="text-xs">Notes</Label>
              <Textarea
                placeholder="Any special instructions..."
                value={bookingNotes}
                onChange={(e) => setBookingNotes(e.target.value)}
                rows={3}
              />
            </div>
            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => setBookingService(null)}>Cancel</Button>
              <Button onClick={() => handleBook("")}>Place Order</Button>
            </div>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
