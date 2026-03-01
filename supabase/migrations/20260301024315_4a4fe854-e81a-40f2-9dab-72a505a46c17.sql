
-- Fix activity_logs INSERT policy to validate user_id
DROP POLICY IF EXISTS "System can insert activity logs" ON public.activity_logs;
CREATE POLICY "Members can insert own activity logs"
  ON public.activity_logs FOR INSERT
  WITH CHECK (
    public.is_member_of_org(auth.uid(), organization_id) AND
    (user_id = auth.uid() OR user_id IS NULL)
  );

-- Fix log_activity RPC to validate user_id matches caller
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
  caller_role TEXT;
BEGIN
  -- Validate caller is the user being logged or has service role
  caller_role := coalesce(current_setting('request.jwt.claim.role', true), '');
  IF p_user_id != auth.uid() AND caller_role != 'service_role' THEN
    RAISE EXCEPTION 'Cannot log activity for other users';
  END IF;

  -- Validate membership
  IF NOT is_member_of_org(auth.uid(), p_org_id) AND caller_role != 'service_role' THEN
    RAISE EXCEPTION 'Not a member of organization';
  END IF;

  INSERT INTO public.activity_logs (organization_id, entity_type, entity_id, action, user_id, details, is_ai_action)
  VALUES (p_org_id, p_entity_type, p_entity_id, p_action, p_user_id, p_details, p_is_ai)
  RETURNING id INTO activity_id;
  
  RETURN activity_id;
END;
$$;

-- Create server-side RPC for auto-accepting invites
CREATE OR REPLACE FUNCTION public.accept_pending_invites_for_user()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_email TEXT;
  invite RECORD;
  existing_membership UUID;
BEGIN
  -- Get the caller's verified email from auth
  SELECT email INTO user_email FROM auth.users WHERE id = auth.uid();
  IF user_email IS NULL THEN
    RETURN;
  END IF;

  -- Find and accept pending invites
  FOR invite IN
    SELECT id, organization_id, role
    FROM public.organization_invites
    WHERE email = lower(user_email)
    AND status = 'pending'
  LOOP
    -- Check if already a member
    SELECT id INTO existing_membership
    FROM public.organization_memberships
    WHERE organization_id = invite.organization_id
    AND user_id = auth.uid();

    IF existing_membership IS NULL THEN
      INSERT INTO public.organization_memberships (organization_id, user_id, role)
      VALUES (invite.organization_id, auth.uid(), invite.role);
    END IF;

    UPDATE public.organization_invites
    SET status = 'accepted', updated_at = now()
    WHERE id = invite.id;
  END LOOP;
END;
$$;
