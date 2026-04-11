import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, FileDown, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface ImportFromContractDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onImport: (items: ImportItem[]) => void;
}

export interface ImportItem {
  title: string;
  description: string;
  transaction_id: string;
  listing_id: string | null;
}

export default function ImportFromContractDialog({
  open,
  onOpenChange,
  onImport,
}: ImportFromContractDialogProps) {
  const [selectedTxnId, setSelectedTxnId] = useState<string | null>(null);
  const [selectedItems, setSelectedItems] = useState<Set<string>>(new Set());

  const { data: transactions = [] } = useQuery({
    queryKey: ["transactions-for-import"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transactions")
        .select("id, buyer_name, seller_name, stage, listing_id, listing:listings(address)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data as {
        id: string;
        buyer_name: string | null;
        seller_name: string | null;
        stage: string;
        listing_id: string | null;
        listing: { address: string } | null;
      }[];
    },
    enabled: open,
  });

  const { data: checklistItems = [] } = useQuery({
    queryKey: ["txn-checklist-import", selectedTxnId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("transaction_checklist_items")
        .select("*")
        .eq("transaction_id", selectedTxnId!)
        .eq("done", false)
        .order("sort_order", { ascending: true });
      if (error) throw error;
      return data;
    },
    enabled: !!selectedTxnId,
  });

  const selectedTxn = transactions.find((t) => t.id === selectedTxnId);

  // Group by section
  const sections = new Map<string, typeof checklistItems>();
  checklistItems.forEach((item) => {
    const arr = sections.get(item.section) || [];
    arr.push(item);
    sections.set(item.section, arr);
  });

  const toggleItem = (id: string) => {
    setSelectedItems((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selectedItems.size === checklistItems.length) {
      setSelectedItems(new Set());
    } else {
      setSelectedItems(new Set(checklistItems.map((i) => i.id)));
    }
  };

  const handleImport = () => {
    if (!selectedTxn) return;
    const items: ImportItem[] = checklistItems
      .filter((i) => selectedItems.has(i.id))
      .map((i) => ({
        title: i.label,
        description: i.section,
        transaction_id: selectedTxn.id,
        listing_id: selectedTxn.listing_id,
      }));
    onImport(items);
    handleClose();
  };

  const handleClose = () => {
    setSelectedTxnId(null);
    setSelectedItems(new Set());
    onOpenChange(false);
  };

  const handleSelectTxn = (id: string) => {
    setSelectedTxnId(id);
    setSelectedItems(new Set());
  };

  return (
    <Dialog open={open} onOpenChange={handleClose}>
      <DialogContent className="sm:max-w-md max-h-[80vh] flex flex-col">
        <DialogHeader>
          {selectedTxnId ? (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setSelectedTxnId(null)}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                <ArrowLeft className="h-4 w-4" />
              </button>
              <div>
                <DialogTitle className="text-base">
                  {selectedTxn?.listing?.address || selectedTxn?.buyer_name || "Contract"}
                </DialogTitle>
                <p className="text-xs text-muted-foreground mt-0.5">
                  Select items to import as tasks
                </p>
              </div>
            </div>
          ) : (
            <>
              <DialogTitle className="text-base">Import from Contract</DialogTitle>
              <p className="text-xs text-muted-foreground">
                Choose a transaction to import checklist items as tasks.
              </p>
            </>
          )}
        </DialogHeader>

        <div className="flex-1 overflow-y-auto -mx-6 px-6">
          {!selectedTxnId ? (
            <div className="space-y-1">
              {transactions.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No transactions found.
                </p>
              )}
              {transactions.map((txn) => (
                <button
                  key={txn.id}
                  onClick={() => handleSelectTxn(txn.id)}
                  className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors flex items-center gap-3"
                >
                  <Home className="h-4 w-4 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">
                      {txn.listing?.address || txn.buyer_name || txn.seller_name || "Untitled"}
                    </p>
                    <p className="text-xs text-muted-foreground capitalize">
                      {txn.stage.replace(/_/g, " ")}
                      {txn.buyer_name && ` · ${txn.buyer_name}`}
                    </p>
                  </div>
                  <Badge variant="outline" className="text-[10px] shrink-0">
                    {txn.stage.replace(/_/g, " ")}
                  </Badge>
                </button>
              ))}
            </div>
          ) : (
            <div className="space-y-3">
              {checklistItems.length === 0 ? (
                <p className="text-sm text-muted-foreground text-center py-8">
                  No pending checklist items.
                </p>
              ) : (
                <>
                  <div className="flex items-center justify-between">
                    <button
                      onClick={toggleAll}
                      className="text-xs text-primary hover:underline"
                    >
                      {selectedItems.size === checklistItems.length
                        ? "Deselect all"
                        : "Select all"}
                    </button>
                    <span className="text-xs text-muted-foreground">
                      {selectedItems.size} selected
                    </span>
                  </div>

                  {Array.from(sections.entries()).map(([section, items]) => (
                    <div key={section}>
                      <p className="text-[10px] uppercase tracking-wider text-muted-foreground font-semibold mb-1">
                        {section}
                      </p>
                      {items.map((item) => (
                        <label
                          key={item.id}
                          className={cn(
                            "flex items-center gap-3 py-2 px-2 rounded-md cursor-pointer hover:bg-muted/50 transition-colors",
                            selectedItems.has(item.id) && "bg-muted/30"
                          )}
                        >
                          <Checkbox
                            checked={selectedItems.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                            className="h-4 w-4"
                          />
                          <span className="text-sm">{item.label}</span>
                        </label>
                      ))}
                    </div>
                  ))}
                </>
              )}
            </div>
          )}
        </div>

        {selectedTxnId && selectedItems.size > 0 && (
          <div className="pt-3 border-t">
            <Button className="w-full" size="sm" onClick={handleImport}>
              <FileDown className="h-3.5 w-3.5 mr-1.5" />
              Import {selectedItems.size} item{selectedItems.size !== 1 ? "s" : ""} as tasks
            </Button>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
