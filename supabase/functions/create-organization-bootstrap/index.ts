import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

interface BootstrapRequest {
  name: string;
  template?: "startup" | "enterprise";
  isDemo?: boolean;
  invites?: Array<{ email: string; role: "admin" | "manager" | "member" }>;
}

interface DemoTicket {
  title: string;
  description: string;
  type: "bug" | "task" | "story" | "support";
  priority: "critical" | "high" | "medium" | "low";
  status: "todo" | "in_progress" | "review" | "done" | "blocked";
  labels: string[];
}

const DEMO_TICKETS: DemoTicket[] = [
  {
    title: "User cannot log in after password reset",
    description: "Users report being unable to log in after requesting a password reset. The reset email is received, but after clicking the link and setting a new password, login attempts fail with 'Invalid credentials'.",
    type: "bug",
    priority: "high",
    status: "todo",
    labels: ["auth", "critical-path"],
  },
  {
    title: "Set up CI/CD pipeline",
    description: "Configure GitHub Actions workflow for automated testing and deployment. Should include:\n- Unit test runner\n- Build verification\n- Staging deployment\n- Production deployment approval",
    type: "task",
    priority: "medium",
    status: "in_progress",
    labels: ["devops", "infrastructure"],
  },
  {
    title: "Design user onboarding flow",
    description: "Create a seamless first-time user experience that guides users through:\n1. Account setup\n2. Team creation\n3. First project setup\n4. Tutorial walkthrough",
    type: "story",
    priority: "medium",
    status: "review",
    labels: ["ux", "onboarding"],
  },
  {
    title: "Dashboard loading performance",
    description: "The main dashboard takes 3+ seconds to load. Need to investigate and optimize:\n- API response times\n- Bundle size\n- Lazy loading opportunities",
    type: "bug",
    priority: "low",
    status: "todo",
    labels: ["performance", "frontend"],
  },
];

async function logStep(
  supabase: ReturnType<typeof createClient>,
  organizationId: string,
  step: string,
  status: "pending" | "done" | "error" = "done"
) {
  await supabase.from("org_provisioning_steps").insert({
    organization_id: organizationId,
    step,
    status,
  });
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseServiceKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    
    const supabase = createClient(supabaseUrl, supabaseServiceKey);

    // Get the user from the auth header
    const authHeader = req.headers.get("Authorization");
    if (!authHeader) {
      throw new Error("Missing authorization header");
    }

    const token = authHeader.replace("Bearer ", "");
    const { data: { user }, error: userError } = await supabase.auth.getUser(token);
    
    if (userError || !user) {
      throw new Error("Unauthorized");
    }

    const body: BootstrapRequest = await req.json();
    const { name, template = "startup", isDemo = true, invites = [] } = body;

    if (!name || name.trim().length === 0) {
      throw new Error("Organization name is required");
    }

    // Generate slug from name
    const slug = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "")
      .substring(0, 50);

    // 1️⃣ Create Organization
    const { data: org, error: orgError } = await supabase
      .from("organizations")
      .insert({
        name: name.trim(),
        slug: `${slug}-${Date.now()}`,
        template,
        is_demo: isDemo,
      })
      .select()
      .single();

    if (orgError) {
      console.error("Org creation error:", orgError);
      throw new Error(`Failed to create organization: ${orgError.message}`);
    }

    await logStep(supabase, org.id, "Organization created");

    // 2️⃣ Create Admin Membership
    const { error: membershipError } = await supabase
      .from("organization_memberships")
      .insert({
        organization_id: org.id,
        user_id: user.id,
        role: "admin",
      });

    if (membershipError) {
      console.error("Membership error:", membershipError);
      throw new Error(`Failed to create membership: ${membershipError.message}`);
    }

    await logStep(supabase, org.id, "Admin role assigned");

    // 3️⃣ Create Default Project
    const projectKey = name.substring(0, 3).toUpperCase().replace(/[^A-Z]/g, "X");
    const projectName = template === "enterprise" ? "Platform" : "Core";

    const { data: project, error: projectError } = await supabase
      .from("projects")
      .insert({
        organization_id: org.id,
        name: projectName,
        key: projectKey,
        description: "Auto-created starter project for your team",
        ticket_counter: 0,
      })
      .select()
      .single();

    if (projectError) {
      console.error("Project error:", projectError);
      throw new Error(`Failed to create project: ${projectError.message}`);
    }

    await logStep(supabase, org.id, "Default project created");

    // 4️⃣ Create Default Sprint
    const startDate = new Date();
    const endDate = new Date();
    endDate.setDate(startDate.getDate() + 14);

    const { data: sprint, error: sprintError } = await supabase
      .from("sprints")
      .insert({
        organization_id: org.id,
        project_id: project.id,
        name: "Sprint 1",
        status: "active",
        start_date: startDate.toISOString().split("T")[0],
        end_date: endDate.toISOString().split("T")[0],
        goal: "Initial sprint - get started with your first tasks",
      })
      .select()
      .single();

    if (sprintError) {
      console.error("Sprint error:", sprintError);
      throw new Error(`Failed to create sprint: ${sprintError.message}`);
    }

    await logStep(supabase, org.id, "Sprint activated");

    // 5️⃣ Seed Demo Tickets (if enabled)
    if (isDemo && template === "startup") {
      const ticketsToInsert = DEMO_TICKETS.map((ticket, index) => ({
        organization_id: org.id,
        project_id: project.id,
        sprint_id: sprint.id,
        title: ticket.title,
        description: ticket.description,
        type: ticket.type,
        priority: ticket.priority,
        status: ticket.status,
        labels: ticket.labels,
        reporter_id: user.id,
        ai_generated: true,
        key: `${projectKey}-${index + 1}`,
      }));

      // Update project counter
      await supabase
        .from("projects")
        .update({ ticket_counter: DEMO_TICKETS.length })
        .eq("id", project.id);

      const { error: ticketsError } = await supabase
        .from("tickets")
        .insert(ticketsToInsert);

      if (ticketsError) {
        console.error("Tickets error:", ticketsError);
        // Non-blocking - continue even if demo tickets fail
      } else {
        await logStep(supabase, org.id, "Demo tickets created");
      }
    }

    // 6️⃣ Process Invites
    if (invites.length > 0) {
      const invitesToInsert = invites
        .filter((inv) => inv.email && inv.email.includes("@"))
        .map((inv) => ({
          organization_id: org.id,
          email: inv.email.toLowerCase().trim(),
          role: inv.role || "member",
          invited_by: user.id,
          status: "pending",
        }));

      if (invitesToInsert.length > 0) {
        const { data: insertedInvites, error: invitesError } = await supabase
          .from("organization_invites")
          .insert(invitesToInsert)
          .select("id, email, role, token");

        if (invitesError) {
          console.error("Invites error:", invitesError);
          // Non-blocking
        } else if (insertedInvites) {
          // Send invite emails via edge function
          for (const invite of insertedInvites) {
            try {
              await fetch(`${supabaseUrl}/functions/v1/send-invite-email`, {
                method: "POST",
                headers: {
                  "Content-Type": "application/json",
                  "Authorization": `Bearer ${supabaseServiceKey}`,
                },
                body: JSON.stringify({
                  inviteId: invite.id,
                  email: invite.email,
                  organizationName: name,
                  role: invite.role,
                  token: invite.token,
                }),
              });
            } catch (emailErr) {
              console.error("Failed to send invite email:", emailErr);
            }
          }
          await logStep(supabase, org.id, `${insertedInvites.length} invite(s) sent`);
        }
      }
    }

    // 7️⃣ Generate AI Recommendations (non-blocking)
    const recommendations = [
      "Create labels for better ticket organization",
      "Invite your team members to collaborate",
      "Set up your first milestone or epic",
      "Configure notification preferences",
    ];

    await supabase.from("org_ai_recommendations").insert({
      organization_id: org.id,
      recommendations,
    });

    await logStep(supabase, org.id, "Setup complete");

    return new Response(
      JSON.stringify({
        success: true,
        organization: org,
        project,
        sprint,
        redirectTo: `/projects/${project.id}`,
      }),
      {
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  } catch (error) {
    console.error("Bootstrap error:", error);
    return new Response(
      JSON.stringify({
        success: false,
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      }
    );
  }
});
