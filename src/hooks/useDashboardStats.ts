import { useQuery } from "@tanstack/react-query";
import { supabase } from "@/integrations/supabase/client";
import { useOrganization } from "@/contexts/OrganizationContext";

export interface DashboardStats {
  totalTickets: number;
  completed: number;
  inProgress: number;
  critical: number;
}

export interface RecentTicket {
  id: string;
  key: string;
  title: string;
  type: "bug" | "task" | "story" | "support";
  priority: "critical" | "high" | "medium" | "low";
  status: "todo" | "in_progress" | "review" | "done" | "blocked";
  assignee_id: string | null;
  labels: string[] | null;
  created_at: string;
}

export interface ActivityItem {
  id: string;
  action: string;
  entity_type: string;
  entity_id: string;
  user_id: string | null;
  is_ai_action: boolean | null;
  details: Record<string, unknown> | null;
  created_at: string;
}

export interface SprintProgress {
  name: string;
  totalTickets: number;
  completedTickets: number;
  startDate: string | null;
  endDate: string | null;
}

export function useDashboardStats() {
  const { currentOrganization } = useOrganization();
  const orgId = currentOrganization?.id;

  const statsQuery = useQuery({
    queryKey: ["dashboard-stats", orgId],
    queryFn: async (): Promise<DashboardStats> => {
      if (!orgId) return { totalTickets: 0, completed: 0, inProgress: 0, critical: 0 };

      const { data, error } = await supabase
        .from("tickets")
        .select("status, priority")
        .eq("organization_id", orgId);

      if (error) throw error;

      const tickets = data || [];
      return {
        totalTickets: tickets.length,
        completed: tickets.filter((t) => t.status === "done").length,
        inProgress: tickets.filter((t) => t.status === "in_progress").length,
        critical: tickets.filter((t) => t.priority === "critical").length,
      };
    },
    enabled: !!orgId,
  });

  const recentTicketsQuery = useQuery({
    queryKey: ["dashboard-recent-tickets", orgId],
    queryFn: async (): Promise<RecentTicket[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("tickets")
        .select("id, key, title, type, priority, status, assignee_id, labels, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(5);

      if (error) throw error;
      return (data || []) as RecentTicket[];
    },
    enabled: !!orgId,
  });

  const activityQuery = useQuery({
    queryKey: ["dashboard-activity", orgId],
    queryFn: async (): Promise<ActivityItem[]> => {
      if (!orgId) return [];

      const { data, error } = await supabase
        .from("activity_logs")
        .select("id, action, entity_type, entity_id, user_id, is_ai_action, details, created_at")
        .eq("organization_id", orgId)
        .order("created_at", { ascending: false })
        .limit(6);

      if (error) throw error;
      return (data || []) as ActivityItem[];
    },
    enabled: !!orgId,
  });

  const sprintQuery = useQuery({
    queryKey: ["dashboard-sprint", orgId],
    queryFn: async (): Promise<SprintProgress | null> => {
      if (!orgId) return null;

      const { data: sprint, error: sprintError } = await supabase
        .from("sprints")
        .select("id, name, start_date, end_date")
        .eq("organization_id", orgId)
        .eq("status", "active")
        .limit(1)
        .maybeSingle();

      if (sprintError) throw sprintError;
      if (!sprint) return null;

      const { data: tickets, error: ticketError } = await supabase
        .from("tickets")
        .select("status")
        .eq("sprint_id", sprint.id);

      if (ticketError) throw ticketError;

      return {
        name: sprint.name,
        totalTickets: (tickets || []).length,
        completedTickets: (tickets || []).filter((t) => t.status === "done").length,
        startDate: sprint.start_date,
        endDate: sprint.end_date,
      };
    },
    enabled: !!orgId,
  });

  return {
    stats: statsQuery.data,
    recentTickets: recentTicketsQuery.data,
    activity: activityQuery.data,
    sprint: sprintQuery.data,
    isLoading:
      statsQuery.isLoading ||
      recentTicketsQuery.isLoading ||
      activityQuery.isLoading ||
      sprintQuery.isLoading,
  };
}
