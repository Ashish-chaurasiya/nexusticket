 import { useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Ticket, TicketStatus, TicketPriority, TicketType, AiTriageData } from "@/types/domain";
 import { Json } from "@/integrations/supabase/types";
 import { useOrganization } from "@/contexts/OrganizationContext";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";
 
 export interface UpdateTicketInput {
   id: string;
   title?: string;
   description?: string;
   type?: TicketType;
   status?: TicketStatus;
   priority?: TicketPriority;
   labels?: string[];
   assignee_id?: string | null;
   sprint_id?: string | null;
   due_date?: string | null;
   estimate_hours?: number | null;
   ai_triage_data?: AiTriageData;
 }
 
 export function useUpdateTicket() {
   const queryClient = useQueryClient();
   const { currentOrganization } = useOrganization();
   const { user } = useAuth();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async (input: UpdateTicketInput) => {
       if (!currentOrganization || !user) {
         throw new Error("Not authenticated or no organization selected");
       }
 
       const { id, ...updates } = input;
       
       // Convert ai_triage_data to Json type if present
       const dbUpdates: Record<string, unknown> = { ...updates };
       if (updates.ai_triage_data) {
         dbUpdates.ai_triage_data = updates.ai_triage_data as unknown as Json;
       }
 
       const { data, error } = await supabase
         .from("tickets")
         .update(dbUpdates)
         .eq("id", id)
         .eq("organization_id", currentOrganization.id)
         .select()
         .single();
 
       if (error) throw error;
 
       // Log activity
       const changedFields = Object.keys(updates).filter(
         (k) => updates[k as keyof typeof updates] !== undefined
       );
       
       await supabase.rpc("log_activity", {
         p_org_id: currentOrganization.id,
         p_entity_type: "ticket",
         p_entity_id: id,
         p_action: "updated",
         p_user_id: user.id,
         p_details: { fields: changedFields } as unknown as Json,
         p_is_ai: false,
       });
 
       return data;
     },
     onMutate: async (input) => {
       // Optimistic update
       await queryClient.cancelQueries({ queryKey: ["ticket", input.id] });
       const previousTicket = queryClient.getQueryData(["ticket", input.id]);
 
       queryClient.setQueryData(["ticket", input.id], (old: Ticket | undefined) => {
         if (!old) return old;
         return { ...old, ...input };
       });
 
       return { previousTicket };
     },
     onError: (error, input, context) => {
       console.error("Failed to update ticket:", error);
       // Rollback
       if (context?.previousTicket) {
         queryClient.setQueryData(["ticket", input.id], context.previousTicket);
       }
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to update ticket. Please try again.",
       });
     },
     onSettled: (data, error, input) => {
       queryClient.invalidateQueries({ queryKey: ["ticket", input.id] });
       queryClient.invalidateQueries({ queryKey: ["tickets"] });
     },
   });
 }
 
 export function useAddComment() {
   const queryClient = useQueryClient();
   const { currentOrganization } = useOrganization();
   const { user } = useAuth();
   const { toast } = useToast();
 
   return useMutation({
     mutationFn: async ({ ticketId, content, isAiGenerated = false }: { 
       ticketId: string; 
       content: string;
       isAiGenerated?: boolean;
     }) => {
       if (!currentOrganization || !user) {
         throw new Error("Not authenticated");
       }
 
       const { data, error } = await supabase
         .from("comments")
         .insert({
           ticket_id: ticketId,
           organization_id: currentOrganization.id,
           author_id: user.id,
           content,
           is_ai_generated: isAiGenerated,
         })
         .select(`*, author:profiles!comments_author_id_fkey(*)`)
         .single();
 
       if (error) throw error;
       return data;
     },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ["ticket-comments", data.ticket_id] });
       toast({
         title: "Comment Added",
         description: "Your comment has been posted.",
       });
     },
     onError: (error) => {
       console.error("Failed to add comment:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to add comment. Please try again.",
       });
     },
   });
 }