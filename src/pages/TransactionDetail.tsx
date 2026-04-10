import { useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Progress } from "@/components/ui/progress";
import { Skeleton } from "@/components/ui/skeleton";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowLeft, CheckCircle2, Circle, Plus, ChevronRight, X } from "lucide-react";
import { format, differenceInDays, parseISO } from "date-fns";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Transaction = Tables<"transactions"> & { listing?: { address: string; status: string; listing_type: string } | null };
type ChecklistItem = Tables<"transaction_checklist_items">;

/* ── default checklist blueprint per stage ── */
const defaultChecklist: { section: string; items: { label: string; service_type?: string }[] }[] = [
  {
    section: "Contract Intake",
    items: [
      { label: "Upload signed contract" },
      { label: "Log MEC date" },
      { label: "Log all dates and deadlines from CBS" },
      { label: "Log purchase price, closing date, possession date" },
      { label: "Log earnest money amount, deadline, and holder" },
      { label: "Log compensation structure" },
      { label: "Log all party contact info" },
      { label: "Flag HOA, pre-1978, solar, cash vs financed" },
    ],
  },
  {
    section: "Day 1",
    items: [
      { label: "Send intro email to title company" },
      { label: "Send intro email to lender" },
      { label: "Send intro email to other broker" },
      { label: "Send intro email to buyer client with earnest money instructions and ABA" },
      { label: "Update MLS status to Under Contract" },
      { label: "Send wire fraud warning to buyer" },
      { label: "Confirm title order placed" },
    ],
  },
  {
    section: "Earnest Money",
    items: [
      { label: "Monitor earnest money delivery daily" },
      { label: "Confirm earnest money delivered to title" },
      { label: "Obtain written receipt from title company" },
      { label: "Log earnest money confirmed date" },
      { label: "Notify agent of earnest money confirmation" },
    ],
  },
  {
    section: "Inspection",
    items: [
      { label: "Schedule inspection", service_type: "inspection" },
      { label: "Confirm inspection date and time with all parties" },
      { label: "Follow up on inspection report" },
      { label: "Track inspection objection deadline" },
      { label: "Log inspection resolution" },
    ],
  },
  {
    section: "Loan & Appraisal",
    items: [
      { label: "Confirm loan application submitted" },
      { label: "Track appraisal order date" },
      { label: "Follow up on appraisal completion" },
      { label: "Log appraisal value" },
      { label: "Confirm loan approval / clear to close" },
    ],
  },
  {
    section: "Title",
    items: [
      { label: "Confirm title commitment received" },
      { label: "Review title exceptions" },
      { label: "Track title objection deadline" },
      { label: "Confirm title issues resolved" },
    ],
  },
  {
    section: "Pre-Close",
    items: [
      { label: "Schedule final walkthrough", service_type: "walkthrough" },
      { label: "Confirm closing date and time" },
      { label: "Confirm closing location / mobile notary" },
      { label: "Review settlement statement" },
      { label: "Confirm all documents ready" },
    ],
  },
  {
    section: "Closing",
    items: [
      { label: "Confirm funds wired" },
      { label: "Confirm recording" },
      { label: "Send closing confirmation to all parties" },
      { label: "Update MLS status to Closed" },
    ],
  },
];

const serviceableTypes = ["inspection", "walkthrough"];

function getDealHealth(txn: Transaction) {
  const items: { label: string; status: string; color: string }[] = [];
  const stage = txn.stage;
  const stages = ["contract_intake", "day_1", "earnest_money", "inspection", "loan_appraisal", "title", "pre_close", "closing"];
  const idx = stages.indexOf(stage);

  items.push({ label: "Inspection", status: idx >= 3 ? "Scheduled" : "Pending", color: idx >= 3 ? "text-primary" : "text-muted-foreground" });
  items.push({ label: "Repairs", status: "Not Assigned", color: "text-muted-foreground" });
  items.push({ label: "Loan", status: idx >= 4 ? "Confirmed" : "Not Confirmed", color: idx >= 4 ? "text-primary" : "text-destructive" });
  items.push({ label: "Appraisal", status: idx >= 4 ? "Complete" : "Pending", color: idx >= 4 ? "text-foreground" : "text-muted-foreground" });
  items.push({ label: "Title", status: idx >= 5 ? "On Track" : "Pending", color: idx >= 5 ? "text-primary" : "text-muted-foreground" });

  return items;
}

export default function TransactionDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const qc = useQueryClient();

  const [actionItem, setActionItem] = useState<ChecklistItem | null>(null);
  const [addOpen, setAddOpen] = useState(false);
  const [addLabel, setAddLabel] = useState("");
  const [addSection, setAddSection] = useState("Custom");

  /* ── queries ── */
  const { data: txn, isLoading } = useQuery({
    queryKey: ["transaction", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("*, listing:listings(address, status, listing_type)")
        .eq("id", id!)
        .single();
      if (error) throw error;
      return data as Transaction;
    },
    enabled: !!id,
  });

  const { data: checklist = [] } = useQuery({
    queryKey: ["txn-checklist", id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_checklist_items")
        .select("*")
        .eq("transaction_id", id!)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data as ChecklistItem[];
    },
    enabled: !!id,
  });

  /* ── mutations ── */
  const toggleItem = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("transaction_checklist_items")
        .update({ done: !item.done, completed_at: !item.done ? new Date().toISOString() : null })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["txn-checklist", id] }),
  });

  const handleByListBar = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("transaction_checklist_items")
        .update({ handled_by: "listbar" })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["txn-checklist", id] });
      toast.success("The List Bar will handle this for you!");
      setActionItem(null);
    },
  });

  const handleBySelf = useMutation({
    mutationFn: async (item: ChecklistItem) => {
      const { error } = await supabase
        .from("transaction_checklist_items")
        .update({ handled_by: "self" })
        .eq("id", item.id);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["txn-checklist", id] });
      toast.success("You're handling this one.");
      setActionItem(null);
    },
  });

  const addItem = useMutation({
    mutationFn: async () => {
      if (!addLabel.trim() || !user) return;
      const { error } = await supabase.from("transaction_checklist_items").insert({
        transaction_id: id!,
        user_id: user.id,
        label: addLabel.trim(),
        section: addSection,
        sort_order: checklist.length,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["txn-checklist", id] });
      setAddLabel("");
      setAddOpen(false);
      toast.success("Item added");
    },
  });

  const seedChecklist = useMutation({
    mutationFn: async () => {
      if (!user) return;
      const rows = defaultChecklist.flatMap((sec, si) =>
        sec.items.map((item, ii) => ({
          transaction_id: id!,
          user_id: user.id,
          label: item.label,
          section: sec.section,
          sort_order: si * 100 + ii,
          service_type: item.service_type || null,
        }))
      );
      const { error } = await supabase.from("transaction_checklist_items").insert(rows);
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["txn-checklist", id] });
      toast.success("Checklist initialized");
    },
  });

  if (isLoading) {
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
        <Button variant="outline" className="mt-4" onClick={() => navigate("/transactions")}>Back to Transactions</Button>
      </div>
    );
  }

  const address = txn.listing?.address || "Untitled";
  const score = txn.health_score ?? 100;
  const daysToClose = txn.closing_date ? Math.max(0, differenceInDays(parseISO(txn.closing_date), new Date())) : null;
  const dealHealth = getDealHealth(txn);

  /* group checklist by section */
  const sections = new Map<string, ChecklistItem[]>();
  checklist.forEach((item) => {
    const arr = sections.get(item.section) || [];
    arr.push(item);
    sections.set(item.section, arr);
  });

  const totalItems = checklist.length;
  const doneItems = checklist.filter((i) => i.done).length;
  const overallPct = totalItems === 0 ? 0 : Math.round((doneItems / totalItems) * 100);

  /* attention items: undone items with a due aspect */
  const attentionItems: string[] = [];
  if (daysToClose !== null && daysToClose <= 7) attentionItems.push(`Closing in ${daysToClose} days`);
  if (txn.earnest_money_due) {
    const emDays = differenceInDays(parseISO(txn.earnest_money_due), new Date());
    if (emDays <= 3 && emDays >= 0) attentionItems.push(`Earnest money due in ${emDays} days`);
  }

  const sectionNames = defaultChecklist.map((s) => s.section);

  return (
    <div className="space-y-4 animate-fade-in">
      {/* Back + Header */}
      <Button variant="ghost" size="sm" onClick={() => navigate("/transactions")}>
        <ArrowLeft className="h-4 w-4 mr-1" /> Back
      </Button>

      <div className="flex items-start justify-between">
        <div>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Deal Strategist · 6AM Daily</p>
          <h1 className="text-2xl font-heading font-bold">{address}</h1>
          <p className="text-sm text-muted-foreground">
            {txn.contract_price ? `$${Number(txn.contract_price).toLocaleString()}` : "No price"}
            {txn.buyer_name && ` · Buyer: ${txn.buyer_name}`}
            {txn.seller_name && ` · Seller: ${txn.seller_name}`}
          </p>
        </div>
      </div>

      {/* Tabs */}
      <Tabs defaultValue="checklist" className="w-full">
        <TabsList className="bg-transparent border-b rounded-none w-full justify-start px-0 h-auto pb-0">
          <TabsTrigger value="checklist" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2">Checklist</TabsTrigger>
          <TabsTrigger value="docs" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2">Docs</TabsTrigger>
          <TabsTrigger value="overview" className="rounded-none border-b-2 border-transparent data-[state=active]:border-foreground data-[state=active]:bg-transparent data-[state=active]:shadow-none px-4 pb-2">Overview</TabsTrigger>
        </TabsList>

        {/* ─── CHECKLIST TAB ─── */}
        <TabsContent value="checklist" className="mt-4">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left — checklist */}
            <div className="lg:col-span-2 space-y-4">
              {/* What needs attention */}
              {attentionItems.length > 0 && (
                <div className="rounded-lg border bg-card p-4">
                  <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-1">What needs attention</p>
                  <div className="space-y-2 mt-2">
                    {attentionItems.map((a, i) => (
                      <div key={i} className="rounded-md border px-3 py-2">
                        <p className="text-sm font-medium">{a}</p>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Checklist header */}
              <div className="flex items-center justify-between">
                <p className="text-sm font-semibold">
                  Checklist <span className="text-muted-foreground font-normal">(Outcomes)</span>
                </p>
                <Button variant="ghost" size="sm" className="text-xs" onClick={() => setAddOpen(true)}>
                  <Plus className="h-3 w-3 mr-1" /> Quick add
                </Button>
              </div>

              {checklist.length === 0 ? (
                <div className="rounded-lg border bg-card p-8 text-center">
                  <p className="text-sm text-muted-foreground mb-3">No checklist items yet.</p>
                  <Button variant="outline" size="sm" onClick={() => seedChecklist.mutate()}>
                    Initialize Default Checklist
                  </Button>
                </div>
              ) : (
                Array.from(sections.entries()).map(([section, items]) => {
                  const sectionDone = items.filter((i) => i.done).length;
                  return (
                    <div key={section} className="space-y-0">
                      <div className="flex items-center justify-between py-2 border-b">
                        <p className="text-sm font-semibold">{section}</p>
                        <span className="text-xs text-muted-foreground">{sectionDone}/{items.length}</span>
                      </div>
                      {items.map((item) => (
                        <ChecklistRow
                          key={item.id}
                          item={item}
                          onToggle={() => toggleItem.mutate(item)}
                          onAction={() => setActionItem(item)}
                        />
                      ))}
                    </div>
                  );
                })
              )}
            </div>

            {/* Right sidebar */}
            <div className="space-y-4">
              {/* Deal Health */}
              <div className="rounded-lg border bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Deal Health</p>
                <div className="space-y-2">
                  {dealHealth.map((h) => (
                    <div key={h.label} className="flex items-center justify-between">
                      <span className="text-sm">{h.label}</span>
                      <span className={`text-sm font-medium ${h.color}`}>{h.status}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Timeline */}
              <div className="rounded-lg border bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Timeline</p>
                <div className="flex items-center justify-between">
                  <span className="text-sm">Closing</span>
                  <span className="text-sm font-semibold">
                    {txn.closing_date ? format(parseISO(txn.closing_date), "MMM d") : "—"}
                  </span>
                </div>
                {txn.earnest_money_due && (
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-sm">EM Due</span>
                    <span className="text-sm font-semibold">{format(parseISO(txn.earnest_money_due), "MMM d")}</span>
                  </div>
                )}
              </div>

              {/* Overall progress */}
              <div className="rounded-lg border bg-card p-4">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium">Overall progress</span>
                  <span className="text-sm font-bold">{overallPct}%</span>
                </div>
                <Progress value={overallPct} className="h-2" />
                <p className="text-xs text-muted-foreground mt-1">{doneItems} of {totalItems} steps complete</p>
              </div>

              {/* Parties */}
              <div className="rounded-lg border bg-card p-4">
                <p className="text-[10px] uppercase tracking-wider text-muted-foreground mb-3">Parties</p>
                {txn.buyer_name && <p className="text-sm"><span className="text-muted-foreground">Buyer:</span> {txn.buyer_name}</p>}
                {txn.seller_name && <p className="text-sm mt-1"><span className="text-muted-foreground">Seller:</span> {txn.seller_name}</p>}
                {!txn.buyer_name && !txn.seller_name && <p className="text-xs text-muted-foreground">No parties added.</p>}
              </div>
            </div>
          </div>
        </TabsContent>

        {/* ─── DOCS TAB ─── */}
        <TabsContent value="docs" className="mt-4">
          <div className="rounded-lg border bg-card p-8 text-center">
            <p className="text-sm text-muted-foreground">Document management coming soon.</p>
          </div>
        </TabsContent>

        {/* ─── OVERVIEW TAB ─── */}
        <TabsContent value="overview" className="mt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Transaction Details</p>
              <Detail label="Address" value={address} />
              <Detail label="Contract Price" value={txn.contract_price ? `$${Number(txn.contract_price).toLocaleString()}` : "—"} />
              <Detail label="Closing Date" value={txn.closing_date ? format(parseISO(txn.closing_date), "MMM d, yyyy") : "—"} />
              <Detail label="Stage" value={txn.stage.replace(/_/g, " ")} />
              <Detail label="Health Score" value={`${score}/100`} />
              <Detail label="EM Amount" value={txn.earnest_money_amount ? `$${Number(txn.earnest_money_amount).toLocaleString()}` : "—"} />
              <Detail label="EM Due" value={txn.earnest_money_due ? format(parseISO(txn.earnest_money_due), "MMM d, yyyy") : "—"} />
            </div>
            <div className="rounded-lg border bg-card p-4 space-y-3">
              <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Notes</p>
              <p className="text-sm text-muted-foreground whitespace-pre-wrap">{txn.notes || "No notes yet."}</p>
            </div>
          </div>
        </TabsContent>
      </Tabs>

      {/* ─── ACTION PANEL (dialog) ─── */}
      <Dialog open={!!actionItem} onOpenChange={(o) => !o && setActionItem(null)}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <p className="text-[10px] uppercase tracking-wider text-muted-foreground">Action Panel</p>
            <DialogTitle className="text-base font-semibold">{actionItem?.label}</DialogTitle>
          </DialogHeader>
          <div className="space-y-2 mt-2">
            {/* Book Directly */}
            <button
              className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors flex items-center justify-between"
              onClick={() => actionItem && handleBySelf.mutate(actionItem)}
            >
              <div>
                <p className="text-sm font-medium">Book Directly</p>
                <p className="text-xs text-muted-foreground">View vendors and complete this step yourself.</p>
              </div>
              <ChevronRight className="h-4 w-4 text-muted-foreground" />
            </button>

            {/* We'll handle it */}
            <button
              className="w-full text-left rounded-lg border border-foreground bg-foreground text-background p-3 hover:bg-foreground/90 transition-colors flex items-center justify-between"
              onClick={() => actionItem && handleByListBar.mutate(actionItem)}
            >
              <div>
                <p className="text-sm font-medium">We'll handle it</p>
                <p className="text-xs opacity-70">List Bar coordinates for you.</p>
              </div>
              <span className="text-xs">→</span>
            </button>

            {/* Mark as complete */}
            <button
              className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors flex items-center justify-between"
              onClick={() => {
                if (actionItem) toggleItem.mutate(actionItem);
                setActionItem(null);
              }}
            >
              <div>
                <p className="text-sm font-medium">Mark as complete</p>
                <p className="text-xs text-muted-foreground">Confirm this step is done.</p>
              </div>
              <CheckCircle2 className="h-4 w-4 text-primary" />
            </button>
          </div>
        </DialogContent>
      </Dialog>

      {/* ─── ADD ITEM DIALOG ─── */}
      <Dialog open={addOpen} onOpenChange={setAddOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Add Checklist Item</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 mt-2">
            <Input placeholder="Item label" value={addLabel} onChange={(e) => setAddLabel(e.target.value)} />
            <Select value={addSection} onValueChange={setAddSection}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                {sectionNames.map((s) => (
                  <SelectItem key={s} value={s}>{s}</SelectItem>
                ))}
                <SelectItem value="Custom">Custom</SelectItem>
              </SelectContent>
            </Select>
            <Button className="w-full" size="sm" onClick={() => addItem.mutate()} disabled={!addLabel.trim()}>
              Add Item
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}

/* ── sub-components ── */

function ChecklistRow({ item, onToggle, onAction }: { item: ChecklistItem; onToggle: () => void; onAction: () => void }) {
  const isServiceable = serviceableTypes.includes(item.service_type || "");
  const handledLabel = item.handled_by === "listbar" ? "List Bar" : item.handled_by === "self" ? "You" : null;

  return (
    <div className={`flex items-center gap-3 py-2.5 border-b last:border-0 group ${item.done ? "opacity-50" : ""}`}>
      <button onClick={onToggle} className="shrink-0">
        {item.done ? (
          <CheckCircle2 className="h-5 w-5 text-primary" />
        ) : (
          <Circle className="h-5 w-5 text-muted-foreground/40 hover:text-foreground transition-colors" />
        )}
      </button>
      <span className={`flex-1 text-sm ${item.done ? "line-through text-muted-foreground" : ""}`}>
        {item.label}
      </span>
      {handledLabel && (
        <Badge variant="outline" className="text-[10px] shrink-0">
          {handledLabel}
        </Badge>
      )}
      {isServiceable && !item.done && !item.handled_by && (
        <Button variant="outline" size="sm" className="text-xs h-7 shrink-0" onClick={onAction}>
          Handle
        </Button>
      )}
      <button onClick={onAction} className="shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
        <ChevronRight className="h-4 w-4 text-muted-foreground" />
      </button>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium capitalize">{value}</span>
    </div>
  );
}
