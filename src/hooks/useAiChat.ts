import { useState, useCallback, useRef } from "react";
import { AiActionType, AiChatMessage } from "@/types/domain";
import { useToast } from "@/hooks/use-toast";

const CHAT_URL = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/ai-chat`;

interface UseAiChatOptions {
  action?: AiActionType;
  context?: {
    organizationId?: string;
    projectId?: string;
    sprintId?: string;
    ticketId?: string;
  };
}

export function useAiChat(options: UseAiChatOptions = {}) {
  const [messages, setMessages] = useState<AiChatMessage[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const abortControllerRef = useRef<AbortController | null>(null);
  const { toast } = useToast();

  const sendMessage = useCallback(async (content: string) => {
    const userMessage: AiChatMessage = {
      id: Date.now().toString(),
      role: "user",
      content,
      timestamp: new Date(),
      action: options.action,
    };

    setMessages((prev) => [...prev, userMessage]);
    setIsLoading(true);

    // Create abort controller for cancellation
    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch(CHAT_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
        },
        body: JSON.stringify({
          messages: [...messages, userMessage].map((m) => ({
            role: m.role,
            content: m.content,
          })),
          action: options.action || "general_chat",
          context: options.context,
        }),
        signal: abortControllerRef.current.signal,
      });

      if (!response.ok) {
        if (response.status === 429) {
          toast({
            variant: "destructive",
            title: "Rate Limited",
            description: "Too many requests. Please wait a moment and try again.",
          });
          throw new Error("Rate limited");
        }
        if (response.status === 402) {
          toast({
            variant: "destructive",
            title: "Credits Exhausted",
            description: "AI credits have been used up. Please add more credits.",
          });
          throw new Error("Credits exhausted");
        }
        throw new Error(`Request failed: ${response.status}`);
      }

      if (!response.body) {
        throw new Error("No response body");
      }

      // Stream the response
      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let assistantContent = "";
      let textBuffer = "";

      // Create initial assistant message
      const assistantId = (Date.now() + 1).toString();

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        textBuffer += decoder.decode(value, { stream: true });

        // Process line-by-line
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
            const toolCalls = parsed.choices?.[0]?.delta?.tool_calls;

            if (content) {
              assistantContent += content;
              setMessages((prev) => {
                const last = prev[prev.length - 1];
                if (last?.role === "assistant" && last.id === assistantId) {
                  return prev.map((m) =>
                    m.id === assistantId ? { ...m, content: assistantContent } : m
                  );
                }
                return [
                  ...prev,
                  {
                    id: assistantId,
                    role: "assistant",
                    content: assistantContent,
                    timestamp: new Date(),
                  },
                ];
              });
            }

            // Handle tool calls (for create_ticket, triage, etc.)
            if (toolCalls && toolCalls.length > 0) {
              const toolCall = toolCalls[0];
              if (toolCall.function) {
                setMessages((prev) => {
                  const last = prev[prev.length - 1];
                  if (last?.role === "assistant" && last.id === assistantId) {
                    return prev.map((m) =>
                      m.id === assistantId
                        ? {
                            ...m,
                            toolCall: {
                              name: toolCall.function.name,
                              arguments: toolCall.function.arguments
                                ? JSON.parse(toolCall.function.arguments)
                                : {},
                            },
                          }
                        : m
                    );
                  }
                  return prev;
                });
              }
            }
          } catch {
            // Incomplete JSON, put it back
            textBuffer = line + "\n" + textBuffer;
            break;
          }
        }
      }
    } catch (error) {
      if ((error as Error).name === "AbortError") {
        console.log("Request cancelled");
      } else {
        console.error("AI chat error:", error);
        toast({
          variant: "destructive",
          title: "AI Error",
          description: "Failed to get AI response. Please try again.",
        });
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  }, [messages, options.action, options.context, toast]);

  const cancelRequest = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      setIsLoading(false);
    }
  }, []);

  const clearMessages = useCallback(() => {
    setMessages([]);
  }, []);

  const addSystemMessage = useCallback((content: string) => {
    setMessages((prev) => [
      ...prev,
      {
        id: Date.now().toString(),
        role: "assistant",
        content,
        timestamp: new Date(),
      },
    ]);
  }, []);

  return {
    messages,
    isLoading,
    sendMessage,
    cancelRequest,
    clearMessages,
    addSystemMessage,
  };
}
