 import { useState, useRef, useEffect } from "react";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { useAiChat } from "@/hooks/useAiChat";
 import { TicketDraft } from "@/pages/TicketCreate";
 import { Send, Sparkles, Loader2 } from "lucide-react";
 import ReactMarkdown from "react-markdown";
 import { TicketType, TicketPriority } from "@/types/domain";
 
 interface TicketCreateChatProps {
   projectId: string;
   projectKey: string;
   draft: TicketDraft;
   onDraftUpdate: (updates: Partial<TicketDraft>) => void;
 }
 
 const SYSTEM_PROMPT = `You are a helpful assistant that helps users create tickets for a project management system.
 
 Your job is to:
 1. Ask clarifying questions to understand what the user needs
 2. Suggest appropriate ticket type (bug, task, story, support)
 3. Suggest priority level (critical, high, medium, low)
 4. Help craft a clear title and description
 5. Suggest relevant labels
 
 When you have enough information, provide structured output in this format:
 
 \`\`\`json
 {
   "title": "Clear, actionable title",
   "description": "Detailed description",
   "type": "bug|task|story|support",
   "priority": "critical|high|medium|low",
   "labels": ["label1", "label2"]
 }
 \`\`\`
 
 Be conversational but efficient. Ask one or two questions at a time.`;
 
 export function TicketCreateChat({
   projectId,
   projectKey,
   draft,
   onDraftUpdate,
 }: TicketCreateChatProps) {
   const [input, setInput] = useState("");
   const scrollRef = useRef<HTMLDivElement>(null);
   const textareaRef = useRef<HTMLTextAreaElement>(null);
 
   const { messages, isLoading, sendMessage, addSystemMessage } = useAiChat({
     action: "create_ticket",
     context: { projectId },
   });
 
   // Add initial greeting
   useEffect(() => {
     if (messages.length === 0) {
       addSystemMessage(
         `Hi! I'll help you create a ticket for **${projectKey}**. What would you like to work on?\n\nYou can describe:\n- A bug you've found\n- A feature you want to build\n- A task that needs to be done\n- A support request`
       );
     }
   }, []);
 
   // Parse AI responses for structured ticket data
   useEffect(() => {
     const lastMessage = messages[messages.length - 1];
     if (lastMessage?.role === "assistant" && lastMessage.content) {
       const jsonMatch = lastMessage.content.match(/```json\n([\s\S]*?)\n```/);
       if (jsonMatch) {
         try {
           const data = JSON.parse(jsonMatch[1]);
           const updates: Partial<TicketDraft> = {};
           
           if (data.title) updates.title = data.title;
           if (data.description) updates.description = data.description;
           if (data.type && ["bug", "task", "story", "support"].includes(data.type)) {
             updates.type = data.type as TicketType;
           }
           if (data.priority && ["critical", "high", "medium", "low"].includes(data.priority)) {
             updates.priority = data.priority as TicketPriority;
           }
           if (Array.isArray(data.labels)) {
             updates.labels = data.labels;
           }
           
           onDraftUpdate(updates);
         } catch (e) {
           // Not valid JSON, ignore
         }
       }
     }
   }, [messages, onDraftUpdate]);
 
   // Auto-scroll
   useEffect(() => {
     if (scrollRef.current) {
       scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
     }
   }, [messages]);
 
   const handleSend = () => {
     if (!input.trim() || isLoading) return;
     sendMessage(input);
     setInput("");
   };
 
   const handleKeyDown = (e: React.KeyboardEvent) => {
     if (e.key === "Enter" && !e.shiftKey) {
       e.preventDefault();
       handleSend();
     }
   };
 
   return (
     <div className="flex h-full flex-col">
       {/* Header */}
       <div className="border-b border-border bg-muted/30 px-4 py-3">
         <div className="flex items-center gap-2">
           <Sparkles className="h-4 w-4 text-primary" />
           <span className="text-sm font-medium">AI Ticket Assistant</span>
         </div>
       </div>
 
       {/* Messages */}
       <ScrollArea className="flex-1 p-4" ref={scrollRef}>
         <div className="space-y-4">
           {messages.map((message) => (
             <div
               key={message.id}
               className={`flex ${
                 message.role === "user" ? "justify-end" : "justify-start"
               }`}
             >
               <div
                 className={`max-w-[85%] rounded-lg px-4 py-2 ${
                   message.role === "user"
                     ? "bg-primary text-primary-foreground"
                     : "bg-muted"
                 }`}
               >
                 <ReactMarkdown
                   components={{
                     pre: ({ children }: { children?: React.ReactNode }) => (
                       <pre className="overflow-x-auto rounded bg-background/50 p-2 text-xs prose prose-sm dark:prose-invert max-w-none">
                         {children}
                       </pre>
                     ),
                     code: ({ children }: { children?: React.ReactNode }) => (
                       <code className="rounded bg-background/50 px-1 text-xs">
                         {children}
                       </code>
                     ),
                     p: ({ children }: { children?: React.ReactNode }) => (
                       <p className="text-sm mb-2 last:mb-0">{children}</p>
                     ),
                     ul: ({ children }: { children?: React.ReactNode }) => (
                       <ul className="text-sm list-disc pl-4 mb-2">{children}</ul>
                     ),
                     li: ({ children }: { children?: React.ReactNode }) => (
                       <li className="mb-1">{children}</li>
                     ),
                     strong: ({ children }: { children?: React.ReactNode }) => (
                       <strong className="font-semibold">{children}</strong>
                     ),
                   }}
                 >
                   {message.content}
                 </ReactMarkdown>
               </div>
             </div>
           ))}
           {isLoading && (
             <div className="flex justify-start">
               <div className="rounded-lg bg-muted px-4 py-2">
                 <Loader2 className="h-4 w-4 animate-spin" />
               </div>
             </div>
           )}
         </div>
       </ScrollArea>
 
       {/* Input */}
       <div className="border-t border-border p-4">
         <div className="flex gap-2">
           <Textarea
             ref={textareaRef}
             value={input}
             onChange={(e) => setInput(e.target.value)}
             onKeyDown={handleKeyDown}
             placeholder="Describe what you need..."
             className="min-h-[60px] resize-none"
             disabled={isLoading}
           />
           <Button
             variant="glow"
             size="icon"
             onClick={handleSend}
             disabled={!input.trim() || isLoading}
             className="h-[60px] w-[60px]"
           >
             <Send className="h-4 w-4" />
           </Button>
         </div>
       </div>
     </div>
   );
 }