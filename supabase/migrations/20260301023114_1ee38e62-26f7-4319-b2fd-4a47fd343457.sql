
-- Create labels table
CREATE TABLE public.labels (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id uuid NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  name text NOT NULL,
  color text NOT NULL DEFAULT '#3b82f6',
  created_at timestamp with time zone NOT NULL DEFAULT now()
);

ALTER TABLE public.labels ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Members can view labels"
  ON public.labels FOR SELECT
  USING (is_member_of_org(auth.uid(), organization_id));

CREATE POLICY "Managers can create labels"
  ON public.labels FOR INSERT
  WITH CHECK (is_manager_or_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Managers can update labels"
  ON public.labels FOR UPDATE
  USING (is_manager_or_admin_in_org(auth.uid(), organization_id));

CREATE POLICY "Admins can delete labels"
  ON public.labels FOR DELETE
  USING (is_admin_in_org(auth.uid(), organization_id));

-- Fix profiles RLS: allow org peers to see each other
CREATE POLICY "Org members can view peer profiles"
  ON public.profiles FOR SELECT
  USING (
    user_id IN (
      SELECT om.user_id FROM public.organization_memberships om
      WHERE om.organization_id IN (
        SELECT om2.organization_id FROM public.organization_memberships om2
        WHERE om2.user_id = auth.uid()
      )
    )
  );
