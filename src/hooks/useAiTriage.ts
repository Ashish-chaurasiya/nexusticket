import { useState, useCallback } from "react";
import { AiTriageData, TicketType } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

const TRIAGE_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-triage`;

interface TriageRequest {
  ticketId?: string;
  title: string;
  description: string;
  type: TicketType;
  projectContext?: {
    projectId: string;
    projectName: string;
    teamMembers?: Array<{ id: string; name: string; role: string }>;
  };
}

interface TriageResponse {
  success: boolean;
  triage?: AiTriageData;
  ticketId?: string;
  error?: string;
}

export function useAiTriage() {
  const [isTriaging, setIsTriaging] = useState(false);
  const [lastTriage, setLastTriage] = useState<AiTriageData | null>(null);
  const { toast } = useToast();

  const triageTicket = useCallback(async (request: TriageRequest): Promise<AiTriageData | null> => {
    setIsTriaging(true);

    try {
      const response = await fetch(TRIAGE_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify(request),
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate Limited",
            description: "Too many requests. Please wait a moment and try again.",
          });
          return null;
        }
        if (response.status === 402) {
          toast({
            variant: "destructive",
            title: "Credits Exhausted",
            description: "AI credits have been used up. Please add more credits.",
          });
          return null;
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      const data: TriageResponse = await response.json();

      if (data.success && data.triage) {
        const triageData: AiTriageData = {
          suggested_priority: data.triage.suggested_priority,
          priority_reasoning: data.triage.priority_reasoning,
          suggested_assignee_role: data.triage.suggested_assignee_role,
          assignment_reasoning: data.triage.assignment_reasoning,
          sla_risk: data.triage.sla_risk,
          sla_risk_reasoning: data.triage.sla_risk_reasoning,
          suggested_labels: data.triage.suggested_labels,
          sprint_recommendation: data.triage.sprint_recommendation,
          estimated_hours: data.triage.estimated_hours,
          triaged_at: new Date().toISOString(),
        };

        setLastTriage(triageData);
        return triageData;
      }

      return null;
    } catch (error) {
      console.error("AI triage error:", error);
      toast({
        variant: "destructive",
        title: "Triage Failed",
        description: "Failed to analyze ticket. Please try again.",
      });
      return null;
    } finally {
      setIsTriaging(false);
    }
  }, [toast]);

  return {
    isTriaging,
    lastTriage,
    triageTicket,
    clearTriage: () => setLastTriage(null),
  };
}
