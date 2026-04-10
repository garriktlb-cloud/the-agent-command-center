import { useParams, useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { ArrowLeft, Calendar, DollarSign, User, FileText, AlertTriangle, CheckCircle2, Clock } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions"> & { listing?: { address: string; status: string } | null };
type Order = Tables<"orders">;
type Task = Tables<"tasks">;

const stages = [
  { key: "contract_intake", label: "Contract Intake" },
  { key: "day_1", label: "Day 1" },
  { key: "earnest_money", label: "Earnest Money" },
  { key: "inspection", label: "Inspection" },
  { key: "loan_appraisal", label: "Loan & Appraisal" },
  { key: "title", label: "Title" },
  { key: "pre_close", label: "Pre-Close" },
  { key: "closing", label: "Closing" },
];

function healthColor(score: number) {
  if (score >= 90) return "text-foreground";
  if (score >= 70) return "text-foreground/70";
  if (score >= 50) return "text-foreground/50";
  return "text-destructive";
}

function healthBg(score: number) {
  if (score >= 90) return "bg-foreground text-background";
  if (score >= 70) return "bg-foreground/80 text-background";
  if (score >= 50) return "bg-foreground/50 text-background";
  return "bg-destructive/20 text-destructive";
}

const taskStatusIcon: Record<string, React.ReactNode> = {
  done: <CheckCircle2 className="h-4 w-4 text-foreground/50" />,
  in_progress: <Clock className="h-4 w-4 text-foreground/60" />,
  todo: <AlertTriangle className="h-4 w-4 text-muted-foreground/50" />,
};

const orderStatusStyles: Record<string, string> = {
  pending: "bg-foreground/5 text-foreground/60 border-foreground/10",
  in_progress: "bg-foreground/8 text-foreground/70 border-foreground/15",
  completed: "bg-foreground/10 text-foreground border-foreground/20",
  cancelled: "bg-destructive/10 text-destructive border-destructive/20",
};

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();

  const { data: txn, isLoading: txnLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, listing:listings(address, status)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    enabled: !!id,
  });

  const { data: orders } = useQuery({
    queryKey: ["transaction-orders", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("orders")
        .select("*")
        .eq("transaction_id", id!)
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Order[];
    },
    enabled: !!id,
  });

  const { data: tasks } = useQuery({
    queryKey: ["transaction-tasks", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .eq("transaction_id", id!)
        .order("due_date", { ascending: true });
      if (error) throw error;
      return data as Task[];
    },
    enabled: !!id,
  });

  if (txnLoading) {
    return (
      <div className="space-y-6 animate-fade-in">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="h-64 w-full rounded-lg" />
      </div>
    );
  }

  if (!txn) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">Transaction not found.</p>
        <Button variant="outline" className="mt-4" onClick={() => navigate("/transactions")}>
          Back to Transactions
        </Button>
      </div>
    );
  }

  const score = txn.health_score ?? 100;
  const address = txn.listing?.address || "Untitled";
  const daysToClose = txn.closing_date ? Math.max(0, differenceInDays(parseISO(txn.closing_date), new Date())) : null;
  const currentStageIndex = stages.findIndex((s) => s.key === txn.stage);

  return (
    <div className="space-y-6 animate-fade-in">
      {/* Header */}
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>
          <ArrowLeft className="h-4 w-4 mr-1" /> Back
        </Button>
      </div>

      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-heading font-bold">{address}</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            {txn.contract_price ? `$${Number(txn.contract_price).toLocaleString()}` : "No price"}{" "}
            {txn.buyer_name && `· Buyer: ${txn.buyer_name}`}
            {txn.seller_name && `· Seller: ${txn.seller_name}`}
          </p>
        </div>
        <div className={`flex flex-col items-center justify-center rounded-lg px-4 py-2 ${healthBg(score)}`}>
          <span className="text-2xl font-heading font-bold">{score}</span>
          <span className="text-[10px] uppercase font-semibold tracking-wider">Health</span>
        </div>
      </div>

      {/* Stage Pipeline */}
      <div className="rounded-lg border bg-card p-4">
        <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Stage Pipeline</p>
        <div className="flex items-center gap-1">
          {stages.map((stage, i) => {
            const isActive = i === currentStageIndex;
            const isPast = i < currentStageIndex;
            return (
              <div key={stage.key} className="flex-1 flex flex-col items-center gap-1.5">
                <div
                  className={`h-2 w-full rounded-full transition-colors ${
                    isPast
                      ? "bg-foreground"
                      : isActive
                      ? "bg-primary"
                      : "bg-muted"
                  }`}
                />
                <span
                  className={`text-[9px] text-center leading-tight ${
                    isActive ? "font-bold text-foreground" : isPast ? "text-foreground/60" : "text-muted-foreground"
                  }`}
                >
                  {stage.label}
                </span>
              </div>
            );
          })}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Main content — left 2 cols */}
        <div className="lg:col-span-2 space-y-4">
          {/* Key Dates */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Key Dates</p>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Closing</p>
                <p className="text-sm font-semibold">
                  {txn.closing_date ? format(parseISO(txn.closing_date), "MMM d, yyyy") : "—"}
                </p>
                {daysToClose !== null && <p className="text-[10px] text-muted-foreground">{daysToClose} days</p>}
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">EM Due</p>
                <p className="text-sm font-semibold">
                  {txn.earnest_money_due ? format(parseISO(txn.earnest_money_due), "MMM d") : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">EM Amount</p>
                <p className="text-sm font-semibold">
                  {txn.earnest_money_amount ? `$${Number(txn.earnest_money_amount).toLocaleString()}` : "—"}
                </p>
              </div>
              <div>
                <p className="text-[10px] text-muted-foreground uppercase">Contract Price</p>
                <p className="text-sm font-semibold">
                  {txn.contract_price ? `$${Number(txn.contract_price).toLocaleString()}` : "—"}
                </p>
              </div>
            </div>
          </div>

          {/* Orders */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Orders</p>
              <span className="text-xs text-muted-foreground">{orders?.length || 0} orders</span>
            </div>
            {orders && orders.length > 0 ? (
              <div className="space-y-2">
                {orders.map((o) => (
                  <div key={o.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium truncate">{o.title}</p>
                      <p className="text-xs text-muted-foreground">{o.vendor_name || "No vendor"}</p>
                    </div>
                    <Badge variant="outline" className={orderStatusStyles[o.status] || ""}>
                      {o.status.replace("_", " ")}
                    </Badge>
                    {o.cost != null && (
                      <span className="text-sm font-semibold">${Number(o.cost).toLocaleString()}</span>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No orders linked to this transaction.</p>
            )}
          </div>

          {/* Tasks */}
          <div className="rounded-lg border bg-card p-4">
            <div className="flex items-center justify-between mb-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Tasks</p>
              <span className="text-xs text-muted-foreground">{tasks?.length || 0} tasks</span>
            </div>
            {tasks && tasks.length > 0 ? (
              <div className="space-y-2">
                {tasks.map((t) => (
                  <div key={t.id} className="flex items-center gap-3 py-2 border-b last:border-0">
                    {taskStatusIcon[t.status] || taskStatusIcon.todo}
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm ${t.status === "done" ? "text-muted-foreground line-through" : "font-medium"}`}>
                        {t.title}
                      </p>
                    </div>
                    {t.due_date && (
                      <span className="text-xs text-muted-foreground">{format(parseISO(t.due_date), "MMM d")}</span>
                    )}
                    <Badge variant="outline" className="text-[10px]">
                      {t.priority}
                    </Badge>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-muted-foreground">No tasks linked to this transaction.</p>
            )}
          </div>
        </div>

        {/* Sidebar — right col */}
        <div className="space-y-4">
          {/* Deal Health */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Deal Health</p>
            <div className="flex items-center gap-3 mb-3">
              <div className={`text-3xl font-heading font-bold ${healthColor(score)}`}>{score}</div>
              <div>
                <p className="text-sm font-medium">
                  {score >= 90 ? "Strong" : score >= 70 ? "Good" : score >= 50 ? "Watch" : "At Risk"}
                </p>
                <p className="text-xs text-muted-foreground">Overall deal health</p>
              </div>
            </div>
            <Progress value={score} className="h-2" />
          </div>

          {/* Parties */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Parties</p>
            <div className="space-y-3">
              {txn.buyer_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Buyer</p>
                    <p className="text-sm font-medium">{txn.buyer_name}</p>
                  </div>
                </div>
              )}
              {txn.seller_name && (
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-xs text-muted-foreground">Seller</p>
                    <p className="text-sm font-medium">{txn.seller_name}</p>
                  </div>
                </div>
              )}
              {!txn.buyer_name && !txn.seller_name && (
                <p className="text-xs text-muted-foreground">No parties added yet.</p>
              )}
            </div>
          </div>

          {/* Notes */}
          <div className="rounded-lg border bg-card p-4">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Notes</p>
            <p className="text-sm text-muted-foreground whitespace-pre-wrap">
              {txn.notes || "No notes yet."}
            </p>
          </div>

          {/* Actions */}
          <div className="rounded-lg border bg-card p-4 space-y-2">
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Actions</p>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <FileText className="h-4 w-4 mr-2" /> Edit Transaction
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <DollarSign className="h-4 w-4 mr-2" /> Add Order
            </Button>
            <Button variant="outline" size="sm" className="w-full justify-start">
              <Calendar className="h-4 w-4 mr-2" /> Add Task
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
