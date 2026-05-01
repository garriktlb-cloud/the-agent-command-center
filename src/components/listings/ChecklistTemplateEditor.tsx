import { useState, useEffect } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Trash2, Plus, GripVertical } from "lucide-react";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type TemplateItem = Tables<"checklist_template_items">;

const ASSIGNEE_OPTIONS = [
  { value: "unassigned", label: "Unassigned" },
  { value: "self", label: "Me" },
  { value: "listbar", label: "List Bar" },
  { value: "vendor", label: "Vendor" },
];

const ANCHOR_OPTIONS = [
  { value: "none", label: "No date" },
  { value: "listing_date", label: "Listing date" },
  { value: "go_live_date", label: "Go-live date" },
];

interface Props {
  templateId: string;
  canEdit: boolean;
}

export function ChecklistTemplateEditor({ templateId, canEdit }: Props) {
  const queryClient = useQueryClient();
  const [newSection, setNewSection] = useState("Custom");
  const [newLabel, setNewLabel] = useState("");

  const { data: items = [], isLoading } = useQuery({
    queryKey: ["checklist_template_items", templateId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_template_items")
        .select("*")
        .eq("template_id", templateId)
        .order("sort_order");
      if (error) throw error;
      return data as TemplateItem[];
    },
  });

  const updateItem = useMutation({
    mutationFn: async ({ id, patch }: { id: string; patch: Partial<TemplateItem> }) => {
      const { error } = await supabase
        .from("checklist_template_items")
        .update(patch)
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["checklist_template_items", templateId] }),
  });

  const addItem = useMutation({
    mutationFn: async () => {
      if (!newLabel.trim()) return;
      const maxOrder = items.reduce((m, i) => Math.max(m, i.sort_order), 0);
      const { error } = await supabase.from("checklist_template_items").insert({
        template_id: templateId,
        section: newSection || "Custom",
        label: newLabel.trim(),
        sort_order: maxOrder + 1,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      setNewLabel("");
      queryClient.invalidateQueries({ queryKey: ["checklist_template_items", templateId] });
      toast.success("Item added");
    },
    onError: (e: any) => toast.error(e.message || "Failed to add"),
  });

  const deleteItem = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist_template_items").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () =>
      queryClient.invalidateQueries({ queryKey: ["checklist_template_items", templateId] }),
  });

  // Group by section
  const sections = items.reduce<Record<string, TemplateItem[]>>((acc, item) => {
    (acc[item.section] ||= []).push(item);
    return acc;
  }, {});

  if (isLoading) {
    return <div className="text-sm text-muted-foreground">Loading…</div>;
  }

  return (
    <div className="space-y-6">
      {Object.entries(sections).map(([section, sectionItems]) => (
        <div key={section}>
          <h3 className="font-heading text-xs font-semibold uppercase tracking-widest text-muted-foreground mb-2">
            {section}
          </h3>
          <div className="space-y-1.5">
            {sectionItems.map((item) => (
              <div
                key={item.id}
                className="flex items-center gap-2 rounded-md border border-border bg-card px-3 py-2"
              >
                <GripVertical className="h-4 w-4 text-muted-foreground/50 shrink-0" />
                <Input
                  value={item.label}
                  onChange={(e) =>
                    updateItem.mutate({ id: item.id, patch: { label: e.target.value } })
                  }
                  disabled={!canEdit}
                  className="flex-1 h-8 border-0 px-1 focus-visible:ring-1"
                />
                <Select
                  value={item.assignee_type ?? "unassigned"}
                  onValueChange={(v) =>
                    updateItem.mutate({
                      id: item.id,
                      patch: { assignee_type: v === "unassigned" ? null : v },
                    })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-8 w-[110px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ASSIGNEE_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                <Input
                  type="number"
                  placeholder="±days"
                  value={item.due_offset_days ?? ""}
                  onChange={(e) => {
                    const val = e.target.value === "" ? null : parseInt(e.target.value);
                    updateItem.mutate({ id: item.id, patch: { due_offset_days: val } });
                  }}
                  disabled={!canEdit}
                  className="h-8 w-[70px] text-xs"
                />
                <Select
                  value={item.due_offset_anchor ?? "none"}
                  onValueChange={(v) =>
                    updateItem.mutate({
                      id: item.id,
                      patch: { due_offset_anchor: v === "none" ? null : v },
                    })
                  }
                  disabled={!canEdit}
                >
                  <SelectTrigger className="h-8 w-[120px] text-xs">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {ANCHOR_OPTIONS.map((o) => (
                      <SelectItem key={o.value} value={o.value}>
                        {o.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {canEdit && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 shrink-0"
                    onClick={() => deleteItem.mutate(item.id)}
                  >
                    <Trash2 className="h-3.5 w-3.5 text-muted-foreground" />
                  </Button>
                )}
              </div>
            ))}
          </div>
        </div>
      ))}

      {items.length === 0 && (
        <p className="text-sm text-muted-foreground">No items yet. Add your first below.</p>
      )}

      {canEdit && (
        <div className="flex items-center gap-2 rounded-md border border-dashed border-border bg-muted/30 p-3">
          <Input
            placeholder="Section"
            value={newSection}
            onChange={(e) => setNewSection(e.target.value)}
            className="h-9 w-[140px]"
          />
          <Input
            placeholder="New checklist item…"
            value={newLabel}
            onChange={(e) => setNewLabel(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") addItem.mutate();
            }}
            className="h-9 flex-1"
          />
          <Button onClick={() => addItem.mutate()} disabled={!newLabel.trim()} size="sm">
            <Plus className="h-4 w-4 mr-1" /> Add
          </Button>
        </div>
      )}
    </div>
  );
}
