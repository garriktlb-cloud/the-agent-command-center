import { useState, useEffect } from "react";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
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
}

interface TaskDetailProps {
  task: TaskDetailData;
  subtasks: Subtask[];
  onUpdate: (field: string, value: unknown) => void;
  onClose: () => void;
  onSubtaskToggle: (id: string, done: boolean) => void;
  onSubtaskAdd: (title: string) => void;
  onSubtaskDelete: (id: string) => void;
}

export default function TaskDetail({
  task,
  subtasks,
  onUpdate,
  onClose,
  onSubtaskToggle,
  onSubtaskAdd,
  onSubtaskDelete,
}: TaskDetailProps) {
  const [title, setTitle] = useState(task.title);
  const [description, setDescription] = useState(task.description || "");

  useEffect(() => {
    setTitle(task.title);
    setDescription(task.description || "");
  }, [task.id, task.title, task.description]);

  const handleTitleBlur = () => {
    if (title.trim() && title !== task.title) {
      onUpdate("title", title.trim());
    }
  };

  const handleDescBlur = () => {
    if (description !== (task.description || "")) {
      onUpdate("description", description || null);
    }
  };

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="flex items-center justify-between px-5 py-3 border-b border-border">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Task Details
        </span>
        <button onClick={onClose} className="text-muted-foreground hover:text-foreground transition-colors">
          <X className="h-4 w-4" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
        {/* Title */}
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="border-0 shadow-none focus-visible:ring-0 px-0 text-lg font-semibold h-auto"
        />

        {/* Description */}
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          onBlur={handleDescBlur}
          placeholder="Add a description…"
          className="border-0 shadow-none focus-visible:ring-0 px-0 resize-none min-h-[60px] text-sm"
        />

        {/* Metadata */}
        <div className="flex flex-wrap gap-2">
          {/* Task Type */}
          <Select
            value={task.task_type}
            onValueChange={(v) => onUpdate("task_type", v)}
          >
            <SelectTrigger className="h-7 w-auto text-xs gap-1.5 border-dashed">
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

          {/* Priority */}
          <Select
            value={task.priority}
            onValueChange={(v) => onUpdate("priority", v)}
          >
            <SelectTrigger className="h-7 w-auto text-xs gap-1.5 border-dashed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="low" className="text-xs">Low</SelectItem>
              <SelectItem value="normal" className="text-xs">Normal</SelectItem>
              <SelectItem value="high" className="text-xs">High</SelectItem>
              <SelectItem value="urgent" className="text-xs">Urgent</SelectItem>
            </SelectContent>
          </Select>

          {/* Status */}
          <Select
            value={task.status}
            onValueChange={(v) => onUpdate("status", v)}
          >
            <SelectTrigger className="h-7 w-auto text-xs gap-1.5 border-dashed">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="todo" className="text-xs">To Do</SelectItem>
              <SelectItem value="in_progress" className="text-xs">In Progress</SelectItem>
              <SelectItem value="done" className="text-xs">Done</SelectItem>
            </SelectContent>
          </Select>

          {/* Due Date */}
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline" size="sm" className="h-7 text-xs gap-1.5 font-normal border-dashed">
                <CalendarIcon className="h-3 w-3" />
                {task.due_date ? format(new Date(task.due_date), "MMM d, yyyy") : "Due date"}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar
                mode="single"
                selected={task.due_date ? new Date(task.due_date) : undefined}
                onSelect={(date) =>
                  onUpdate("due_date", date ? format(date, "yyyy-MM-dd") : null)
                }
              />
            </PopoverContent>
          </Popover>
        </div>

        {/* Related To */}
        <div className="space-y-2">
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
            Related to
          </span>
          <RelatedToPicker
            listingId={task.listing_id}
            transactionId={task.transaction_id}
            contactId={task.contact_id}
            onChange={(field, value) => onUpdate(field, value)}
          />
        </div>

        {/* Subtasks */}
        <SubtaskList
          subtasks={subtasks}
          onToggle={onSubtaskToggle}
          onAdd={onSubtaskAdd}
          onDelete={onSubtaskDelete}
        />
      </div>
    </div>
  );
}
