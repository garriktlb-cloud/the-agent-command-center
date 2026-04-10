import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Plus, Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Skeleton } from "@/components/ui/skeleton";
import { useState } from "react";
import { useNavigate } from "react-router-dom";
import type { Tables } from "@/integrations/supabase/types";
import { differenceInDays, parseISO } from "date-fns";

type Transaction = Tables<"transactions"> & { listing?: { address: string } | null };

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

function healthColor(score: number) {
  if (score >= 90) return "bg-foreground text-background";
  if (score >= 80) return "bg-foreground/80 text-background";
  if (score >= 60) return "bg-foreground/50 text-background";
  return "bg-foreground/30 text-foreground";
}

function healthLabel(score: number) {
  if (score >= 90) return "Strong";
  if (score >= 80) return "Good";
  if (score >= 60) return "Watch";
  return "At Risk";
}

function TransactionCard({ txn, onClick }: { txn: Transaction; onClick: () => void }) {
  const score = txn.health_score ?? 100;
  const daysToClose = txn.closing_date ? Math.max(0, differenceInDays(parseISO(txn.closing_date), new Date())) : null;
  const address = txn.listing?.address || txn.buyer_name || txn.seller_name || "Untitled";
  const price = txn.contract_price ? `$${Number(txn.contract_price).toLocaleString()}` : "—";

  return (
    <div className="rounded-lg border bg-card overflow-hidden hover:shadow-md transition-shadow cursor-pointer" onClick={onClick}>
      <div className="bg-primary px-4 py-3 flex items-center justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-primary-foreground/60">
            {stageLabels[txn.stage] || txn.stage}
          </p>
          <h3 className="font-heading font-bold text-primary-foreground text-lg">{address}</h3>
          <p className="text-xs text-primary-foreground/60">
            {price}{daysToClose !== null ? ` · ${daysToClose} days to close` : ""}
          </p>
        </div>
        <div className={`flex flex-col items-center justify-center rounded-md px-2.5 py-1.5 ${healthColor(score)}`}>
          <span className="text-lg font-heading font-bold">{score}</span>
          <span className="text-[9px] uppercase font-semibold">{healthLabel(score)}</span>
        </div>
      </div>
      <div className="p-4">
        <div className="flex items-center justify-between text-xs mb-1">
          <span className="text-muted-foreground">Deal Health</span>
          <span className="font-semibold">{score}%</span>
        </div>
        <Progress value={score} className="h-1.5 mb-3" />
        <div className="flex justify-between items-center">
          <span className="text-xs text-muted-foreground">
            {daysToClose !== null ? `${daysToClose} days remaining` : "No closing date"}
          </span>
          <Button variant="outline" size="sm">Details</Button>
        </div>
      </div>
    </div>
  );
}

export default function Transactions() {
  const [search, setSearch] = useState("");
  const navigate = useNavigate();

  const { data: transactions, isLoading } = useQuery({
    queryKey: ["transactions"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, listing:listings(address)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as Transaction[];
    },
  });

  const filtered = transactions?.filter((t) => {
    const address = t.listing?.address || t.buyer_name || t.seller_name || "";
    return !search || address.toLowerCase().includes(search.toLowerCase());
  });

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
        <div className="relative w-64">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <Input placeholder="Search transactions..." className="pl-9" value={search} onChange={(e) => setSearch(e.target.value)} />
        </div>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => <Skeleton key={i} className="h-48 rounded-lg" />)}
        </div>
      ) : filtered && filtered.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filtered.map((txn) => (
            <TransactionCard key={txn.id} txn={txn} onClick={() => navigate(`/transactions/${txn.id}`)} />
          ))}
        </div>
      ) : (
        <div className="text-center py-12 text-muted-foreground">
          <p className="text-sm">No transactions yet. Click "New Transaction" to add one.</p>
        </div>
      )}
    </div>
  );
}
