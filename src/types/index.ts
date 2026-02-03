// Core data models for Nexus - AI-First Ticket Management

export type TicketType = 'bug' | 'task' | 'story' | 'support';
export type TicketStatus = 'todo' | 'in-progress' | 'review' | 'done' | 'blocked';
export type Priority = 'critical' | 'high' | 'medium' | 'low';
export type UserRole = 'admin' | 'manager' | 'member';

export interface Organization {
  id: string;
  name: string;
  slug: string;
  logoUrl?: string;
  createdAt: Date;
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatarUrl?: string;
  role: UserRole;
  organizationId: string;
}

export interface Project {
  id: string;
  name: string;
  key: string; // e.g., "PROJ" for ticket prefixes
  description?: string;
  organizationId: string;
  createdAt: Date;
  ticketCount: number;
}

export interface Ticket {
  id: string;
  key: string; // e.g., "PROJ-123"
  title: string;
  description?: string;
  type: TicketType;
  status: TicketStatus;
  priority: Priority;
  projectId: string;
  assigneeId?: string;
  assignee?: User;
  reporterId: string;
  reporter?: User;
  labels: string[];
  dueDate?: Date;
  createdAt: Date;
  updatedAt: Date;
  commentCount: number;
  attachmentCount: number;
}

export interface Comment {
  id: string;
  ticketId: string;
  authorId: string;
  author?: User;
  content: string;
  createdAt: Date;
  isAiGenerated: boolean;
}

export interface Attachment {
  id: string;
  ticketId: string;
  name: string;
  url: string;
  size: number;
  type: string;
  uploadedAt: Date;
}

// AI-related types
export interface AiSuggestion {
  id: string;
  type: 'title' | 'description' | 'priority' | 'assignee' | 'label';
  value: string;
  confidence: number;
  reasoning?: string;
}

export interface AiTriageResult {
  suggestedAssignee?: User;
  suggestedPriority: Priority;
  suggestedLabels: string[];
  slaRisk: 'low' | 'medium' | 'high';
  sprintSuggestion?: string;
}
