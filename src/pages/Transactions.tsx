import { useState, useMemo } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Plus, Search, LayoutList, CalendarDays, Eye, ChevronLeft, ChevronRight } from "lucide-react";
import { format, parseISO, startOfMonth, endOfMonth, eachDayOfInterval, getDay, addMonths, subMonths, isSameDay, isSameMonth } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";
import { NewTransactionDialog } from "@/components/transactions/NewTransactionDialog";

type Transaction = Tables<"transactions"> & {
  listing?: { address: string; listing_type: string } | null;
};

const stageLabels: Record<string, string> = {
  contract_intake: "Contract Intake",
  day_1: "Day 1",
  earnest_money: "Earnest Money",
  inspection: "Inspection",
  loan_appraisal: "Loan & Appraisal",
  title: "Title",
  pre_close: "Pre-Close",
  closing: "Closing",
};

function formatDate(d: string | null) {
  if (!d) return "—";
  return new Date(d + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
}

function formatPrice(p: number | null) {
  if (!p) return "—";
  return `$${Number(p).toLocaleString()}`;
}

function getSide(txn: Transaction) {
  if (txn.listing?.listing_type === "buyer") return "Buy";
  if (txn.listing?.listing_type === "seller") return "Sell";
  if (txn.buyer_name && !txn.seller_name) return "Buy";
  if (txn.seller_name && !txn.buyer_name) return "Sell";
  return "—";
}

/* ── Table View ── */
function TransactionsTable({ transactions, onView }: { transactions: Transaction[]; onView: (id: string) => void }) {
  return (
    <div className="rounded-lg border bg-card">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[24%]">Address</TableHead>
            <TableHead className="w-[10%]">Side</TableHead>
            <TableHead className="w-[14%]">Stage</TableHead>
            <TableHead className="w-[14%] text-right">Price</TableHead>
            <TableHead className="w-[14%]">Closing Date</TableHead>
            <TableHead className="w-[12%]">Health</TableHead>
            <TableHead className="w-[12%] text-right" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.map((txn) => {
            const address = txn.listing?.address || txn.buyer_name || txn.seller_name || "Untitled";
            const score = txn.health_score ?? 100;
            return (
              <TableRow key={txn.id}>
                <TableCell>
                  <p className="font-medium text-sm truncate">{address}</p>
                </TableCell>
                <TableCell>
                  <Badge
                    variant="outline"
                    className={`text-[11px] border-0 font-medium ${
                      getSide(txn) === "Buy"
                        ? "bg-blue-500/10 text-blue-700 dark:text-blue-400"
                        : getSide(txn) === "Sell"
                        ? "bg-emerald-500/10 text-emerald-700 dark:text-emerald-400"
                        : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {getSide(txn)}
                  </Badge>
                </TableCell>
                <TableCell>
                  <Badge variant="outline" className="text-[11px] border-0 font-medium bg-muted text-muted-foreground">
                    {stageLabels[txn.stage] || txn.stage}
                  </Badge>
                </TableCell>
                <TableCell className="text-sm font-semibold text-right">{formatPrice(txn.contract_price)}</TableCell>
                <TableCell className="text-sm">{formatDate(txn.closing_date)}</TableCell>
                <TableCell>
                  <div className="flex items-center gap-2">
                    <div className="h-2 w-16 rounded-full bg-muted overflow-hidden">
                      <div className="h-full rounded-full bg-foreground/60" style={{ width: `${score}%` }} />
                    </div>
                    <span className="text-xs text-muted-foreground">{score}%</span>
                  </div>
                </TableCell>
                <TableCell className="text-right">
                  <Button variant="ghost" size="sm" onClick={() => onView(txn.id)}>
                    <Eye className="h-4 w-4 mr-1" /> View Details
                  </Button>
                </TableCell>
              </TableRow>
            );
          })}
        </TableBody>
      </Table>
    </div>
  );
}

/* ── Calendar View ── */
interface Deadline {
  date: string;
  label: string;
  address: string;
  txnId: string;
  type: "closing" | "earnest_money";
}

function CalendarView({ transactions, onView }: { transactions: Transaction[]; onView: (id: string) => void }) {
  const [currentMonth, setCurrentMonth] = useState(new Date());

  const deadlines = useMemo(() => {
    const items: Deadline[] = [];
    transactions.forEach((txn) => {
      const address = txn.listing?.address || txn.buyer_name || txn.seller_name || "Untitled";
      if (txn.closing_date) {
        items.push({ date: txn.closing_date, label: "Closing", address, txnId: txn.id, type: "closing" });
      }
      if (txn.earnest_money_due) {
        items.push({ date: txn.earnest_money_due, label: "Earnest $", address, txnId: txn.id, type: "earnest_money" });
      }
    });
    return items;
  }, [transactions]);

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startPad = getDay(monthStart); // 0=Sun

  return (
    <div className="rounded-lg border bg-card p-5">
      <div className="flex items-center justify-between mb-4">
        <h2 className="font-heading font-semibold">{format(currentMonth, "MMMM yyyy")}</h2>
        <div className="flex gap-1">
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(subMonths(currentMonth, 1))}>
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <Button variant="ghost" size="sm" onClick={() => setCurrentMonth(new Date())}>
            Today
          </Button>
          <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setCurrentMonth(addMonths(currentMonth, 1))}>
            <ChevronRight className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Day headers */}
      <div className="grid grid-cols-7 text-center text-xs text-muted-foreground font-medium mb-1">
        {["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"].map((d) => (
          <div key={d} className="py-1">{d}</div>
        ))}
      </div>

      {/* Day cells */}
      <div className="grid grid-cols-7 gap-px bg-border rounded-lg overflow-hidden">
        {/* Padding for start of month */}
        {Array.from({ length: startPad }).map((_, i) => (
          <div key={`pad-${i}`} className="bg-card min-h-[80px] p-1" />
        ))}
        {days.map((day) => {
          const dayStr = format(day, "yyyy-MM-dd");
          const dayDeadlines = deadlines.filter((d) => d.date === dayStr);
          const isToday = isSameDay(day, new Date());
          return (
            <div key={dayStr} className={`bg-card min-h-[80px] p-1.5 ${isToday ? "ring-1 ring-inset ring-foreground/20" : ""}`}>
              <p className={`text-xs font-medium mb-1 ${isToday ? "text-foreground font-bold" : "text-muted-foreground"}`}>
                {format(day, "d")}
              </p>
              <div className="space-y-0.5">
                {dayDeadlines.map((dl, i) => (
                  <button
                    key={i}
                    onClick={() => onView(dl.txnId)}
                    className={`w-full text-left text-[10px] leading-tight px-1 py-0.5 rounded truncate ${
                      dl.type === "closing"
                        ? "bg-primary/10 text-primary hover:bg-primary/20"
                        : "bg-accent/30 text-accent-foreground hover:bg-accent/50"
                    }`}
                  >
                    {dl.label}: {dl.address}
                  </button>
                ))}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

/* ── Page ── */
export default function Transactions() {
  const [view, setView] = useState<"table" | "calendar">("table");
  const [search, setSearch] = useState("");
  const [newOpen, setNewOpen] = useState(false);
  const navigate = useNavigate();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, listing:listings(address, listing_type)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const filtered = transactions?.filter((t) => {
    const address = t.listing?.address || t.buyer_name || t.seller_name || "";
    return !search || address.toLowerCase().includes(search.toLowerCase());
  });

  const handleView = (id: string) => navigate(`/transactions/${id}`);

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex items-end justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">Transactions</h1>
          <p className="text-sm text-muted-foreground mt-0.5">Active deals, key dates, and health monitoring.</p>
        </div>
        <Button size="sm"><Plus className="h-4 w-4 mr-1" />New Transaction</Button>
      </div>

      <div className="flex items-center gap-3">
        <Tabs value={view} onValueChange={(v) => setView(v as "table" | "calendar")}>
          <TabsList>
            <TabsTrigger value="table"><LayoutList className="h-4 w-4 mr-1" />Table</TabsTrigger>
            <TabsTrigger value="calendar"><CalendarDays className="h-4 w-4 mr-1" />Calendar</TabsTrigger>
          </TabsList>
        </Tabs>
        <div className="ml-auto relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => <Skeleton key={i} className="h-14 w-full rounded-lg" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        view === "table" ? (
          <TransactionsTable transactions={filtered} onView={handleView} />
        ) : (
          <CalendarView transactions={filtered} onView={handleView} />
        )
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No transactions yet. Click "New Transaction" to add one.</p>
        </div>
      )}
    </div>
  );
}
