 import { useState } from "react";
 import { useTicketComments } from "@/hooks/useTickets";
 import { useAddComment } from "@/hooks/useUpdateTicket";
 import { Button } from "@/components/ui/button";
 import { Textarea } from "@/components/ui/textarea";
 import { ScrollArea } from "@/components/ui/scroll-area";
 import { Badge } from "@/components/ui/badge";
 import { Send, Loader2, Sparkles } from "lucide-react";
 import { format } from "date-fns";
 
 interface TicketCommentsProps {
   ticketId: string;
 }
 
 export function TicketComments({ ticketId }: TicketCommentsProps) {
   const { data: comments, isLoading } = useTicketComments(ticketId);
   const addComment = useAddComment();
   const [newComment, setNewComment] = useState("");
 
   const handleSubmit = () => {
     if (!newComment.trim()) return;
     addComment.mutate(
       { ticketId, content: newComment },
       { onSuccess: () => setNewComment("") }
     );
   };
 
   if (isLoading) {
     return (
       <div className="flex h-64 items-center justify-center">
         <Loader2 className="h-6 w-6 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   return (
     <div className="flex h-full flex-col">
       <ScrollArea className="flex-1">
         <div className="space-y-4">
           {comments?.length === 0 && (
             <p className="py-8 text-center text-muted-foreground">
               No comments yet. Start the conversation!
             </p>
           )}
           {comments?.map((comment) => {
             const author = comment.author as unknown as { 
               full_name?: string; 
               email: string;
               avatar_url?: string;
             } | null;
             
             return (
               <div key={comment.id} className="rounded-lg border border-border p-4">
                 <div className="mb-2 flex items-center justify-between">
                   <div className="flex items-center gap-2">
                     <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/60" />
                     <div>
                       <p className="text-sm font-medium">
                         {author?.full_name || author?.email || "Unknown"}
                       </p>
                       <p className="text-xs text-muted-foreground">
                         {format(new Date(comment.created_at), "MMM d, yyyy 'at' h:mm a")}
                       </p>
                     </div>
                   </div>
                   {comment.is_ai_generated && (
                     <Badge variant="secondary" className="gap-1">
                       <Sparkles className="h-3 w-3" />
                       AI
                     </Badge>
                   )}
                 </div>
                 <p className="whitespace-pre-wrap text-sm">{comment.content}</p>
               </div>
             );
           })}
         </div>
       </ScrollArea>
 
       {/* New Comment Input */}
       <div className="mt-4 border-t border-border pt-4">
         <div className="flex gap-2">
           <Textarea
             value={newComment}
             onChange={(e) => setNewComment(e.target.value)}
             placeholder="Write a comment..."
             rows={3}
             className="resize-none"
           />
           <Button
             variant="glow"
             size="icon"
             onClick={handleSubmit}
             disabled={!newComment.trim() || addComment.isPending}
             className="h-auto w-16"
           >
             {addComment.isPending ? (
               <Loader2 className="h-4 w-4 animate-spin" />
             ) : (
               <Send className="h-4 w-4" />
             )}
           </Button>
         </div>
       </div>
     </div>
   );
 }