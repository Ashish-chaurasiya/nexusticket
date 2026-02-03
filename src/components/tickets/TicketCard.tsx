import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";
import { TicketType, TicketStatus, Priority } from "@/types";
import { MessageSquare, Paperclip, AlertCircle, CheckCircle2, Circle, Clock, XCircle } from "lucide-react";

interface TicketCardProps {
  ticketKey: string;
  title: string;
  type: TicketType;
  priority: Priority;
  status: TicketStatus;
  assignee?: {
    name: string;
    avatarUrl?: string;
  };
  commentCount?: number;
  attachmentCount?: number;
  labels?: string[];
  onClick?: () => void;
}

const typeIcons = {
  bug: <AlertCircle className="h-3.5 w-3.5" />,
  task: <CheckCircle2 className="h-3.5 w-3.5" />,
  story: <Circle className="h-3.5 w-3.5" />,
  support: <MessageSquare className="h-3.5 w-3.5" />,
};

const statusIcons = {
  todo: <Circle className="h-3 w-3" />,
  "in-progress": <Clock className="h-3 w-3" />,
  review: <AlertCircle className="h-3 w-3" />,
  done: <CheckCircle2 className="h-3 w-3" />,
  blocked: <XCircle className="h-3 w-3" />,
};

const priorityColors = {
  critical: "border-l-priority-critical",
  high: "border-l-priority-high",
  medium: "border-l-priority-medium",
  low: "border-l-priority-low",
};

export function TicketCard({
  ticketKey,
  title,
  type,
  priority,
  status,
  assignee,
  commentCount = 0,
  attachmentCount = 0,
  labels = [],
  onClick,
}: TicketCardProps) {
  return (
    <div
      onClick={onClick}
      className={cn(
        "group cursor-pointer rounded-lg border border-border bg-card p-4 transition-all duration-200 hover:border-border hover:bg-card-hover hover:shadow-md",
        "border-l-2",
        priorityColors[priority]
      )}
    >
      {/* Header */}
      <div className="mb-2 flex items-start justify-between gap-2">
        <div className="flex items-center gap-2">
          <Badge variant={type} className="gap-1">
            {typeIcons[type]}
            <span className="capitalize">{type}</span>
          </Badge>
          <span className="text-xs font-medium text-muted-foreground">
            {ticketKey}
          </span>
        </div>
        <Badge variant={status} className="gap-1 text-[10px]">
          {statusIcons[status]}
          <span className="capitalize">{status.replace("-", " ")}</span>
        </Badge>
      </div>

      {/* Title */}
      <h4 className="mb-3 line-clamp-2 text-sm font-medium text-foreground group-hover:text-primary">
        {title}
      </h4>

      {/* Labels */}
      {labels.length > 0 && (
        <div className="mb-3 flex flex-wrap gap-1">
          {labels.slice(0, 3).map((label) => (
            <span
              key={label}
              className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
            >
              {label}
            </span>
          ))}
          {labels.length > 3 && (
            <span className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              +{labels.length - 3}
            </span>
          )}
        </div>
      )}

      {/* Footer */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3 text-muted-foreground">
          {commentCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <MessageSquare className="h-3 w-3" />
              {commentCount}
            </div>
          )}
          {attachmentCount > 0 && (
            <div className="flex items-center gap-1 text-xs">
              <Paperclip className="h-3 w-3" />
              {attachmentCount}
            </div>
          )}
        </div>
        {assignee && (
          <div
            className="h-6 w-6 rounded-full bg-gradient-to-br from-primary to-ticket-story"
            title={assignee.name}
          />
        )}
      </div>
    </div>
  );
}
