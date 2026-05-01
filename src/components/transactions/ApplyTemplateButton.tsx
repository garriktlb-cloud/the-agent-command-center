import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Plus, FileText, Star, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface Props {
  transactionId: string;
  hasMecDate: boolean;
  variant?: "default" | "outline" | "ghost";
  size?: "default" | "sm";
  label?: string;
}

interface Template {
  id: string;
  name: string;
  is_default: boolean;
  user_id: string | null;
}

export function ApplyTemplateButton({
  transactionId,
  hasMecDate,
  variant = "outline",
  size = "sm",
  label = "Apply template",
}: Props) {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [open, setOpen] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["apply_txn_templates", user?.id],
    queryFn: async () => {
      const platformRes = await supabase
        .from("checklist_templates")
        .select("id, name, is_default, user_id")
        .is("user_id", null)
        .eq("template_type", "transaction")
        .order("name");

      const mineRes = user
        ? await supabase
            .from("checklist_templates")
            .select("id, name, is_default, user_id")
            .eq("user_id", user.id)
            .eq("template_type", "transaction")
            .order("is_default", { ascending: false })
            .order("name")
        : { data: [] as Template[] };

      return {
        platform: (platformRes.data ?? []) as Template[],
        mine: (mineRes.data ?? []) as Template[],
      };
    },
    enabled: !!user && open,
  });

  const apply = useMutation({
    mutationFn: async (templateId: string) => {
      const { data, error } = await supabase.rpc("apply_transaction_template", {
        _template_id: templateId,
        _transaction_id: transactionId,
      });
      if (error) throw error;
      return data as number;
    },
    onSuccess: (count) => {
      qc.invalidateQueries({ queryKey: ["txn-checklist", transactionId] });
      if (count === 0) {
        toast.info("No new items added — template already applied");
      } else {
        toast.success(`Added ${count} item${count === 1 ? "" : "s"}`);
        if (!hasMecDate) {
          toast.warning("Set the MEC date to auto-calculate deadlines");
        }
      }
    },
    onError: (e: any) => toast.error(e.message || "Failed to apply template"),
  });

  const platform = data?.platform ?? [];
  const mine = data?.mine ?? [];

  return (
    <DropdownMenu open={open} onOpenChange={setOpen}>
      <DropdownMenuTrigger asChild>
        <Button variant={variant} size={size} className="text-xs">
          <Plus className="h-3.5 w-3.5 mr-1.5" />
          {label}
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" className="w-64">
        {isLoading ? (
          <div className="flex items-center justify-center py-4">
            <Loader2 className="h-4 w-4 animate-spin text-muted-foreground" />
          </div>
        ) : (
          <>
            {platform.length > 0 && (
              <>
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  Platform
                </DropdownMenuLabel>
                {platform.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => apply.mutate(t.id)}
                    disabled={apply.isPending}
                  >
                    <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {mine.length > 0 && (
              <>
                {platform.length > 0 && <DropdownMenuSeparator />}
                <DropdownMenuLabel className="text-[10px] uppercase tracking-wider text-muted-foreground">
                  My add-ons
                </DropdownMenuLabel>
                {mine.map((t) => (
                  <DropdownMenuItem
                    key={t.id}
                    onClick={() => apply.mutate(t.id)}
                    disabled={apply.isPending}
                  >
                    {t.is_default ? (
                      <Star className="h-4 w-4 mr-2 fill-primary text-primary" />
                    ) : (
                      <FileText className="h-4 w-4 mr-2 text-muted-foreground" />
                    )}
                    {t.name}
                  </DropdownMenuItem>
                ))}
              </>
            )}
            {platform.length === 0 && mine.length === 0 && (
              <div className="px-2 py-3 text-xs text-muted-foreground text-center">
                No templates available.
              </div>
            )}
          </>
        )}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}
