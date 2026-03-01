import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { StatsCard } from "@/components/dashboard/StatsCard";
import { AiChatPanel } from "@/components/ai/AiChatPanel";
import { TicketCard } from "@/components/tickets/TicketCard";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useDashboardStats } from "@/hooks/useDashboardStats";
import { formatDistanceToNow } from "date-fns";
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { user, isLoading: authLoading } = useAuth();
  const { currentOrganization, isLoading: orgLoading } = useOrganization();
  const { stats, recentTickets, activity, sprint, isLoading: dataLoading } = useDashboardStats();

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

  const sprintProgress = sprint
    ? sprint.totalTickets > 0
      ? Math.round((sprint.completedTickets / sprint.totalTickets) * 100)
      : 0
    : 0;

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
            <Button variant="glow" className="gap-2" onClick={() => navigate("/tickets/new")}>
              <Plus className="h-4 w-4" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats Grid */}
        <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {dataLoading ? (
            <>
              {[1, 2, 3, 4].map((i) => (
                <Skeleton key={i} className="h-28 rounded-lg" />
              ))}
            </>
          ) : (
            <>
              <StatsCard
                title="Total Tickets"
                value={stats?.totalTickets ?? 0}
                icon={<Ticket className="h-5 w-5" />}
              />
              <StatsCard
                title="Completed"
                value={stats?.completed ?? 0}
                icon={<CheckCircle2 className="h-5 w-5" />}
              />
              <StatsCard
                title="In Progress"
                value={stats?.inProgress ?? 0}
                icon={<Clock className="h-5 w-5" />}
              />
              <StatsCard
                title="Critical Issues"
                value={stats?.critical ?? 0}
                icon={<AlertCircle className="h-5 w-5" />}
              />
            </>
          )}
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
                {dataLoading ? (
                  [1, 2, 3].map((i) => <Skeleton key={i} className="h-20 rounded-lg" />)
                ) : recentTickets && recentTickets.length > 0 ? (
                  recentTickets.map((ticket) => (
                    <TicketCard
                      key={ticket.id}
                      ticketKey={ticket.key}
                      title={ticket.title}
                      type={ticket.type}
                      priority={ticket.priority}
                      status={ticket.status === "in_progress" ? "in-progress" : ticket.status as any}
                      labels={ticket.labels || undefined}
                      onClick={() => navigate(`/tickets/${ticket.id}`)}
                    />
                  ))
                ) : (
                  <p className="py-8 text-center text-sm text-muted-foreground">
                    No tickets yet. Create your first ticket to get started.
                  </p>
                )}
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
                {stats && stats.critical > 0 ? (
                  <>
                    <span className="font-medium text-foreground">{stats.critical} critical ticket{stats.critical !== 1 ? "s" : ""}</span>{" "}
                    need attention. Consider reviewing and prioritizing them.
                  </>
                ) : stats && stats.totalTickets > 0 ? (
                  <>
                    <span className="font-medium text-foreground">{stats.completed}</span> of{" "}
                    <span className="font-medium text-foreground">{stats.totalTickets}</span> tickets completed.
                    {stats.inProgress > 0 && <> {stats.inProgress} in progress.</>}
                  </>
                ) : (
                  "Create tickets and let AI help you prioritize and manage your work."
                )}
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
                {dataLoading ? (
                  [1, 2, 3].map((i) => (
                    <div key={i} className="p-4">
                      <Skeleton className="h-10 rounded" />
                    </div>
                  ))
                ) : activity && activity.length > 0 ? (
                  activity.map((item) => (
                    <div key={item.id} className="flex items-start gap-3 p-4">
                      <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary/60 to-ticket-story/60" />
                      <div className="flex-1 text-sm">
                        <p className="text-foreground">
                          <span className="font-medium">
                            {item.is_ai_action ? "AI Assistant" : "User"}
                          </span>{" "}
                          <span className="text-muted-foreground">{item.action}</span>{" "}
                          <span className="font-medium text-primary">{item.entity_type}</span>
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatDistanceToNow(new Date(item.created_at), { addSuffix: true })}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="p-4 text-center text-sm text-muted-foreground">No recent activity</p>
                )}
              </div>
            </div>

            {/* Sprint Progress */}
            <div className="rounded-lg border border-border bg-card p-4">
              <div className="mb-3 flex items-center justify-between">
                <h3 className="font-medium text-foreground">Sprint Progress</h3>
                {sprint ? (
                  <Badge variant="in-progress">{sprint.name}</Badge>
                ) : (
                  <Badge variant="outline">No active sprint</Badge>
                )}
              </div>
              <div className="mb-2 h-2 overflow-hidden rounded-full bg-muted">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-primary to-status-done transition-all"
                  style={{ width: `${sprintProgress}%` }}
                />
              </div>
              <div className="flex justify-between text-xs text-muted-foreground">
                <span>{sprint?.completedTickets ?? 0} completed</span>
                <span>{sprint ? sprint.totalTickets - sprint.completedTickets : 0} remaining</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Panel */}
      <AiChatPanel organizationId={currentOrganization?.id} />
    </DashboardLayout>
  );
}
