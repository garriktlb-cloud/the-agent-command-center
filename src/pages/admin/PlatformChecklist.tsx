import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChecklistTemplateEditor } from "@/components/listings/ChecklistTemplateEditor";
import type { Tables } from "@/integrations/supabase/types";

type Template = Tables<"checklist_templates">;
type Type = "listing" | "transaction";

export default function PlatformChecklist() {
  const { roles, loading } = useAuth();
  const [tab, setTab] = useState<Type>("listing");

  const { data: templates = [] } = useQuery({
    queryKey: ["platform_templates_admin"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .is("user_id", null)
        .order("created_at");
      if (error) throw error;
      return data as Template[];
    },
  });

  if (loading) return null;
  if (!roles.includes("admin")) return <Navigate to="/" replace />;

  const current = templates.find((t) => (t.template_type ?? "listing") === tab);

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Admin</p>
        <h1 className="font-heading text-2xl font-bold">Platform Checklists</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          Default starting points every agent gets.
        </p>
      </div>

      <Tabs value={tab} onValueChange={(v) => setTab(v as Type)}>
        <TabsList>
          <TabsTrigger value="listing">Listings</TabsTrigger>
          <TabsTrigger value="transaction">Transaction (CO)</TabsTrigger>
        </TabsList>

        <TabsContent value={tab} className="mt-6">
          {!current ? (
            <p className="text-sm text-muted-foreground">No platform template found for this category.</p>
          ) : (
            <>
              <p className="text-sm text-muted-foreground mb-4">
                <span className="font-medium text-foreground">{current.name}</span>
                {tab === "transaction" && " — applied automatically when agents create a new Colorado transaction."}
              </p>
              <ChecklistTemplateEditor templateId={current.id} canEdit={true} />
            </>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
