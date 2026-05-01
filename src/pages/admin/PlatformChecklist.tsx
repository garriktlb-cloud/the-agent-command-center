import { useQuery } from "@tanstack/react-query";
import { Navigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { ChecklistTemplateEditor } from "@/components/listings/ChecklistTemplateEditor";
import type { Tables } from "@/integrations/supabase/types";

type Template = Tables<"checklist_templates">;

export default function PlatformChecklist() {
  const { roles, loading } = useAuth();

  const { data: platformTemplate } = useQuery({
    queryKey: ["platform_template_default"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("checklist_templates")
        .select("*")
        .is("user_id", null)
        .order("created_at")
        .limit(1)
        .single();
      if (error) throw error;
      return data as Template;
    },
  });

  if (loading) return null;
  if (!roles.includes("admin")) {
    return <Navigate to="/" replace />;
  }

  if (!platformTemplate) {
    return <p className="text-sm text-muted-foreground">No platform template found.</p>;
  }

  return (
    <div className="animate-fade-in max-w-4xl">
      <div className="mb-6">
        <p className="text-xs font-semibold uppercase tracking-widest text-accent mb-1">Admin</p>
        <h1 className="font-heading text-2xl font-bold">Platform Checklist</h1>
        <p className="text-sm text-muted-foreground mt-0.5">
          {platformTemplate.name} — the default starting point every agent gets.
        </p>
      </div>
      <ChecklistTemplateEditor templateId={platformTemplate.id} canEdit={true} />
    </div>
  );
}
