import { Link, useLocation } from "react-router-dom";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard,
  FolderKanban,
  Ticket,
  Users,
  Settings,
  Sparkles,
  ChevronDown,
  Plus,
  Search,
  Bell,
} from "lucide-react";
import { Button } from "@/components/ui/button";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  { name: "Projects", href: "/projects", icon: FolderKanban },
  { name: "My Tickets", href: "/tickets", icon: Ticket },
  { name: "Team", href: "/team", icon: Users },
];

const projects = [
  { name: "Nexus Core", key: "NXS", color: "bg-primary" },
  { name: "Mobile App", key: "MOB", color: "bg-ticket-story" },
  { name: "API Gateway", key: "API", color: "bg-ticket-support" },
];

export function Sidebar() {
  const location = useLocation();

  return (
    <aside className="flex h-screen w-64 flex-col border-r border-border bg-sidebar">
      {/* Logo & Org Selector */}
      <div className="flex h-16 items-center justify-between border-b border-border px-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <div className="flex flex-col">
            <span className="text-sm font-semibold text-foreground">Nexus</span>
            <span className="text-xs text-muted-foreground">Acme Corp</span>
          </div>
        </div>
        <Button variant="ghost" size="icon" className="h-8 w-8">
          <ChevronDown className="h-4 w-4" />
        </Button>
      </div>

      {/* Search & Actions */}
      <div className="border-b border-border p-3">
        <div className="flex gap-2">
          <Button
            variant="outline"
            className="flex-1 justify-start gap-2 text-muted-foreground"
          >
            <Search className="h-4 w-4" />
            <span className="text-sm">Search...</span>
            <kbd className="ml-auto rounded bg-muted px-1.5 py-0.5 text-[10px] text-muted-foreground">
              ⌘K
            </kbd>
          </Button>
          <Button variant="ghost" size="icon" className="shrink-0">
            <Bell className="h-4 w-4" />
          </Button>
        </div>
      </div>

      {/* Main Navigation */}
      <nav className="flex-1 space-y-1 overflow-y-auto p-3">
        <div className="mb-4">
          {navigation.map((item) => {
            const isActive = location.pathname === item.href;
            return (
              <Link
                key={item.name}
                to={item.href}
                className={cn(
                  "flex items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium transition-colors",
                  isActive
                    ? "bg-sidebar-accent text-foreground"
                    : "text-sidebar-foreground hover:bg-sidebar-accent hover:text-foreground"
                )}
              >
                <item.icon className="h-4 w-4" />
                {item.name}
              </Link>
            );
          })}
        </div>

        {/* Projects Section */}
        <div>
          <div className="mb-2 flex items-center justify-between px-3">
            <span className="text-xs font-medium uppercase tracking-wider text-muted-foreground">
              Projects
            </span>
            <Button variant="ghost" size="icon" className="h-6 w-6">
              <Plus className="h-3 w-3" />
            </Button>
          </div>
          <div className="space-y-1">
            {projects.map((project) => (
              <Link
                key={project.key}
                to={`/projects/${project.key.toLowerCase()}`}
                className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
              >
                <div className={cn("h-2 w-2 rounded-full", project.color)} />
                <span className="flex-1 truncate">{project.name}</span>
                <span className="text-xs text-muted-foreground">
                  {project.key}
                </span>
              </Link>
            ))}
          </div>
        </div>
      </nav>

      {/* AI Assistant */}
      <div className="border-t border-border p-3">
        <Button
          variant="glow"
          className="w-full justify-start gap-2"
        >
          <Sparkles className="h-4 w-4" />
          <span>AI Assistant</span>
        </Button>
      </div>

      {/* User & Settings */}
      <div className="border-t border-border p-3">
        <Link
          to="/settings"
          className="flex items-center gap-3 rounded-lg px-3 py-2 text-sm text-sidebar-foreground transition-colors hover:bg-sidebar-accent hover:text-foreground"
        >
          <Settings className="h-4 w-4" />
          Settings
        </Link>
        <div className="mt-2 flex items-center gap-3 rounded-lg px-3 py-2">
          <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-ticket-story" />
          <div className="flex-1">
            <p className="text-sm font-medium text-foreground">Alex Johnson</p>
            <p className="text-xs text-muted-foreground">Admin</p>
          </div>
        </div>
      </div>
    </aside>
  );
}
