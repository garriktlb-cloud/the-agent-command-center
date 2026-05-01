import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
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
type TemplateType = "listing" | "transaction";

export default function ChecklistTemplates() {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [openId, setOpenId] = useState<string | null>(null);
  const [createOpen, setCreateOpen] = useState(false);
  const [newName, setNewName] = useState("");
  const [cloneFrom, setCloneFrom] = useState<string>("blank");
  const [activeTab, setActiveTab] = useState<TemplateType>("listing");

  const { data: allTemplates = [] } = useQuery({
    queryKey: ["all_templates", user?.id],
    queryFn: async () => {
      const [mine, platform] = await Promise.all([
        supabase.from("checklist_templates").select("*").eq("user_id", user!.id).order("created_at"),
        supabase.from("checklist_templates").select("*").is("user_id", null),
      ]);
      if (mine.error) throw mine.error;
      if (platform.error) throw platform.error;
      return [...(mine.data as Template[]), ...(platform.data as Template[])];
    },
    enabled: !!user,
  });

  const myTemplates = allTemplates.filter(
    (t) => t.user_id === user?.id && (t.template_type ?? "listing") === activeTab
  );
  const platformTemplates = allTemplates.filter(
    (t) => t.user_id === null && (t.template_type ?? "listing") === activeTab
  );

  const { data: itemCounts = {} } = useQuery({
    queryKey: ["template_item_counts", user?.id],
    queryFn: async () => {
      const ids = allTemplates.map((t) => t.id);
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
    enabled: allTemplates.length > 0,
  });

  const createTemplate = useMutation({
    mutationFn: async () => {
      if (!user || !newName.trim()) return;
      const { data: tpl, error } = await supabase
        .from("checklist_templates")
        .insert({
          user_id: user.id,
          name: newName.trim(),
          template_type: activeTab,
          is_default: myTemplates.length === 0,
        })
        .select("id")
        .single();
      if (error) throw error;

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
      queryClient.invalidateQueries({ queryKey: ["all_templates"] });
      queryClient.invalidateQueries({ queryKey: ["template_item_counts"] });
      toast.success("Template created");
      if (id) setOpenId(id);
    },
    onError: (e: any) => toast.error(e.message || "Failed to create"),
  });

  const setDefault = useMutation({
    mutationFn: async (id: string) => {
      if (!user) return;
      // Clear default within the same template type
      const sameTypeIds = allTemplates
        .filter((t) => t.user_id === user.id && (t.template_type ?? "listing") === activeTab)
        .map((t) => t.id);
      if (sameTypeIds.length > 0) {
        await supabase
          .from("checklist_templates")
          .update({ is_default: false })
          .in("id", sameTypeIds);
      }
      const { error } = await supabase
        .from("checklist_templates")
        .update({ is_default: true })
        .eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_templates"] });
      toast.success("Default template updated");
    },
  });

  const deleteTemplate = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("checklist_templates").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["all_templates"] });
      toast.success("Template deleted");
    },
  });

  const openTemplate = allTemplates.find((t) => t.id === openId);

  if (openTemplate) {
    const isOwn = openTemplate.user_id === user?.id;
    const isTxn = (openTemplate.template_type ?? "listing") === "transaction";
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
              <Star className={`h-4 w-4 mr-1.5 ${openTemplate.is_default ? "fill-current" : ""}`} />
              {openTemplate.is_default
                ? `Default for new ${isTxn ? "transactions" : "listings"}`
                : "Make default"}
            </Button>
          )}
        </div>
        <ChecklistTemplateEditor templateId={openTemplate.id} canEdit={isOwn} />
      </div>
    );
  }

  const newEntityLabel = activeTab === "transaction" ? "transactions" : "listings";

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="font-heading text-2xl font-bold">Checklist Templates</h1>
          <p className="text-sm text-muted-foreground mt-0.5">
            Reusable starting points applied when you create a new {newEntityLabel}.
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
              <DialogTitle>
                New {activeTab === "transaction" ? "transaction add-on" : "listing"} template
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-3">
              <div>
                <label className="text-sm font-medium mb-1.5 block">Name</label>
                <Input
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder={
                    activeTab === "transaction" ? "e.g. My Closing Add-ons" : "e.g. Luxury Listing"
                  }
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

      <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as TemplateType)}>
        <TabsList>
          <TabsTrigger value="listing">Listings</TabsTrigger>
          <TabsTrigger value="transaction">Transaction add-ons</TabsTrigger>
        </TabsList>

        <TabsContent value={activeTab} className="mt-6">
          {activeTab === "transaction" && (
            <p className="text-xs text-muted-foreground mb-4 p-3 rounded-md border bg-muted/30">
              The standard Colorado contract deadlines are applied automatically to every new
              transaction. Use this section for <em>your own additions</em> like closing gifts,
              lender check-ins, or post-close follow-ups.
            </p>
          )}

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
                    {t.is_default && <Star className="h-4 w-4 fill-primary text-primary" />}
                    <div>
                      <p className="font-medium">{t.name}</p>
                      <p className="text-xs text-muted-foreground">{itemCounts[t.id] ?? 0} items</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-1" onClick={(e) => e.stopPropagation()}>
                    {!t.is_default && (
                      <Button variant="ghost" size="sm" onClick={() => setDefault.mutate(t.id)}>
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

          <h2 className="font-heading text-sm font-semibold uppercase tracking-widest text-muted-foreground mb-3">
            Platform
          </h2>
          {platformTemplates.length === 0 ? (
            <Card className="p-6 text-center text-sm text-muted-foreground">
              No platform templates for this category.
            </Card>
          ) : (
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
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
