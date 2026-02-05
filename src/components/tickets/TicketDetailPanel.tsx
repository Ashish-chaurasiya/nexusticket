 import { useState } from "react";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { Ticket, TicketStatus, TicketPriority, TicketType } from "@/types/domain";
 import { useUpdateTicket } from "@/hooks/useUpdateTicket";
 import { useOrganizationMembers } from "@/hooks/useProjects";
 import {
   AlertCircle,
   CheckCircle2,
   Circle,
   Clock,
   MessageSquare,
   XCircle,
   User,
   Calendar,
   Tag,
   Edit2,
   Save,
   X,
 } from "lucide-react";
 import { format } from "date-fns";
 
 interface TicketDetailPanelProps {
   ticket: Ticket;
 }
 
 const statusConfig: Record<TicketStatus, { label: string; icon: React.ReactNode }> = {
   todo: { label: "To Do", icon: <Circle className="h-4 w-4" /> },
   in_progress: { label: "In Progress", icon: <Clock className="h-4 w-4" /> },
   review: { label: "In Review", icon: <AlertCircle className="h-4 w-4" /> },
   done: { label: "Done", icon: <CheckCircle2 className="h-4 w-4" /> },
   blocked: { label: "Blocked", icon: <XCircle className="h-4 w-4" /> },
 };
 
 const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
   critical: { label: "Critical", color: "bg-priority-critical" },
   high: { label: "High", color: "bg-priority-high" },
   medium: { label: "Medium", color: "bg-priority-medium" },
   low: { label: "Low", color: "bg-priority-low" },
 };
 
 const typeIcons: Record<TicketType, React.ReactNode> = {
   bug: <AlertCircle className="h-4 w-4" />,
   task: <CheckCircle2 className="h-4 w-4" />,
   story: <Circle className="h-4 w-4" />,
   support: <MessageSquare className="h-4 w-4" />,
 };
 
 export function TicketDetailPanel({ ticket }: TicketDetailPanelProps) {
   const updateTicket = useUpdateTicket();
   const { data: members } = useOrganizationMembers();
   const [isEditingDescription, setIsEditingDescription] = useState(false);
   const [description, setDescription] = useState(ticket.description || "");
 
   const handleStatusChange = (status: TicketStatus) => {
     updateTicket.mutate({ id: ticket.id, status });
   };
 
   const handlePriorityChange = (priority: TicketPriority) => {
     updateTicket.mutate({ id: ticket.id, priority });
   };
 
   const handleTypeChange = (type: TicketType) => {
     updateTicket.mutate({ id: ticket.id, type });
   };
 
   const handleAssigneeChange = (assigneeId: string) => {
     updateTicket.mutate({
       id: ticket.id,
       assignee_id: assigneeId === "unassigned" ? null : assigneeId,
     });
   };
 
   const handleSaveDescription = () => {
     updateTicket.mutate({ id: ticket.id, description });
     setIsEditingDescription(false);
   };
 
   return (
     <div className="space-y-6">
       {/* Status & Priority Row */}
       <div className="grid grid-cols-3 gap-4">
         <div className="space-y-2">
           <Label className="text-muted-foreground">Status</Label>
           <Select value={ticket.status} onValueChange={handleStatusChange}>
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {Object.entries(statusConfig).map(([key, { label, icon }]) => (
                 <SelectItem key={key} value={key}>
                   <div className="flex items-center gap-2">
                     {icon}
                     {label}
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         <div className="space-y-2">
           <Label className="text-muted-foreground">Priority</Label>
           <Select value={ticket.priority} onValueChange={handlePriorityChange}>
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {Object.entries(priorityConfig).map(([key, { label, color }]) => (
                 <SelectItem key={key} value={key}>
                   <div className="flex items-center gap-2">
                     <div className={`h-2 w-2 rounded-full ${color}`} />
                     {label}
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
 
         <div className="space-y-2">
           <Label className="text-muted-foreground">Type</Label>
           <Select value={ticket.type} onValueChange={handleTypeChange}>
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               {Object.entries(typeIcons).map(([key, icon]) => (
                 <SelectItem key={key} value={key}>
                   <div className="flex items-center gap-2">
                     {icon}
                     <span className="capitalize">{key}</span>
                   </div>
                 </SelectItem>
               ))}
             </SelectContent>
           </Select>
         </div>
       </div>
 
       {/* Assignee */}
       <div className="space-y-2">
         <Label className="flex items-center gap-2 text-muted-foreground">
           <User className="h-4 w-4" />
           Assignee
         </Label>
         <Select
           value={ticket.assignee_id || "unassigned"}
           onValueChange={handleAssigneeChange}
         >
           <SelectTrigger>
             <SelectValue placeholder="Unassigned" />
           </SelectTrigger>
           <SelectContent>
             <SelectItem value="unassigned">Unassigned</SelectItem>
             {members?.map((m) => (
               <SelectItem key={m.user_id} value={m.user_id}>
                 {(() => {
                   const profile = m.profile as unknown as { full_name?: string; email: string } | null;
                   return profile?.full_name || profile?.email || m.user_id;
                 })()}
               </SelectItem>
             ))}
           </SelectContent>
         </Select>
       </div>
 
       {/* Labels */}
       <div className="space-y-2">
         <Label className="flex items-center gap-2 text-muted-foreground">
           <Tag className="h-4 w-4" />
           Labels
         </Label>
         <div className="flex flex-wrap gap-2">
           {ticket.labels?.map((label) => (
             <Badge key={label} variant="secondary">
               {label}
             </Badge>
           ))}
           {(!ticket.labels || ticket.labels.length === 0) && (
             <span className="text-sm text-muted-foreground">No labels</span>
           )}
         </div>
       </div>
 
       {/* Description */}
       <div className="space-y-2">
         <div className="flex items-center justify-between">
           <Label className="text-muted-foreground">Description</Label>
           {!isEditingDescription ? (
             <Button
               variant="ghost"
               size="sm"
               onClick={() => setIsEditingDescription(true)}
             >
               <Edit2 className="mr-1 h-3 w-3" />
               Edit
             </Button>
           ) : (
             <div className="flex gap-2">
               <Button variant="ghost" size="sm" onClick={handleSaveDescription}>
                 <Save className="mr-1 h-3 w-3" />
                 Save
               </Button>
               <Button
                 variant="ghost"
                 size="sm"
                 onClick={() => {
                   setDescription(ticket.description || "");
                   setIsEditingDescription(false);
                 }}
               >
                 <X className="mr-1 h-3 w-3" />
                 Cancel
               </Button>
             </div>
           )}
         </div>
         {isEditingDescription ? (
           <Textarea
             value={description}
             onChange={(e) => setDescription(e.target.value)}
             rows={6}
             className="resize-none"
           />
         ) : (
           <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm">
             {ticket.description || (
               <span className="text-muted-foreground">No description</span>
             )}
           </div>
         )}
       </div>
 
       {/* Metadata */}
       <div className="grid grid-cols-2 gap-4 rounded-lg border border-border bg-muted/30 p-4">
         <div className="space-y-1">
           <Label className="text-xs text-muted-foreground">Created</Label>
           <p className="flex items-center gap-1 text-sm">
             <Calendar className="h-3 w-3" />
             {format(new Date(ticket.created_at), "MMM d, yyyy 'at' h:mm a")}
           </p>
         </div>
         <div className="space-y-1">
           <Label className="text-xs text-muted-foreground">Updated</Label>
           <p className="flex items-center gap-1 text-sm">
             <Calendar className="h-3 w-3" />
             {format(new Date(ticket.updated_at), "MMM d, yyyy 'at' h:mm a")}
           </p>
         </div>
         <div className="space-y-1">
           <Label className="text-xs text-muted-foreground">Reporter</Label>
           <p className="text-sm">
             {ticket.reporter?.full_name || ticket.reporter?.email || "Unknown"}
           </p>
         </div>
         {ticket.ai_generated && (
           <div className="space-y-1">
             <Label className="text-xs text-muted-foreground">Source</Label>
             <Badge variant="secondary">AI Generated</Badge>
           </div>
         )}
       </div>
 
       {/* AI Triage Data */}
       {ticket.ai_triage_data && (
         <div className="rounded-lg border border-primary/30 bg-primary/5 p-4">
           <h3 className="mb-3 flex items-center gap-2 font-medium">
             <span className="text-primary">✨</span>
             AI Triage Analysis
           </h3>
           <div className="space-y-2 text-sm">
             <p>
               <strong>Priority Reasoning:</strong>{" "}
               {ticket.ai_triage_data.priority_reasoning}
             </p>
             <p>
               <strong>SLA Risk:</strong>{" "}
               <Badge
                 variant={
                   ticket.ai_triage_data.sla_risk === "high"
                     ? "destructive"
                     : ticket.ai_triage_data.sla_risk === "medium"
                     ? "medium"
                     : "secondary"
                 }
               >
                 {ticket.ai_triage_data.sla_risk}
               </Badge>
             </p>
             {ticket.ai_triage_data.sprint_recommendation && (
               <p>
                 <strong>Sprint:</strong> {ticket.ai_triage_data.sprint_recommendation}
               </p>
             )}
           </div>
         </div>
       )}
     </div>
   );
 }