import MetricCard from "@/components/dashboard/MetricCard";
import ListingCard from "@/components/dashboard/ListingCard";
import OrderRow from "@/components/dashboard/OrderRow";
import DeadlineItem from "@/components/dashboard/DeadlineItem";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { Plus, Home, DollarSign, Key, ShoppingCart } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import { differenceInDays, format, parseISO } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Listing = Tables<"listings">;
type Transaction = Tables<"transactions"> & {
  listing?: { address: string } | null;
};
type Order = Tables<"orders"> & {
  listing?: { address: string } | null;
};

const stageLabels: Record<string, string> = {
  new: "New",
  signed: "Signed",
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

function getChecklist(status: string) {
  const idx = stageOrder.indexOf(status);
  return [
    { label: "Listing agreement", done: idx >= 0 },
    { label: "Photography", done: idx >= 1 },
    { label: "MLS Input", done: idx >= 2 },
    { label: "Go Live", done: idx >= 3 },
  ];
}

function getNextAction(status: string) {
  const map: Record<string, string> = {
    new: "Agreement out for signature",
    signed: "Schedule photography",
    photography_scheduled: "Photography scheduled",
    coming_soon: "MLS input in progress",
    active: "Ready to launch",
    live: "Live on market",
    under_contract: "Under contract",
  };
  return map[status] || "No action needed";
}

function formatDeadlineDate(d: string | null) {
  if (!d) return "—";
  const date = parseISO(d);
  const diff = differenceInDays(date, new Date());
  if (diff === 0) return "Today";
  if (diff === 1) return "Tomorrow";
  return format(date, "MMM d");
}

function getUrgency(d: string | null): "red" | "amber" | "normal" {
  if (!d) return "normal";
  const diff = differenceInDays(parseISO(d), new Date());
  if (diff <= 1) return "red";
  if (diff <= 5) return "amber";
  return "normal";
}

const SparkLine = () => (
  <svg viewBox="0 0 60 28" className="w-14 h-7 text-foreground/30">
    <polyline
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      points="2,22 10,18 18,20 26,14 34,16 42,8 50,10 58,4"
    />
  </svg>
);

export default function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const today = new Date();
  const greeting =
    today.getHours() < 12 ? "Good morning" : today.getHours() < 17 ? "Good afternoon" : "Good evening";
  const dateStr = today
    .toLocaleDateString("en-US", { weekday: "long", month: "short", day: "numeric" })
    .toUpperCase();
  const displayName =
    user?.user_metadata?.full_name?.split(" ")[0] || user?.email?.split("@")[0] || "there";

  const { data: listings, isLoading: listingsLoading } = useQuery({
    queryKey: ["dashboard-listings"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("listings")
        .select("*")
        .not("status", "eq", "under_contract")
        .order("created_at", { ascending: false })
        .limit(4);
      if (error) throw error;
      return data as Listing[];
    },
  });

  const { data: transactions, isLoading: txLoading } = useQuery({
    queryKey: ["dashboard-transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, listing:listings(address)")
        .order("closing_date", { ascending: true });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const { data: orders, isLoading: ordersLoading } = useQuery({
    queryKey: ["dashboard-orders"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*, listing:listings(address)")
        .not("status", "eq", "completed")
        .not("status", "eq", "cancelled")
        .order("due_date", { ascending: true })
        .limit(5);
      if (error) throw error;
      return data as Order[];
    },
  });

  const activeListings = listings?.length ?? 0;
  const needOrders =
    listings?.filter((l) => ["signed", "photography_scheduled"].includes(l.status)).length ?? 0;
  const launchingSoon =
    listings?.filter((l) => ["coming_soon", "photography_scheduled"].includes(l.status)).length ?? 0;
  const projectedGCI =
    transactions?.reduce((sum, t) => sum + (t.contract_price ? t.contract_price * 0.03 : 0), 0) ?? 0;
  const outstandingOrders = orders?.filter((o) => o.status === "pending").length ?? 0;

  const deadlines = (transactions ?? [])
    .flatMap((t) => {
      const address = t.listing?.address ?? t.buyer_name ?? t.seller_name ?? "Untitled";
      const items = [];
      if (t.closing_date) {
        items.push({
          label: "Closing",
          property: address,
          date: formatDeadlineDate(t.closing_date),
          urgency: getUrgency(t.closing_date),
          icon: <Key className="h-4 w-4 text-foreground/60" />,
          txnId: t.id,
          rawDate: t.closing_date,
        });
      }
      if (t.earnest_money_due) {
        items.push({
          label: "Earnest money due",
          property: address,
          date: formatDeadlineDate(t.earnest_money_due),
          urgency: getUrgency(t.earnest_money_due),
          icon: <DollarSign className="h-4 w-4 text-foreground/60" />,
          txnId: t.id,
          rawDate: t.earnest_money_due,
        });
      }
      return items;
    })
    .sort((a, b) => (a.rawDate < b.rawDate ? -1 : 1))
    .slice(0, 5);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-end justify-between">
        <div>
          <p className="text-[10px] text-muted-foreground uppercase tracking-widest font-semibold">{dateStr}</p>
          <h1 className="text-2xl font-heading font-bold mt-0.5">{greeting}, {displayName}.</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Run your listings and active deals in one place.</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={() => navigate("/orders")}>Order Service</Button>
          <Button size="sm" className="rounded-full h-9 w-9 p-0" onClick={() => navigate("/listings")}>
            <Plus className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Metrics */}
      <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
        {listingsLoading || txLoading ? (
          [1,2,3,4,5].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)
        ) : (
          <>
            <MetricCard label="Active Listings" value={activeListings} variant="primary" icon={<Home className="h-5 w-5" />} />
            <MetricCard label="Need Orders" value={needOrders} showArrow />
            <MetricCard label="Projected GCI" value={projectedGCI > 0 ? `$${Math.round(projectedGCI / 1000)}K` : "—"} trailing={projectedGCI > 0 ? <SparkLine /> : undefined} />
            <MetricCard label="Launching Soon" value={launchingSoon} showArrow />
            <MetricCard label="Open Orders" value={outstandingOrders} sublabel={`${outstandingOrders} order${outstandingOrders !== 1 ? "s" : ""}`} showArrow />
          </>
        )}
      </div>

      {/* Deadlines */}
      <section>
        <h2 className="text-base font-heading font-semibold mb-3">Upcoming Deadlines</h2>
        {txLoading ? (
          <div className="space-y-2">{[1,2,3].map((i) => <Skeleton key={i} className="h-14 rounded-md" />)}</div>
        ) : deadlines.length > 0 ? (
          <div className="space-y-2">
            {deadlines.map((d, i) => (
              <div key={i} onClick={() => navigate(`/transactions/${d.txnId}`)} className="cursor-pointer">
                <DeadlineItem label={d.label} property={d.property} date={d.date} urgency={d.urgency} icon={d.icon} />
              </div>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground py-4 border rounded-lg bg-card text-center">
            No upcoming deadlines. Add transactions to track closing dates.
          </p>
        )}
      </section>

      {/* Listings */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-semibold">Your Listings</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/listings")}>View all</Button>
        </div>
        {listingsLoading ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {[1,2,3,4].map((i) => <Skeleton key={i} className="h-64 rounded-lg" />)}
          </div>
        ) : listings && listings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
            {listings.map((l) => (
              <div key={l.id} onClick={() => navigate(`/listings/${l.id}`)} className="cursor-pointer">
                <ListingCard
                  address={l.address}
                  agent={(l as any).seller_name || "No seller assigned"}
                  status={stageLabels[l.status] || l.status}
                  statusColor="blue"
                  readiness={getReadiness(l.status)}
                  checklist={getChecklist(l.status)}
                  nextAction={getNextAction(l.status)}
                />
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            <Home className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No active listings yet.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/listings")}>Add your first listing</Button>
          </div>
        )}
      </section>

      {/* Active Orders */}
      <section>
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-base font-heading font-semibold">Active Orders</h2>
          <Button variant="ghost" size="sm" className="text-muted-foreground" onClick={() => navigate("/orders")}>View all</Button>
        </div>
        {ordersLoading ? (
          <div className="space-y-2">{[1,2].map((i) => <Skeleton key={i} className="h-14 rounded-lg" />)}</div>
        ) : orders && orders.length > 0 ? (
          <div className="space-y-2">
            {orders.map((o) => (
              <OrderRow
                key={o.id}
                service={o.title}
                property={o.listing?.address ?? "—"}
                vendor={o.vendor_name ?? "—"}
                status={o.status === "pending" ? "Pending" : o.status === "in_progress" ? "In Progress" : "Pending"}
                dueDate={o.due_date ? format(parseISO(o.due_date), "MMM d") : "—"}
                price={o.cost ? `$${Number(o.cost).toLocaleString()}` : "—"}
                billing="Not billed"
              />
            ))}
          </div>
        ) : (
          <div className="text-center py-10 text-muted-foreground border rounded-lg bg-card">
            <ShoppingCart className="h-8 w-8 mx-auto mb-2 opacity-20" />
            <p className="text-sm">No active orders.</p>
            <Button size="sm" variant="outline" className="mt-3" onClick={() => navigate("/orders")}>Place an order</Button>
          </div>
        )}
      </section>
    </div>
  );
}
