import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Sparkles,
  ArrowRight,
  Ticket,
  Users,
  Zap,
  Shield,
  LayoutDashboard,
  MessageSquare,
  CheckCircle2,
  ChevronRight,
} from "lucide-react";

const features = [
  {
    icon: <Sparkles className="h-6 w-6" />,
    title: "AI-First Experience",
    description:
      "Create tickets through natural conversation. Our AI understands context and enriches your tickets automatically.",
  },
  {
    icon: <LayoutDashboard className="h-6 w-6" />,
    title: "Beautiful Boards",
    description:
      "Kanban, list, or timeline views. Customize workflows to match how your team actually works.",
  },
  {
    icon: <Users className="h-6 w-6" />,
    title: "Team Collaboration",
    description:
      "Real-time updates, @mentions, and smart notifications keep everyone aligned without the noise.",
  },
  {
    icon: <Zap className="h-6 w-6" />,
    title: "Instant Insights",
    description:
      "AI-powered analytics surface blockers, predict delays, and suggest optimizations automatically.",
  },
];

const trustedBy = [
  "Acme Corp",
  "TechFlow",
  "Innovate.io",
  "DataDriven",
  "CloudScale",
];

export default function Landing() {
  return (
    <div className="min-h-screen bg-background">
      {/* Navigation */}
      <nav className="fixed top-0 z-50 w-full border-b border-border/40 bg-background/80 backdrop-blur-xl">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-6">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold text-foreground">Nexus</span>
          </div>
          <div className="hidden items-center gap-8 md:flex">
            <a
              href="#features"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Features
            </a>
            <a
              href="#pricing"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Pricing
            </a>
            <a
              href="#docs"
              className="text-sm text-muted-foreground transition-colors hover:text-foreground"
            >
              Docs
            </a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost">Sign in</Button>
            </Link>
            <Link to="/signup">
              <Button variant="glow">Get Started</Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative overflow-hidden pt-32">
        {/* Background Effects */}
        <div className="pointer-events-none absolute inset-0">
          <div className="absolute left-1/2 top-0 h-[600px] w-[800px] -translate-x-1/2 rounded-full bg-primary/10 blur-[120px]" />
          <div className="absolute right-1/4 top-1/4 h-[400px] w-[400px] rounded-full bg-ticket-story/10 blur-[100px]" />
        </div>

        <div className="relative mx-auto max-w-7xl px-6 pb-24 pt-16 text-center">
          <Badge
            variant="outline"
            className="mb-6 gap-2 border-primary/30 px-4 py-2"
          >
            <Sparkles className="h-3 w-3 text-primary" />
            <span className="text-xs">AI-Powered Ticket Management</span>
          </Badge>

          <h1 className="mx-auto max-w-4xl text-5xl font-bold tracking-tight text-foreground sm:text-6xl lg:text-7xl">
            Ship faster with{" "}
            <span className="gradient-text">AI-first</span>{" "}
            ticket management
          </h1>

          <p className="mx-auto mt-6 max-w-2xl text-lg text-muted-foreground sm:text-xl">
            The intelligent workspace for teams who want to focus on building,
            not managing. Create, triage, and track work with AI that actually
            helps.
          </p>

          <div className="mt-10 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup">
              <Button variant="glow" size="xl" className="gap-2">
                Start for free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Link to="/dashboard">
              <Button variant="outline" size="xl" className="gap-2">
                View demo
                <ChevronRight className="h-5 w-5" />
              </Button>
            </Link>
          </div>

          <p className="mt-4 text-sm text-muted-foreground">
            No credit card required · Free for small teams
          </p>

          {/* Trusted By */}
          <div className="mt-16">
            <p className="mb-6 text-sm text-muted-foreground">
              Trusted by innovative teams
            </p>
            <div className="flex flex-wrap items-center justify-center gap-8 opacity-50">
              {trustedBy.map((company) => (
                <span
                  key={company}
                  className="text-lg font-semibold text-muted-foreground"
                >
                  {company}
                </span>
              ))}
            </div>
          </div>
        </div>

        {/* Dashboard Preview */}
        <div className="relative mx-auto max-w-6xl px-6">
          <div className="overflow-hidden rounded-xl border border-border bg-card shadow-2xl">
            <div className="flex h-8 items-center gap-2 border-b border-border bg-muted/50 px-4">
              <div className="h-3 w-3 rounded-full bg-status-blocked/50" />
              <div className="h-3 w-3 rounded-full bg-priority-medium/50" />
              <div className="h-3 w-3 rounded-full bg-status-done/50" />
            </div>
            <div className="aspect-[16/10] bg-gradient-to-br from-card to-muted/30 p-8">
              {/* Simplified Dashboard Preview */}
              <div className="grid h-full grid-cols-4 gap-4">
                {/* Sidebar Placeholder */}
                <div className="col-span-1 rounded-lg bg-sidebar/50 p-4">
                  <div className="mb-4 flex items-center gap-2">
                    <div className="h-6 w-6 rounded bg-primary/30" />
                    <div className="h-4 w-20 rounded bg-foreground/10" />
                  </div>
                  <div className="space-y-2">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-8 w-full rounded bg-foreground/5"
                      />
                    ))}
                  </div>
                </div>

                {/* Main Content Placeholder */}
                <div className="col-span-3 space-y-4">
                  <div className="flex gap-4">
                    {[1, 2, 3, 4].map((i) => (
                      <div
                        key={i}
                        className="h-24 flex-1 rounded-lg bg-card/80 p-4"
                      >
                        <div className="mb-2 h-3 w-16 rounded bg-foreground/10" />
                        <div className="h-6 w-12 rounded bg-primary/30" />
                      </div>
                    ))}
                  </div>
                  <div className="flex flex-1 gap-4">
                    {["To Do", "In Progress", "Done"].map((col) => (
                      <div
                        key={col}
                        className="flex-1 rounded-lg bg-muted/30 p-3"
                      >
                        <div className="mb-3 h-4 w-20 rounded bg-foreground/10" />
                        <div className="space-y-2">
                          {[1, 2].map((i) => (
                            <div
                              key={i}
                              className="h-20 rounded-lg border border-border/50 bg-card/50 p-3"
                            >
                              <div className="mb-2 h-3 w-8 rounded bg-primary/30" />
                              <div className="h-3 w-full rounded bg-foreground/10" />
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-32">
        <div className="mx-auto max-w-7xl px-6">
          <div className="text-center">
            <Badge variant="outline" className="mb-4">
              Features
            </Badge>
            <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
              Everything you need, nothing you don't
            </h2>
            <p className="mx-auto mt-4 max-w-2xl text-muted-foreground">
              Built from the ground up with AI at its core. Every feature is
              designed to reduce friction and help you ship faster.
            </p>
          </div>

          <div className="mt-16 grid gap-8 sm:grid-cols-2 lg:grid-cols-4">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="group rounded-xl border border-border bg-card p-6 transition-all hover:border-primary/30 hover:shadow-glow-sm"
              >
                <div className="mb-4 inline-flex rounded-lg bg-primary/10 p-3 text-primary">
                  {feature.icon}
                </div>
                <h3 className="mb-2 font-semibold text-foreground">
                  {feature.title}
                </h3>
                <p className="text-sm text-muted-foreground">
                  {feature.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* AI Section */}
      <section className="border-y border-border bg-muted/30 py-24">
        <div className="mx-auto max-w-7xl px-6">
          <div className="grid items-center gap-12 lg:grid-cols-2">
            <div>
              <Badge variant="outline" className="mb-4 gap-2 border-primary/30">
                <Sparkles className="h-3 w-3 text-primary" />
                AI Copilot
              </Badge>
              <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
                Your AI teammate that actually helps
              </h2>
              <p className="mt-4 text-muted-foreground">
                Our AI doesn't just suggest—it understands your project context,
                learns your team's patterns, and takes action.
              </p>

              <div className="mt-8 space-y-4">
                {[
                  "Creates tickets from natural language",
                  "Auto-assigns based on expertise and workload",
                  "Predicts blockers before they happen",
                  "Summarizes sprint progress instantly",
                ].map((item) => (
                  <div key={item} className="flex items-center gap-3">
                    <CheckCircle2 className="h-5 w-5 text-status-done" />
                    <span className="text-foreground">{item}</span>
                  </div>
                ))}
              </div>

              <Button variant="glow" className="mt-8 gap-2">
                <MessageSquare className="h-4 w-4" />
                Try AI Assistant
              </Button>
            </div>

            {/* AI Chat Preview */}
            <div className="rounded-xl border border-border bg-card p-6 shadow-lg">
              <div className="mb-4 flex items-center gap-2">
                <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                  <Sparkles className="h-4 w-4 text-primary-foreground" />
                </div>
                <span className="font-medium text-foreground">Nexus AI</span>
              </div>

              <div className="space-y-4">
                <div className="rounded-lg bg-muted p-3 text-sm text-foreground">
                  I noticed the authentication API has had 3 related bug reports
                  this week. Should I create a parent ticket to track root cause
                  analysis?
                </div>
                <div className="ml-auto max-w-[80%] rounded-lg bg-primary p-3 text-sm text-primary-foreground">
                  Yes, and assign it to the security team
                </div>
                <div className="rounded-lg bg-muted p-3 text-sm text-foreground">
                  Done! Created{" "}
                  <span className="font-medium text-primary">AUTH-142</span> and
                  assigned to Sarah Chen. I've linked all related tickets and
                  set priority to High based on customer impact.
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="mx-auto max-w-4xl px-6 text-center">
          <h2 className="text-3xl font-bold text-foreground sm:text-4xl">
            Ready to transform how your team works?
          </h2>
          <p className="mx-auto mt-4 max-w-xl text-muted-foreground">
            Join thousands of teams shipping faster with Nexus. Free for small
            teams, no credit card required.
          </p>
          <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
            <Link to="/signup">
              <Button variant="glow" size="xl" className="gap-2">
                Get started for free
                <ArrowRight className="h-5 w-5" />
              </Button>
            </Link>
            <Button variant="outline" size="xl">
              Schedule a demo
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-muted/30 py-12">
        <div className="mx-auto max-w-7xl px-6">
          <div className="flex flex-col items-center justify-between gap-6 md:flex-row">
            <div className="flex items-center gap-2">
              <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
                <Sparkles className="h-4 w-4 text-primary-foreground" />
              </div>
              <span className="text-lg font-semibold text-foreground">
                Nexus
              </span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <a href="#" className="hover:text-foreground">
                Privacy
              </a>
              <a href="#" className="hover:text-foreground">
                Terms
              </a>
              <a href="#" className="hover:text-foreground">
                Security
              </a>
              <a href="#" className="hover:text-foreground">
                Status
              </a>
            </div>
            <p className="text-sm text-muted-foreground">
              © 2025 Nexus. All rights reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  );
}
