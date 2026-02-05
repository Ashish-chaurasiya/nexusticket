 import { useQuery } from "@tanstack/react-query";
 import { supabase } from "@/integrations/supabase/client";
 import { Project } from "@/types/domain";
 import { useOrganization } from "@/contexts/OrganizationContext";
 
 export function useProjects() {
   const { currentOrganization } = useOrganization();
 
   return useQuery({
     queryKey: ["projects", currentOrganization?.id],
     queryFn: async () => {
       if (!currentOrganization) return [];
 
       const { data, error } = await supabase
         .from("projects")
         .select("*")
         .eq("organization_id", currentOrganization.id)
         .order("created_at", { ascending: false });
 
       if (error) throw error;
 
       return data.map((p): Project => ({
         id: p.id,
         organization_id: p.organization_id,
         name: p.name,
         key: p.key,
         description: p.description ?? undefined,
         ticket_counter: p.ticket_counter,
         created_at: p.created_at,
         updated_at: p.updated_at,
       }));
     },
     enabled: !!currentOrganization,
   });
 }
 
 export function useProject(projectId: string | undefined) {
   const { currentOrganization } = useOrganization();
 
   return useQuery({
     queryKey: ["project", projectId],
     queryFn: async () => {
       if (!projectId || !currentOrganization) return null;
 
       const { data, error } = await supabase
         .from("projects")
         .select("*")
         .eq("id", projectId)
         .eq("organization_id", currentOrganization.id)
         .single();
 
       if (error) throw error;
 
       return {
         id: data.id,
         organization_id: data.organization_id,
         name: data.name,
         key: data.key,
         description: data.description ?? undefined,
         ticket_counter: data.ticket_counter,
         created_at: data.created_at,
         updated_at: data.updated_at,
       } as Project;
     },
     enabled: !!projectId && !!currentOrganization,
   });
 }
 
 export function useOrganizationMembers() {
   const { currentOrganization } = useOrganization();
 
   return useQuery({
     queryKey: ["org-members", currentOrganization?.id],
     queryFn: async () => {
       if (!currentOrganization) return [];
 
       const { data, error } = await supabase
         .from("organization_memberships")
         .select(`
           *,
           profile:profiles!organization_memberships_user_id_fkey(*)
         `)
         .eq("organization_id", currentOrganization.id);
 
       if (error) throw error;
       return data;
     },
     enabled: !!currentOrganization,
   });
 }