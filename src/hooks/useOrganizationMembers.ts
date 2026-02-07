import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useToast } from "@/hooks/use-toast";

type OrganizationRole = "admin" | "manager" | "member";

interface Member {
  id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  profile: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Invite {
  id: string;
  email: string;
  role: OrganizationRole;
  status: string;
  created_at: string;
  token: string;
}

export function useOrganizationMembers() {
  const { currentOrganization } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const membersQuery = useQuery({
    queryKey: ["org-members", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from("organization_memberships")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all members
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      })) as Member[];
    },
    enabled: !!currentOrganization,
  });

  const invitesQuery = useQuery({
    queryKey: ["org-invites", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from("organization_invites")
        .select("id, email, role, status, created_at, token")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invite[];
    },
    enabled: !!currentOrganization,
  });

  return {
    members: membersQuery.data || [],
    membersLoading: membersQuery.isLoading,
    invites: invitesQuery.data || [],
    invitesLoading: invitesQuery.isLoading,
    refetchMembers: membersQuery.refetch,
    refetchInvites: invitesQuery.refetch,
  };
}
