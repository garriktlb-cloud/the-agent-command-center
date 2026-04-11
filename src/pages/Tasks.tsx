import { useState } from "react";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { toast } from "sonner";
import TaskQuickAdd from "@/components/tasks/TaskQuickAdd";
import TaskList, { type TaskRow } from "@/components/tasks/TaskList";
import TaskDetail from "@/components/tasks/TaskDetail";
import type { Subtask } from "@/components/tasks/SubtaskList";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Filter, X } from "lucide-react";
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

  const { data: allTasks = [], isLoading } = useQuery({
    queryKey: ["tasks"],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("tasks")
        .select("*")
        .order("created_at", { ascending: false });
      if (error) throw error;
      return data;
    },
  });

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

  const detailOpen = !!selectedTask;

  return (
    <div className="animate-fade-in h-[calc(100vh-4rem)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <h1 className="text-xl font-heading font-bold">Tasks</h1>
        <div className="flex items-center gap-2">
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
        {/* Task list — full width when no detail, shrinks when detail open */}
        <div className={cn(
          "flex flex-col border-r border-border transition-all duration-200",
          detailOpen ? "w-full md:w-[420px]" : "w-full"
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
            />
          )}
        </div>

        {/* Detail panel — only renders when a task is selected */}
        {detailOpen && (
          <div className="hidden md:flex flex-1 max-w-md border-l border-border">
            <div className="w-full">
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
                }}
                subtasks={subtasks}
                onUpdate={handleUpdate}
                onClose={() => setSelectedId(null)}
                onSubtaskToggle={handleToggle}
                onSubtaskAdd={(title) =>
                  createMutation.mutate({ title, parent_task_id: selectedId! })
                }
                onSubtaskDelete={(id) => deleteMutation.mutate(id)}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
