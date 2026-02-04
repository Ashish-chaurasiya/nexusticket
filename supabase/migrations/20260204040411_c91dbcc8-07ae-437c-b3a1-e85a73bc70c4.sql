-- Create ENUM types for roles, ticket status, priority, type
CREATE TYPE public.organization_role AS ENUM ('admin', 'manager', 'member');
CREATE TYPE public.ticket_status AS ENUM ('todo', 'in_progress', 'review', 'done', 'blocked');
CREATE TYPE public.ticket_priority AS ENUM ('critical', 'high', 'medium', 'low');
CREATE TYPE public.ticket_type AS ENUM ('bug', 'task', 'story', 'support');
CREATE TYPE public.sprint_status AS ENUM ('planning', 'active', 'completed');

-- Organizations table (tenants)
CREATE TABLE public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  slug TEXT NOT NULL UNIQUE,
  logo_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- User profiles (public user data, linked to auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL UNIQUE REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL,
  full_name TEXT,
  avatar_url TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Organization memberships (multi-tenant user roles)
CREATE TABLE public.organization_memberships (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role organization_role NOT NULL DEFAULT 'member',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, user_id)
);

-- Projects table
CREATE TABLE public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  key TEXT NOT NULL,
  description TEXT,
  ticket_counter INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, key)
);

-- Sprints table
CREATE TABLE public.sprints (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  goal TEXT,
  status sprint_status NOT NULL DEFAULT 'planning',
  start_date DATE,
  end_date DATE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Tickets table
CREATE TABLE public.tickets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  sprint_id UUID REFERENCES public.sprints(id) ON DELETE SET NULL,
  key TEXT NOT NULL,
  title TEXT NOT NULL,
  description TEXT,
  type ticket_type NOT NULL DEFAULT 'task',
  status ticket_status NOT NULL DEFAULT 'todo',
  priority ticket_priority NOT NULL DEFAULT 'medium',
  assignee_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  reporter_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  labels TEXT[] DEFAULT '{}',
  due_date DATE,
  estimate_hours NUMERIC,
  ai_generated BOOLEAN DEFAULT false,
  ai_triage_data JSONB,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(organization_id, key)
);

-- Comments table
CREATE TABLE public.comments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  ticket_id UUID NOT NULL REFERENCES public.tickets(id) ON DELETE CASCADE,
  author_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  is_ai_generated BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Activity logs (audit trail)
CREATE TABLE public.activity_logs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  entity_type TEXT NOT NULL,
  entity_id UUID NOT NULL,
  action TEXT NOT NULL,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  details JSONB,
  is_ai_action BOOLEAN DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Enable RLS on all tables
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_memberships ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.sprints ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.tickets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.comments ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.activity_logs ENABLE ROW LEVEL SECURITY;

-- Helper functions for RLS (security definer to avoid recursion)

-- Check if user is member of organization
CREATE OR REPLACE FUNCTION public.is_member_of_org(uid UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = uid AND organization_id = org_id
  );
$$;

-- Get user role in organization
CREATE OR REPLACE FUNCTION public.get_user_role_in_org(uid UUID, org_id UUID)
RETURNS organization_role
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT role FROM public.organization_memberships
  WHERE user_id = uid AND organization_id = org_id
  LIMIT 1;
$$;

-- Check if user is admin in organization
CREATE OR REPLACE FUNCTION public.is_admin_in_org(uid UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = uid AND organization_id = org_id AND role = 'admin'
  );
$$;

-- Check if user is manager or admin in organization
CREATE OR REPLACE FUNCTION public.is_manager_or_admin_in_org(uid UUID, org_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.organization_memberships
    WHERE user_id = uid AND organization_id = org_id AND role IN ('admin', 'manager')
  );
$$;

-- RLS Policies for profiles
CREATE POLICY "Users can view own profile"
  ON public.profiles FOR SELECT
  USING (user_id = auth.uid());

CREATE POLICY "Users can update own profile"
  ON public.profiles FOR UPDATE
  USING (user_id = auth.uid());

CREATE POLICY "Users can insert own profile"
  ON public.profiles FOR INSERT
  WITH CHECK (user_id = auth.uid());

-- RLS Policies for organizations
CREATE POLICY "Members can view their organizations"
  ON public.organizations FOR SELECT
  USING (public.is_member_of_org(auth.uid(), id));

CREATE POLICY "Admins can update their organizations"
  ON public.organizations FOR UPDATE
  USING (public.is_admin_in_org(auth.uid(), id));

-- RLS Policies for organization_memberships
CREATE POLICY "Members can view memberships in their orgs"
  ON public.organization_memberships FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Admins can insert memberships"
  ON public.organization_memberships FOR INSERT
  WITH CHECK (public.is_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can update memberships"
  ON public.organization_memberships FOR UPDATE
  USING (public.is_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can delete memberships"
  ON public.organization_memberships FOR DELETE
  USING (public.is_admin_in_org(auth.uid(), organization_id));

-- RLS Policies for projects
CREATE POLICY "Members can view projects in their orgs"
  ON public.projects FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Managers can create projects"
  ON public.projects FOR INSERT
  WITH CHECK (public.is_manager_or_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Managers can update projects"
  ON public.projects FOR UPDATE
  USING (public.is_manager_or_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can delete projects"
  ON public.projects FOR DELETE
  USING (public.is_admin_in_org(auth.uid(), organization_id));

-- RLS Policies for sprints
CREATE POLICY "Members can view sprints"
  ON public.sprints FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Managers can create sprints"
  ON public.sprints FOR INSERT
  WITH CHECK (public.is_manager_or_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Managers can update sprints"
  ON public.sprints FOR UPDATE
  USING (public.is_manager_or_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Managers can delete sprints"
  ON public.sprints FOR DELETE
  USING (public.is_manager_or_admin_in_org(auth.uid(), organization_id));

-- RLS Policies for tickets
CREATE POLICY "Members can view tickets"
  ON public.tickets FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can create tickets"
  ON public.tickets FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id) AND reporter_id = auth.uid());

CREATE POLICY "Members can update assigned tickets or managers all"
  ON public.tickets FOR UPDATE
  USING (
    public.is_member_of_org(auth.uid(), organization_id) AND 
    (assignee_id = auth.uid() OR public.is_manager_or_admin_in_org(auth.uid(), organization_id))
  );

CREATE POLICY "Managers can delete tickets"
  ON public.tickets FOR DELETE
  USING (public.is_manager_or_admin_in_org(auth.uid(), organization_id));

-- RLS Policies for comments
CREATE POLICY "Members can view comments"
  ON public.comments FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Members can create comments"
  ON public.comments FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id) AND author_id = auth.uid());

CREATE POLICY "Authors can update own comments"
  ON public.comments FOR UPDATE
  USING (author_id = auth.uid());

CREATE POLICY "Authors or admins can delete comments"
  ON public.comments FOR DELETE
  USING (author_id = auth.uid() OR public.is_admin_in_org(auth.uid(), organization_id));

-- RLS Policies for activity_logs
CREATE POLICY "Members can view activity logs"
  ON public.activity_logs FOR SELECT
  USING (public.is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "System can insert activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (public.is_member_of_org(auth.uid(), organization_id));

-- Function to auto-increment ticket key
CREATE OR REPLACE FUNCTION public.generate_ticket_key()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  project_key TEXT;
  next_counter INTEGER;
BEGIN
  -- Get project key and increment counter
  UPDATE public.projects 
  SET ticket_counter = ticket_counter + 1
  WHERE id = NEW.project_id
  RETURNING key, ticket_counter INTO project_key, next_counter;
  
  -- Generate ticket key
  NEW.key := project_key || '-' || next_counter;
  
  RETURN NEW;
END;
$$;

CREATE TRIGGER set_ticket_key
  BEFORE INSERT ON public.tickets
  FOR EACH ROW
  EXECUTE FUNCTION public.generate_ticket_key();

-- Updated_at trigger function
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER
LANGUAGE plpgsql
SET search_path = public
AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$;

-- Apply updated_at triggers
CREATE TRIGGER update_organizations_updated_at
  BEFORE UPDATE ON public.organizations
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_profiles_updated_at
  BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_organization_memberships_updated_at
  BEFORE UPDATE ON public.organization_memberships
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_projects_updated_at
  BEFORE UPDATE ON public.projects
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_sprints_updated_at
  BEFORE UPDATE ON public.sprints
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_tickets_updated_at
  BEFORE UPDATE ON public.tickets
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_comments_updated_at
  BEFORE UPDATE ON public.comments
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- Function to log activity
CREATE OR REPLACE FUNCTION public.log_activity(
  p_org_id UUID,
  p_entity_type TEXT,
  p_entity_id UUID,
  p_action TEXT,
  p_user_id UUID,
  p_details JSONB DEFAULT NULL,
  p_is_ai BOOLEAN DEFAULT false
)
RETURNS UUID
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  activity_id UUID;
BEGIN
  INSERT INTO public.activity_logs (organization_id, entity_type, entity_id, action, user_id, details, is_ai_action)
  VALUES (p_org_id, p_entity_type, p_entity_id, p_action, p_user_id, p_details, p_is_ai)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Create indexes for performance
CREATE INDEX idx_organization_memberships_user ON public.organization_memberships(user_id);
CREATE INDEX idx_organization_memberships_org ON public.organization_memberships(organization_id);
CREATE INDEX idx_projects_org ON public.projects(organization_id);
CREATE INDEX idx_tickets_org ON public.tickets(organization_id);
CREATE INDEX idx_tickets_project ON public.tickets(project_id);
CREATE INDEX idx_tickets_assignee ON public.tickets(assignee_id);
CREATE INDEX idx_tickets_status ON public.tickets(status);
CREATE INDEX idx_sprints_org ON public.sprints(organization_id);
CREATE INDEX idx_sprints_project ON public.sprints(project_id);
CREATE INDEX idx_comments_ticket ON public.comments(ticket_id);
CREATE INDEX idx_activity_logs_org ON public.activity_logs(organization_id);
CREATE INDEX idx_activity_logs_entity ON public.activity_logs(entity_type, entity_id);
CREATE INDEX idx_profiles_user ON public.profiles(user_id);