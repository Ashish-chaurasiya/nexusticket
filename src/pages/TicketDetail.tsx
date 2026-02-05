 import { useState } from "react";
 import { useParams, useNavigate } from "react-router-dom";
 import { DashboardLayout } from "@/components/layout/DashboardLayout";
 import { TicketDetailPanel } from "@/components/tickets/TicketDetailPanel";
 import { TicketComments } from "@/components/tickets/TicketComments";
 import { TicketAiActions } from "@/components/tickets/TicketAiActions";
 import { useTicket } from "@/hooks/useTickets";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
 import { ArrowLeft, Loader2, MessageSquare, Activity, Sparkles } from "lucide-react";
 
 export default function TicketDetail() {
   const { ticketId } = useParams<{ ticketId: string }>();
   const navigate = useNavigate();
   const { data: ticket, isLoading, error } = useTicket(ticketId);
   const [activeTab, setActiveTab] = useState("details");
 
   if (isLoading) {
     return (
       <DashboardLayout>
         <div className="flex h-full items-center justify-center">
           <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
         </div>
       </DashboardLayout>
     );
   }
 
   if (error || !ticket) {
     return (
       <DashboardLayout>
         <div className="flex h-full flex-col items-center justify-center">
           <p className="mb-4 text-muted-foreground">Ticket not found</p>
           <Button variant="outline" onClick={() => navigate(-1)}>
             Go Back
           </Button>
         </div>
       </DashboardLayout>
     );
   }
 
   return (
     <DashboardLayout>
       <div className="flex h-full flex-col">
         {/* Header */}
         <div className="border-b border-border bg-card/50 px-6 py-4">
           <div className="flex items-center justify-between">
             <div className="flex items-center gap-4">
               <Button
                 variant="ghost"
                 size="icon"
                 onClick={() => navigate(`/projects/${ticket.project_id}`)}
               >
                 <ArrowLeft className="h-4 w-4" />
               </Button>
               <div>
                 <div className="flex items-center gap-2">
                   <Badge variant={ticket.type}>{ticket.type}</Badge>
                   <span className="text-sm font-medium text-muted-foreground">
                     {ticket.key}
                   </span>
                 </div>
                 <h1 className="mt-1 text-xl font-semibold text-foreground">
                   {ticket.title}
                 </h1>
               </div>
             </div>
 
             <div className="flex items-center gap-2">
               <Button variant="subtle" size="sm" className="gap-1.5">
                 <Sparkles className="h-4 w-4" />
                 AI Triage
               </Button>
             </div>
           </div>
         </div>
 
         {/* Content */}
         <div className="flex flex-1 overflow-hidden">
           {/* Main Panel */}
           <div className="flex-1 overflow-y-auto">
             <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full">
               <div className="border-b border-border px-6">
                 <TabsList className="h-12">
                   <TabsTrigger value="details" className="gap-1.5">
                     <Activity className="h-4 w-4" />
                     Details
                   </TabsTrigger>
                   <TabsTrigger value="comments" className="gap-1.5">
                     <MessageSquare className="h-4 w-4" />
                     Comments
                   </TabsTrigger>
                   <TabsTrigger value="ai" className="gap-1.5">
                     <Sparkles className="h-4 w-4" />
                     AI Actions
                   </TabsTrigger>
                 </TabsList>
               </div>
 
               <TabsContent value="details" className="p-6">
                 <TicketDetailPanel ticket={ticket} />
               </TabsContent>
 
               <TabsContent value="comments" className="p-6">
                 <TicketComments ticketId={ticket.id} />
               </TabsContent>
 
               <TabsContent value="ai" className="p-6">
                 <TicketAiActions ticket={ticket} />
               </TabsContent>
             </Tabs>
           </div>
         </div>
       </div>
     </DashboardLayout>
   );
 }