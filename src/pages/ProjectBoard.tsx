import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KanbanBoard } from "@/components/tickets/KanbanBoard";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  Sparkles,
} from "lucide-react";

export default function ProjectBoard() {
  return (
    <DashboardLayout>
      <div className="flex h-full flex-col">
        {/* Project Header */}
        <div className="border-b border-border bg-card/50 px-6 py-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
              <span className="text-sm font-bold text-primary-foreground">NX</span>
            </div>
            <div>
              <h1 className="text-xl font-semibold text-foreground">Nexus Core</h1>
              <p className="text-sm text-muted-foreground">
                Main product development · 47 open tickets
              </p>
            </div>
            <Badge variant="in-progress" className="ml-4">
              Sprint 14
            </Badge>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-border bg-background p-1">
                <Button variant="ghost" size="sm" className="h-7 gap-1.5 px-2">
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-7 gap-1.5 px-2 text-muted-foreground"
                >
                  <List className="h-4 w-4" />
                  List
                </Button>
              </div>

              {/* Filters */}
              <Button variant="outline" size="sm" className="gap-1.5">
                <Filter className="h-4 w-4" />
                Filter
                <ChevronDown className="h-3 w-3" />
              </Button>

              {/* Search */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Search tickets..."
                  className="h-9 w-64 rounded-lg border border-border bg-background pl-9 pr-4 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="subtle" size="sm" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Triage
              </Button>
              <Button variant="glow" size="sm" className="gap-1.5">
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </div>
          </div>
        </div>

        {/* Kanban Board */}
        <div className="flex-1 overflow-hidden">
          <KanbanBoard />
        </div>
      </div>

      {/* AI Chat Panel */}
      <AiChatPanel />
    </DashboardLayout>
  );
}
