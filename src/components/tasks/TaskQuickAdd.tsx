import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
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
  Flag,
  Plus,
  X,
  Mail,
  Phone,
  Users,
  CheckSquare,
  CornerDownRight,
  FileText,
  Link2,
} from "lucide-react";
import { format } from "date-fns";
import { cn } from "@/lib/utils";
import RelatedToPicker from "./RelatedToPicker";

type TaskType = "todo" | "email" | "call" | "meeting" | "follow_up" | "document";
type Priority = "low" | "normal" | "high" | "urgent";

interface TaskQuickAddProps {
  onAdd: (task: {
    title: string;
    description?: string;
    due_date?: string;
    priority?: Priority;
    task_type?: TaskType;
    listing_id?: string | null;
    transaction_id?: string | null;
    contact_id?: string | null;
  }) => void;
}

const PRIORITY_CONFIG: Record<Priority, { label: string; color: string }> = {
  urgent: { label: "Urgent", color: "text-destructive" },
  high: { label: "High", color: "text-accent" },
  normal: { label: "Normal", color: "text-primary/60" },
  low: { label: "Low", color: "text-muted-foreground" },
};

const TYPE_CONFIG: Record<TaskType, { label: string; icon: typeof Mail }> = {
  todo: { label: "To Do", icon: CheckSquare },
  email: { label: "Email", icon: Mail },
  call: { label: "Call", icon: Phone },
  meeting: { label: "Meeting", icon: Users },
  follow_up: { label: "Follow Up", icon: CornerDownRight },
  document: { label: "Document", icon: FileText },
};

export default function TaskQuickAdd({ onAdd }: TaskQuickAddProps) {
  const [open, setOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [dueDate, setDueDate] = useState<Date | undefined>();
  const [priority, setPriority] = useState<Priority>("normal");
  const [taskType, setTaskType] = useState<TaskType>("todo");
  const [listingId, setListingId] = useState<string | null>(null);
  const [transactionId, setTransactionId] = useState<string | null>(null);
  const [contactId, setContactId] = useState<string | null>(null);

  const reset = () => {
    setTitle("");
    setDescription("");
    setDueDate(undefined);
    setPriority("normal");
    setTaskType("todo");
    setListingId(null);
    setTransactionId(null);
    setContactId(null);
    setOpen(false);
  };

  const handleSubmit = () => {
    const trimmed = title.trim();
    if (!trimmed) return;
    onAdd({
      title: trimmed,
      description: description.trim() || undefined,
      due_date: dueDate ? format(dueDate, "yyyy-MM-dd") : undefined,
      priority,
      task_type: taskType,
      listing_id: listingId,
      transaction_id: transactionId,
      contact_id: contactId,
    });
    reset();
  };

  const handleRelatedChange = (field: string, value: string | null) => {
    if (field === "listing_id") setListingId(value);
    else if (field === "transaction_id") setTransactionId(value);
    else if (field === "contact_id") setContactId(value);
  };

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 px-4 py-3 border-b border-border text-sm text-muted-foreground hover:text-foreground transition-colors w-full text-left"
      >
        <Plus className="h-4 w-4 shrink-0" />
        <span>Add task</span>
      </button>
    );
  }

  const TypeIcon = TYPE_CONFIG[taskType].icon;

  return (
    <div className="border-b border-border">
      <div className="px-4 pt-3 pb-2 space-y-2">
        <Input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Task name"
          className="border-0 shadow-none focus-visible:ring-0 px-0 h-7 text-sm font-medium"
          autoFocus
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              handleSubmit();
            }
            if (e.key === "Escape") reset();
          }}
        />
        <Textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Description"
          className="border-0 shadow-none focus-visible:ring-0 px-0 min-h-[24px] h-6 text-xs text-muted-foreground resize-none"
          rows={1}
        />

        {/* Action chips */}
        <div className="flex items-center gap-1.5 flex-wrap">
          {/* Due Date */}
          <Popover>
            <PopoverTrigger asChild>
              <button className={cn(
                "inline-flex items-center gap-1 px-2 py-0.5 rounded border border-border text-xs hover:bg-muted/50 transition-colors",
                dueDate && "border-primary/30 bg-primary/5"
              )}>
                <CalendarIcon className="h-3 w-3" />
                {dueDate ? format(dueDate, "MMM d") : "Due date"}
                {dueDate && (
                  <X
                    className="h-3 w-3 ml-0.5 hover:text-destructive"
                    onClick={(e) => { e.stopPropagation(); setDueDate(undefined); }}
                  />
                )}
              </button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="start">
              <Calendar mode="single" selected={dueDate} onSelect={setDueDate} />
            </PopoverContent>
          </Popover>

          {/* Priority */}
          <Select value={priority} onValueChange={(v) => setPriority(v as Priority)}>
            <SelectTrigger className="h-auto w-auto px-2 py-0.5 border-dashed text-xs gap-1 [&>svg]:h-3 [&>svg]:w-3">
              <Flag className={cn("h-3 w-3", PRIORITY_CONFIG[priority].color)} />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(PRIORITY_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          {/* Task Type */}
          <Select value={taskType} onValueChange={(v) => setTaskType(v as TaskType)}>
            <SelectTrigger className="h-auto w-auto px-2 py-0.5 border-dashed text-xs gap-1 [&>svg]:h-3 [&>svg]:w-3">
              <TypeIcon className="h-3 w-3" />
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {Object.entries(TYPE_CONFIG).map(([key, cfg]) => (
                <SelectItem key={key} value={key} className="text-xs">
                  {cfg.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Related To */}
        <div className="pt-1">
          <RelatedToPicker
            listingId={listingId}
            transactionId={transactionId}
            contactId={contactId}
            onChange={handleRelatedChange}
          />
        </div>
      </div>

      {/* Footer */}
      <div className="flex items-center justify-end gap-2 px-4 py-2 border-t border-border/50">
        <Button variant="ghost" size="sm" className="h-7 text-xs" onClick={reset}>
          Cancel
        </Button>
        <Button
          size="sm"
          className="h-7 text-xs"
          disabled={!title.trim()}
          onClick={handleSubmit}
        >
          Add task
        </Button>
      </div>
    </div>
  );
}
