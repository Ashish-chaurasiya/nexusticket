 import { useNavigate } from "react-router-dom";
 import { KanbanColumn } from "./KanbanColumn";
 import { TicketCard } from "./TicketCard";
 import { Ticket, TicketStatus } from "@/types/domain";
 import { Loader2 } from "lucide-react";
 
 interface KanbanBoardProps {
   tickets: Ticket[];
   isLoading?: boolean;
   onCreateTicket?: () => void;
 }
 
 const columns: { status: TicketStatus; title: string }[] = [
   { status: "todo", title: "To Do" },
   { status: "in_progress", title: "In Progress" },
   { status: "review", title: "In Review" },
   { status: "done", title: "Done" },
   { status: "blocked", title: "Blocked" },
 ];
 
 // Map database status to UI status for badge variants
 function mapStatusToUi(status: TicketStatus): "todo" | "in-progress" | "review" | "done" | "blocked" {
   if (status === "in_progress") return "in-progress";
   return status as "todo" | "review" | "done" | "blocked";
 }
 
 export function KanbanBoard({ tickets, isLoading, onCreateTicket }: KanbanBoardProps) {
   const navigate = useNavigate();
 
   const getTicketsByStatus = (status: TicketStatus) =>
     tickets.filter((ticket) => ticket.status === status);
 
   if (isLoading) {
     return (
       <div className="flex h-full items-center justify-center">
         <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
       </div>
     );
   }
 
   return (
     <div className="flex gap-4 overflow-x-auto p-6">
       {columns.map((column) => {
         const columnTickets = getTicketsByStatus(column.status);
         return (
           <KanbanColumn
             key={column.status}
             status={column.status}
             title={column.title}
             count={columnTickets.length}
             onAdd={onCreateTicket}
           >
             {columnTickets.map((ticket) => (
               <TicketCard
                 key={ticket.id}
                 ticketKey={ticket.key}
                 title={ticket.title}
                 type={ticket.type}
                 priority={ticket.priority}
                 status={mapStatusToUi(ticket.status)}
                 assignee={ticket.assignee ? {
                   name: ticket.assignee.full_name || ticket.assignee.email,
                   avatarUrl: ticket.assignee.avatar_url,
                 } : undefined}
                 commentCount={ticket.comment_count}
                 labels={ticket.labels}
                 onClick={() => navigate(`/tickets/${ticket.id}`)}
               />
             ))}
           </KanbanColumn>
         );
       })}
     </div>
   );
 }
