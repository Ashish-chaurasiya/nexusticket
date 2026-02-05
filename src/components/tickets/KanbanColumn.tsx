import { ReactNode } from "react";
import { cn } from "@/lib/utils";
 import { TicketStatus } from "@/types/domain";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

interface KanbanColumnProps {
  status: TicketStatus;
  title: string;
  count: number;
  children: ReactNode;
   onAdd?: () => void;
}

const statusColors: Record<TicketStatus, string> = {
  todo: "bg-status-todo",
   in_progress: "bg-status-in-progress",
  review: "bg-status-review",
  done: "bg-status-done",
  blocked: "bg-status-blocked",
};

 export function KanbanColumn({ status, title, count, children, onAdd }: KanbanColumnProps) {
  return (
    <div className="flex h-full w-80 flex-shrink-0 flex-col rounded-lg bg-muted/30">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border p-3">
        <div className="flex items-center gap-2">
          <div className={cn("h-2 w-2 rounded-full", statusColors[status])} />
          <h3 className="text-sm font-medium text-foreground">{title}</h3>
          <span className="rounded-full bg-muted px-2 py-0.5 text-xs text-muted-foreground">
            {count}
          </span>
        </div>
         <Button variant="ghost" size="icon" className="h-6 w-6" onClick={onAdd}>
          <Plus className="h-3 w-3" />
        </Button>
      </div>

      {/* Cards */}
      <div className="flex-1 space-y-3 overflow-y-auto p-3">
        {children}
      </div>
    </div>
  );
}
