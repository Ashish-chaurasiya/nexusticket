 import { useState } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { KanbanBoard } from "@/components/tickets/KanbanBoard";
 import { TicketList } from "@/components/tickets/TicketList";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { useTickets } from "@/hooks/useTickets";
 import { useProject, useProjects } from "@/hooks/useProjects";
import {
  Plus,
  Filter,
  LayoutGrid,
  List,
  Search,
  ChevronDown,
  Sparkles,
   Loader2,
} from "lucide-react";

export default function ProjectBoard() {
   const { projectId } = useParams<{ projectId: string }>();
   const navigate = useNavigate();
   const [viewMode, setViewMode] = useState<"board" | "list">("board");
   const [searchQuery, setSearchQuery] = useState("");
   
   // Get the first project if no projectId is specified
   const { data: projects, isLoading: projectsLoading } = useProjects();
   const activeProjectId = projectId || projects?.[0]?.id;
   
   const { data: project, isLoading: projectLoading } = useProject(activeProjectId);
   const { data: tickets, isLoading: ticketsLoading } = useTickets(activeProjectId, {
     search: searchQuery || undefined,
   });
 
   const handleCreateTicket = () => {
     if (activeProjectId) {
       navigate(`/projects/${activeProjectId}/tickets/new`);
     }
   };
 
   const isLoading = projectsLoading || projectLoading;
 
   if (isLoading) {
     return (
       <DashboardLayout>
         <div className="flex h-full items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
       </DashboardLayout>
     );
   }
 
   if (!project) {
     return (
       <DashboardLayout>
         <div className="flex h-full flex-col items-center justify-center">
           <p className="mb-4 text-muted-foreground">No projects found</p>
           <p className="text-sm text-muted-foreground">
             Create an organization to get started
           </p>
         </div>
       </DashboardLayout>
     );
   }
 
   const openTicketCount = tickets?.filter(t => t.status !== "done").length || 0;
 
  return (
    <DashboardLayout>
      <div className="flex h-full flex-col">
        {/* Project Header */}
        <div className="border-b border-border bg-card/50 px-6 py-4">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-primary">
               <span className="text-sm font-bold text-primary-foreground">
                 {project.key.slice(0, 2).toUpperCase()}
               </span>
            </div>
            <div>
               <h1 className="text-xl font-semibold text-foreground">{project.name}</h1>
              <p className="text-sm text-muted-foreground">
                 {project.description || "Project board"} · {openTicketCount} open tickets
              </p>
            </div>
          </div>

          {/* Toolbar */}
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* View Toggle */}
              <div className="flex rounded-lg border border-border bg-background p-1">
                 <Button
                   variant={viewMode === "board" ? "secondary" : "ghost"}
                   size="sm"
                   className="h-7 gap-1.5 px-2"
                   onClick={() => setViewMode("board")}
                 >
                  <LayoutGrid className="h-4 w-4" />
                  Board
                </Button>
                <Button
                   variant={viewMode === "list" ? "secondary" : "ghost"}
                  size="sm"
                   className="h-7 gap-1.5 px-2"
                   onClick={() => setViewMode("list")}
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
                 <Input
                  type="text"
                  placeholder="Search tickets..."
                   className="h-9 w-64 pl-9"
                   value={searchQuery}
                   onChange={(e) => setSearchQuery(e.target.value)}
                />
              </div>
            </div>

            <div className="flex items-center gap-2">
              <Button variant="subtle" size="sm" className="gap-1.5">
                <Sparkles className="h-4 w-4" />
                AI Triage
              </Button>
               <Button variant="glow" size="sm" className="gap-1.5" onClick={handleCreateTicket}>
                <Plus className="h-4 w-4" />
                New Ticket
              </Button>
            </div>
          </div>
        </div>

         {/* Content */}
        <div className="flex-1 overflow-hidden">
           {viewMode === "board" ? (
             <KanbanBoard
               tickets={tickets || []}
               isLoading={ticketsLoading}
               onCreateTicket={handleCreateTicket}
             />
           ) : (
             <div className="p-6">
               <TicketList
                 tickets={tickets || []}
                 isLoading={ticketsLoading}
               />
             </div>
           )}
        </div>
      </div>

      {/* AI Chat Panel */}
      <AiChatPanel />
    </DashboardLayout>
  );
}
