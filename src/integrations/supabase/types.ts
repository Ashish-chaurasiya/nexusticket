export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.1"
  }
  public: {
    Tables: {
      activity_logs: {
        Row: {
          action: string
          created_at: string
          details: Json | null
          entity_id: string
          entity_type: string
          id: string
          is_ai_action: boolean | null
          organization_id: string
          user_id: string | null
        }
        Insert: {
          action: string
          created_at?: string
          details?: Json | null
          entity_id: string
          entity_type: string
          id?: string
          is_ai_action?: boolean | null
          organization_id: string
          user_id?: string | null
        }
        Update: {
          action?: string
          created_at?: string
          details?: Json | null
          entity_id?: string
          entity_type?: string
          id?: string
          is_ai_action?: boolean | null
          organization_id?: string
          user_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "activity_logs_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      comments: {
        Row: {
          author_id: string
          content: string
          created_at: string
          id: string
          is_ai_generated: boolean | null
          organization_id: string
          ticket_id: string
          updated_at: string
        }
        Insert: {
          author_id: string
          content: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          organization_id: string
          ticket_id: string
          updated_at?: string
        }
        Update: {
          author_id?: string
          content?: string
          created_at?: string
          id?: string
          is_ai_generated?: boolean | null
          organization_id?: string
          ticket_id?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "comments_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "comments_ticket_id_fkey"
            columns: ["ticket_id"]
            isOneToOne: false
            referencedRelation: "tickets"
            referencedColumns: ["id"]
          },
        ]
      }
      labels: {
        Row: {
          color: string
          created_at: string
          id: string
          name: string
          organization_id: string
        }
        Insert: {
          color?: string
          created_at?: string
          id?: string
          name: string
          organization_id: string
        }
        Update: {
          color?: string
          created_at?: string
          id?: string
          name?: string
          organization_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "labels_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_ai_recommendations: {
        Row: {
          generated_at: string
          id: string
          organization_id: string
          recommendations: Json
        }
        Insert: {
          generated_at?: string
          id?: string
          organization_id: string
          recommendations: Json
        }
        Update: {
          generated_at?: string
          id?: string
          organization_id?: string
          recommendations?: Json
        }
        Relationships: [
          {
            foreignKeyName: "org_ai_recommendations_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: true
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      org_provisioning_steps: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          status: string
          step: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          status?: string
          step: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          status?: string
          step?: string
        }
        Relationships: [
          {
            foreignKeyName: "org_provisioning_steps_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_invites: {
        Row: {
          created_at: string
          email: string
          id: string
          invited_by: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          status: string
          token: string
          updated_at: string
        }
        Insert: {
          created_at?: string
          email: string
          id?: string
          invited_by: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Update: {
          created_at?: string
          email?: string
          id?: string
          invited_by?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          status?: string
          token?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_invites_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organization_memberships: {
        Row: {
          created_at: string
          id: string
          organization_id: string
          role: Database["public"]["Enums"]["organization_role"]
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          organization_id: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          id?: string
          organization_id?: string
          role?: Database["public"]["Enums"]["organization_role"]
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "organization_memberships_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      organizations: {
        Row: {
          created_at: string
          id: string
          is_demo: boolean | null
          logo_url: string | null
          name: string
          slug: string
          template: string | null
          updated_at: string
        }
        Insert: {
          created_at?: string
          id?: string
          is_demo?: boolean | null
          logo_url?: string | null
          name: string
          slug: string
          template?: string | null
          updated_at?: string
        }
        Update: {
          created_at?: string
          id?: string
          is_demo?: boolean | null
          logo_url?: string | null
          name?: string
          slug?: string
          template?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      profiles: {
        Row: {
          avatar_url: string | null
          created_at: string
          email: string
          full_name: string | null
          id: string
          updated_at: string
          user_id: string
        }
        Insert: {
          avatar_url?: string | null
          created_at?: string
          email: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          avatar_url?: string | null
          created_at?: string
          email?: string
          full_name?: string | null
          id?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      projects: {
        Row: {
          created_at: string
          description: string | null
          id: string
          key: string
          name: string
          organization_id: string
          ticket_counter: number
          updated_at: string
        }
        Insert: {
          created_at?: string
          description?: string | null
          id?: string
          key: string
          name: string
          organization_id: string
          ticket_counter?: number
          updated_at?: string
        }
        Update: {
          created_at?: string
          description?: string | null
          id?: string
          key?: string
          name?: string
          organization_id?: string
          ticket_counter?: number
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "projects_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
        ]
      }
      sprints: {
        Row: {
          created_at: string
          end_date: string | null
          goal: string | null
          id: string
          name: string
          organization_id: string
          project_id: string
          start_date: string | null
          status: Database["public"]["Enums"]["sprint_status"]
          updated_at: string
        }
        Insert: {
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name: string
          organization_id: string
          project_id: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["sprint_status"]
          updated_at?: string
        }
        Update: {
          created_at?: string
          end_date?: string | null
          goal?: string | null
          id?: string
          name?: string
          organization_id?: string
          project_id?: string
          start_date?: string | null
          status?: Database["public"]["Enums"]["sprint_status"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "sprints_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "sprints_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tickets: {
        Row: {
          ai_generated: boolean | null
          ai_triage_data: Json | null
          assignee_id: string | null
          created_at: string
          description: string | null
          due_date: string | null
          estimate_hours: number | null
          id: string
          key: string
          labels: string[] | null
          organization_id: string
          priority: Database["public"]["Enums"]["ticket_priority"]
          project_id: string
          reporter_id: string
          sprint_id: string | null
          status: Database["public"]["Enums"]["ticket_status"]
          title: string
          type: Database["public"]["Enums"]["ticket_type"]
          updated_at: string
        }
        Insert: {
          ai_generated?: boolean | null
          ai_triage_data?: Json | null
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          key: string
          labels?: string[] | null
          organization_id: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id: string
          reporter_id: string
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Update: {
          ai_generated?: boolean | null
          ai_triage_data?: Json | null
          assignee_id?: string | null
          created_at?: string
          description?: string | null
          due_date?: string | null
          estimate_hours?: number | null
          id?: string
          key?: string
          labels?: string[] | null
          organization_id?: string
          priority?: Database["public"]["Enums"]["ticket_priority"]
          project_id?: string
          reporter_id?: string
          sprint_id?: string | null
          status?: Database["public"]["Enums"]["ticket_status"]
          title?: string
          type?: Database["public"]["Enums"]["ticket_type"]
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "tickets_organization_id_fkey"
            columns: ["organization_id"]
            isOneToOne: false
            referencedRelation: "organizations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "tickets_sprint_id_fkey"
            columns: ["sprint_id"]
            isOneToOne: false
            referencedRelation: "sprints"
            referencedColumns: ["id"]
          },
        ]
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      get_user_role_in_org: {
        Args: { org_id: string; uid: string }
        Returns: Database["public"]["Enums"]["organization_role"]
      }
      is_admin_in_org: {
        Args: { org_id: string; uid: string }
        Returns: boolean
      }
      is_manager_or_admin_in_org: {
        Args: { org_id: string; uid: string }
        Returns: boolean
      }
      is_member_of_org: {
        Args: { org_id: string; uid: string }
        Returns: boolean
      }
      log_activity: {
        Args: {
          p_action: string
          p_details?: Json
          p_entity_id: string
          p_entity_type: string
          p_is_ai?: boolean
          p_org_id: string
          p_user_id: string
        }
        Returns: string
      }
    }
    Enums: {
      organization_role: "admin" | "manager" | "member"
      sprint_status: "planning" | "active" | "completed"
      ticket_priority: "critical" | "high" | "medium" | "low"
      ticket_status: "todo" | "in_progress" | "review" | "done" | "blocked"
      ticket_type: "bug" | "task" | "story" | "support"
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {
      organization_role: ["admin", "manager", "member"],
      sprint_status: ["planning", "active", "completed"],
      ticket_priority: ["critical", "high", "medium", "low"],
      ticket_status: ["todo", "in_progress", "review", "done", "blocked"],
      ticket_type: ["bug", "task", "story", "support"],
    },
  },
} as const
