import { useEffect, useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ArrowLeft } from "lucide-react";
import { SERVICE_TYPES, getServiceById, type ServiceTypeDef } from "@/lib/orderServices";

export interface NewOrderDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  /** Pre-select a service. If provided, picker is skipped. */
  initialServiceId?: string;
  /** Pre-link to a listing. */
  initialListingId?: string;
  /** Pre-link to a transaction. */
  initialTransactionId?: string;
  /** Pre-fill the service-specific details (e.g. from voice parsing). */
  initialDetails?: Record<string, any>;
  /** Pre-fill notes / description. */
  initialNotes?: string;
  /** Source of this order (default 'form'). */
  source?: "form" | "voice" | "email";
  sourceTranscript?: string | null;
  sourceConfidence?: number | null;
  onCreated?: (orderId: string) => void;
}

export function NewOrderDialog(props: NewOrderDialogProps) {
  const {
    open,
    onOpenChange,
    initialServiceId,
    initialListingId,
    initialTransactionId,
    initialDetails,
    initialNotes,
    source = "form",
    sourceTranscript,
    sourceConfidence,
    onCreated,
  } = props;
  const { user } = useAuth();
  const qc = useQueryClient();

  const [serviceId, setServiceId] = useState<string | null>(initialServiceId ?? null);
  const [details, setDetails] = useState<Record<string, any>>(initialDetails ?? {});
  const [notes, setNotes] = useState<string>(initialNotes ?? "");
  const [listingId, setListingId] = useState<string>(initialListingId ?? "");
  const [transactionId, setTransactionId] = useState<string>(initialTransactionId ?? "");
  const [submitting, setSubmitting] = useState(false);

  // Reset when dialog opens with new initial values
  useEffect(() => {
    if (open) {
      setServiceId(initialServiceId ?? null);
      setDetails(initialDetails ?? {});
      setNotes(initialNotes ?? "");
      setListingId(initialListingId ?? "");
      setTransactionId(initialTransactionId ?? "");
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open]);

  const { data: listings } = useQuery({
    queryKey: ["listings-mini"],
    queryFn: async () => {
      const { data, error } = await supabase.from("listings").select("id, address").order("address");
      if (error) throw error;
      return data;
    },
    enabled: open,
  });

  const { data: transactions } = useQuery({
    queryKey: ["transactions-mini"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, buyer_name, seller_name, listing:listings(address)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as any[];
    },
    enabled: open,
  });

  const service = useMemo(() => getServiceById(serviceId), [serviceId]);

  const setField = (key: string, value: any) =>
    setDetails((d) => ({ ...d, [key]: value }));

  const canSubmit = !!service && !!user && (
    !service.fields.some((f) => f.required && (details[f.key] === undefined || details[f.key] === ""))
  );

  const handleSubmit = async () => {
    if (!user || !service) return;
    setSubmitting(true);
    try {
      const title = service.defaultTitle(details);
      const { data, error } = await supabase
        .from("orders")
        .insert({
          user_id: user.id,
          title,
          description: notes || null,
          listing_id: listingId || null,
          transaction_id: transactionId || null,
          status: "pending",
          priority: "normal",
          service_type: service.id,
          service_details: details,
          source,
          source_transcript: sourceTranscript ?? null,
          source_confidence: sourceConfidence ?? null,
          due_date: details.preferred_date || details.needed_by || null,
        } as any)
        .select("id")
        .single();
      if (error) throw error;
      toast.success("Order submitted to the team");
      qc.invalidateQueries({ queryKey: ["orders"] });
      onCreated?.(data!.id);
      onOpenChange(false);
    } catch (e: any) {
      console.error(e);
      toast.error(e?.message || "Failed to submit order");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="font-heading flex items-center gap-2">
            {service && !initialServiceId ? (
              <button
                onClick={() => setServiceId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
                aria-label="Back to service picker"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
            ) : null}
            {service ? `New ${service.label} order` : "New order"}
          </DialogTitle>
          {!service && (
            <DialogDescription>Choose a service. The team gets the details right away.</DialogDescription>
          )}
        </DialogHeader>

        {!service ? (
          <ServicePicker onPick={setServiceId} />
        ) : (
          <div className="space-y-4 pt-1">
            {/* Service-specific fields */}
            {service.fields.map((f) => (
              <FieldRenderer
                key={f.key}
                field={f}
                value={details[f.key]}
                onChange={(v) => setField(f.key, v)}
              />
            ))}

            {/* Linkage */}
            <div className="grid grid-cols-2 gap-3 pt-2 border-t">
              <div className="space-y-1.5">
                <Label className="text-xs">Listing (optional)</Label>
                <Select value={listingId || "none"} onValueChange={(v) => setListingId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Link to listing" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {listings?.map((l) => (
                      <SelectItem key={l.id} value={l.id}>{l.address}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-1.5">
                <Label className="text-xs">Transaction (optional)</Label>
                <Select value={transactionId || "none"} onValueChange={(v) => setTransactionId(v === "none" ? "" : v)}>
                  <SelectTrigger><SelectValue placeholder="Link to transaction" /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">— None —</SelectItem>
                    {transactions?.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        {t.listing?.address || t.buyer_name || t.seller_name || "Untitled"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-1.5">
              <Label className="text-xs">Notes for the team</Label>
              <Textarea
                rows={2}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Anything else the team should know"
              />
            </div>

            {sourceTranscript && (
              <div className="rounded-md border bg-muted/40 p-3 text-xs">
                <p className="font-medium mb-1">Captured from voice</p>
                <p className="text-muted-foreground italic">"{sourceTranscript}"</p>
              </div>
            )}

            <div className="flex justify-end gap-2 pt-2">
              <Button variant="outline" onClick={() => onOpenChange(false)} disabled={submitting}>
                Cancel
              </Button>
              <Button onClick={handleSubmit} disabled={!canSubmit || submitting}>
                {submitting ? "Submitting…" : "Submit order"}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}

function ServicePicker({ onPick }: { onPick: (id: string) => void }) {
  return (
    <div className="grid grid-cols-2 gap-3 pt-2">
      {SERVICE_TYPES.map((s) => {
        const Icon = s.icon;
        return (
          <button
            key={s.id}
            onClick={() => onPick(s.id)}
            className="rounded-lg border bg-card p-4 text-left hover:border-primary hover:shadow-sm transition-all group"
          >
            <Icon className="h-5 w-5 mb-2 text-primary" />
            <p className="font-heading font-semibold text-sm">{s.label}</p>
            <p className="text-xs text-muted-foreground mt-0.5 leading-snug">{s.description}</p>
          </button>
        );
      })}
    </div>
  );
}

function FieldRenderer({
  field,
  value,
  onChange,
}: {
  field: ServiceTypeDef["fields"][number];
  value: any;
  onChange: (v: any) => void;
}) {
  const id = `f-${field.key}`;
  return (
    <div className="space-y-1.5">
      <Label htmlFor={id} className="text-xs">
        {field.label}{field.required ? " *" : ""}
      </Label>
      {field.type === "textarea" ? (
        <Textarea
          id={id}
          rows={2}
          value={value || ""}
          onChange={(e) => onChange(e.target.value)}
          placeholder={field.placeholder}
        />
      ) : field.type === "select" ? (
        <Select value={value || ""} onValueChange={onChange}>
          <SelectTrigger id={id}><SelectValue placeholder="Select…" /></SelectTrigger>
          <SelectContent>
            {field.options?.map((o) => (
              <SelectItem key={o.value} value={o.value}>{o.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : field.type === "boolean" ? (
        <div className="flex items-center gap-2 h-10">
          <Switch checked={!!value} onCheckedChange={onChange} id={id} />
          <span className="text-sm text-muted-foreground">{value ? "Yes" : "No"}</span>
        </div>
      ) : (
        <Input
          id={id}
          type={field.type === "number" ? "number" : field.type === "date" ? "date" : field.type === "time" ? "time" : "text"}
          value={value ?? ""}
          onChange={(e) => onChange(field.type === "number" ? (e.target.value === "" ? "" : Number(e.target.value)) : e.target.value)}
          placeholder={field.placeholder}
        />
      )}
      {field.helpText && <p className="text-[11px] text-muted-foreground">{field.helpText}</p>}
    </div>
  );
}
