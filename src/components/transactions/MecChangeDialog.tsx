import { useState } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";

interface Props {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  transactionId: string;
  oldDate: string | null;
  newDate: string;
}

export function MecChangeDialog({ open, onOpenChange, transactionId, oldDate, newDate }: Props) {
  const [choice, setChoice] = useState<"incomplete" | "all" | "skip">("incomplete");
  const qc = useQueryClient();

  const apply = useMutation({
    mutationFn: async () => {
      // Update MEC date
      const { error: upErr } = await supabase
        .from("transactions")
        .update({ mec_date: newDate })
        .eq("id", transactionId);
      if (upErr) throw upErr;

      if (choice !== "skip") {
        const { error } = await supabase.rpc("recalc_transaction_deadlines", {
          _transaction_id: transactionId,
          _only_incomplete: choice === "incomplete",
        });
        if (error) throw error;
      }
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["transaction", transactionId] });
      qc.invalidateQueries({ queryKey: ["txn-checklist", transactionId] });
      toast.success(choice === "skip" ? "MEC updated (deadlines unchanged)" : "Deadlines recalculated");
      onOpenChange(false);
    },
    onError: (e: any) => toast.error(e.message || "Failed to update"),
  });

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>MEC date changed</DialogTitle>
          <DialogDescription>
            {oldDate ? `From ${oldDate} → ${newDate}.` : `New MEC date: ${newDate}.`} How should
            deadlines update?
          </DialogDescription>
        </DialogHeader>

        <RadioGroup value={choice} onValueChange={(v) => setChoice(v as any)} className="space-y-2 py-2">
          <div className="flex items-start gap-2 rounded-md border p-3">
            <RadioGroupItem value="incomplete" id="r1" className="mt-0.5" />
            <Label htmlFor="r1" className="flex-1 cursor-pointer">
              <p className="font-medium text-sm">Recalc only incomplete items</p>
              <p className="text-xs text-muted-foreground">Items already marked done keep their dates.</p>
            </Label>
          </div>
          <div className="flex items-start gap-2 rounded-md border p-3">
            <RadioGroupItem value="all" id="r2" className="mt-0.5" />
            <Label htmlFor="r2" className="flex-1 cursor-pointer">
              <p className="font-medium text-sm">Recalc all items</p>
              <p className="text-xs text-muted-foreground">Rewrites every deadline based on the new MEC.</p>
            </Label>
          </div>
          <div className="flex items-start gap-2 rounded-md border p-3">
            <RadioGroupItem value="skip" id="r3" className="mt-0.5" />
            <Label htmlFor="r3" className="flex-1 cursor-pointer">
              <p className="font-medium text-sm">Skip — leave dates alone</p>
              <p className="text-xs text-muted-foreground">Just update the MEC field.</p>
            </Label>
          </div>
        </RadioGroup>

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={() => apply.mutate()} disabled={apply.isPending}>
            Apply
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
