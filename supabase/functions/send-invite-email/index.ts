import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";
import { Resend } from "https://esm.sh/resend@2.0.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate: require service role or authenticated admin
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const token = authHeader.replace("Bearer ", "");
    const serviceRoleKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    
    // Allow service role calls (from create-organization-bootstrap) or authenticated users
    if (token !== serviceRoleKey) {
      const supabase = createClient(
        Deno.env.get("SUPABASE_URL")!,
        Deno.env.get("SUPABASE_ANON_KEY")!,
        { global: { headers: { Authorization: authHeader } } }
      );

      const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
      if (claimsError || !claims?.claims) {
        return new Response(
          JSON.stringify({ error: "Unauthorized" }),
          { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const resendApiKey = Deno.env.get("RESEND_API_KEY");
    if (!resendApiKey) {
      console.error("RESEND_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "Email service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const resend = new Resend(resendApiKey);

    const body = await req.json();
    const { email, organizationName, role, token: inviteToken, inviterName } = body;

    // Input validation
    if (!email || typeof email !== "string" || !email.includes("@") || email.length > 255) {
      return new Response(
        JSON.stringify({ error: "Valid email is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!organizationName || typeof organizationName !== "string" || organizationName.length > 200) {
      return new Response(
        JSON.stringify({ error: "Valid organization name is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!inviteToken || typeof inviteToken !== "string") {
      return new Response(
        JSON.stringify({ error: "Token is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Use environment variable for app URL with fallback
    const appUrl = Deno.env.get("APP_URL") || "https://nexusticket.lovable.app";
    const inviteUrl = `${appUrl}/invite?token=${encodeURIComponent(inviteToken)}`;

    const safeOrgName = organizationName.replace(/[<>&"']/g, "");
    const safeEmail = email.replace(/[<>&"']/g, "");
    const roleLabel = (role || "member").charAt(0).toUpperCase() + (role || "member").slice(1);
    const safeInviterName = inviterName ? String(inviterName).replace(/[<>&"']/g, "").substring(0, 100) : null;

    const emailHtml = `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>You're Invited to Join ${safeOrgName}</title>
</head>
<body style="margin: 0; padding: 0; background-color: #0a0b0f; font-family: 'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background-color: #0a0b0f; padding: 40px 20px;">
    <tr>
      <td align="center">
        <table width="100%" max-width="500" cellpadding="0" cellspacing="0" style="max-width: 500px; background-color: #12141c; border-radius: 12px; border: 1px solid #1e2130; overflow: hidden;">
          <tr>
            <td style="padding: 32px 32px 24px; text-align: center; border-bottom: 1px solid #1e2130;">
              <div style="display: inline-flex; align-items: center; justify-content: center; width: 48px; height: 48px; background: linear-gradient(135deg, #3b82f6, #8b5cf6); border-radius: 12px; margin-bottom: 16px;">
                <span style="font-size: 24px;">✨</span>
              </div>
              <h1 style="margin: 0; color: #f8fafc; font-size: 24px; font-weight: 600;">You're Invited!</h1>
            </td>
          </tr>
          <tr>
            <td style="padding: 32px;">
              <p style="margin: 0 0 16px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                ${safeInviterName ? `${safeInviterName} has` : "You've been"} invited to join <strong style="color: #f8fafc;">${safeOrgName}</strong> on Nexus as a <strong style="color: #f8fafc;">${roleLabel}</strong>.
              </p>
              <p style="margin: 0 0 24px; color: #94a3b8; font-size: 15px; line-height: 1.6;">
                Nexus is an AI-first ticket management platform that helps teams collaborate, track work, and ship faster.
              </p>
              <table width="100%" cellpadding="0" cellspacing="0">
                <tr>
                  <td align="center" style="padding: 8px 0 24px;">
                    <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6, #6366f1); color: #ffffff; text-decoration: none; font-weight: 600; font-size: 15px; padding: 14px 32px; border-radius: 8px; box-shadow: 0 4px 14px rgba(59, 130, 246, 0.4);">
                      Accept Invitation
                    </a>
                  </td>
                </tr>
              </table>
              <div style="background-color: #1a1d2a; border-radius: 8px; padding: 16px; margin-bottom: 24px;">
                <p style="margin: 0 0 8px; color: #64748b; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Your Role</p>
                <p style="margin: 0; color: #f8fafc; font-size: 14px; font-weight: 500;">${roleLabel}</p>
              </div>
              <p style="margin: 0; color: #64748b; font-size: 13px; line-height: 1.6;">
                If the button doesn't work, copy and paste this link into your browser:
              </p>
              <p style="margin: 8px 0 0; word-break: break-all;">
                <a href="${inviteUrl}" style="color: #3b82f6; font-size: 13px; text-decoration: none;">${inviteUrl}</a>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding: 24px 32px; background-color: #0d0f14; border-top: 1px solid #1e2130; text-align: center;">
              <p style="margin: 0 0 8px; color: #64748b; font-size: 13px;">
                This invitation was sent to ${safeEmail}
              </p>
              <p style="margin: 0; color: #475569; font-size: 12px;">
                If you didn't expect this invitation, you can safely ignore this email.
              </p>
            </td>
          </tr>
        </table>
        <table width="100%" cellpadding="0" cellspacing="0" style="max-width: 500px; margin-top: 24px;">
          <tr>
            <td align="center">
              <p style="margin: 0; color: #475569; font-size: 12px;">
                Powered by <strong style="color: #64748b;">Nexus</strong> · AI-First Ticket Management
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>
    `;

    const emailResponse = await resend.emails.send({
      from: "Nexus <onboarding@resend.dev>",
      to: [email],
      subject: `You're invited to join ${safeOrgName} on Nexus`,
      html: emailHtml,
    });

    return new Response(
      JSON.stringify({ success: true, messageId: emailResponse.data?.id }),
      {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Error sending invite email:", error);
    return new Response(
      JSON.stringify({ error: "Failed to send invitation email" }),
      {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
