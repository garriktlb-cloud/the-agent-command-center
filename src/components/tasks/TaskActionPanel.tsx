import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { CheckCircle2, ChevronRight } from "lucide-react";

interface TaskActionPanelProps {
  open: boolean;
  title: string;
  onClose: () => void;
  onBookDirectly: () => void;
  onWeHandleIt: () => void;
  onMarkComplete: () => void;
}

export default function TaskActionPanel({
  open,
  title,
  onClose,
  onBookDirectly,
  onWeHandleIt,
  onMarkComplete,
}: TaskActionPanelProps) {
  return (
    <Dialog open={open} onOpenChange={(o) => !o && onClose()}>
      <DialogContent className="sm:max-w-sm">
        <DialogHeader>
          <p className="text-[10px] uppercase tracking-wider text-muted-foreground">
            Action Panel
          </p>
          <DialogTitle className="text-base font-semibold">{title}</DialogTitle>
        </DialogHeader>
        <div className="space-y-2 mt-2">
          <button
            className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors flex items-center justify-between"
            onClick={onBookDirectly}
          >
            <div>
              <p className="text-sm font-medium">Book Directly</p>
              <p className="text-xs text-muted-foreground">
                View vendors and complete this step yourself.
              </p>
            </div>
            <ChevronRight className="h-4 w-4 text-muted-foreground" />
          </button>

          <button
            className="w-full text-left rounded-lg border border-foreground bg-foreground text-background p-3 hover:bg-foreground/90 transition-colors flex items-center justify-between"
            onClick={onWeHandleIt}
          >
            <div>
              <p className="text-sm font-medium">We'll handle it</p>
              <p className="text-xs opacity-70">List Bar coordinates for you.</p>
            </div>
            <span className="text-xs">→</span>
          </button>

          <button
            className="w-full text-left rounded-lg border p-3 hover:bg-muted/50 transition-colors flex items-center justify-between"
            onClick={onMarkComplete}
          >
            <div>
              <p className="text-sm font-medium">Mark as complete</p>
              <p className="text-xs text-muted-foreground">
                Confirm this step is done.
              </p>
            </div>
            <CheckCircle2 className="h-4 w-4 text-primary" />
          </button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
