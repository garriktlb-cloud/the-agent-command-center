import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Plus } from "lucide-react";

interface TaskQuickAddProps {
  onAdd: (title: string) => void;
}

export default function TaskQuickAdd({ onAdd }: TaskQuickAddProps) {
  const [value, setValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = value.trim();
    if (!trimmed) return;
    onAdd(trimmed);
    setValue("");
  };

  return (
    <form onSubmit={handleSubmit} className="flex items-center gap-2 px-4 py-3 border-b border-border">
      <Plus className="h-4 w-4 text-muted-foreground shrink-0" />
      <Input
        value={value}
        onChange={(e) => setValue(e.target.value)}
        placeholder="What needs to be done?"
        className="border-0 shadow-none focus-visible:ring-0 px-0 h-8 text-sm"
      />
    </form>
  );
}
