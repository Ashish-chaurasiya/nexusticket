import { KanbanColumn } from "./KanbanColumn";
import { TicketCard } from "./TicketCard";
import { Ticket, TicketStatus } from "@/types";

// Mock data for demonstration
const mockTickets: Ticket[] = [
  {
    id: "1",
    key: "NXS-101",
    title: "Fix authentication token refresh causing logout",
    type: "bug",
    status: "in-progress",
    priority: "critical",
    projectId: "1",
    reporterId: "1",
    assigneeId: "2",
    assignee: { id: "2", email: "", name: "Sarah Chen", role: "member", organizationId: "1" },
    labels: ["auth", "critical"],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 5,
    attachmentCount: 2,
  },
  {
    id: "2",
    key: "NXS-102",
    title: "Implement AI-powered ticket suggestions",
    type: "story",
    status: "todo",
    priority: "high",
    projectId: "1",
    reporterId: "1",
    labels: ["ai", "feature"],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 3,
    attachmentCount: 0,
  },
  {
    id: "3",
    key: "NXS-103",
    title: "Update database connection pooling",
    type: "task",
    status: "review",
    priority: "medium",
    projectId: "1",
    reporterId: "1",
    assigneeId: "3",
    assignee: { id: "3", email: "", name: "Mike Ross", role: "member", organizationId: "1" },
    labels: ["backend", "performance"],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 2,
    attachmentCount: 1,
  },
  {
    id: "4",
    key: "NXS-104",
    title: "Customer request: Export to PDF feature",
    type: "support",
    status: "todo",
    priority: "medium",
    projectId: "1",
    reporterId: "1",
    labels: ["customer-request"],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 1,
    attachmentCount: 0,
  },
  {
    id: "5",
    key: "NXS-105",
    title: "Mobile responsive design improvements",
    type: "task",
    status: "done",
    priority: "low",
    projectId: "1",
    reporterId: "1",
    assigneeId: "2",
    assignee: { id: "2", email: "", name: "Sarah Chen", role: "member", organizationId: "1" },
    labels: ["ui", "mobile"],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 8,
    attachmentCount: 3,
  },
  {
    id: "6",
    key: "NXS-106",
    title: "API rate limiting not enforced properly",
    type: "bug",
    status: "blocked",
    priority: "high",
    projectId: "1",
    reporterId: "1",
    labels: ["api", "security"],
    createdAt: new Date(),
    updatedAt: new Date(),
    commentCount: 4,
    attachmentCount: 0,
  },
];

const columns: { status: TicketStatus; title: string }[] = [
  { status: "todo", title: "To Do" },
  { status: "in-progress", title: "In Progress" },
  { status: "review", title: "In Review" },
  { status: "done", title: "Done" },
  { status: "blocked", title: "Blocked" },
];

export function KanbanBoard() {
  const getTicketsByStatus = (status: TicketStatus) =>
    mockTickets.filter((ticket) => ticket.status === status);

  return (
    <div className="flex gap-4 overflow-x-auto p-6">
      {columns.map((column) => {
        const tickets = getTicketsByStatus(column.status);
        return (
          <KanbanColumn
            key={column.status}
            status={column.status}
            title={column.title}
            count={tickets.length}
          >
            {tickets.map((ticket) => (
              <TicketCard
                key={ticket.id}
                ticketKey={ticket.key}
                title={ticket.title}
                type={ticket.type}
                priority={ticket.priority}
                status={ticket.status}
                assignee={ticket.assignee}
                commentCount={ticket.commentCount}
                attachmentCount={ticket.attachmentCount}
                labels={ticket.labels}
              />
            ))}
          </KanbanColumn>
        );
      })}
    </div>
  );
}
