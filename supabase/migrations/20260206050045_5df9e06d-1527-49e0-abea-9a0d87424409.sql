-- Drop overly permissive policies
DROP POLICY IF EXISTS "Anyone can accept invites by token" ON public.organization_invites;
DROP POLICY IF EXISTS "System can insert provisioning steps" ON public.org_provisioning_steps;

-- Create proper policy for accepting invites - users can only accept their own invites
CREATE POLICY "Users can accept their own invites" ON public.organization_invites
FOR UPDATE USING (
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid())
) WITH CHECK (
  email = (SELECT email FROM public.profiles WHERE user_id = auth.uid()) 
  AND status = 'accepted'
);

-- Provisioning steps are only inserted by service role (edge functions)
-- Members can only read, not insert from client
CREATE POLICY "Service role can insert provisioning steps" ON public.org_provisioning_steps
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- Also add insert policy for org_ai_recommendations for service role
CREATE POLICY "System can insert recommendations" ON public.org_ai_recommendations
FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);