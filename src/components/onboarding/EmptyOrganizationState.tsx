import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Building2, Link2, Sparkles } from "lucide-react";

export function EmptyOrganizationState() {
  const navigate = useNavigate();

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Nexus</span>
        </div>
      </header>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          <div className="mx-auto mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-muted">
            <Building2 className="h-8 w-8 text-muted-foreground" />
          </div>

          <h1 className="text-2xl font-bold">Create an Organization to Continue</h1>
          <p className="mt-3 text-muted-foreground">
            An organization is required to manage projects, tickets, and team members.
          </p>

          <div className="mt-8 space-y-3">
            <Button
              size="lg"
              className="w-full"
              onClick={() => navigate("/onboarding/create-organization")}
            >
              <Building2 className="mr-2 h-4 w-4" />
              Create Organization
            </Button>

            <Button
              variant="outline"
              size="lg"
              className="w-full"
              onClick={() => {
                // Could open a modal to paste invite link
                const link = prompt("Paste your invite link:");
                if (link) {
                  try {
                    const url = new URL(link);
                    if (url.pathname.includes("/invite")) {
                      window.location.href = link;
                    }
                  } catch {
                    // Invalid URL
                  }
                }
              }}
            >
              <Link2 className="mr-2 h-4 w-4" />
              Join via Invite Link
            </Button>
          </div>

          <p className="mt-6 text-xs text-muted-foreground">
            If you've received an invitation, check your email for the invite link.
          </p>
        </div>
      </main>
    </div>
  );
}
