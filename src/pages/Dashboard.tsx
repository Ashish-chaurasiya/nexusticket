import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { TicketCard } from "@/components/tickets/TicketCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import {
  Ticket,
  CheckCircle2,
  AlertCircle,
  Clock,
  TrendingUp,
  Plus,
  Filter,
  ArrowRight,
  Loader2,
} from "lucide-react";

// Mock data - will be replaced with real data
const recentTickets = [
  {
    key: "NXS-108",
    title: "Dashboard loading performance optimization",
    type: "task" as const,
    priority: "high" as const,
    status: "in-progress" as const,
    assignee: { name: "Sarah Chen" },
    commentCount: 3,
  },
  {
    key: "NXS-107",
    title: "Fix file upload timeout on large files",
    type: "bug" as const,
    priority: "critical" as const,
    status: "todo" as const,
    commentCount: 5,
    attachmentCount: 2,
  },
  {
    key: "NXS-106",
    title: "Implement dark mode toggle",
    type: "story" as const,
    priority: "medium" as const,
    status: "review" as const,
    assignee: { name: "Mike Ross" },
    labels: ["ui", "feature"],
  },
];

const activityItems = [
  { user: "Sarah Chen", action: "completed", ticket: "NXS-105", time: "2m ago" },
  { user: "Mike Ross", action: "commented on", ticket: "NXS-103", time: "15m ago" },
  { user: "You", action: "created", ticket: "NXS-108", time: "1h ago" },
  { user: "AI Assistant", action: "triaged", ticket: "NXS-107", time: "2h ago" },
];

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrganization, isLoading: orgLoading } = useOrganization();

  // Redirect to login if not authenticated
  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login");
    }
  }, [user, authLoading, navigate]);

  if (authLoading || orgLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user) {
    return null;
  }

  return (
    <DashboardLayout>
      <div className="p-6">
        {/* Header */}
        <div className="mb-8 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-semibold text-foreground">
              Good morning{user.email ? `, ${user.email.split("@")[0]}` : ""}
            </h1>
            <p className="mt-1 text-muted-foreground">
              {currentOrganization
                ? `${currentOrganization.name} - Here's what's happening with your projects today.`
                : "Here's what's happening with your projects today."}
            </p>
          </div>
          <div className="flex items-center gap-3">
            <Button variant="outline" className="gap-2">
              <Filter className="h-4 w-4" />
              Filter
            </Button>
            <Button variant="glow" className="gap-2">
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          <StatsCard
            title="Total Tickets"
            value={128}
            change={{ value: 12, positive: true }}
            icon={<Ticket className="h-5 w-5" />}
          />
          <StatsCard
            title="Completed"
            value={47}
            change={{ value: 8, positive: true }}
            icon={<CheckCircle2 className="h-5 w-5" />}
          />
          <StatsCard
            title="In Progress"
            value={23}
            icon={<Clock className="h-5 w-5" />}
          />
          <StatsCard
            title="Critical Issues"
            value={5}
            change={{ value: 2, positive: false }}
            icon={<AlertCircle className="h-5 w-5" />}
          />
        </div>

        {/* Main Content Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Recent Tickets */}
          <div className="lg:col-span-2">
            <div className="rounded-lg border border-border bg-card">
              <div className="flex items-center justify-between border-b border-border p-4">
                <h2 className="font-medium text-foreground">Recent Tickets</h2>
                <Button variant="ghost" className="gap-2 text-sm text-muted-foreground">
                  View all
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </div>
              <div className="space-y-4 p-4">
                {recentTickets.map((ticket) => (
                  <TicketCard key={ticket.key} ticketKey={ticket.key} {...ticket} />
                ))}
              </div>
            </div>
          </div>

          {/* Activity & AI Insights */}
          <div className="space-y-6">
            {/* AI Insights */}
            <div className="rounded-lg border border-primary/30 bg-gradient-to-br from-primary/5 to-transparent p-4">
              <div className="mb-3 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <TrendingUp className="h-4 w-4 text-primary-foreground" />
                </div>
                <h3 className="font-medium text-foreground">AI Insights</h3>
              </div>
              <p className="text-sm text-muted-foreground">
                <span className="font-medium text-foreground">3 tickets</span> are
                at risk of missing their SLA. Consider prioritizing{" "}
                <span className="font-medium text-primary">NXS-107</span> which has
                been in backlog for 5 days.
              </p>
              <Button variant="subtle" className="mt-3 w-full">
                View AI recommendations
              </Button>
            </div>

            {/* Activity Feed */}
            <div className="rounded-lg border border-border bg-card">
              <div className="border-b border-border p-4">
                <h2 className="font-medium text-foreground">Activity</h2>
              </div>
              <div className="divide-y divide-border">
                {activityItems.map((item, index) => (
                  <div key={index} className="flex items-start gap-3 p-4">
                    <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-ticket-story/60" />
                    <div className="flex-1 text-sm">
                      <p className="text-foreground">
                        <span className="font-medium">{item.user}</span>{" "}
                        <span className="text-muted-foreground">
                          {item.action}
                        </span>{" "}
                        <span className="font-medium text-primary">
                          {item.ticket}
                        </span>
                      </p>
                      <p className="text-xs text-muted-foreground">{item.time}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Sprint Progress */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-foreground">Sprint Progress</h3>
                <Badge variant="in-progress">Week 2 of 3</Badge>
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-status-done"
                  style={{ width: "68%" }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>23 completed</span>
                <span>11 remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AiChatPanel 
        organizationId={currentOrganization?.id}
      />
    </DashboardLayout>
  );
}
