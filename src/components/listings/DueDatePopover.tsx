import { useState } from "react";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { Button } from "@/components/ui/button";
import { CalendarIcon, Plus, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface DueDatePopoverProps {
  value: string | null; // ISO date YYYY-MM-DD
  onChange: (next: string | null) => void;
  goLiveDate?: string | null;
}

function toISO(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

function daysFromNow(n: number) {
  const d = new Date();
  d.setDate(d.getDate() + n);
  return toISO(d);
}

export function DueDatePopover({ value, onChange, goLiveDate }: DueDatePopoverProps) {
  const [open, setOpen] = useState(false);

  const pick = (date: string | null) => {
    onChange(date);
    setOpen(false);
  };

  // urgency styling
  let urgency: "none" | "soon" | "overdue" = "none";
  if (value) {
    const today = new Date(); today.setHours(0, 0, 0, 0);
    const due = new Date(value + "T00:00:00");
    const diffDays = Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
    if (diffDays < 0) urgency = "overdue";
    else if (diffDays <= 3) urgency = "soon";
  }

  const label = value
    ? new Date(value + "T00:00:00").toLocaleDateString("en-US", { month: "short", day: "numeric" })
    : "Date";

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <button
          type="button"
          className={cn(
            "inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-xs transition-colors",
            !value && "border-dashed border-muted-foreground/30 text-muted-foreground/60 hover:text-foreground hover:border-foreground/30",
            value && urgency === "none" && "bg-foreground/5 border-foreground/15 text-foreground hover:bg-foreground/10",
            value && urgency === "soon" && "bg-amber-500/10 border-amber-500/30 text-amber-700 dark:text-amber-400 hover:bg-amber-500/15",
            value && urgency === "overdue" && "bg-destructive/10 border-destructive/30 text-destructive hover:bg-destructive/15",
          )}
        >
          {value ? <CalendarIcon className="h-3 w-3" /> : <Plus className="h-3 w-3" />}
          <span>{label}</span>
        </button>
      </PopoverTrigger>
      <PopoverContent className="w-auto p-0" align="end">
        <div className="border-b p-2 flex flex-wrap gap-1">
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => pick(daysFromNow(0))}>Today</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => pick(daysFromNow(3))}>In 3 days</Button>
          <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => pick(daysFromNow(7))}>Next week</Button>
          {goLiveDate && (
            <Button size="sm" variant="ghost" className="h-7 text-xs" onClick={() => pick(goLiveDate)}>Go live</Button>
          )}
          {value && (
            <Button size="sm" variant="ghost" className="h-7 text-xs ml-auto text-destructive" onClick={() => pick(null)}>
              <X className="h-3 w-3 mr-1" /> Clear
            </Button>
          )}
        </div>
        <Calendar
          mode="single"
          selected={value ? new Date(value + "T00:00:00") : undefined}
          onSelect={(d) => d && pick(toISO(d))}
          initialFocus
          className={cn("p-3 pointer-events-auto")}
        />
      </PopoverContent>
    </Popover>
  );
}
