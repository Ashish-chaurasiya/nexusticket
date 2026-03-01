import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface TriageResult {
  suggestedPriority: "critical" | "high" | "medium" | "low";
  priorityReasoning: string;
  suggestedAssigneeId?: string;
  suggestedAssigneeName?: string;
  assignmentReasoning?: string;
  slaRisk: "low" | "medium" | "high";
  slaRiskReasoning: string;
  suggestedLabels: string[];
  sprintRecommendation: string;
  estimatedHours?: number;
}

const TRIAGE_SYSTEM_PROMPT = `You are an expert ticket triage AI for a software development team. Analyze the ticket and provide accurate triage recommendations.

ANALYSIS GUIDELINES:
1. Priority Assessment:
   - critical: Production down, security breach, data loss risk
   - high: Major feature broken, blocking other work, customer-facing issue
   - medium: Important but not urgent, can wait for next sprint
   - low: Nice to have, minor improvements, tech debt

2. SLA Risk Assessment:
   - high: Needs immediate attention, risk of SLA breach
   - medium: Should be addressed within the sprint
   - low: Can be planned for future sprints

3. Label Suggestions: Infer relevant labels from content (e.g., "auth", "ui", "api", "performance", "security")

4. Sprint Recommendation: Suggest current sprint, next sprint, or backlog based on priority and complexity

Return structured triage data using the triage_ticket function.`;

const TRIAGE_TOOL = {
  type: "function",
  function: {
    name: "triage_ticket",
    description: "Return structured triage recommendations",
    parameters: {
      type: "object",
      properties: {
        suggestedPriority: { 
          type: "string", 
          enum: ["critical", "high", "medium", "low"],
          description: "Recommended priority level"
        },
        priorityReasoning: { 
          type: "string",
          description: "Brief explanation for priority recommendation"
        },
        suggestedAssigneeRole: { 
          type: "string", 
          enum: ["frontend", "backend", "fullstack", "qa", "devops", "design"],
          description: "Type of engineer best suited for this ticket"
        },
        assignmentReasoning: {
          type: "string",
          description: "Why this type of engineer should handle it"
        },
        slaRisk: { 
          type: "string", 
          enum: ["low", "medium", "high"],
          description: "Risk level for SLA compliance"
        },
        slaRiskReasoning: { 
          type: "string",
          description: "Explanation of SLA risk assessment"
        },
        suggestedLabels: { 
          type: "array", 
          items: { type: "string" },
          description: "Relevant labels based on ticket content"
        },
        sprintRecommendation: { 
          type: "string",
          description: "Recommendation: 'current_sprint', 'next_sprint', or 'backlog'"
        },
        estimatedHours: {
          type: "number",
          description: "Estimated hours to complete based on complexity"
        }
      },
      required: ["suggestedPriority", "priorityReasoning", "slaRisk", "slaRiskReasoning", "suggestedLabels", "sprintRecommendation"]
    }
  }
};

const VALID_TYPES = ["bug", "task", "story", "support"];

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
    const title = body.title;
    const description = body.description;
    const type = body.type;

    if (!title || typeof title !== "string" || title.length > 500) {
      return new Response(
        JSON.stringify({ error: "Title is required and must be under 500 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!description || typeof description !== "string" || description.length > 10000) {
      return new Response(
        JSON.stringify({ error: "Description is required and must be under 10000 characters" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    if (!type || !VALID_TYPES.includes(type)) {
      return new Response(
        JSON.stringify({ error: "Type must be one of: " + VALID_TYPES.join(", ") }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const ticketId = body.ticketId;
    const projectContext = body.projectContext;

    // Build context message
    let userMessage = `Analyze and triage this ${type} ticket:

Title: ${title}

Description:
${description}`;

    if (projectContext) {
      userMessage += `\n\nProject: ${String(projectContext.projectName || "").substring(0, 200)}`;
      if (projectContext.teamMembers && Array.isArray(projectContext.teamMembers) && projectContext.teamMembers.length > 0) {
        userMessage += `\nTeam Members: ${projectContext.teamMembers.slice(0, 20).map((m: { name?: string; role?: string }) => `${String(m.name || "").substring(0, 100)} (${String(m.role || "").substring(0, 50)})`).join(", ")}`;
      }
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify({
        model: "google/gemini-3-flash-preview",
        messages: [
          { role: "system", content: TRIAGE_SYSTEM_PROMPT },
          { role: "user", content: userMessage }
        ],
        tools: [TRIAGE_TOOL],
        tool_choice: { type: "function", function: { name: "triage_ticket" } }
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

    const data = await response.json();
    
    // Extract the triage result from tool call
    const toolCall = data.choices?.[0]?.message?.tool_calls?.[0];
    if (toolCall && toolCall.function.name === "triage_ticket") {
      const triageResult: TriageResult = JSON.parse(toolCall.function.arguments);
      
      return new Response(
        JSON.stringify({ 
          success: true, 
          triage: triageResult,
          ticketId 
        }),
        { headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Fallback to content if no tool call
    return new Response(
      JSON.stringify({ 
        success: true, 
        message: data.choices?.[0]?.message?.content 
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    console.error("AI triage error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
