import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Check, X, Sparkles, UserPlus } from "lucide-react";

type InviteStatus = "loading" | "valid" | "invalid" | "expired" | "accepted" | "error";

interface InviteDetails {
  id: string;
  email: string;
  role: string;
  organization: {
    id: string;
    name: string;
  };
}

export default function AcceptInvite() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { user, isLoading: authLoading } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const { toast } = useToast();

  const [status, setStatus] = useState<InviteStatus>("loading");
  const [invite, setInvite] = useState<InviteDetails | null>(null);
  const [isAccepting, setIsAccepting] = useState(false);

  const token = searchParams.get("token");

  useEffect(() => {
    if (!token) {
      setStatus("invalid");
      return;
    }

    const fetchInvite = async () => {
      try {
        const { data, error } = await supabase
          .from("organization_invites")
          .select(`
            id,
            email,
            role,
            status,
            organization:organizations(id, name)
          `)
          .eq("token", token)
          .single();

        if (error || !data) {
          setStatus("invalid");
          return;
        }

        if (data.status === "accepted") {
          setStatus("accepted");
          return;
        }

        if (data.status === "expired") {
          setStatus("expired");
          return;
        }

        setInvite({
          id: data.id,
          email: data.email,
          role: data.role,
          organization: data.organization as { id: string; name: string },
        });
        setStatus("valid");
      } catch (error) {
        console.error("Error fetching invite:", error);
        setStatus("error");
      }
    };

    fetchInvite();
  }, [token]);

  const handleAccept = async () => {
    if (!invite || !user) return;

    setIsAccepting(true);

    try {
      // Create membership
      const { error: membershipError } = await supabase
        .from("organization_memberships")
        .insert({
          organization_id: invite.organization.id,
          user_id: user.id,
          role: invite.role as "admin" | "manager" | "member",
        });

      if (membershipError) {
        // Check if already a member
        if (membershipError.code === "23505") {
          toast({
            title: "Already a member",
            description: "You're already a member of this organization.",
          });
        } else {
          throw membershipError;
        }
      }

      // Update invite status
      await supabase
        .from("organization_invites")
        .update({ status: "accepted" })
        .eq("id", invite.id);

      toast({
        title: "Invite accepted!",
        description: `You've joined ${invite.organization.name}`,
      });

      await refreshOrganizations();
      navigate("/dashboard");
    } catch (error) {
      console.error("Error accepting invite:", error);
      toast({
        title: "Error",
        description: "Failed to accept invite. Please try again.",
        variant: "destructive",
      });
    } finally {
      setIsAccepting(false);
    }
  };

  // Wait for auth to load
  if (authLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Redirect to login if not authenticated
  if (!user && status === "valid") {
    return (
      <div className="flex min-h-screen flex-col bg-background">
        <header className="border-b border-border px-6 py-4">
          <div className="flex items-center gap-2">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
              <Sparkles className="h-4 w-4 text-primary-foreground" />
            </div>
            <span className="text-lg font-semibold">Nexus</span>
          </div>
        </header>

        <main className="flex flex-1 items-center justify-center px-6 py-12">
          <div className="w-full max-w-md text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
              <UserPlus className="h-6 w-6 text-primary" />
            </div>
            <h1 className="text-2xl font-bold">You're Invited!</h1>
            <p className="mt-2 text-muted-foreground">
              You've been invited to join{" "}
              <span className="font-medium text-foreground">
                {invite?.organization.name}
              </span>{" "}
              as a {invite?.role}.
            </p>
            <p className="mt-4 text-sm text-muted-foreground">
              Please sign in or create an account to accept this invitation.
            </p>

            <div className="mt-6 flex gap-3">
              <Button
                variant="outline"
                className="flex-1"
                onClick={() =>
                  navigate(`/login?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)
                }
              >
                Sign In
              </Button>
              <Button
                className="flex-1"
                onClick={() =>
                  navigate(`/signup?returnTo=${encodeURIComponent(window.location.pathname + window.location.search)}`)
                }
              >
                Create Account
              </Button>
            </div>
          </div>
        </main>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen flex-col bg-background">
      <header className="border-b border-border px-6 py-4">
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Nexus</span>
        </div>
      </header>

      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md text-center">
          {status === "loading" && (
            <>
              <Loader2 className="mx-auto h-8 w-8 animate-spin text-primary" />
              <p className="mt-4 text-muted-foreground">Validating invitation...</p>
            </>
          )}

          {status === "invalid" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <X className="h-6 w-6 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">Invalid Invitation</h1>
              <p className="mt-2 text-muted-foreground">
                This invitation link is invalid or has been revoked.
              </p>
              <Button className="mt-6" onClick={() => navigate("/")}>
                Go Home
              </Button>
            </>
          )}

          {status === "expired" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-muted">
                <X className="h-6 w-6 text-muted-foreground" />
              </div>
              <h1 className="text-2xl font-bold">Invitation Expired</h1>
              <p className="mt-2 text-muted-foreground">
                This invitation has expired. Please ask for a new invite.
              </p>
              <Button className="mt-6" onClick={() => navigate("/")}>
                Go Home
              </Button>
            </>
          )}

          {status === "accepted" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <Check className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">Already Accepted</h1>
              <p className="mt-2 text-muted-foreground">
                This invitation has already been accepted.
              </p>
              <Button className="mt-6" onClick={() => navigate("/dashboard")}>
                Go to Dashboard
              </Button>
            </>
          )}

          {status === "valid" && invite && user && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                <UserPlus className="h-6 w-6 text-primary" />
              </div>
              <h1 className="text-2xl font-bold">You're Invited!</h1>
              <p className="mt-2 text-muted-foreground">
                You've been invited to join{" "}
                <span className="font-medium text-foreground">
                  {invite.organization.name}
                </span>{" "}
                as a <span className="capitalize font-medium">{invite.role}</span>.
              </p>

              <div className="mt-6 flex gap-3">
                <Button
                  variant="outline"
                  className="flex-1"
                  onClick={() => navigate("/")}
                  disabled={isAccepting}
                >
                  Decline
                </Button>
                <Button
                  className="flex-1"
                  onClick={handleAccept}
                  disabled={isAccepting}
                >
                  {isAccepting ? (
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  ) : (
                    <Check className="mr-2 h-4 w-4" />
                  )}
                  Accept Invite
                </Button>
              </div>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-destructive/10">
                <X className="h-6 w-6 text-destructive" />
              </div>
              <h1 className="text-2xl font-bold">Something Went Wrong</h1>
              <p className="mt-2 text-muted-foreground">
                We couldn't load this invitation. Please try again.
              </p>
              <Button className="mt-6" onClick={() => window.location.reload()}>
                Retry
              </Button>
            </>
          )}
        </div>
      </main>
    </div>
  );
}
