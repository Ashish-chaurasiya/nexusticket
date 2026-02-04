import { useState, useRef, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { Sparkles, Send, X, Minimize2, Maximize2, Loader2, StopCircle } from "lucide-react";
import { useAiChat } from "@/hooks/useAiChat";
import { AiActionType } from "@/types/domain";
import ReactMarkdown from "react-markdown";

interface AiChatPanelProps {
  organizationId?: string;
  projectId?: string;
  sprintId?: string;
  defaultAction?: AiActionType;
}

const suggestedActions: Array<{ label: string; action: AiActionType; prompt: string }> = [
  { label: "Create a new ticket", action: "create_ticket", prompt: "I need to create a new ticket" },
  { label: "Summarize sprint status", action: "summarize_sprint", prompt: "Summarize the current sprint status" },
  { label: "Analyze project health", action: "analyze_project", prompt: "Analyze this project's health" },
  { label: "Find unassigned tickets", action: "general_chat", prompt: "Show me all unassigned high-priority tickets" },
];

export function AiChatPanel({ organizationId, projectId, sprintId, defaultAction }: AiChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  const [input, setInput] = useState("");
  const [currentAction, setCurrentAction] = useState<AiActionType>(defaultAction || "general_chat");
  const messagesEndRef = useRef<HTMLDivElement>(null);

  const { messages, isLoading, sendMessage, cancelRequest, clearMessages, addSystemMessage } = useAiChat({
    action: currentAction,
    context: {
      organizationId,
      projectId,
      sprintId,
    },
  });

  // Scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Add welcome message on first open
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      addSystemMessage(
        "Hi! I'm Nexus AI, your intelligent assistant. I can help you create tickets, analyze projects, and provide insights. What would you like to do?"
      );
    }
  }, [isOpen, messages.length, addSystemMessage]);

  const handleSend = () => {
    if (!input.trim() || isLoading) return;
    sendMessage(input);
    setInput("");
  };

  const handleSuggestedAction = (action: typeof suggestedActions[0]) => {
    setCurrentAction(action.action);
    setInput(action.prompt);
    // Automatically send
    setTimeout(() => {
      sendMessage(action.prompt);
      setInput("");
    }, 0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  if (!isOpen) {
    return (
      <Button
        onClick={() => setIsOpen(true)}
        variant="glow"
        className="fixed bottom-6 right-6 z-50 h-14 w-14 rounded-full p-0 shadow-lg"
      >
        <Sparkles className="h-6 w-6" />
      </Button>
    );
  }

  return (
    <div
      className={cn(
        "fixed bottom-6 right-6 z-50 flex flex-col rounded-xl border border-border bg-card shadow-2xl transition-all",
        isMinimized ? "h-14 w-80" : "h-[500px] w-96"
      )}
    >
      {/* Header */}
      <div className="flex items-center justify-between border-b border-border px-4 py-3">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div>
            <span className="font-medium text-foreground">Nexus AI</span>
            {isLoading && (
              <span className="ml-2 text-xs text-muted-foreground">thinking...</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => {
              setIsOpen(false);
              clearMessages();
            }}
          >
            <X className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {!isMinimized && (
        <>
          {/* Messages */}
          <div className="flex-1 space-y-4 overflow-y-auto p-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={cn(
                  "flex",
                  message.role === "user" ? "justify-end" : "justify-start"
                )}
              >
                <div
                  className={cn(
                    "max-w-[85%] rounded-lg px-4 py-2 text-sm",
                    message.role === "user"
                      ? "bg-primary text-primary-foreground"
                      : "bg-muted text-foreground"
                  )}
                >
                  {message.role === "assistant" ? (
                    <div className="prose prose-sm prose-invert max-w-none">
                      <ReactMarkdown>{message.content}</ReactMarkdown>
                    </div>
                  ) : (
                    message.content
                  )}

                  {/* Tool call result */}
                  {message.toolCall && (
                    <div className="mt-2 rounded bg-background/50 p-2 text-xs">
                      <p className="font-medium text-primary">
                        {message.toolCall.name === "create_ticket"
                          ? "📝 Ready to create ticket"
                          : message.toolCall.name === "triage_ticket"
                          ? "🔍 Triage complete"
                          : "✅ Action ready"}
                      </p>
                      {message.toolCall.name === "create_ticket" && (
                        <div className="mt-1 space-y-1 text-muted-foreground">
                          <p>
                            <strong>Title:</strong>{" "}
                            {(message.toolCall.arguments as Record<string, unknown>).title as string}
                          </p>
                          <p>
                            <strong>Type:</strong>{" "}
                            {(message.toolCall.arguments as Record<string, unknown>).type as string}
                          </p>
                          <p>
                            <strong>Priority:</strong>{" "}
                            {(message.toolCall.arguments as Record<string, unknown>).priority as string}
                          </p>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-lg bg-muted px-4 py-2 text-sm text-muted-foreground">
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Thinking...</span>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Actions - Show only at start */}
          {messages.length <= 1 && !isLoading && (
            <div className="border-t border-border px-4 py-3">
              <p className="mb-2 text-xs text-muted-foreground">Quick actions</p>
              <div className="flex flex-wrap gap-2">
                {suggestedActions.map((action) => (
                  <button
                    key={action.label}
                    onClick={() => handleSuggestedAction(action)}
                    className="rounded-full border border-border bg-background px-3 py-1 text-xs text-muted-foreground transition-colors hover:border-primary hover:text-primary"
                  >
                    {action.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input */}
          <div className="border-t border-border p-4">
            <div className="flex gap-2">
              <textarea
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Ask anything..."
                rows={1}
                className="flex-1 resize-none rounded-lg border border-border bg-background px-4 py-2 text-sm text-foreground placeholder:text-muted-foreground focus:border-primary focus:outline-none"
              />
              {isLoading ? (
                <Button onClick={cancelRequest} size="icon" variant="destructive">
                  <StopCircle className="h-4 w-4" />
                </Button>
              ) : (
                <Button onClick={handleSend} size="icon" disabled={!input.trim()}>
                  <Send className="h-4 w-4" />
                </Button>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}
