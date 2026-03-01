

# Full Site Verification Report

## Overall Status: Functional with 6 issues to fix

---

## What's Working

- **Authentication**: Login/Signup flows with email + password, profile creation, auth guards
- **Organization system**: Create org, invite members, role-based access (admin/manager/member)
- **Ticket engine**: CRUD with auto-generated keys (trigger confirmed attached), Kanban + list views
- **AI integration**: Chat, triage, copilot edge functions with JWT auth, input validation, streaming
- **Dashboard**: Wired to real data (stats, recent tickets, activity, sprint progress)
- **Team page**: Member list, invite sending, role management, invite revocation
- **Email invites**: Resend integration via edge function, styled HTML emails
- **Invite acceptance**: Server-side RPC `accept_pending_invites_for_user` auto-joins on login
- **RLS policies**: All 10 tables have RLS enabled with org-scoped isolation
- **Database triggers**: `set_ticket_key` trigger confirmed on `tickets` table

---

## Issues Found (6)

### Issue 1: CORS Header Mismatch on `send-invite-email` (Bug)

The `send-invite-email` edge function uses a shorter CORS header list:
```
authorization, x-client-info, apikey, content-type
```
All other edge functions use the full set including `x-supabase-client-platform` etc. This can cause CORS preflight failures for some client SDK versions.

**Fix**: Update CORS headers in `send-invite-email` to match the full set used by other functions.

---

### Issue 2: `organization_invites` Token Exposed to Client (Security - Medium)

In `Team.tsx` line 193, the invite mutation selects `.select("id, token")` after inserting an invite, then passes the token to the edge function. While the token is needed for email links, exposing it to the browser means any admin user can see raw invite tokens in network requests.

**Fix**: Move token retrieval inside the `send-invite-email` edge function. The client should pass the `inviteId` only; the edge function should look up the token server-side using service role.

---

### Issue 3: `AcceptInvite` Page Queries by Token Without Auth (Security - Low)

The `/invite` page queries `organization_invites` by token column. The RLS policies allow viewing invites by email match or admin status. An unauthenticated user landing on `/invite?token=xxx` won't be able to query the invite (RLS blocks it), causing a poor UX where the invite appears invalid when the user simply needs to sign up first.

**Fix**: Show a clear message: "Sign up or log in to accept this invitation" instead of "Invalid invite" when the query fails for unauthenticated users.

---

### Issue 4: Leaked Password Protection Disabled (Infrastructure)

The database linter and security scan both flag that leaked password protection is disabled. This is a configuration-only change.

**Fix**: Enable leaked password protection in the authentication settings. This cannot be done via code -- it requires manual configuration.

---

### Issue 5: `activity_logs` and `org_ai_recommendations` Lack Tamper Protection (Security - Low)

These tables have no UPDATE or DELETE policies, relying on the absence of policies to block those operations. While this works (RLS defaults to deny), explicit deny policies would be more robust.

**Fix**: No action strictly required since RLS deny-by-default blocks these operations. Optionally add explicit deny policies for defense-in-depth.

---

### Issue 6: Profile Email Visibility (Security - Info)

Profiles table exposes email to all org members via the peer profiles RLS policy. This is by design for team features (showing assignee names/emails) but flagged by the security scanner.

**Fix**: This is acceptable for the team collaboration use case. No change needed unless privacy requirements dictate otherwise.

---

## Implementation Plan

### Step 1: Fix CORS headers in `send-invite-email`

Update the `corsHeaders` object to include the full `x-supabase-client-*` headers matching all other edge functions.

### Step 2: Move invite token retrieval server-side

- Modify `send-invite-email` edge function to accept `inviteId` and look up the token using service role client
- Update `Team.tsx` to stop selecting/passing `token` from the client

### Step 3: Improve AcceptInvite UX for unauthenticated users

- In `AcceptInvite.tsx`, detect when user is not authenticated and show a sign-up/login prompt instead of "Invalid invite"
- Pass the token as a query param to login/signup so users return to `/invite?token=xxx` after auth

### Step 4: Add explicit deny policies (optional hardening)

- Add `UPDATE/DELETE USING (false)` policies on `activity_logs` and `org_ai_recommendations` via migration

---

## Technical Details

### Files to modify:
1. `supabase/functions/send-invite-email/index.ts` -- CORS fix + server-side token lookup
2. `src/pages/Team.tsx` -- Remove token from client-side invite flow
3. `src/pages/onboarding/AcceptInvite.tsx` -- Better UX for unauthenticated users
4. New migration -- Explicit deny policies for `activity_logs` and `org_ai_recommendations`

### Files unchanged:
- All hooks, contexts, dashboard, kanban, AI functions remain as-is
- Auth flow, org context, RLS policies for core tables all verified correct

