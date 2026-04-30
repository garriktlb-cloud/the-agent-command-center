import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { User, Building2, Briefcase, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";
import { toast } from "sonner";
import type { Tables } from "@/integrations/supabase/types";

type Vendor = Tables<"vendors">;

export type AssigneeValue = {
  assignee_type: "self" | "listbar" | "vendor" | null;
  vendor_id: string | null;
};

interface AssigneePopoverProps {
  value: AssigneeValue;
  vendor?: Vendor | null;
  onChange: (next: AssigneeValue) => void;
}

export function AssigneePopover({ value, vendor, onChange }: AssigneePopoverProps) {
  const { user } = useAuth();
  const queryClient = useQueryClient();
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [addingVendor, setAddingVendor] = useState(false);
  const [newVendorName, setNewVendorName] = useState("");
  const [newVendorCategory, setNewVendorCategory] = useState("");

  const { data: vendors = [] } = useQuery({
    queryKey: ["vendors", user?.id],
    queryFn: async () => {
      const { data, error } = await supabase.from("vendors").select("*").order("name");
      if (error) throw error;
      return data as Vendor[];
    },
    enabled: !!user && open,
  });

  const filtered = vendors.filter((v) =>
    v.name.toLowerCase().includes(search.toLowerCase()) ||
    (v.category || "").toLowerCase().includes(search.toLowerCase())
  );

  const grouped: Record<string, Vendor[]> = {};
  filtered.forEach((v) => {
    const key = v.category || "Other";
    if (!grouped[key]) grouped[key] = [];
    grouped[key].push(v);
  });

  const pick = (next: AssigneeValue) => {
    onChange(next);
    setOpen(false);
  };

  const handleAddVendor = async () => {
    if (!newVendorName.trim() || !user) return;
    const { data, error } = await supabase
      .from("vendors")
      .insert({
        user_id: user.id,
        name: newVendorName.trim(),
        category: newVendorCategory.trim() || null,
      })
      .select()
      .single();
    if (error) {
      toast.error("Failed to add vendor");
      return;
    }
    queryClient.invalidateQueries({ queryKey: ["vendors"] });
    setAddingVendor(false);
    setNewVendorName("");
    setNewVendorCategory("");
    pick({ assignee_type: "vendor", vendor_id: data.id });
  };

  // Display label for the chip
  const renderChip = () => {
    if (value.assignee_type === "self") {
      return (
        <>
          <User className="h-3 w-3" />
          <span>Me</span>
        </>
      );
    }
    if (value.assignee_type === "listbar") {
      return (
        <>
          <Building2 className="h-3 w-3" />
          <span>List Bar</span>
        </>
      );
    }
    if (value.assignee_type === "vendor" && vendor) {
      return (
        <>
          <Briefcase className="h-3 w-3" />
          <span className="truncate max-w-[110px]">{vendor.name}</span>
        </>
      );
    }
    return (
      <>
        <Plus className="h-3 w-3" />
        <span>Assign</span>
      </>
    );
  };

  const isAssigned = !!value.assignee_type;

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
            isAssigned
              ? "bg-foreground/5 border-foreground/15 text-foreground hover:bg-foreground/10"
              : "border-dashed border-muted-foreground/30 text-muted-foreground/60 hover:text-foreground hover:border-foreground/30"
          )}
        >
          {renderChip()}
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-72 p-0" align="end">
        <Tabs defaultValue={value.assignee_type === "vendor" ? "vendor" : value.assignee_type === "listbar" ? "listbar" : "self"}>
          <TabsList className="grid grid-cols-3 w-full rounded-none rounded-t-md">
            <TabsTrigger value="self" className="text-xs">Me</TabsTrigger>
            <TabsTrigger value="listbar" className="text-xs">List Bar</TabsTrigger>
            <TabsTrigger value="vendor" className="text-xs">Vendor</TabsTrigger>
          </TabsList>

          <TabsContent value="self" className="p-3 mt-0">
            <p className="text-xs text-muted-foreground mb-3">Assign this item to yourself.</p>
            <div className="flex gap-2">
              <Button size="sm" className="flex-1" onClick={() => pick({ assignee_type: "self", vendor_id: null })}>
                <User className="h-3.5 w-3.5 mr-1.5" /> Assign to me
              </Button>
              {isAssigned && (
                <Button size="sm" variant="ghost" onClick={() => pick({ assignee_type: null, vendor_id: null })} title="Clear">
                  <X className="h-3.5 w-3.5" />
                </Button>
              )}
            </div>
          </TabsContent>

          <TabsContent value="listbar" className="p-3 mt-0">
            <p className="text-xs text-muted-foreground mb-3">
              Hand this off to the List Bar TC team.
            </p>
            <Button size="sm" className="w-full" onClick={() => pick({ assignee_type: "listbar", vendor_id: null })}>
              <Building2 className="h-3.5 w-3.5 mr-1.5" /> Assign to List Bar
            </Button>
          </TabsContent>

          <TabsContent value="vendor" className="p-0 mt-0">
            {addingVendor ? (
              <div className="p-3 space-y-2">
                <Input
                  placeholder="Vendor name"
                  value={newVendorName}
                  onChange={(e) => setNewVendorName(e.target.value)}
                  className="h-8 text-xs"
                  autoFocus
                />
                <Input
                  placeholder="Category (e.g. Photographer)"
                  value={newVendorCategory}
                  onChange={(e) => setNewVendorCategory(e.target.value)}
                  className="h-8 text-xs"
                />
                <div className="flex gap-2">
                  <Button size="sm" className="flex-1 h-8" onClick={handleAddVendor} disabled={!newVendorName.trim()}>
                    Add & Assign
                  </Button>
                  <Button size="sm" variant="ghost" className="h-8" onClick={() => setAddingVendor(false)}>
                    Cancel
                  </Button>
                </div>
              </div>
            ) : (
              <>
                <div className="p-2 border-b">
                  <Input
                    placeholder="Search vendors…"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="h-8 text-xs"
                  />
                </div>
                <div className="max-h-56 overflow-y-auto">
                  {Object.keys(grouped).length === 0 ? (
                    <p className="text-xs text-muted-foreground text-center py-6 px-3">
                      {vendors.length === 0 ? "No vendors yet." : "No matches."}
                    </p>
                  ) : (
                    Object.entries(grouped).map(([category, list]) => (
                      <div key={category} className="py-1">
                        <p className="px-3 py-1 text-[10px] uppercase tracking-wider text-muted-foreground">
                          {category}
                        </p>
                        {list.map((v) => (
                          <button
                            key={v.id}
                            type="button"
                            className={cn(
                              "w-full text-left px-3 py-1.5 text-xs hover:bg-foreground/5 transition-colors",
                              value.vendor_id === v.id && "bg-foreground/5 font-medium"
                            )}
                            onClick={() => pick({ assignee_type: "vendor", vendor_id: v.id })}
                          >
                            {v.name}
                            {v.company && <span className="text-muted-foreground"> · {v.company}</span>}
                          </button>
                        ))}
                      </div>
                    ))
                  )}
                </div>
                <div className="border-t p-2">
                  <Button
                    size="sm"
                    variant="ghost"
                    className="w-full h-8 text-xs justify-start"
                    onClick={() => setAddingVendor(true)}
                  >
                    <Plus className="h-3.5 w-3.5 mr-1.5" /> Add new vendor
                  </Button>
                </div>
              </>
            )}
          </TabsContent>
        </Tabs>
      </PopoverContent>
    </Popover>
  );
}
