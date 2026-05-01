import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Upload, Loader2, FileText, X, Sparkles } from "lucide-react";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
}

interface Extracted {
  mec_date: string | null;
  closing_date: string | null;
  possession_date: string | null;
  contract_price: number | null;
  earnest_money_amount: number | null;
  earnest_money_due: string | null;
  buyer_names: string[];
  seller_names: string[];
  property_address: string | null;
}

export function NewTransactionDialog({ open, onOpenChange }: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const navigate = useNavigate();

  const [mode, setMode] = useState<"upload" | "manual">("upload");
  const [file, setFile] = useState<File | null>(null);
  const [uploadedPath, setUploadedPath] = useState<string | null>(null);
  const [parsing, setParsing] = useState(false);

  // Form fields (used by both paths after parse / for manual entry)
  const [form, setForm] = useState({
    property_address: "",
    buyer_name: "",
    seller_name: "",
    mec_date: "",
    closing_date: "",
    contract_price: "",
    earnest_money_amount: "",
    earnest_money_due: "",
  });

  const reset = () => {
    setFile(null);
    setUploadedPath(null);
    setForm({
      property_address: "",
      buyer_name: "",
      seller_name: "",
      mec_date: "",
      closing_date: "",
      contract_price: "",
      earnest_money_amount: "",
      earnest_money_due: "",
    });
    setMode("upload");
  };

  const handleUploadAndParse = async () => {
    if (!file || !user) return;
    setParsing(true);
    try {
      // Upload to private bucket: contracts/<user_id>/<timestamp>-<name>
      const path = `${user.id}/${Date.now()}-${file.name.replace(/[^a-zA-Z0-9._-]/g, "_")}`;
      const { error: upErr } = await supabase.storage
        .from("contracts")
        .upload(path, file, { contentType: "application/pdf", upsert: false });
      if (upErr) throw upErr;
      setUploadedPath(path);

      // Call edge function
      const { data, error } = await supabase.functions.invoke("parse-contract", {
        body: { contract_path: path },
      });
      if (error) throw error;
      if (data?.error) throw new Error(data.error);

      const ex: Extracted = data.data;
      setForm({
        property_address: ex.property_address ?? "",
        buyer_name: (ex.buyer_names || []).join(", "),
        seller_name: (ex.seller_names || []).join(", "),
        mec_date: ex.mec_date ?? "",
        closing_date: ex.closing_date ?? "",
        contract_price: ex.contract_price?.toString() ?? "",
        earnest_money_amount: ex.earnest_money_amount?.toString() ?? "",
        earnest_money_due: ex.earnest_money_due ?? "",
      });
      toast.success("Contract parsed — review and confirm");
    } catch (e: any) {
      toast.error(e.message || "Failed to parse contract");
    } finally {
      setParsing(false);
    }
  };

  const create = useMutation({
    mutationFn: async () => {
      if (!user) throw new Error("Not signed in");
      if (!form.mec_date) throw new Error("MEC date is required");

      const { data: txn, error } = await supabase
        .from("transactions")
        .insert({
          user_id: user.id,
          mec_date: form.mec_date,
          closing_date: form.closing_date || null,
          contract_price: form.contract_price ? Number(form.contract_price) : null,
          earnest_money_amount: form.earnest_money_amount
            ? Number(form.earnest_money_amount)
            : null,
          earnest_money_due: form.earnest_money_due || null,
          buyer_name: form.buyer_name || null,
          seller_name: form.seller_name || null,
          contract_file_path: uploadedPath,
          stage: "contract_intake",
        })
        .select("id")
        .single();
      if (error) throw error;

      // Apply platform CO template
      if (coTemplateId) {
        await supabase.rpc("apply_transaction_template", {
          _template_id: coTemplateId,
          _transaction_id: txn.id,
        });
      }
      // Apply user's add-on template if they have a default
      if (addOnTemplateId) {
        await supabase.rpc("apply_transaction_template", {
          _template_id: addOnTemplateId,
          _transaction_id: txn.id,
        });
      }

      return txn.id;
    },
    onSuccess: (id) => {
      qc.invalidateQueries({ queryKey: ["transactions"] });
      toast.success("Transaction created with full Colorado checklist");
      reset();
      onOpenChange(false);
      navigate(`/transactions/${id}`);
    },
    onError: (e: any) => toast.error(e.message || "Failed to create transaction"),
  });

  return (
    <Dialog open={open} onOpenChange={(v) => { onOpenChange(v); if (!v) reset(); }}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>New Transaction</DialogTitle>
          <p className="text-xs text-muted-foreground">
            Colorado Residential Contract — deadlines auto-calculate from MEC date.
          </p>
        </DialogHeader>

        <Tabs value={mode} onValueChange={(v) => setMode(v as "upload" | "manual")}>
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="upload">
              <Sparkles className="h-4 w-4 mr-1.5" />Upload contract
            </TabsTrigger>
            <TabsTrigger value="manual">Enter manually</TabsTrigger>
          </TabsList>

          <TabsContent value="upload" className="space-y-3 mt-3">
            {!file ? (
              <label className="block border-2 border-dashed border-border rounded-lg p-8 text-center cursor-pointer hover:bg-muted/30 transition-colors">
                <input
                  type="file"
                  accept="application/pdf"
                  className="hidden"
                  onChange={(e) => setFile(e.target.files?.[0] ?? null)}
                />
                <Upload className="h-8 w-8 mx-auto text-muted-foreground mb-2" />
                <p className="text-sm font-medium">Drop or click to upload contract PDF</p>
                <p className="text-xs text-muted-foreground mt-1">
                  AI will extract MEC, closing, earnest money, parties, and price.
                </p>
              </label>
            ) : (
              <div className="flex items-center justify-between rounded-md border p-3">
                <div className="flex items-center gap-2 min-w-0">
                  <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
                  <span className="text-sm truncate">{file.name}</span>
                </div>
                <Button variant="ghost" size="icon" onClick={() => setFile(null)} disabled={parsing}>
                  <X className="h-4 w-4" />
                </Button>
              </div>
            )}

            {file && !uploadedPath && (
              <Button onClick={handleUploadAndParse} disabled={parsing} className="w-full">
                {parsing ? (
                  <><Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> Parsing contract…</>
                ) : (
                  <><Sparkles className="h-4 w-4 mr-1.5" /> Extract with AI</>
                )}
              </Button>
            )}

            {uploadedPath && <ReviewForm form={form} setForm={setForm} />}
          </TabsContent>

          <TabsContent value="manual" className="mt-3">
            <ReviewForm form={form} setForm={setForm} />
          </TabsContent>
        </Tabs>

        <div className="flex justify-end gap-2 pt-2 border-t">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button
            onClick={() => create.mutate()}
            disabled={!form.mec_date || create.isPending}
          >
            {create.isPending ? <Loader2 className="h-4 w-4 mr-1.5 animate-spin" /> : null}
            Create transaction
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function ReviewForm({
  form,
  setForm,
}: {
  form: any;
  setForm: (f: any) => void;
}) {
  const set = (k: string, v: string) => setForm({ ...form, [k]: v });
  return (
    <div className="grid grid-cols-2 gap-3">
      <div className="col-span-2">
        <Label className="text-xs">Property address</Label>
        <Input value={form.property_address} onChange={(e) => set("property_address", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Buyer name(s)</Label>
        <Input value={form.buyer_name} onChange={(e) => set("buyer_name", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Seller name(s)</Label>
        <Input value={form.seller_name} onChange={(e) => set("seller_name", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">MEC date *</Label>
        <Input type="date" value={form.mec_date} onChange={(e) => set("mec_date", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Closing date</Label>
        <Input type="date" value={form.closing_date} onChange={(e) => set("closing_date", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Contract price</Label>
        <Input type="number" value={form.contract_price} onChange={(e) => set("contract_price", e.target.value)} />
      </div>
      <div>
        <Label className="text-xs">Earnest money amount</Label>
        <Input type="number" value={form.earnest_money_amount} onChange={(e) => set("earnest_money_amount", e.target.value)} />
      </div>
      <div className="col-span-2">
        <Label className="text-xs">Earnest money due</Label>
        <Input type="date" value={form.earnest_money_due} onChange={(e) => set("earnest_money_due", e.target.value)} />
      </div>
    </div>
  );
}
