 import { useState } from "react";
 import { Button } from "@/components/ui/button";
 import { Badge } from "@/components/ui/badge";
 import { Ticket } from "@/types/domain";
 import { useAiTriage } from "@/hooks/useAiTriage";
 import { AiTriageData } from "@/types/domain";
 import { useUpdateTicket } from "@/hooks/useUpdateTicket";
 import { useToast } from "@/hooks/use-toast";
 import { Sparkles, Loader2, CheckCircle2, AlertTriangle, Lightbulb, Wand2 } from "lucide-react";
 
 interface TicketAiActionsProps {
   ticket: Ticket;
 }
 
 export function TicketAiActions({ ticket }: TicketAiActionsProps) {
   const { triageTicket, isTriaging } = useAiTriage();
   const updateTicket = useUpdateTicket();
   const { toast } = useToast();
   const [triageResult, setTriageResult] = useState<AiTriageData | null>(null);
 
   const handleTriage = async () => {
     try {
       const result = await triageTicket({
         ticketId: ticket.id,
         title: ticket.title,
         description: ticket.description,
         type: ticket.type,
       });
       setTriageResult(result);
     } catch (error) {
       toast({
         variant: "destructive",
         title: "Triage Failed",
         description: "Could not analyze this ticket. Please try again.",
       });
     }
   };
 
   const handleApplyTriage = () => {
     if (!triageResult) return;
 
     updateTicket.mutate({
       id: ticket.id,
       priority: triageResult.suggested_priority,
       labels: [...(ticket.labels || []), ...triageResult.suggested_labels],
       ai_triage_data: triageResult,
     });
 
     toast({
       title: "Triage Applied",
       description: "AI recommendations have been applied to this ticket.",
     });
   };
 
   const displayResult = triageResult || ticket.ai_triage_data;
 
   return (
     <div className="space-y-6">
       {/* Action Buttons */}
       <div className="grid grid-cols-2 gap-4">
         <Button
           variant="outline"
           size="lg"
           className="h-auto flex-col gap-2 py-6"
           onClick={handleTriage}
           disabled={isTriaging}
         >
           {isTriaging ? (
             <Loader2 className="h-6 w-6 animate-spin" />
           ) : (
             <Sparkles className="h-6 w-6 text-primary" />
           )}
           <span className="font-medium">AI Triage</span>
           <span className="text-xs text-muted-foreground">
             Analyze priority & assignment
           </span>
         </Button>
 
         <Button
           variant="outline"
           size="lg"
           className="h-auto flex-col gap-2 py-6"
           disabled
         >
           <Wand2 className="h-6 w-6 text-primary" />
           <span className="font-medium">Improve Description</span>
           <span className="text-xs text-muted-foreground">Coming soon</span>
         </Button>
       </div>
 
       {/* Triage Results */}
       {displayResult && (
         <div className="rounded-lg border border-border bg-card p-6">
           <div className="mb-4 flex items-center justify-between">
             <h3 className="flex items-center gap-2 font-semibold">
               <Sparkles className="h-5 w-5 text-primary" />
               AI Triage Analysis
             </h3>
             {triageResult && (
               <Button variant="glow" size="sm" onClick={handleApplyTriage}>
                 <CheckCircle2 className="mr-1 h-4 w-4" />
                 Apply Recommendations
               </Button>
             )}
           </div>
 
           <div className="space-y-4">
             {/* Priority */}
             <div className="rounded-lg bg-muted/30 p-4">
               <div className="mb-2 flex items-center justify-between">
                 <span className="text-sm font-medium">Suggested Priority</span>
                 <Badge
                   variant={
                     displayResult.suggested_priority === "critical"
                       ? "destructive"
                       : displayResult.suggested_priority === "high"
                       ? "high"
                       : "secondary"
                   }
                 >
                   {displayResult.suggested_priority}
                 </Badge>
               </div>
               <p className="text-sm text-muted-foreground">
                 {displayResult.priority_reasoning}
               </p>
             </div>
 
             {/* SLA Risk */}
             <div className="rounded-lg bg-muted/30 p-4">
               <div className="mb-2 flex items-center justify-between">
                 <span className="text-sm font-medium">SLA Risk</span>
                 <Badge
                   variant={
                     displayResult.sla_risk === "high"
                       ? "destructive"
                       : displayResult.sla_risk === "medium"
                       ? "medium"
                       : "secondary"
                   }
                 >
                   {displayResult.sla_risk === "high" && (
                     <AlertTriangle className="mr-1 h-3 w-3" />
                   )}
                   {displayResult.sla_risk}
                 </Badge>
               </div>
               <p className="text-sm text-muted-foreground">
                 {displayResult.sla_risk_reasoning}
               </p>
             </div>
 
             {/* Suggested Labels */}
             {displayResult.suggested_labels?.length > 0 && (
               <div className="rounded-lg bg-muted/30 p-4">
                 <span className="mb-2 block text-sm font-medium">
                   Suggested Labels
                 </span>
                 <div className="flex flex-wrap gap-2">
                   {displayResult.suggested_labels.map((label) => (
                     <Badge key={label} variant="outline">
                       {label}
                     </Badge>
                   ))}
                 </div>
               </div>
             )}
 
             {/* Sprint Recommendation */}
             {displayResult.sprint_recommendation && (
               <div className="rounded-lg bg-muted/30 p-4">
                 <div className="flex items-start gap-2">
                   <Lightbulb className="mt-0.5 h-4 w-4 text-primary" />
                   <div>
                     <span className="text-sm font-medium">Sprint Recommendation</span>
                     <p className="text-sm text-muted-foreground">
                       {displayResult.sprint_recommendation}
                     </p>
                   </div>
                 </div>
               </div>
             )}
 
             {/* Estimated Hours */}
             {displayResult.estimated_hours && (
               <div className="rounded-lg bg-muted/30 p-4">
                 <span className="text-sm font-medium">Estimated Effort</span>
                 <p className="text-2xl font-bold text-primary">
                   {displayResult.estimated_hours}h
                 </p>
               </div>
             )}
           </div>
         </div>
       )}
 
       {/* No triage yet */}
       {!displayResult && (
         <div className="rounded-lg border border-dashed border-border p-8 text-center">
           <Sparkles className="mx-auto mb-3 h-10 w-10 text-muted-foreground" />
           <h3 className="mb-1 font-medium">No AI Analysis Yet</h3>
           <p className="text-sm text-muted-foreground">
             Click "AI Triage" to get intelligent recommendations for this ticket.
           </p>
         </div>
       )}
     </div>
   );
 }