 import { useState } from "react";
 import { useNavigate } from "react-router-dom";
 import { Ticket, TicketStatus, TicketPriority } from "@/types/domain";
 import { Badge } from "@/components/ui/badge";
 import { Button } from "@/components/ui/button";
 import { Checkbox } from "@/components/ui/checkbox";
 import {
   Table,
   TableBody,
   TableCell,
   TableHead,
   TableHeader,
   TableRow,
 } from "@/components/ui/table";
 import {
   DropdownMenu,
   DropdownMenuContent,
   DropdownMenuItem,
   DropdownMenuTrigger,
 } from "@/components/ui/dropdown-menu";
 import { AlertCircle, CheckCircle2, Circle, Clock, MessageSquare, XCircle, MoreHorizontal } from "lucide-react";
 import { format } from "date-fns";
 
 interface TicketListProps {
   tickets: Ticket[];
   isLoading?: boolean;
 }
 
 const statusConfig: Record<TicketStatus, { label: string; icon: React.ReactNode }> = {
   todo: { label: "To Do", icon: <Circle className="h-3 w-3" /> },
   in_progress: { label: "In Progress", icon: <Clock className="h-3 w-3" /> },
   review: { label: "In Review", icon: <AlertCircle className="h-3 w-3" /> },
   done: { label: "Done", icon: <CheckCircle2 className="h-3 w-3" /> },
   blocked: { label: "Blocked", icon: <XCircle className="h-3 w-3" /> },
 };
 
 const priorityConfig: Record<TicketPriority, { label: string; color: string }> = {
   critical: { label: "Critical", color: "bg-priority-critical" },
   high: { label: "High", color: "bg-priority-high" },
   medium: { label: "Medium", color: "bg-priority-medium" },
   low: { label: "Low", color: "bg-priority-low" },
 };
 
 const typeIcons = {
   bug: <AlertCircle className="h-4 w-4" />,
   task: <CheckCircle2 className="h-4 w-4" />,
   story: <Circle className="h-4 w-4" />,
   support: <MessageSquare className="h-4 w-4" />,
 };
 
 export function TicketList({ tickets, isLoading }: TicketListProps) {
   const navigate = useNavigate();
   const [selectedTickets, setSelectedTickets] = useState<Set<string>>(new Set());
 
   const toggleTicket = (id: string) => {
     const newSelected = new Set(selectedTickets);
     if (newSelected.has(id)) {
       newSelected.delete(id);
     } else {
       newSelected.add(id);
     }
     setSelectedTickets(newSelected);
   };
 
   const toggleAll = () => {
     if (selectedTickets.size === tickets.length) {
       setSelectedTickets(new Set());
     } else {
       setSelectedTickets(new Set(tickets.map((t) => t.id)));
     }
   };
 
   if (isLoading) {
     return (
       <div className="flex h-64 items-center justify-center">
         <div className="h-8 w-8 animate-spin rounded-full border-2 border-primary border-t-transparent" />
       </div>
     );
   }
 
   if (tickets.length === 0) {
     return (
       <div className="flex h-64 flex-col items-center justify-center text-center">
         <Circle className="mb-4 h-12 w-12 text-muted-foreground" />
         <h3 className="mb-1 font-medium">No tickets found</h3>
         <p className="text-sm text-muted-foreground">
           Create your first ticket to get started
         </p>
       </div>
     );
   }
 
   return (
     <div className="rounded-lg border border-border">
       <Table>
         <TableHeader>
           <TableRow>
             <TableHead className="w-12">
               <Checkbox
                 checked={selectedTickets.size === tickets.length}
                 onCheckedChange={toggleAll}
               />
             </TableHead>
             <TableHead className="w-24">Key</TableHead>
             <TableHead>Title</TableHead>
             <TableHead className="w-24">Type</TableHead>
             <TableHead className="w-28">Status</TableHead>
             <TableHead className="w-24">Priority</TableHead>
             <TableHead className="w-32">Assignee</TableHead>
             <TableHead className="w-28">Updated</TableHead>
             <TableHead className="w-12" />
           </TableRow>
         </TableHeader>
         <TableBody>
           {tickets.map((ticket) => (
             <TableRow
               key={ticket.id}
               className="cursor-pointer hover:bg-muted/50"
               onClick={() => navigate(`/tickets/${ticket.id}`)}
             >
               <TableCell onClick={(e) => e.stopPropagation()}>
                 <Checkbox
                   checked={selectedTickets.has(ticket.id)}
                   onCheckedChange={() => toggleTicket(ticket.id)}
                 />
               </TableCell>
               <TableCell className="font-mono text-xs text-muted-foreground">
                 {ticket.key}
               </TableCell>
               <TableCell>
                 <div className="line-clamp-1 font-medium">{ticket.title}</div>
               </TableCell>
               <TableCell>
                 <Badge variant={ticket.type} className="gap-1">
                   {typeIcons[ticket.type]}
                   <span className="capitalize">{ticket.type}</span>
                 </Badge>
               </TableCell>
               <TableCell>
                 <Badge variant={ticket.status.replace("_", "-") as "todo" | "in-progress" | "review" | "done" | "blocked"} className="gap-1">
                   {statusConfig[ticket.status].icon}
                   {statusConfig[ticket.status].label}
                 </Badge>
               </TableCell>
               <TableCell>
                 <div className="flex items-center gap-2">
                   <div
                     className={`h-2 w-2 rounded-full ${priorityConfig[ticket.priority].color}`}
                   />
                   <span className="text-sm capitalize">{ticket.priority}</span>
                 </div>
               </TableCell>
               <TableCell>
                 <span className="text-sm">
                   {ticket.assignee?.full_name || ticket.assignee?.email || "—"}
                 </span>
               </TableCell>
               <TableCell className="text-sm text-muted-foreground">
                 {format(new Date(ticket.updated_at), "MMM d")}
               </TableCell>
               <TableCell onClick={(e) => e.stopPropagation()}>
                 <DropdownMenu>
                   <DropdownMenuTrigger asChild>
                     <Button variant="ghost" size="icon" className="h-8 w-8">
                       <MoreHorizontal className="h-4 w-4" />
                     </Button>
                   </DropdownMenuTrigger>
                   <DropdownMenuContent align="end">
                     <DropdownMenuItem
                       onClick={() => navigate(`/tickets/${ticket.id}`)}
                     >
                       View Details
                     </DropdownMenuItem>
                     <DropdownMenuItem>Copy Link</DropdownMenuItem>
                   </DropdownMenuContent>
                 </DropdownMenu>
               </TableCell>
             </TableRow>
           ))}
         </TableBody>
       </Table>
     </div>
   );
 }