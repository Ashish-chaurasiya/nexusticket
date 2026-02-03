import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const badgeVariants = cva(
  "inline-flex items-center rounded-full border px-2.5 py-0.5 text-xs font-medium transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
  {
    variants: {
      variant: {
        default: "border-transparent bg-primary text-primary-foreground hover:bg-primary/80",
        secondary: "border-transparent bg-secondary text-secondary-foreground hover:bg-secondary/80",
        destructive: "border-transparent bg-destructive text-destructive-foreground hover:bg-destructive/80",
        outline: "text-foreground",
        // Status variants
        todo: "border-transparent bg-status-todo/20 text-status-todo",
        "in-progress": "border-transparent bg-status-in-progress/20 text-status-in-progress",
        review: "border-transparent bg-status-review/20 text-status-review",
        done: "border-transparent bg-status-done/20 text-status-done",
        blocked: "border-transparent bg-status-blocked/20 text-status-blocked",
        // Ticket type variants
        bug: "border-transparent bg-ticket-bug/20 text-ticket-bug",
        task: "border-transparent bg-ticket-task/20 text-ticket-task",
        story: "border-transparent bg-ticket-story/20 text-ticket-story",
        support: "border-transparent bg-ticket-support/20 text-ticket-support",
        // Priority variants
        critical: "border-transparent bg-priority-critical/20 text-priority-critical",
        high: "border-transparent bg-priority-high/20 text-priority-high",
        medium: "border-transparent bg-priority-medium/20 text-priority-medium",
        low: "border-transparent bg-priority-low/20 text-priority-low",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

export interface BadgeProps extends React.HTMLAttributes<HTMLDivElement>, VariantProps<typeof badgeVariants> {}

function Badge({ className, variant, ...props }: BadgeProps) {
  return <div className={cn(badgeVariants({ variant }), className)} {...props} />;
}

export { Badge, badgeVariants };
