import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus, Star, Trash2, Copy, ArrowLeft } from "lucide-react";
import { ChecklistTemplateEditor } from "@/components/listings/ChecklistTemplateEditor";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Template = Tables<"checklist_templates">;

export default function ChecklistTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [cloneFrom, setCloneFrom] = useState<string>("blank");

  const { data: myTemplates = [] } = useQuery({
    queryKey: ["my_templates", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .eq("user_id", user!.id)
        .order("created_at");
      if (error) throw error;
      return data as Template[];
    },
    enabled: !!user,
  });

  const { data: platformTemplates = [] } = useQuery({
    queryKey: ["platform_templates"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .is("user_id", null);
      if (error) throw error;
      return data as Template[];
    },
  });

  const { data: itemCounts = {} } = useQuery({
    queryKey: ["template_item_counts", user?.id],
    queryFn: async () => {
      const ids = [...myTemplates, ...platformTemplates].map((t) => t.id);
      if (ids.length === 0) return {};
      const { data, error } = await supabase
        .from("checklist_template_items")
        .select("template_id")
        .in("template_id", ids);
      if (error) throw error;
      const counts: Record<string, number> = {};
      data.forEach((r: any) => {
        counts[r.template_id] = (counts[r.template_id] || 0) + 1;
      });
      return counts;
    },
    enabled: myTemplates.length + platformTemplates.length > 0,
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      if (!user || !newName.trim()) return;
      const { data: tpl, error } = await supabase
        .from("checklist_templates")
        .insert({
          user_id: user.id,
          name: newName.trim(),
          is_default: myTemplates.length === 0,
        })
        .select("id")
        .single();
      if (error) throw error;

      // Clone items if requested
      if (cloneFrom !== "blank") {
        const { data: srcItems } = await supabase
          .from("checklist_template_items")
          .select("section, label, sort_order, assignee_type, vendor_category, due_offset_days, due_offset_anchor")
          .eq("template_id", cloneFrom);
        if (srcItems && srcItems.length > 0) {
          await supabase.from("checklist_template_items").insert(
            srcItems.map((i) => ({ ...i, template_id: tpl.id }))
          );
        }
      }
      return tpl.id;
    },
    onSuccess: (id) => {
      setCreateOpen(false);
      setNewName("");
      setCloneFrom("blank");
      queryClient.invalidateQueries({ queryKey: ["my_templates"] });
      queryClient.invalidateQueries({ queryKey: ["template_item_counts"] });
      toast.success("Template created");
      if (id) setOpenId(id);
    },
    onError: (e: any) => toast.error(e.message || "Failed to create"),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      // Clear existing default first
      await supabase
        .from("checklist_templates")
        .update({ is_default: false })
        .eq("user_id", user.id)
        .eq("is_default", true);
      const { error } = await supabase
        .from("checklist_templates")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_templates"] });
      toast.success("Default template updated");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["my_templates"] });
      toast.success("Template deleted");
    },
  });

  const openTemplate = [...myTemplates, ...platformTemplates].find((t) => t.id === openId);

  if (openTemplate) {
    const isOwn = openTemplate.user_id === user?.id;
    return (
      <div className="animate-fade-in max-w-4xl">
        <button
          onClick={() => setOpenId(null)}
          className="flex items-center gap-1.5 text-sm text-muted-foreground hover:text-foreground mb-4"
        >
          <ArrowLeft className="h-4 w-4" /> Back to templates
        </button>
        <div className="flex items-start justify-between mb-6 gap-4">
          <div>
            <h1 className="font-heading text-2xl font-bold">{openTemplate.name}</h1>
            <p className="text-sm text-muted-foreground mt-0.5">
              {isOwn ? "Your template" : "Platform template (read-only)"}
            </p>
          </div>
          {isOwn && (
            <Button
              variant={openTemplate.is_default ? "default" : "outline"}
              size="sm"
              onClick={() => !openTemplate.is_default && setDefault.mutate(openTemplate.id)}
              disabled={openTemplate.is_default}
            >
              <Star
                className={`h-4 w-4 mr-1.5 ${openTemplate.is_default ? "fill-current" : ""}`}
              />
              {openTemplate.is_default ? "Default for new listings" : "Make default"}
            </Button>
          )}
        </div>
        <ChecklistTemplateEditor templateId={openTemplate.id} canEdit={isOwn} />
      </div>
    );
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="font-heading text-2xl font-bold">Checklist Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reusable starting points applied when you create a new listing.
          </p>
        </div>
        <Dialog open={createOpen} onOpenChange={setCreateOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-1.5" /> New template
            </Button>
          </DialogTrigger>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>New checklist template</DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="e.g. Luxury Listing"
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-1.5 block">Start from</label>
                <Select value={cloneFrom} onValueChange={setCloneFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="blank">Blank template</SelectItem>
                    {platformTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        Clone: {t.name}
                      </SelectItem>
                    ))}
                    {myTemplates.map((t) => (
                      <SelectItem key={t.id} value={t.id}>
                        Clone: {t.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <DialogFooter>
              <Button onClick={() => createTemplate.mutate()} disabled={!newName.trim()}>
                Create
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* My templates */}
      <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Mine
      </h2>
      {myTemplates.length === 0 ? (
        <Card className="p-6 text-center text-sm text-muted-foreground mb-6">
          No personal templates yet. Create one to customize your defaults.
        </Card>
      ) : (
        <div className="space-y-2 mb-8">
          {myTemplates.map((t) => (
            <Card
              key={t.id}
              className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
              onClick={() => setOpenId(t.id)}
            >
              <div className="flex items-center gap-2">
                {t.is_default && (
                  <Star className="h-4 w-4 fill-primary text-primary" />
                )}
                <div>
                  <p className="font-medium">{t.name}</p>
                  <p className="text-xs text-muted-foreground">
                    {itemCounts[t.id] ?? 0} items
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                {!t.is_default && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setDefault.mutate(t.id)}
                  >
                    <Star className="h-4 w-4 mr-1" /> Make default
                  </Button>
                )}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    if (confirm(`Delete "${t.name}"?`)) deleteTemplate.mutate(t.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-muted-foreground" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Platform templates */}
      <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
        Platform
      </h2>
      <div className="space-y-2">
        {platformTemplates.map((t) => (
          <Card
            key={t.id}
            className="flex items-center justify-between p-4 hover:bg-muted/30 transition-colors cursor-pointer"
            onClick={() => setOpenId(t.id)}
          >
            <div>
              <p className="font-medium">{t.name}</p>
              <p className="text-xs text-muted-foreground">
                {itemCounts[t.id] ?? 0} items · Read-only
              </p>
            </div>
            <Button
              variant="ghost"
              size="sm"
              onClick={(e) => {
                e.stopPropagation();
                setNewName(`${t.name} (copy)`);
                setCloneFrom(t.id);
                setCreateOpen(true);
              }}
            >
              <Copy className="h-4 w-4 mr-1" /> Clone
            </Button>
          </Card>
        ))}
      </div>
    </div>
  );
}
