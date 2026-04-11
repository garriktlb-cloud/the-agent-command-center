import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TaskQuickAdd from "@/components/tasks/TaskQuickAdd";
import TaskList, { type TaskRow } from "@/components/tasks/TaskList";
import TaskDetail from "@/components/tasks/TaskDetail";
import TaskActionPanel from "@/components/tasks/TaskActionPanel";
import ImportFromContractDialog, { type ImportItem } from "@/components/tasks/ImportFromContractDialog";
import type { Subtask } from "@/components/tasks/SubtaskList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Filter, FileDown } from "lucide-react";
import { cn } from "@/lib/utils";

type TaskType = "todo" | "email" | "call" | "meeting" | "follow_up" | "document";
type Priority = "low" | "normal" | "high" | "urgent";
type Status = "todo" | "in_progress" | "done";

export default function Tasks() {
  const { user } = useAuth();
  const qc = useQueryClient();
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [filterType, setFilterType] = useState<string>("all");
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [importOpen, setImportOpen] = useState(false);
  const [actionTask, setActionTask] = useState<TaskRow | null>(null);

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*, listings(address), transactions(buyer_name, seller_name), contacts(name)")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

  const getRelatedLabel = (t: (typeof allTasks)[0]) => {
    if ((t as any).contacts?.name) return `Client · ${(t as any).contacts.name}`;
    if ((t as any).listings?.address) return `Deal · ${(t as any).listings.address}`;
    const tx = (t as any).transactions;
    if (tx?.buyer_name || tx?.seller_name) return `Deal · ${tx.buyer_name || tx.seller_name}`;
    return null;
  };

  const parentTasks: TaskRow[] = allTasks
    .filter((t) => !t.parent_task_id)
    .filter((t) => filterType === "all" || t.task_type === filterType)
    .filter((t) => filterPriority === "all" || t.priority === filterPriority)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status as Status,
      priority: t.priority as Priority,
      task_type: (t.task_type || "todo") as TaskType,
      due_date: t.due_date,
      parent_task_id: t.parent_task_id,
      related_label: getRelatedLabel(t),
      transaction_id: t.transaction_id,
      handled_by: (t as any).handled_by || null,
    }));

  const selectedTask = allTasks.find((t) => t.id === selectedId);
  const subtasks: Subtask[] = allTasks
    .filter((t) => t.parent_task_id === selectedId)
    .map((t) => ({
      id: t.id,
      title: t.title,
      status: t.status as Status,
    }));

  const createMutation = useMutation({
    mutationFn: async (data: {
      title: string;
      description?: string;
      due_date?: string;
      priority?: Priority;
      task_type?: TaskType;
      parent_task_id?: string;
      listing_id?: string | null;
      transaction_id?: string | null;
      contact_id?: string | null;
    }) => {
      if (!user) throw new Error("Not authenticated");
      const { error } = await supabase.from("tasks").insert({
        title: data.title,
        description: data.description || null,
        due_date: data.due_date || null,
        priority: data.priority || "normal",
        user_id: user.id,
        parent_task_id: data.parent_task_id || null,
        task_type: data.task_type || "todo",
        listing_id: data.listing_id || null,
        transaction_id: data.transaction_id || null,
        contact_id: data.contact_id || null,
      });
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: () => toast.error("Failed to create task"),
  });

  const updateMutation = useMutation({
    mutationFn: async ({ id, field, value }: { id: string; field: string; value: unknown }) => {
      const updates: Record<string, unknown> = { [field]: value };
      if (field === "status" && value === "done") {
        updates.completed_at = new Date().toISOString();
      } else if (field === "status" && value !== "done") {
        updates.completed_at = null;
      }
      const { error } = await supabase.from("tasks").update(updates as any).eq("id", id);
      if (error) throw error;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["tasks"] }),
    onError: () => toast.error("Failed to update task"),
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: string) => {
      const { error } = await supabase.from("tasks").delete().eq("id", id);
      if (error) throw error;
    },
    onSuccess: (_, id) => {
      if (selectedId === id) setSelectedId(null);
      qc.invalidateQueries({ queryKey: ["tasks"] });
    },
    onError: () => toast.error("Failed to delete task"),
  });

  const handleToggle = (id: string, done: boolean) => {
    updateMutation.mutate({ id, field: "status", value: done ? "done" : "todo" });
  };

  const handleUpdate = (field: string, value: unknown) => {
    if (!selectedId) return;
    updateMutation.mutate({ id: selectedId, field, value });
  };

  const handleImport = async (items: ImportItem[]) => {
    if (!user) return;
    try {
      const rows = items.map((item) => ({
        title: item.title,
        description: item.description,
        transaction_id: item.transaction_id,
        listing_id: item.listing_id,
        user_id: user.id,
        task_type: "todo" as const,
        priority: "normal" as const,
      }));
      const { error } = await supabase.from("tasks").insert(rows);
      if (error) throw error;
      qc.invalidateQueries({ queryKey: ["tasks"] });
      toast.success(`Imported ${items.length} tasks from contract`);
    } catch {
      toast.error("Failed to import tasks");
    }
  };

  const handleActionBookDirectly = () => {
    if (!actionTask) return;
    updateMutation.mutate({ id: actionTask.id, field: "handled_by", value: "self" });
    toast.success("You're handling this one.");
    setActionTask(null);
  };

  const handleActionWeHandleIt = () => {
    if (!actionTask) return;
    updateMutation.mutate({ id: actionTask.id, field: "handled_by", value: "listbar" });
    toast.success("The List Bar will handle this for you!");
    setActionTask(null);
  };

  const handleActionMarkComplete = () => {
    if (!actionTask) return;
    handleToggle(actionTask.id, actionTask.status !== "done");
    setActionTask(null);
  };

  // Detail panel action handlers (for currently selected task)
  const handleDetailBookDirectly = () => {
    if (!selectedId) return;
    updateMutation.mutate({ id: selectedId, field: "handled_by", value: "self" });
    toast.success("You're handling this one.");
  };

  const handleDetailWeHandleIt = () => {
    if (!selectedId) return;
    updateMutation.mutate({ id: selectedId, field: "handled_by", value: "listbar" });
    toast.success("The List Bar will handle this for you!");
  };

  const handleDetailMarkComplete = () => {
    if (!selectedId || !selectedTask) return;
    handleToggle(selectedId, selectedTask.status !== "done");
  };

  const detailOpen = !!selectedTask;

  return (
    <div className="animate-fade-in h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-heading font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            className="h-7 text-xs"
            onClick={() => setImportOpen(true)}
          >
            <FileDown className="h-3 w-3 mr-1" />
            Import from Contract
          </Button>
          <Filter className="h-3.5 w-3.5 text-muted-foreground" />
          <Select value={filterType} onValueChange={setFilterType}>
            <SelectTrigger className="h-7 w-auto text-xs border-dashed">
              <SelectValue placeholder="Type" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Types</SelectItem>
              <SelectItem value="todo" className="text-xs">To Do</SelectItem>
              <SelectItem value="email" className="text-xs">Email</SelectItem>
              <SelectItem value="call" className="text-xs">Call</SelectItem>
              <SelectItem value="meeting" className="text-xs">Meeting</SelectItem>
              <SelectItem value="follow_up" className="text-xs">Follow Up</SelectItem>
              <SelectItem value="document" className="text-xs">Document</SelectItem>
            </SelectContent>
          </Select>
          <Select value={filterPriority} onValueChange={setFilterPriority}>
            <SelectTrigger className="h-7 w-auto text-xs border-dashed">
              <SelectValue placeholder="Priority" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all" className="text-xs">All Priorities</SelectItem>
              <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
              <SelectItem value="high" className="text-xs">High</SelectItem>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      <div className="flex h-[calc(100%-3.25rem)]">
        <div className={cn(
          "flex flex-col border-r border-border transition-all duration-200",
          detailOpen ? "flex-1 min-w-0" : "w-full"
        )}>
          <TaskQuickAdd onAdd={(task) => createMutation.mutate(task)} />
          {isLoading ? (
            <div className="flex items-center justify-center py-16 text-sm text-muted-foreground">
              Loading…
            </div>
          ) : (
            <TaskList
              tasks={parentTasks}
              selectedId={selectedId}
              onSelect={setSelectedId}
              onToggle={handleToggle}
              onDelete={(id) => deleteMutation.mutate(id)}
              onAction={setActionTask}
            />
          )}
        </div>

        {detailOpen && (
          <div className="hidden md:flex w-[380px] shrink-0">
            <div className="w-full overflow-y-auto">
              <TaskDetail
                task={{
                  id: selectedTask!.id,
                  title: selectedTask!.title,
                  description: selectedTask!.description,
                  status: selectedTask!.status as Status,
                  priority: selectedTask!.priority as Priority,
                  task_type: (selectedTask!.task_type || "todo") as string,
                  due_date: selectedTask!.due_date,
                  listing_id: selectedTask!.listing_id,
                  transaction_id: selectedTask!.transaction_id,
                  contact_id: selectedTask!.contact_id,
                  handled_by: (selectedTask as any)?.handled_by || null,
                }}
                subtasks={subtasks}
                onUpdate={handleUpdate}
                onClose={() => setSelectedId(null)}
                onSubtaskToggle={handleToggle}
                onSubtaskAdd={(title) =>
                  createMutation.mutate({ title, parent_task_id: selectedId! })
                }
                onSubtaskDelete={(id) => deleteMutation.mutate(id)}
                onBookDirectly={selectedTask?.transaction_id ? handleDetailBookDirectly : undefined}
                onWeHandleIt={selectedTask?.transaction_id ? handleDetailWeHandleIt : undefined}
                onMarkComplete={selectedTask?.transaction_id ? handleDetailMarkComplete : undefined}
              />
            </div>
          </div>
        )}
      </div>

      <ImportFromContractDialog
        open={importOpen}
        onOpenChange={setImportOpen}
        onImport={handleImport}
      />

      <TaskActionPanel
        open={!!actionTask}
        title={actionTask?.title || ""}
        onClose={() => setActionTask(null)}
        onBookDirectly={handleActionBookDirectly}
        onWeHandleIt={handleActionWeHandleIt}
        onMarkComplete={handleActionMarkComplete}
      />
    </div>
  );
}
