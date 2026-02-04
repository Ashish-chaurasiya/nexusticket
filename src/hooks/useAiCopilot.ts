import { useState, useCallback, useRef } from "react";
import { CopilotAction } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

const COPILOT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-copilot`;

interface CopilotData {
  tickets?: Array<{
    key: string;
    title: string;
    status: string;
    priority: string;
    type: string;
    assignee?: string;
    createdAt: string;
    updatedAt: string;
  }>;
  sprint?: {
    name: string;
    startDate: string;
    endDate: string;
    goal?: string;
  };
  recentActivity?: Array<{
    action: string;
    entityType: string;
    user: string;
    timestamp: string;
  }>;
}

interface UseCopilotOptions {
  organizationId: string;
  projectId?: string;
  sprintId?: string;
}

export function useAiCopilot(options: UseCopilotOptions) {
  const [response, setResponse] = useState<string>("");
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const runCopilotAction = useCallback(
    async (action: CopilotAction, data: CopilotData) => {
      setIsLoading(true);
      setResponse("");

      abortControllerRef.current = new AbortController();

      try {
        const res = await fetch(COPILOT_URL, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
          },
          body: JSON.stringify({
            action,
            organizationId: options.organizationId,
            projectId: options.projectId,
            sprintId: options.sprintId,
            data,
          }),
          signal: abortControllerRef.current.signal,
        });

        if (!res.ok) {
          if (res.status === 429) {
            toast({
              variant: "destructive",
              title: "Rate Limited",
              description: "Too many requests. Please wait a moment and try again.",
            });
            throw new Error("Rate limited");
          }
          if (res.status === 402) {
            toast({
              variant: "destructive",
              title: "Credits Exhausted",
              description: "AI credits have been used up. Please add more credits.",
            });
            throw new Error("Credits exhausted");
          }
          throw new Error(`Request failed: ${res.status}`);
        }

        if (!res.body) {
          throw new Error("No response body");
        }

        // Stream the response
        const reader = res.body.getReader();
        const decoder = new TextDecoder();
        let fullContent = "";
        let textBuffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          textBuffer += decoder.decode(value, { stream: true });

          let newlineIndex: number;
          while ((newlineIndex = textBuffer.indexOf("\n")) !== -1) {
            let line = textBuffer.slice(0, newlineIndex);
            textBuffer = textBuffer.slice(newlineIndex + 1);

            if (line.endsWith("\r")) line = line.slice(0, -1);
            if (line.startsWith(":") || line.trim() === "") continue;
            if (!line.startsWith("data: ")) continue;

            const jsonStr = line.slice(6).trim();
            if (jsonStr === "[DONE]") break;

            try {
              const parsed = JSON.parse(jsonStr);
              const content = parsed.choices?.[0]?.delta?.content as string | undefined;

              if (content) {
                fullContent += content;
                setResponse(fullContent);
              }
            } catch {
              textBuffer = line + "\n" + textBuffer;
              break;
            }
          }
        }

        return fullContent;
      } catch (error) {
        if ((error as Error).name === "AbortError") {
          console.log("Request cancelled");
        } else {
          console.error("Copilot error:", error);
          toast({
            variant: "destructive",
            title: "Copilot Error",
            description: "Failed to generate insights. Please try again.",
          });
        }
        return null;
      } finally {
        setIsLoading(false);
        abortControllerRef.current = null;
      }
    },
    [options.organizationId, options.projectId, options.sprintId, toast]
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clear = useCallback(() => {
    setResponse("");
  }, []);

  return {
    response,
    isLoading,
    runCopilotAction,
    cancel,
    clear,
  };
}
