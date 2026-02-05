 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Ticket, TicketStatus, TicketPriority, TicketType, AiTriageData } from "@/types/domain";
 import { useOrganization } from "@/contexts/OrganizationContext";
 import { useToast } from "@/hooks/use-toast";
 import { Database } from "@/integrations/supabase/types";
 
 type TicketRow = Database["public"]["Tables"]["tickets"]["Row"];
 type ProfileRow = Database["public"]["Tables"]["profiles"]["Row"];
 
 interface TicketWithProfile extends TicketRow {
   assignee: ProfileRow | null;
   reporter: ProfileRow | null;
 }
 
 function mapRowToTicket(row: unknown): Ticket {
   const r = row as Record<string, unknown>;
   const assigneeData = r.assignee as Record<string, unknown> | null;
   const reporterData = r.reporter as Record<string, unknown> | null;
 
   return {
     id: r.id as string,
     organization_id: r.organization_id as string,
     project_id: r.project_id as string,
     sprint_id: (r.sprint_id as string | null) ?? undefined,
     key: r.key as string,
     title: r.title as string,
     description: (r.description as string | null) ?? undefined,
     type: r.type as TicketType,
     status: r.status as TicketStatus,
     priority: r.priority as TicketPriority,
     assignee_id: (r.assignee_id as string | null) ?? undefined,
     reporter_id: r.reporter_id as string,
     labels: (r.labels as string[] | null) ?? [],
     due_date: (r.due_date as string | null) ?? undefined,
     estimate_hours: r.estimate_hours ? Number(r.estimate_hours) : undefined,
     ai_generated: (r.ai_generated as boolean | null) ?? false,
     ai_triage_data: r.ai_triage_data as AiTriageData | undefined,
     created_at: r.created_at as string,
     updated_at: r.updated_at as string,
     assignee: assigneeData ? {
       id: assigneeData.id as string,
       user_id: assigneeData.user_id as string,
       email: assigneeData.email as string,
       full_name: (assigneeData.full_name as string | null) ?? undefined,
       avatar_url: (assigneeData.avatar_url as string | null) ?? undefined,
       created_at: assigneeData.created_at as string,
       updated_at: assigneeData.updated_at as string,
     } : undefined,
     reporter: reporterData ? {
       id: reporterData.id as string,
       user_id: reporterData.user_id as string,
       email: reporterData.email as string,
       full_name: (reporterData.full_name as string | null) ?? undefined,
       avatar_url: (reporterData.avatar_url as string | null) ?? undefined,
       created_at: reporterData.created_at as string,
       updated_at: reporterData.updated_at as string,
     } : undefined,
   };
 }
 
 export interface TicketFilters {
   status?: TicketStatus[];
   priority?: TicketPriority[];
   assignee_id?: string;
   search?: string;
   sprint_id?: string;
 }
 
 export function useTickets(projectId: string | undefined, filters?: TicketFilters) {
   const { currentOrganization } = useOrganization();
 
   return useQuery({
     queryKey: ["tickets", projectId, currentOrganization?.id, filters],
     queryFn: async () => {
       if (!projectId || !currentOrganization) return [];
 
       let query = supabase
         .from("tickets")
         .select(`
           *,
           assignee:profiles!assignee_id(*),
           reporter:profiles!reporter_id(*)
         `)
         .eq("project_id", projectId)
         .eq("organization_id", currentOrganization.id)
         .order("created_at", { ascending: false });
 
       if (filters?.status?.length) {
         query = query.in("status", filters.status);
       }
       if (filters?.priority?.length) {
         query = query.in("priority", filters.priority);
       }
       if (filters?.assignee_id) {
         query = query.eq("assignee_id", filters.assignee_id);
       }
       if (filters?.sprint_id) {
         query = query.eq("sprint_id", filters.sprint_id);
       }
       if (filters?.search) {
         query = query.or(`title.ilike.%${filters.search}%,key.ilike.%${filters.search}%`);
       }
 
       const { data, error } = await query;
 
       if (error) throw error;
       return (data as unknown[]).map(mapRowToTicket);
     },
     enabled: !!projectId && !!currentOrganization,
   });
 }
 
 export function useTicket(ticketId: string | undefined) {
   const { currentOrganization } = useOrganization();
 
   return useQuery({
     queryKey: ["ticket", ticketId],
     queryFn: async () => {
       if (!ticketId || !currentOrganization) return null;
 
       const { data, error } = await supabase
         .from("tickets")
         .select(`
           *,
           assignee:profiles!assignee_id(*),
           reporter:profiles!reporter_id(*)
         `)
         .eq("id", ticketId)
         .eq("organization_id", currentOrganization.id)
         .single();
 
       if (error) throw error;
       return mapRowToTicket(data);
     },
     enabled: !!ticketId && !!currentOrganization,
   });
 }
 
 export function useTicketComments(ticketId: string | undefined) {
   return useQuery({
     queryKey: ["ticket-comments", ticketId],
     queryFn: async () => {
       if (!ticketId) return [];
 
       const { data, error } = await supabase
         .from("comments")
         .select(`
           *,
           author:profiles!comments_author_id_fkey(*)
         `)
         .eq("ticket_id", ticketId)
         .order("created_at", { ascending: true });
 
       if (error) throw error;
       return data;
     },
     enabled: !!ticketId,
   });
 }