-- Add template and demo columns to organizations
ALTER TABLE public.organizations
ADD COLUMN IF NOT EXISTS template text CHECK (template IN ('startup', 'enterprise')) DEFAULT 'startup',
ADD COLUMN IF NOT EXISTS is_demo boolean DEFAULT false;

-- Create organization_invites table
CREATE TABLE IF NOT EXISTS public.organization_invites (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  email text NOT NULL,
  role organization_role DEFAULT 'member' NOT NULL,
  invited_by uuid NOT NULL,
  status text CHECK (status IN ('pending', 'accepted', 'expired')) DEFAULT 'pending' NOT NULL,
  token uuid DEFAULT gen_random_uuid() NOT NULL UNIQUE,
  created_at timestamptz DEFAULT now() NOT NULL,
  updated_at timestamptz DEFAULT now() NOT NULL
);

-- Create org_provisioning_steps table for real-time progress
CREATE TABLE IF NOT EXISTS public.org_provisioning_steps (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE NOT NULL,
  step text NOT NULL,
  status text CHECK (status IN ('pending', 'done', 'error')) DEFAULT 'pending' NOT NULL,
  created_at timestamptz DEFAULT now() NOT NULL
);

-- Create org_ai_recommendations table
CREATE TABLE IF NOT EXISTS public.org_ai_recommendations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid REFERENCES public.organizations(id) ON DELETE CASCADE UNIQUE NOT NULL,
  recommendations jsonb NOT NULL,
  generated_at timestamptz DEFAULT now() NOT NULL
);

-- Enable RLS on new tables
ALTER TABLE public.organization_invites ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_provisioning_steps ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.org_ai_recommendations ENABLE ROW LEVEL SECURITY;

-- RLS policies for organization_invites
CREATE POLICY "Admins can manage invites" ON public.organization_invites
FOR ALL USING (is_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Invited users can view their invites" ON public.organization_invites
FOR SELECT USING (email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()));

CREATE POLICY "Anyone can accept invites by token" ON public.organization_invites
FOR UPDATE USING (true) WITH CHECK (status = 'accepted');

-- RLS policies for org_provisioning_steps
CREATE POLICY "Members can view provisioning steps" ON public.org_provisioning_steps
FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "System can insert provisioning steps" ON public.org_provisioning_steps
FOR INSERT WITH CHECK (true);

-- RLS policies for org_ai_recommendations
CREATE POLICY "Members can view recommendations" ON public.org_ai_recommendations
FOR SELECT USING (is_member_of_org(auth.uid(), organization_id));

-- Enable realtime for provisioning steps
ALTER PUBLICATION supabase_realtime ADD TABLE public.org_provisioning_steps;

-- Update organizations table to allow insert for authenticated users (for new org creation)
CREATE POLICY "Authenticated users can create organizations" ON public.organizations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Create trigger for updated_at on organization_invites
CREATE TRIGGER update_organization_invites_updated_at
BEFORE UPDATE ON public.organization_invites
FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();