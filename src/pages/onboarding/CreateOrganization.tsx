import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Progress } from "@/components/ui/progress";
import { useToast } from "@/hooks/use-toast";
import {
  Building2,
  Users,
  Mail,
  Plus,
  Trash2,
  ArrowRight,
  ArrowLeft,
  Check,
  Loader2,
  Sparkles,
  Rocket,
} from "lucide-react";
import { cn } from "@/lib/utils";

type Step = 1 | 2 | 3;

interface Invite {
  id: string;
  email: string;
  role: "admin" | "manager" | "member";
}

interface ProvisioningStep {
  step: string;
  status: "pending" | "done" | "error";
}

const INDUSTRIES = [
  "Technology",
  "Healthcare",
  "Finance",
  "Education",
  "E-commerce",
  "Media",
  "Manufacturing",
  "Other",
];

const TEAM_SIZES = [
  { value: "1-5", label: "1–5 members" },
  { value: "6-20", label: "6–20 members" },
  { value: "20+", label: "20+ members" },
];

export default function CreateOrganization() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { refreshOrganizations } = useOrganization();
  const { toast } = useToast();

  const [step, setStep] = useState<Step>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [provisioningSteps, setProvisioningSteps] = useState<ProvisioningStep[]>([]);
  const [redirectPath, setRedirectPath] = useState<string | null>(null);

  // Step 1 fields
  const [orgName, setOrgName] = useState("");
  const [industry, setIndustry] = useState("");
  const [teamSize, setTeamSize] = useState("");

  // Step 2 fields
  const [invites, setInvites] = useState<Invite[]>([
    { id: crypto.randomUUID(), email: "", role: "member" },
  ]);

  // Redirect if user already has organizations
  useEffect(() => {
    if (!user) {
      navigate("/login");
    }
  }, [user, navigate]);

  // Subscribe to provisioning progress
  useEffect(() => {
    if (step !== 3) return;

    const channel = supabase
      .channel("provisioning-progress")
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "org_provisioning_steps",
        },
        (payload) => {
          const newStep = payload.new as ProvisioningStep;
          setProvisioningSteps((prev) => [...prev, newStep]);
        }
      )
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [step]);

  // Auto-redirect after provisioning completes
  useEffect(() => {
    if (redirectPath && provisioningSteps.some((s) => s.step === "Setup complete")) {
      const timer = setTimeout(async () => {
        await refreshOrganizations();
        navigate(redirectPath);
      }, 1500);
      return () => clearTimeout(timer);
    }
  }, [provisioningSteps, redirectPath, navigate, refreshOrganizations]);

  const addInvite = () => {
    setInvites([
      ...invites,
      { id: crypto.randomUUID(), email: "", role: "member" },
    ]);
  };

  const removeInvite = (id: string) => {
    if (invites.length > 1) {
      setInvites(invites.filter((inv) => inv.id !== id));
    }
  };

  const updateInvite = (id: string, field: "email" | "role", value: string) => {
    setInvites(
      invites.map((inv) =>
        inv.id === id ? { ...inv, [field]: value } : inv
      )
    );
  };

  const handleCreateOrganization = async () => {
    if (!orgName.trim()) {
      toast({
        title: "Name required",
        description: "Please enter an organization name.",
        variant: "destructive",
      });
      return;
    }

    setIsSubmitting(true);
    setStep(3);
    setProvisioningSteps([]);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error("No session");

      const validInvites = invites
        .filter((inv) => inv.email.includes("@"))
        .map((inv) => ({ email: inv.email, role: inv.role }));

      const response = await supabase.functions.invoke("create-organization-bootstrap", {
        body: {
          name: orgName.trim(),
          template: "startup",
          isDemo: true,
          invites: validInvites,
        },
      });

      if (response.error) {
        throw new Error(response.error.message || "Failed to create organization");
      }

      const { data } = response;
      if (!data.success) {
        throw new Error(data.error || "Failed to create organization");
      }

      setRedirectPath(data.redirectTo);
    } catch (error) {
      console.error("Bootstrap error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "Failed to create organization",
        variant: "destructive",
      });
      setStep(1);
      setIsSubmitting(false);
    }
  };

  const handleContinue = () => {
    if (step === 1) {
      if (!orgName.trim()) {
        toast({
          title: "Name required",
          description: "Please enter an organization name.",
          variant: "destructive",
        });
        return;
      }
      setStep(2);
    } else if (step === 2) {
      handleCreateOrganization();
    }
  };

  const handleSkipInvites = () => {
    setInvites([]);
    handleCreateOrganization();
  };

  const progress = step === 1 ? 33 : step === 2 ? 66 : 100;

  return (
    <div className="flex min-h-screen flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border px-6 py-4">
        <div className="mx-auto flex max-w-2xl items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-primary">
            <Sparkles className="h-4 w-4 text-primary-foreground" />
          </div>
          <span className="text-lg font-semibold">Nexus</span>
        </div>
      </header>

      {/* Progress bar */}
      <div className="border-b border-border px-6 py-3">
        <div className="mx-auto max-w-2xl">
          <Progress value={progress} className="h-1" />
          <div className="mt-2 flex justify-between text-xs text-muted-foreground">
            <span className={cn(step >= 1 && "text-foreground font-medium")}>
              Organization
            </span>
            <span className={cn(step >= 2 && "text-foreground font-medium")}>
              Team
            </span>
            <span className={cn(step >= 3 && "text-foreground font-medium")}>
              Ready
            </span>
          </div>
        </div>
      </div>

      {/* Content */}
      <main className="flex flex-1 items-center justify-center px-6 py-12">
        <div className="w-full max-w-md">
          {/* Step 1: Organization Details */}
          {step === 1 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Building2 className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Create Your Organization</h1>
                <p className="mt-2 text-muted-foreground">
                  Set up your workspace to manage projects and collaborate with your team.
                </p>
              </div>

              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="orgName">Organization Name *</Label>
                  <Input
                    id="orgName"
                    placeholder="Acme Corp"
                    value={orgName}
                    onChange={(e) => setOrgName(e.target.value)}
                    autoFocus
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="industry">Industry (optional)</Label>
                  <Select value={industry} onValueChange={setIndustry}>
                    <SelectTrigger id="industry">
                      <SelectValue placeholder="Select industry" />
                    </SelectTrigger>
                    <SelectContent>
                      {INDUSTRIES.map((ind) => (
                        <SelectItem key={ind} value={ind.toLowerCase()}>
                          {ind}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="teamSize">Team Size (optional)</Label>
                  <Select value={teamSize} onValueChange={setTeamSize}>
                    <SelectTrigger id="teamSize">
                      <SelectValue placeholder="Select team size" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEAM_SIZES.map((size) => (
                        <SelectItem key={size.value} value={size.value}>
                          {size.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button onClick={handleContinue} className="w-full" size="lg">
                Continue
                <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </div>
          )}

          {/* Step 2: Invite Team Members */}
          {step === 2 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  <Users className="h-6 w-6 text-primary" />
                </div>
                <h1 className="text-2xl font-bold">Invite Your Team</h1>
                <p className="mt-2 text-muted-foreground">
                  Collaborate better with shared ownership. You can always invite more later.
                </p>
              </div>

              <div className="space-y-3">
                {invites.map((invite, index) => (
                  <div key={invite.id} className="flex gap-2">
                    <div className="flex-1">
                      <Input
                        placeholder="email@company.com"
                        type="email"
                        value={invite.email}
                        onChange={(e) =>
                          updateInvite(invite.id, "email", e.target.value)
                        }
                      />
                    </div>
                    <Select
                      value={invite.role}
                      onValueChange={(value) =>
                        updateInvite(invite.id, "role", value)
                      }
                    >
                      <SelectTrigger className="w-28">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="admin">Admin</SelectItem>
                        <SelectItem value="manager">Manager</SelectItem>
                        <SelectItem value="member">Member</SelectItem>
                      </SelectContent>
                    </Select>
                    {invites.length > 1 && (
                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => removeInvite(invite.id)}
                      >
                        <Trash2 className="h-4 w-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                ))}

                <Button
                  variant="outline"
                  onClick={addInvite}
                  className="w-full"
                  size="sm"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Add another
                </Button>
              </div>

              <div className="flex gap-3">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="flex-1"
                >
                  <ArrowLeft className="mr-2 h-4 w-4" />
                  Back
                </Button>
                <Button onClick={handleContinue} className="flex-1">
                  <Mail className="mr-2 h-4 w-4" />
                  Send Invites
                </Button>
              </div>

              <div className="text-center">
                <Button
                  variant="link"
                  onClick={handleSkipInvites}
                  className="text-muted-foreground"
                >
                  Skip for now
                </Button>
                <p className="mt-1 text-xs text-muted-foreground">
                  You can invite members anytime from Team Settings.
                </p>
              </div>
            </div>
          )}

          {/* Step 3: Provisioning */}
          {step === 3 && (
            <div className="space-y-6">
              <div className="text-center">
                <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-primary/10">
                  {provisioningSteps.some((s) => s.step === "Setup complete") ? (
                    <Check className="h-6 w-6 text-primary" />
                  ) : (
                    <Loader2 className="h-6 w-6 animate-spin text-primary" />
                  )}
                </div>
                <h1 className="text-2xl font-bold">
                  {provisioningSteps.some((s) => s.step === "Setup complete")
                    ? "🎉 Organization Created!"
                    : "Setting Up Your Workspace"}
                </h1>
                <p className="mt-2 text-muted-foreground">
                  {provisioningSteps.some((s) => s.step === "Setup complete")
                    ? "Your workspace is ready. Redirecting..."
                    : "Please wait while we configure everything..."}
                </p>
              </div>

              <div className="space-y-2 rounded-lg border border-border bg-muted/30 p-4">
                {[
                  "Organization created",
                  "Admin role assigned",
                  "Default project created",
                  "Sprint activated",
                  "Demo tickets created",
                  "Setup complete",
                ].map((stepName) => {
                  const completed = provisioningSteps.some(
                    (s) => s.step === stepName || 
                    (stepName === "Demo tickets created" && s.step.includes("invite"))
                  );
                  const isComplete = provisioningSteps.some((s) => s.step === stepName);
                  
                  return (
                    <div
                      key={stepName}
                      className={cn(
                        "flex items-center gap-3 rounded px-2 py-1.5 transition-colors",
                        isComplete && "bg-primary/5"
                      )}
                    >
                      {isComplete ? (
                        <Check className="h-4 w-4 text-primary" />
                      ) : (
                        <div className="h-4 w-4 rounded-full border-2 border-muted-foreground/30" />
                      )}
                      <span
                        className={cn(
                          "text-sm",
                          isComplete
                            ? "text-foreground"
                            : "text-muted-foreground"
                        )}
                      >
                        {stepName}
                      </span>
                    </div>
                  );
                })}
              </div>

              {provisioningSteps.some((s) => s.step === "Setup complete") && (
                <div className="flex justify-center">
                  <Rocket className="h-8 w-8 animate-bounce text-primary" />
                </div>
              )}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
