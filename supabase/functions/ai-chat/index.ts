import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

// AI Action Types
type ActionType = 
  | "create_ticket"
  | "triage_ticket"
  | "analyze_project"
  | "summarize_sprint"
  | "general_chat";

interface ChatRequest {
  messages: Array<{ role: "user" | "assistant"; content: string }>;
  action?: ActionType;
  context?: {
    organizationId?: string;
    projectId?: string;
    sprintId?: string;
    ticketId?: string;
  };
}

const SYSTEM_PROMPTS: Record<ActionType, string> = {
  create_ticket: `You are Nexus AI, an intelligent ticket creation assistant. Your role is to help users create well-structured tickets through conversation.

WORKFLOW:
1. First, understand what the user wants to report or request
2. Ask clarifying questions to gather: title, description, type (bug/task/story/support), priority
3. Once you have enough information, call the create_ticket function with structured data

GUIDELINES:
- Be conversational but efficient
- Suggest appropriate ticket type based on context
- Infer priority from urgency cues
- Extract labels from the description
- Always confirm before creating

When ready to create, use the create_ticket tool with the structured data.`,

  triage_ticket: `You are Nexus AI, an intelligent ticket triage assistant. Analyze tickets and provide recommendations.

Your analysis should include:
1. Priority assessment (critical/high/medium/low) with reasoning
2. Suggested assignee based on ticket type and content
3. SLA risk assessment (low/medium/high)
4. Recommended sprint placement
5. Suggested labels

Use the triage_ticket tool to return structured triage data.`,

  analyze_project: `You are Nexus AI, a project analysis assistant. Analyze project health and provide actionable insights.

Analyze and report on:
1. Velocity trends
2. Blockers and risks
3. Resource allocation
4. Sprint health
5. Ticket aging analysis
6. Recommendations for improvement

Be data-driven and specific with your insights.`,

  summarize_sprint: `You are Nexus AI, a sprint summarization assistant for managers.

Provide:
1. Sprint progress summary (completed vs remaining)
2. Key accomplishments
3. Blockers and risks
4. Team velocity
5. Tickets at risk of not completing
6. Recommendations for the next standup

Format for easy consumption in meetings.`,

  general_chat: `You are Nexus AI, an intelligent assistant for the Nexus ticket management platform.

You can help with:
- Creating and managing tickets
- Analyzing project health
- Summarizing sprint status
- Answering questions about the platform
- Providing insights and recommendations

Be helpful, concise, and proactive in suggesting actions.`
};

const TOOLS = {
  create_ticket: {
    type: "function",
    function: {
      name: "create_ticket",
      description: "Create a new ticket with structured data",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Clear, concise ticket title" },
          description: { type: "string", description: "Detailed description of the ticket" },
          type: { type: "string", enum: ["bug", "task", "story", "support"], description: "Type of ticket" },
          priority: { type: "string", enum: ["critical", "high", "medium", "low"], description: "Priority level" },
          labels: { type: "array", items: { type: "string" }, description: "Relevant labels" },
          estimateHours: { type: "number", description: "Estimated hours to complete" }
        },
        required: ["title", "description", "type", "priority"]
      }
    }
  },
  triage_ticket: {
    type: "function",
    function: {
      name: "triage_ticket",
      description: "Return structured triage recommendations for a ticket",
      parameters: {
        type: "object",
        properties: {
          suggestedPriority: { type: "string", enum: ["critical", "high", "medium", "low"] },
          priorityReasoning: { type: "string" },
          suggestedAssigneeRole: { type: "string", enum: ["frontend", "backend", "fullstack", "qa", "devops"] },
          slaRisk: { type: "string", enum: ["low", "medium", "high"] },
          slaRiskReasoning: { type: "string" },
          suggestedLabels: { type: "array", items: { type: "string" } },
          sprintRecommendation: { type: "string" }
        },
        required: ["suggestedPriority", "priorityReasoning", "slaRisk"]
      }
    }
  }
};

const VALID_ACTIONS: ActionType[] = ["create_ticket", "triage_ticket", "analyze_project", "summarize_sprint", "general_chat"];

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
    const messages = body.messages;
    if (!Array.isArray(messages) || messages.length === 0 || messages.length > 50) {
      return new Response(
        JSON.stringify({ error: "Invalid messages: must be an array of 1-50 messages" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    for (const msg of messages) {
      if (!msg.role || !["user", "assistant"].includes(msg.role)) {
        return new Response(
          JSON.stringify({ error: "Invalid message role" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (typeof msg.content !== "string" || msg.content.length > 10000) {
        return new Response(
          JSON.stringify({ error: "Invalid message content" }),
          { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
    }

    const action: ActionType = VALID_ACTIONS.includes(body.action) ? body.action : "general_chat";
    const context = body.context;

    // Build the request to AI gateway
    const systemPrompt = SYSTEM_PROMPTS[action];
    const aiMessages = [
      { role: "system", content: systemPrompt },
      ...messages
    ];

    // Add context to the last user message if available
    if (context && messages.length > 0) {
      const contextInfo = `\n\n[Context: Organization ${context.organizationId}, Project ${context.projectId}]`;
      const lastUserIndex = messages.length - 1;
      if (messages[lastUserIndex].role === "user") {
        aiMessages[aiMessages.length - 1] = {
          ...aiMessages[aiMessages.length - 1],
          content: messages[lastUserIndex].content + contextInfo
        };
      }
    }

    // Prepare request body with optional tools
    const requestBody: Record<string, unknown> = {
      model: "google/gemini-3-flash-preview",
      messages: aiMessages,
      stream: true
    };

    // Add tools for specific actions
    if (action === "create_ticket") {
      requestBody.tools = [TOOLS.create_ticket];
    } else if (action === "triage_ticket") {
      requestBody.tools = [TOOLS.triage_ticket];
      requestBody.tool_choice = { type: "function", function: { name: "triage_ticket" } };
    }

    const response = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json"
      },
      body: JSON.stringify(requestBody)
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
    console.error("AI chat error:", error);
    return new Response(
      JSON.stringify({ error: "An unexpected error occurred" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
