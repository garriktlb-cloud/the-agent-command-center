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
import { format } from "date-fns";

type Order = Tables<"orders">;

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
        <p className="font-medium text-sm truncate">{order.title}</p>
        <p className="text-xs text-muted-foreground truncate">
          {order.vendor_name || "No vendor"}{order.description ? ` · ${order.description}` : ""}
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

export default function Orders() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");

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

  const filtered = orders?.filter((o) => {
    const matchesTab = tab === "all" || o.status === tab;
    const matchesSearch = !search || o.title.toLowerCase().includes(search.toLowerCase());
    return matchesTab && matchesSearch;
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

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Orders</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Service orders, vendor assignments, and billing status.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Order</Button>
      </div>

      <div className="flex items-center gap-3">
        <Tabs value={tab} onValueChange={setTab}>
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
          <p className="text-sm">No orders yet. Click "New Order" to create one.</p>
        </div>
      )}
    </div>
  );
}
