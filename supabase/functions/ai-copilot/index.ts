import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

type CopilotAction = "sprint_summary" | "project_analysis" | "team_insights" | "standup_prep";

const VALID_ACTIONS: CopilotAction[] = ["sprint_summary", "project_analysis", "team_insights", "standup_prep"];

const ACTION_PROMPTS: Record<CopilotAction, string> = {
  sprint_summary: `You are a Manager AI Copilot providing sprint summaries. Analyze the sprint data and provide:

1. **Sprint Progress**
   - Completed tickets count and percentage
   - In-progress work
   - Remaining work

2. **Key Accomplishments**
   - Major features delivered
   - Important bugs fixed

3. **Blockers & Risks**
   - Blocked tickets and why
   - Tickets at risk of not completing

4. **Team Velocity**
   - Ticket throughput
   - Comparison to sprint goal

5. **Recommendations**
   - Actions for the next standup
   - Priority adjustments needed

Format for easy consumption in team meetings. Be concise but comprehensive.`,

  project_analysis: `You are a Manager AI Copilot providing project health analysis. Analyze the project data and provide:

1. **Overall Health Score** (1-10 with reasoning)

2. **Ticket Distribution**
   - By status
   - By priority
   - By type

3. **Bottlenecks**
   - Tickets stuck in review
   - Aging tickets (> 7 days without update)
   - Blocked work

4. **Resource Insights**
   - Workload distribution
   - Overloaded team members

5. **Recommendations**
   - Priority realignment suggestions
   - Process improvements
   - Risk mitigation actions

Be data-driven and actionable.`,

  team_insights: `You are a Manager AI Copilot providing team performance insights. Analyze the data and provide:

1. **Workload Distribution**
   - Tickets per team member
   - Balance assessment

2. **Velocity Metrics**
   - Tickets completed per person
   - Average time to completion

3. **Collaboration Patterns**
   - Cross-functional work
   - Review bottlenecks

4. **Recommendations**
   - Load balancing suggestions
   - Skill development areas

Be constructive and supportive in tone.`,

  standup_prep: `You are a Manager AI Copilot helping prepare for standup meetings. Provide:

1. **Yesterday's Highlights**
   - Completed tickets
   - Major progress

2. **Today's Focus**
   - Critical tickets to address
   - Upcoming deadlines

3. **Blockers to Discuss**
   - Currently blocked items
   - Items needing decisions

4. **Quick Stats**
   - Sprint burn-down status
   - Days remaining

Keep it brief - this is for a 15-minute standup.`
};

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    // Authenticate user
    const authHeader = req.headers.get("Authorization");
    if (!authHeader?.startsWith("Bearer ")) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const supabase = createClient(
      Deno.env.get("SUPABASE_URL")!,
      Deno.env.get("SUPABASE_ANON_KEY")!,
      { global: { headers: { Authorization: authHeader } } }
    );

    const token = authHeader.replace("Bearer ", "");
    const { data: claims, error: claimsError } = await supabase.auth.getClaims(token);
    if (claimsError || !claims?.claims) {
      return new Response(
        JSON.stringify({ error: "Unauthorized" }),
        { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) {
      console.error("LOVABLE_API_KEY is not configured");
      return new Response(
        JSON.stringify({ error: "AI service is not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const body = await req.json();

    // Input validation
    const action = body.action;
    if (!action || !VALID_ACTIONS.includes(action)) {
      return new Response(
        JSON.stringify({ error: "Invalid action. Must be one of: " + VALID_ACTIONS.join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!body.organizationId || typeof body.organizationId !== "string") {
      return new Response(
        JSON.stringify({ error: "organizationId is required" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const data = body.data;

    // Build context from provided data
    let dataContext = "";
    
    if (data?.sprint) {
      dataContext += `\n## Sprint Information
Name: ${String(data.sprint.name || "").substring(0, 200)}
Period: ${String(data.sprint.startDate || "").substring(0, 20)} to ${String(data.sprint.endDate || "").substring(0, 20)}
Goal: ${String(data.sprint.goal || "Not specified").substring(0, 500)}`;
    }

    if (data?.tickets && Array.isArray(data.tickets) && data.tickets.length > 0) {
      const tickets = data.tickets.slice(0, 100); // Limit to 100 tickets
      dataContext += `\n\n## Tickets (${tickets.length} total)`;
      
      const byStatus: Record<string, typeof tickets> = {};
      tickets.forEach((t: { status?: string; key?: string; title?: string; priority?: string; type?: string; assignee?: string }) => {
        const status = String(t.status || "unknown").substring(0, 50);
        if (!byStatus[status]) byStatus[status] = [];
        byStatus[status].push(t);
      });

      Object.entries(byStatus).forEach(([status, statusTickets]) => {
        dataContext += `\n\n### ${status.replace("_", " ").toUpperCase()} (${statusTickets.length})`;
        statusTickets.slice(0, 10).forEach((t: { key?: string; title?: string; priority?: string; type?: string; assignee?: string }) => {
          dataContext += `\n- [${String(t.key || "").substring(0, 20)}] ${String(t.title || "").substring(0, 200)} (${t.priority}, ${t.type}${t.assignee ? `, assigned to ${String(t.assignee).substring(0, 100)}` : ""})`;
        });
        if (statusTickets.length > 10) {
          dataContext += `\n- ... and ${statusTickets.length - 10} more`;
        }
      });
    }

    if (data?.recentActivity && Array.isArray(data.recentActivity) && data.recentActivity.length > 0) {
      dataContext += `\n\n## Recent Activity`;
      data.recentActivity.slice(0, 10).forEach((a: { user?: string; action?: string; entityType?: string; timestamp?: string }) => {
        dataContext += `\n- ${String(a.user || "").substring(0, 100)} ${String(a.action || "").substring(0, 100)} ${String(a.entityType || "").substring(0, 50)} (${String(a.timestamp || "").substring(0, 30)})`;
      });
    }

    const userMessage = `Analyze the following data and provide your ${action.replace("_", " ")}:${dataContext}`;

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: ACTION_PROMPTS[action as CopilotAction] },
          { role: "user", content: userMessage }
        ],
        stream: true
      })
    });

    if (!response.ok) {
      if (response.status === 429) {
        return new Response(
          JSON.stringify({ error: "Rate limit exceeded. Please try again in a moment." }),
          { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (response.status === 402) {
        return new Response(
          JSON.stringify({ error: "AI credits exhausted. Please add credits to continue." }),
          { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      console.error("AI gateway error:", response.status);
      return new Response(
        JSON.stringify({ error: "AI service temporarily unavailable" }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    return new Response(response.body, {
      headers: { ...corsHeaders, "Content-Type": "text/event-stream" }
    });
  } catch (error) {
    console.error("AI copilot error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
