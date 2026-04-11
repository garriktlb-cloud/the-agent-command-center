import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  CalendarIcon,
  X,
  Mail,
  Phone,
  Users,
  CheckSquare,
  FileText,
  CornerDownRight,
  Flag,
  MoreHorizontal,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import SubtaskList, { type Subtask } from "./SubtaskList";
import RelatedToPicker from "./RelatedToPicker";

const TYPE_OPTIONS = [
  { value: "todo", label: "To Do", icon: CheckSquare },
  { value: "email", label: "Email", icon: Mail },
  { value: "call", label: "Call", icon: Phone },
  { value: "meeting", label: "Meeting", icon: Users },
  { value: "follow_up", label: "Follow Up", icon: CornerDownRight },
  { value: "document", label: "Document", icon: FileText },
] as const;

const PRIORITY_OPTIONS = [
  { value: "urgent", label: "Urgent", color: "text-red-500", bg: "bg-red-500/15 ring-1 ring-red-500/30" },
  { value: "high", label: "High", color: "text-orange-500", bg: "bg-orange-500/15 ring-1 ring-orange-500/30" },
  { value: "normal", label: "Medium", color: "text-blue-500", bg: "bg-blue-500/15 ring-1 ring-blue-500/30" },
  { value: "low", label: "Low", color: "text-muted-foreground", bg: "bg-muted ring-1 ring-border" },
] as const;

interface TaskDetailData {
  id: string;
  title: string;
  description: string | null;
  status: "todo" | "in_progress" | "done";
  priority: "low" | "normal" | "high" | "urgent";
  task_type: string;
  due_date: string | null;
  listing_id: string | null;
  transaction_id: string | null;
  contact_id: string | null;
  handled_by: string | null;
}

interface TaskDetailProps {
  task: TaskDetailData;
  subtasks: Subtask[];
  onUpdate: (field: string, value: unknown) => void;
  onClose: () => void;
  onSubtaskToggle: (id: string, done: boolean) => void;
  onSubtaskAdd: (title: string) => void;
  onSubtaskDelete: (id: string) => void;
  onBookDirectly?: () => void;
  onWeHandleIt?: () => void;
  onMarkComplete?: () => void;
}

export default function TaskDetail({
  task,
  subtasks,
  onUpdate,
  onClose,
  onSubtaskToggle,
  onSubtaskAdd,
  onSubtaskDelete,
  onBookDirectly,
  onWeHandleIt,
  onMarkComplete,
}: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
  }, [task.id, task.title, task.description]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) onUpdate("title", title.trim());
  };

  const handleDescBlur = () => {
    if (description !== (task.description || "")) onUpdate("description", description || null);
  };

  const currentPriority = PRIORITY_OPTIONS.find((p) => p.value === task.priority);

  return (
    <div className="flex flex-col h-full bg-muted/20">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-border">
        <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
          Task Detail
        </span>
        <div className="flex items-center gap-1">
          <button className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
            <MoreHorizontal className="h-4 w-4" />
          </button>
          <button onClick={onClose} className="text-muted-foreground hover:text-foreground p-1 rounded transition-colors">
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="border-0 shadow-none focus-visible:ring-0 px-0 text-base font-semibold h-auto bg-transparent"
        />

        {/* Task Setup Card */}
        <div className="rounded-lg border border-border bg-background p-3 space-y-0">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">
            Task Setup
          </span>

          {/* Linked to */}
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-xs text-muted-foreground">Linked to</span>
            <RelatedToPicker
              listingId={task.listing_id}
              transactionId={task.transaction_id}
              contactId={task.contact_id}
              onChange={(field, value) => onUpdate(field, value)}
            />
          </div>

          {/* Task type */}
          <div className="flex items-center justify-between py-2 border-b border-border/50">
            <span className="text-xs text-muted-foreground">Task type</span>
            <Select value={task.task_type} onValueChange={(v) => onUpdate("task_type", v)}>
              <SelectTrigger className="h-auto w-auto px-0 border-0 shadow-none text-xs font-medium gap-1 bg-transparent">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TYPE_OPTIONS.map((opt) => (
                  <SelectItem key={opt.value} value={opt.value} className="text-xs">
                    {opt.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Due date */}
          <div className="flex items-center justify-between py-2">
            <span className="text-xs text-muted-foreground">Due date</span>
            <Popover>
              <PopoverTrigger asChild>
                <button className="text-xs font-medium hover:text-foreground transition-colors">
                  {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "Set date"}
                </button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="end">
                <Calendar
                  mode="single"
                  selected={task.due_date ? new Date(task.due_date) : undefined}
                  onSelect={(date) => onUpdate("due_date", date ? format(date, "yyyy-MM-dd") : null)}
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>

        {/* Priority Card */}
        <div className="rounded-lg border border-border bg-background p-3 space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest">
              Priority
            </span>
            <span className={cn("text-xs font-medium", currentPriority?.color)}>
              {currentPriority?.label}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {PRIORITY_OPTIONS.map((p) => (
              <button
                key={p.value}
                onClick={() => onUpdate("priority", p.value)}
                className={cn(
                  "p-1.5 rounded-md transition-all",
                  task.priority === p.value ? p.bg : "hover:bg-muted"
                )}
              >
                <Flag className={cn("h-3.5 w-3.5", p.color)} />
              </button>
            ))}
          </div>
        </div>

        {/* Notes Card */}
        <div className="rounded-lg border border-border bg-background p-3 space-y-1">
          <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
            Notes
          </span>
          <Textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            onBlur={handleDescBlur}
            placeholder="Add notes…"
            className="border-0 shadow-none focus-visible:ring-0 px-0 resize-none min-h-[48px] text-xs bg-transparent"
          />
        </div>

        {/* Subtasks */}
        <div className="rounded-lg border border-border bg-background p-3">
          <SubtaskList
            subtasks={subtasks}
            onToggle={onSubtaskToggle}
            onAdd={onSubtaskAdd}
            onDelete={onSubtaskDelete}
          />
        </div>

        {/* Action Buttons — only for transaction-linked tasks */}
        {task.transaction_id && onBookDirectly && onWeHandleIt && onMarkComplete && (
          <div className="rounded-lg border border-border bg-background p-3 space-y-2">
            <span className="text-[10px] font-semibold text-muted-foreground uppercase tracking-widest block">
              Actions
            </span>
            {task.handled_by && (
              <p className="text-xs text-muted-foreground">
                Handled by: <span className="font-medium text-foreground">{task.handled_by === "listbar" ? "List Bar" : "You"}</span>
              </p>
            )}
            <div className="flex gap-2">
              <Button variant="outline" size="sm" className="flex-1 text-xs" onClick={onBookDirectly}>
                Book Directly
              </Button>
              <Button size="sm" className="flex-1 text-xs" onClick={onWeHandleIt}>
                We'll handle it
              </Button>
            </div>
            <Button variant="ghost" size="sm" className="w-full text-xs" onClick={onMarkComplete}>
              <CheckSquare className="h-3 w-3 mr-1" /> Mark complete
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
