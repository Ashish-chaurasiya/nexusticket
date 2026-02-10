 import { useMutation, useQueryClient } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { TicketStatus, TicketPriority, TicketType } from "@/types/domain";
 import { useOrganization } from "@/contexts/OrganizationContext";
 import { useAuth } from "@/contexts/AuthContext";
 import { useToast } from "@/hooks/use-toast";

 export interface CreateTicketInput {
   title: string;
   description?: string;
   type: TicketType;
   priority: TicketPriority;
   project_id: string;
   labels?: string[];
   assignee_id?: string;
   sprint_id?: string;
   due_date?: string;
   estimate_hours?: number;
   ai_generated?: boolean;
 }

 export function useCreateTicket() {
   const queryClient = useQueryClient();
   const { currentOrganization } = useOrganization();
   const { user } = useAuth();
   const { toast } = useToast();

   return useMutation({
     mutationFn: async (input: CreateTicketInput) => {
       if (!currentOrganization || !user) {
         throw new Error("Not authenticated or no organization selected");
       }

       const { data, error } = await supabase
         .from("tickets")
         .insert({
           title: input.title,
           description: input.description,
           type: input.type,
           priority: input.priority,
           status: "todo" as TicketStatus,
           project_id: input.project_id,
           organization_id: currentOrganization.id,
           reporter_id: user.id,
           labels: input.labels || [],
           assignee_id: input.assignee_id,
           sprint_id: input.sprint_id,
           due_date: input.due_date,
           estimate_hours: input.estimate_hours,
           ai_generated: input.ai_generated || false,
           key: "TEMP",
         })
         .select()
         .single();

       if (error) throw error;

       await supabase.rpc("log_activity", {
         p_org_id: currentOrganization.id,
         p_entity_type: "ticket",
         p_entity_id: data.id,
         p_action: "created",
         p_user_id: user.id,
         p_details: { title: input.title, type: input.type },
         p_is_ai: input.ai_generated || false,
       });

       return data;
     },
     onSuccess: (data) => {
       queryClient.invalidateQueries({ queryKey: ["tickets"] });
       queryClient.setQueryData(["ticket", data.id], data);
       toast({
         title: "Ticket Created",
         description: `${data.key} has been created successfully.`,
       });
     },
     onError: (error) => {
       console.error("Failed to create ticket:", error);
       toast({
         variant: "destructive",
         title: "Error",
         description: "Failed to create ticket. Please try again.",
       });
     },
   });
 }
