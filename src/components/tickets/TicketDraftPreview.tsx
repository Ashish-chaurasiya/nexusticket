 import { Badge } from "@/components/ui/badge";
 import { Input } from "@/components/ui/input";
 import { Textarea } from "@/components/ui/textarea";
 import { Label } from "@/components/ui/label";
 import {
   Select,
   SelectContent,
   SelectItem,
   SelectTrigger,
   SelectValue,
 } from "@/components/ui/select";
 import { TicketDraft } from "@/pages/TicketCreate";
 import { TicketType, TicketPriority } from "@/types/domain";
 import { AlertCircle, CheckCircle2, Circle, MessageSquare, X } from "lucide-react";
 import { Button } from "@/components/ui/button";
 
 interface TicketDraftPreviewProps {
   draft: TicketDraft;
   projectKey: string;
   onUpdate: (updates: Partial<TicketDraft>) => void;
 }
 
 const typeIcons = {
   bug: <AlertCircle className="h-4 w-4" />,
   task: <CheckCircle2 className="h-4 w-4" />,
   story: <Circle className="h-4 w-4" />,
   support: <MessageSquare className="h-4 w-4" />,
 };
 
 const priorityColors = {
   critical: "bg-priority-critical",
   high: "bg-priority-high",
   medium: "bg-priority-medium",
   low: "bg-priority-low",
 };
 
 export function TicketDraftPreview({ draft, projectKey, onUpdate }: TicketDraftPreviewProps) {
   const handleLabelRemove = (label: string) => {
     onUpdate({ labels: draft.labels.filter((l) => l !== label) });
   };
 
   const handleAddLabel = (e: React.KeyboardEvent<HTMLInputElement>) => {
     if (e.key === "Enter") {
       const input = e.currentTarget;
       const value = input.value.trim();
       if (value && !draft.labels.includes(value)) {
         onUpdate({ labels: [...draft.labels, value] });
         input.value = "";
       }
     }
   };
 
   return (
     <div className="space-y-6">
       <div className="flex items-center justify-between">
         <h2 className="text-lg font-semibold text-foreground">Ticket Preview</h2>
         <span className="text-sm text-muted-foreground">{projectKey}-???</span>
       </div>
 
       {/* Title */}
       <div className="space-y-2">
         <Label htmlFor="title">Title</Label>
         <Input
           id="title"
           placeholder="What needs to be done?"
           value={draft.title}
           onChange={(e) => onUpdate({ title: e.target.value })}
           className="text-lg font-medium"
         />
       </div>
 
       {/* Type & Priority Row */}
       <div className="grid grid-cols-2 gap-4">
         <div className="space-y-2">
           <Label>Type</Label>
           <Select
             value={draft.type}
             onValueChange={(v) => onUpdate({ type: v as TicketType })}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="bug">
                 <div className="flex items-center gap-2">
                   {typeIcons.bug}
                   Bug
                 </div>
               </SelectItem>
               <SelectItem value="task">
                 <div className="flex items-center gap-2">
                   {typeIcons.task}
                   Task
                 </div>
               </SelectItem>
               <SelectItem value="story">
                 <div className="flex items-center gap-2">
                   {typeIcons.story}
                   Story
                 </div>
               </SelectItem>
               <SelectItem value="support">
                 <div className="flex items-center gap-2">
                   {typeIcons.support}
                   Support
                 </div>
               </SelectItem>
             </SelectContent>
           </Select>
         </div>
 
         <div className="space-y-2">
           <Label>Priority</Label>
           <Select
             value={draft.priority}
             onValueChange={(v) => onUpdate({ priority: v as TicketPriority })}
           >
             <SelectTrigger>
               <SelectValue />
             </SelectTrigger>
             <SelectContent>
               <SelectItem value="critical">
                 <div className="flex items-center gap-2">
                   <div className={`h-2 w-2 rounded-full ${priorityColors.critical}`} />
                   Critical
                 </div>
               </SelectItem>
               <SelectItem value="high">
                 <div className="flex items-center gap-2">
                   <div className={`h-2 w-2 rounded-full ${priorityColors.high}`} />
                   High
                 </div>
               </SelectItem>
               <SelectItem value="medium">
                 <div className="flex items-center gap-2">
                   <div className={`h-2 w-2 rounded-full ${priorityColors.medium}`} />
                   Medium
                 </div>
               </SelectItem>
               <SelectItem value="low">
                 <div className="flex items-center gap-2">
                   <div className={`h-2 w-2 rounded-full ${priorityColors.low}`} />
                   Low
                 </div>
               </SelectItem>
             </SelectContent>
           </Select>
         </div>
       </div>
 
       {/* Labels */}
       <div className="space-y-2">
         <Label>Labels</Label>
         <div className="flex flex-wrap gap-2">
           {draft.labels.map((label) => (
             <Badge key={label} variant="secondary" className="gap-1">
               {label}
               <button
                 onClick={() => handleLabelRemove(label)}
                 className="ml-1 rounded-full hover:bg-muted"
               >
                 <X className="h-3 w-3" />
               </button>
             </Badge>
           ))}
           <Input
             placeholder="Add label..."
             className="h-6 w-24 text-xs"
             onKeyDown={handleAddLabel}
           />
         </div>
       </div>
 
       {/* Description */}
       <div className="space-y-2">
         <Label htmlFor="description">Description</Label>
         <Textarea
           id="description"
           placeholder="Describe the ticket in detail..."
           value={draft.description}
           onChange={(e) => onUpdate({ description: e.target.value })}
           rows={8}
           className="resize-none"
         />
       </div>
 
       {/* Preview Card */}
       {draft.title && (
         <div className="rounded-lg border border-border bg-card p-4">
           <h3 className="mb-2 text-sm font-medium text-muted-foreground">
             Card Preview
           </h3>
           <div className="rounded-lg border-l-2 border-l-primary bg-muted/30 p-3">
             <div className="flex items-center gap-2">
               <Badge variant={draft.type} className="gap-1">
                 {typeIcons[draft.type]}
                 <span className="capitalize">{draft.type}</span>
               </Badge>
               <span className="text-xs text-muted-foreground">
                 {projectKey}-???
               </span>
             </div>
             <p className="mt-2 text-sm font-medium">{draft.title}</p>
             {draft.labels.length > 0 && (
               <div className="mt-2 flex flex-wrap gap-1">
                 {draft.labels.slice(0, 3).map((label) => (
                   <span
                     key={label}
                     className="rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground"
                   >
                     {label}
                   </span>
                 ))}
               </div>
             )}
           </div>
         </div>
       )}
     </div>
   );
 }