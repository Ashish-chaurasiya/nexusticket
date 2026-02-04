// Domain types for Nexus - derived from database schema
// These types are used throughout the application

export type OrganizationRole = "admin" | "manager" | "member";
export type TicketStatus = "todo" | "in_progress" | "review" | "done" | "blocked";
export type TicketPriority = "critical" | "high" | "medium" | "low";
export type TicketType = "bug" | "task" | "story" | "support";
export type SprintStatus = "planning" | "active" | "completed";

// Organization (Tenant)
export interface Organization {
  id: string;
  name: string;
  slug: string;
  logo_url?: string;
  created_at: string;
  updated_at: string;
}

// User Profile
export interface Profile {
  id: string;
  user_id: string;
  email: string;
  full_name?: string;
  avatar_url?: string;
  created_at: string;
  updated_at: string;
}

// Organization Membership
export interface OrganizationMembership {
  id: string;
  organization_id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  updated_at: string;
  // Joined data
  organization?: Organization;
  profile?: Profile;
}

// Project
export interface Project {
  id: string;
  organization_id: string;
  name: string;
  key: string;
  description?: string;
  ticket_counter: number;
  created_at: string;
  updated_at: string;
}

// Sprint
export interface Sprint {
  id: string;
  organization_id: string;
  project_id: string;
  name: string;
  goal?: string;
  status: SprintStatus;
  start_date?: string;
  end_date?: string;
  created_at: string;
  updated_at: string;
  // Computed
  ticket_count?: number;
  completed_count?: number;
}

// Ticket
export interface Ticket {
  id: string;
  organization_id: string;
  project_id: string;
  sprint_id?: string;
  key: string;
  title: string;
  description?: string;
  type: TicketType;
  status: TicketStatus;
  priority: TicketPriority;
  assignee_id?: string;
  reporter_id: string;
  labels: string[];
  due_date?: string;
  estimate_hours?: number;
  ai_generated: boolean;
  ai_triage_data?: AiTriageData;
  created_at: string;
  updated_at: string;
  // Joined data
  assignee?: Profile;
  reporter?: Profile;
  project?: Project;
  sprint?: Sprint;
  comment_count?: number;
}

// Comment
export interface Comment {
  id: string;
  organization_id: string;
  ticket_id: string;
  author_id: string;
  content: string;
  is_ai_generated: boolean;
  created_at: string;
  updated_at: string;
  // Joined data
  author?: Profile;
}

// Activity Log
export interface ActivityLog {
  id: string;
  organization_id: string;
  entity_type: string;
  entity_id: string;
  action: string;
  user_id?: string;
  details?: Record<string, unknown>;
  is_ai_action: boolean;
  created_at: string;
  // Joined data
  user?: Profile;
}

// AI Triage Data (stored in ticket.ai_triage_data)
export interface AiTriageData {
  suggested_priority: TicketPriority;
  priority_reasoning: string;
  suggested_assignee_role?: string;
  assignment_reasoning?: string;
  sla_risk: "low" | "medium" | "high";
  sla_risk_reasoning: string;
  suggested_labels: string[];
  sprint_recommendation: string;
  estimated_hours?: number;
  triaged_at: string;
}

// AI Chat Types
export type AiActionType = 
  | "create_ticket"
  | "triage_ticket"
  | "analyze_project"
  | "summarize_sprint"
  | "general_chat";

export interface AiChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  action?: AiActionType;
  toolCall?: {
    name: string;
    arguments: Record<string, unknown>;
  };
}

// AI Copilot Types
export type CopilotAction = 
  | "sprint_summary"
  | "project_analysis"
  | "team_insights"
  | "standup_prep";

export interface CopilotRequest {
  action: CopilotAction;
  organizationId: string;
  projectId?: string;
  sprintId?: string;
}

// Dashboard Stats
export interface DashboardStats {
  totalTickets: number;
  completedTickets: number;
  inProgressTickets: number;
  criticalIssues: number;
  sprintProgress?: {
    completed: number;
    total: number;
    daysRemaining: number;
  };
}

// Kanban Board Types
export interface KanbanColumn {
  status: TicketStatus;
  title: string;
  tickets: Ticket[];
}

// Context Types
export interface OrganizationContext {
  organization: Organization;
  membership: OrganizationMembership;
  role: OrganizationRole;
}

export interface ProjectContext {
  project: Project;
  activeSprint?: Sprint;
}
