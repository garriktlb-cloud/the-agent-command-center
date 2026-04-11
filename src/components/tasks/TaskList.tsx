import { Checkbox } from "@/components/ui/checkbox";
import { cn } from "@/lib/utils";
import { format, isPast, isToday } from "date-fns";
import {
  Mail,
  Phone,
  Users,
  CheckSquare,
  FileText,
  CornerDownRight,
  MoreHorizontal,
  ChevronDown,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible";
import { useState } from "react";

export interface TaskRow {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  task_type: "todo" | "email" | "call" | "meeting" | "follow_up" | "document";
  due_date: string | null;
  parent_task_id: string | null;
  subtask_count?: number;
}

const TYPE_ICONS: Record<string, typeof Mail> = {
  email: Mail,
  call: Phone,
  meeting: Users,
  todo: CheckSquare,
  follow_up: CornerDownRight,
  document: FileText,
};

const PRIORITY_COLORS: Record<string, string> = {
  urgent: "bg-destructive",
  high: "bg-accent",
  normal: "bg-primary/60",
  low: "bg-muted-foreground/30",
};

interface TaskListProps {
  tasks: TaskRow[];
  selectedId: string | null;
  onSelect: (id: string) => void;
  onToggle: (id: string, done: boolean) => void;
  onDelete: (id: string) => void;
}

export default function TaskList({ tasks, selectedId, onSelect, onToggle, onDelete }: TaskListProps) {
  const [showCompleted, setShowCompleted] = useState(false);

  const parentTasks = tasks.filter((t) => !t.parent_task_id);
  const active = parentTasks.filter((t) => t.status !== "done");
  const completed = parentTasks.filter((t) => t.status === "done");

  const renderTask = (task: TaskRow) => {
    const Icon = TYPE_ICONS[task.task_type] || CheckSquare;
    const overdue =
      task.due_date && task.status !== "done" && isPast(new Date(task.due_date)) && !isToday(new Date(task.due_date));

    return (
      <div
        key={task.id}
        onClick={() => onSelect(task.id)}
        className={cn(
          "flex items-center gap-3 px-4 py-2.5 cursor-pointer transition-colors border-b border-border/50 group",
          selectedId === task.id ? "bg-muted/80" : "hover:bg-muted/40"
        )}
      >
        <Checkbox
          checked={task.status === "done"}
          onCheckedChange={(checked) => {
            onToggle(task.id, !!checked);
          }}
          onClick={(e) => e.stopPropagation()}
          className="h-4 w-4 shrink-0"
        />

        <Icon className="h-3.5 w-3.5 text-muted-foreground shrink-0" />

        <div className="flex-1 min-w-0">
          <span
            className={cn(
              "text-sm block truncate",
              task.status === "done" && "line-through text-muted-foreground"
            )}
          >
            {task.title}
          </span>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          {task.due_date && (
            <span
              className={cn(
                "text-xs",
                overdue ? "text-red-500 font-medium" : "text-muted-foreground"
              )}
            >
              {format(new Date(task.due_date), "MMM d")}
            </span>
          )}

          <div className={cn("h-2 w-2 rounded-full shrink-0", PRIORITY_COLORS[task.priority])} />

          <DropdownMenu>
            <DropdownMenuTrigger
              onClick={(e) => e.stopPropagation()}
              className="opacity-0 group-hover:opacity-100 transition-opacity"
            >
              <MoreHorizontal className="h-4 w-4 text-muted-foreground" />
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onClick={() => onDelete(task.id)} className="text-destructive">
                Delete
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>
    );
  };

  return (
    <div className="flex-1 overflow-y-auto">
      {active.length === 0 && completed.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-muted-foreground">
          <CheckSquare className="h-10 w-10 mb-3 opacity-30" />
          <p className="text-sm">No tasks yet</p>
        </div>
      )}

      {active.map(renderTask)}

      {completed.length > 0 && (
        <Collapsible open={showCompleted} onOpenChange={setShowCompleted}>
          <CollapsibleTrigger className="flex items-center gap-2 w-full px-4 py-2.5 text-xs font-medium text-muted-foreground hover:text-foreground transition-colors border-b border-border/50">
            <ChevronDown
              className={cn("h-3.5 w-3.5 transition-transform", showCompleted && "rotate-180")}
            />
            Completed ({completed.length})
          </CollapsibleTrigger>
          <CollapsibleContent>{completed.map(renderTask)}</CollapsibleContent>
        </Collapsible>
      )}
    </div>
  );
}
