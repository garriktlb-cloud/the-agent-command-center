import { useState } from "react";
import { Checkbox } from "@/components/ui/checkbox";
import { Input } from "@/components/ui/input";
import { Plus, Trash2 } from "lucide-react";
import { cn } from "@/lib/utils";

export interface Subtask {
  id: string;
  title: string;
  status: "todo" | "in_progress" | "done";
}

interface SubtaskListProps {
  subtasks: Subtask[];
  onToggle: (id: string, done: boolean) => void;
  onAdd: (title: string) => void;
  onDelete: (id: string) => void;
}

export default function SubtaskList({ subtasks, onToggle, onAdd, onDelete }: SubtaskListProps) {
  const [newTitle, setNewTitle] = useState("");
  const [adding, setAdding] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = newTitle.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setNewTitle("");
  };

  const completedCount = subtasks.filter((s) => s.status === "done").length;

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
          Subtasks
        </span>
        {subtasks.length > 0 && (
          <span className="text-xs text-muted-foreground">
            {completedCount}/{subtasks.length}
          </span>
        )}
      </div>

      {subtasks.length > 0 && (
        <div className="space-y-1">
          {subtasks.map((sub) => (
            <div
              key={sub.id}
              className="flex items-center gap-2 group py-1 px-1 rounded hover:bg-muted/50"
            >
              <Checkbox
                checked={sub.status === "done"}
                onCheckedChange={(checked) => onToggle(sub.id, !!checked)}
                className="h-3.5 w-3.5"
              />
              <span
                className={cn(
                  "text-sm flex-1",
                  sub.status === "done" && "line-through text-muted-foreground"
                )}
              >
                {sub.title}
              </span>
              <button
                onClick={() => onDelete(sub.id)}
                className="opacity-0 group-hover:opacity-100 transition-opacity text-muted-foreground hover:text-destructive"
              >
                <Trash2 className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}

      {adding ? (
        <form onSubmit={handleSubmit} className="flex items-center gap-2">
          <Input
            value={newTitle}
            onChange={(e) => setNewTitle(e.target.value)}
            placeholder="Subtask title"
            className="h-7 text-sm"
            autoFocus
            onBlur={() => {
              if (!newTitle.trim()) setAdding(false);
            }}
          />
        </form>
      ) : (
        <button
          onClick={() => setAdding(true)}
          className="flex items-center gap-1.5 text-xs text-muted-foreground hover:text-foreground transition-colors"
        >
          <Plus className="h-3 w-3" />
          Add subtask
        </button>
      )}
    </div>
  );
}
