 import { useState, useEffect } from "react";
 import { useNavigate, useParams } from "react-router-dom";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { TicketDraftPreview } from "@/components/tickets/TicketDraftPreview";
 import { TicketCreateChat } from "@/components/tickets/TicketCreateChat";
 import { useProject } from "@/hooks/useProjects";
 import { useCreateTicket, CreateTicketInput } from "@/hooks/useCreateTicket";
 import { TicketType, TicketPriority } from "@/types/domain";
 import { Button } from "@/components/ui/button";
 import { ArrowLeft, Loader2 } from "lucide-react";
 
 export interface TicketDraft {
   title: string;
   description: string;
   type: TicketType;
   priority: TicketPriority;
   labels: string[];
 }
 
 const initialDraft: TicketDraft = {
   title: "",
   description: "",
   type: "task",
   priority: "medium",
   labels: [],
 };
 
 export default function TicketCreate() {
   const { projectId } = useParams<{ projectId: string }>();
   const navigate = useNavigate();
   const { data: project, isLoading: projectLoading } = useProject(projectId);
   const createTicket = useCreateTicket();
 
   const [draft, setDraft] = useState<TicketDraft>(initialDraft);
   const [isConfirming, setIsConfirming] = useState(false);
 
   const handleDraftUpdate = (updates: Partial<TicketDraft>) => {
     setDraft((prev) => ({ ...prev, ...updates }));
   };
 
   const handleCreateTicket = async () => {
     if (!projectId || !draft.title.trim()) return;
 
     setIsConfirming(true);
     try {
       const input: CreateTicketInput = {
         title: draft.title,
         description: draft.description || undefined,
         type: draft.type,
         priority: draft.priority,
         project_id: projectId,
         labels: draft.labels,
         ai_generated: true,
       };
 
       const result = await createTicket.mutateAsync(input);
       navigate(`/tickets/${result.id}`);
     } catch (error) {
       console.error("Failed to create ticket:", error);
     } finally {
       setIsConfirming(false);
     }
   };
 
   const canCreate = draft.title.trim().length > 0;
 
   if (projectLoading) {
     return (
       <DashboardLayout>
         <div className="flex h-full items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
       </DashboardLayout>
     );
   }
 
   return (
     <DashboardLayout>
       <div className="flex h-full flex-col">
         {/* Header */}
         <div className="border-b border-border bg-card/50 px-6 py-4">
           <div className="flex items-center gap-4">
             <Button
               variant="ghost"
               size="icon"
               onClick={() => navigate(`/projects/${projectId}`)}
             >
               <ArrowLeft className="h-4 w-4" />
             </Button>
             <div>
               <h1 className="text-xl font-semibold text-foreground">
                 Create New Ticket
               </h1>
               <p className="text-sm text-muted-foreground">
                 {project?.name} · AI-assisted ticket creation
               </p>
             </div>
           </div>
         </div>
 
         {/* Main Content */}
         <div className="flex flex-1 overflow-hidden">
           {/* Left: AI Chat */}
           <div className="flex w-1/2 flex-col border-r border-border">
             <TicketCreateChat
               projectId={projectId!}
               projectKey={project?.key || ""}
               draft={draft}
               onDraftUpdate={handleDraftUpdate}
             />
           </div>
 
           {/* Right: Live Preview */}
           <div className="flex w-1/2 flex-col">
             <div className="flex-1 overflow-y-auto p-6">
               <TicketDraftPreview
                 draft={draft}
                 projectKey={project?.key || ""}
                 onUpdate={handleDraftUpdate}
               />
             </div>
 
             {/* Create Button */}
             <div className="border-t border-border bg-card/50 p-4">
               <Button
                 variant="glow"
                 size="lg"
                 className="w-full"
                 disabled={!canCreate || isConfirming}
                 onClick={handleCreateTicket}
               >
                 {isConfirming ? (
                   <>
                     <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                     Creating...
                   </>
                 ) : (
                   "Create Ticket"
                 )}
               </Button>
             </div>
           </div>
         </div>
       </div>
     </DashboardLayout>
   );
 }