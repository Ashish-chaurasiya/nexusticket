import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useOrganization } from "@/contexts/OrganizationContext";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { useToast } from "@/hooks/use-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
  Users,
  UserPlus,
  Mail,
  Shield,
  ShieldCheck,
  User,
  Clock,
  CheckCircle,
  XCircle,
  Loader2,
  Trash2,
  MoreHorizontal,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

type OrganizationRole = "admin" | "manager" | "member";

interface Member {
  id: string;
  user_id: string;
  role: OrganizationRole;
  created_at: string;
  profile: {
    email: string;
    full_name: string | null;
    avatar_url: string | null;
  } | null;
}

interface Invite {
  id: string;
  email: string;
  role: OrganizationRole;
  status: string;
  created_at: string;
}

const roleIcons: Record<OrganizationRole, typeof Shield> = {
  admin: ShieldCheck,
  manager: Shield,
  member: User,
};

const roleColors: Record<OrganizationRole, string> = {
  admin: "bg-primary/20 text-primary",
  manager: "bg-amber-500/20 text-amber-500",
  member: "bg-muted text-muted-foreground",
};

export default function Team() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { currentOrganization, currentRole } = useOrganization();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [inviteDialogOpen, setInviteDialogOpen] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState<OrganizationRole>("member");
  const [isInviting, setIsInviting] = useState(false);

  const isAdmin = currentRole === "admin";

  // Fetch members
  const { data: members = [], isLoading: membersLoading } = useQuery({
    queryKey: ["org-members", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from("organization_memberships")
        .select(`
          id,
          user_id,
          role,
          created_at
        `)
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: true });

      if (error) throw error;

      // Fetch profiles for all members
      const userIds = data.map((m) => m.user_id);
      const { data: profiles } = await supabase
        .from("profiles")
        .select("user_id, email, full_name, avatar_url")
        .in("user_id", userIds);

      const profileMap = new Map(profiles?.map((p) => [p.user_id, p]) || []);

      return data.map((m) => ({
        ...m,
        profile: profileMap.get(m.user_id) || null,
      })) as Member[];
    },
    enabled: !!currentOrganization,
  });

  // Fetch pending invites
  const { data: invites = [], isLoading: invitesLoading } = useQuery({
    queryKey: ["org-invites", currentOrganization?.id],
    queryFn: async () => {
      if (!currentOrganization) return [];

      const { data, error } = await supabase
        .from("organization_invites")
        .select("id, email, role, status, created_at")
        .eq("organization_id", currentOrganization.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      return data as Invite[];
    },
    enabled: !!currentOrganization && isAdmin,
  });

  // Send invite mutation
  const sendInviteMutation = useMutation({
    mutationFn: async ({ email, role }: { email: string; role: OrganizationRole }) => {
      if (!currentOrganization || !user) throw new Error("Not authenticated");

      // Check if email is already a member
      const existingMember = members.find(
        (m) => m.profile?.email.toLowerCase() === email.toLowerCase()
      );
      if (existingMember) {
        throw new Error("This email is already a member of the organization");
      }

      // Check if invite already exists
      const existingInvite = invites.find(
        (i) => i.email.toLowerCase() === email.toLowerCase() && i.status === "pending"
      );
      if (existingInvite) {
        throw new Error("An invite has already been sent to this email");
      }

      // Create invite
      const { data: invite, error: inviteError } = await supabase
        .from("organization_invites")
        .insert({
          organization_id: currentOrganization.id,
          email: email.toLowerCase().trim(),
          role,
          invited_by: user.id,
          status: "pending",
        })
        .select("id, token")
        .single();

      if (inviteError) throw inviteError;

      // Send email via edge function
      const { error: emailError } = await supabase.functions.invoke("send-invite-email", {
        body: {
          inviteId: invite.id,
          email: email.toLowerCase().trim(),
          organizationName: currentOrganization.name,
          role,
          token: invite.token,
        },
      });

      if (emailError) {
        console.error("Failed to send invite email:", emailError);
        // Don't throw - invite was created, email just failed
      }

      return invite;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-invites", currentOrganization?.id] });
      toast({
        title: "Invite sent",
        description: `An invitation has been sent to ${inviteEmail}`,
      });
      setInviteDialogOpen(false);
      setInviteEmail("");
      setInviteRole("member");
    },
    onError: (error) => {
      toast({
        variant: "destructive",
        title: "Failed to send invite",
        description: error instanceof Error ? error.message : "An error occurred",
      });
    },
  });

  // Revoke invite mutation
  const revokeInviteMutation = useMutation({
    mutationFn: async (inviteId: string) => {
      const { error } = await supabase
        .from("organization_invites")
        .delete()
        .eq("id", inviteId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-invites", currentOrganization?.id] });
      toast({ title: "Invite revoked" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to revoke invite",
      });
    },
  });

  // Update member role mutation
  const updateRoleMutation = useMutation({
    mutationFn: async ({ memberId, newRole }: { memberId: string; newRole: OrganizationRole }) => {
      const { error } = await supabase
        .from("organization_memberships")
        .update({ role: newRole })
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", currentOrganization?.id] });
      toast({ title: "Role updated" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to update role",
      });
    },
  });

  // Remove member mutation
  const removeMemberMutation = useMutation({
    mutationFn: async (memberId: string) => {
      const { error } = await supabase
        .from("organization_memberships")
        .delete()
        .eq("id", memberId);

      if (error) throw error;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["org-members", currentOrganization?.id] });
      toast({ title: "Member removed" });
    },
    onError: () => {
      toast({
        variant: "destructive",
        title: "Failed to remove member",
      });
    },
  });

  const handleSendInvite = () => {
    if (!inviteEmail || !inviteEmail.includes("@")) {
      toast({
        variant: "destructive",
        title: "Invalid email",
        description: "Please enter a valid email address",
      });
      return;
    }
    sendInviteMutation.mutate({ email: inviteEmail, role: inviteRole });
  };

  const getInitials = (name: string | null, email: string) => {
    if (name) {
      return name
        .split(" ")
        .map((n) => n[0])
        .join("")
        .toUpperCase()
        .substring(0, 2);
    }
    return email.substring(0, 2).toUpperCase();
  };

  const formatDate = (dateStr: string) => {
    return new Date(dateStr).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const pendingInvites = invites.filter((i) => i.status === "pending");
  const acceptedInvites = invites.filter((i) => i.status === "accepted");

  return (
    <DashboardLayout>
      <div className="flex-1 overflow-auto p-6">
        <div className="mx-auto max-w-4xl space-y-8">
          {/* Header */}
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-semibold">Team</h1>
              <p className="text-muted-foreground">
                Manage members and invitations for {currentOrganization?.name}
              </p>
            </div>
            {isAdmin && (
              <Dialog open={inviteDialogOpen} onOpenChange={setInviteDialogOpen}>
                <DialogTrigger asChild>
                  <Button>
                    <UserPlus className="mr-2 h-4 w-4" />
                    Invite Member
                  </Button>
                </DialogTrigger>
                <DialogContent>
                  <DialogHeader>
                    <DialogTitle>Invite Team Member</DialogTitle>
                    <DialogDescription>
                      Send an invitation to join {currentOrganization?.name}
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4 py-4">
                    <div className="space-y-2">
                      <Label htmlFor="email">Email address</Label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="colleague@company.com"
                        value={inviteEmail}
                        onChange={(e) => setInviteEmail(e.target.value)}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label htmlFor="role">Role</Label>
                      <Select value={inviteRole} onValueChange={(v) => setInviteRole(v as OrganizationRole)}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="admin">
                            <div className="flex items-center gap-2">
                              <ShieldCheck className="h-4 w-4" />
                              Admin
                            </div>
                          </SelectItem>
                          <SelectItem value="manager">
                            <div className="flex items-center gap-2">
                              <Shield className="h-4 w-4" />
                              Manager
                            </div>
                          </SelectItem>
                          <SelectItem value="member">
                            <div className="flex items-center gap-2">
                              <User className="h-4 w-4" />
                              Member
                            </div>
                          </SelectItem>
                        </SelectContent>
                      </Select>
                      <p className="text-xs text-muted-foreground">
                        {inviteRole === "admin" && "Full access to all settings, members, and projects"}
                        {inviteRole === "manager" && "Can manage projects, sprints, and tickets"}
                        {inviteRole === "member" && "Can view and work on assigned projects"}
                      </p>
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setInviteDialogOpen(false)}>
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendInvite}
                      disabled={sendInviteMutation.isPending}
                    >
                      {sendInviteMutation.isPending ? (
                        <>
                          <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                          Sending...
                        </>
                      ) : (
                        <>
                          <Mail className="mr-2 h-4 w-4" />
                          Send Invite
                        </>
                      )}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            )}
          </div>

          {/* Members Section */}
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Users className="h-5 w-5 text-muted-foreground" />
              <h2 className="text-lg font-medium">Members ({members.length})</h2>
            </div>

            <div className="rounded-lg border border-border bg-card">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Member</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Joined</TableHead>
                    {isAdmin && <TableHead className="w-12"></TableHead>}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {membersLoading ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8">
                        <Loader2 className="mx-auto h-6 w-6 animate-spin text-muted-foreground" />
                      </TableCell>
                    </TableRow>
                  ) : members.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={4} className="text-center py-8 text-muted-foreground">
                        No members yet
                      </TableCell>
                    </TableRow>
                  ) : (
                    members.map((member) => {
                      const RoleIcon = roleIcons[member.role];
                      const isCurrentUser = member.user_id === user?.id;

                      return (
                        <TableRow key={member.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <Avatar className="h-8 w-8">
                                <AvatarImage src={member.profile?.avatar_url || undefined} />
                                <AvatarFallback>
                                  {getInitials(member.profile?.full_name || null, member.profile?.email || "")}
                                </AvatarFallback>
                              </Avatar>
                              <div>
                                <p className="font-medium">
                                  {member.profile?.full_name || "Unknown"}
                                  {isCurrentUser && (
                                    <span className="ml-2 text-xs text-muted-foreground">(you)</span>
                                  )}
                                </p>
                                <p className="text-sm text-muted-foreground">
                                  {member.profile?.email}
                                </p>
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn("gap-1 capitalize", roleColors[member.role])}
                            >
                              <RoleIcon className="h-3 w-3" />
                              {member.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(member.created_at)}
                          </TableCell>
                          {isAdmin && (
                            <TableCell>
                              {!isCurrentUser && (
                                <DropdownMenu>
                                  <DropdownMenuTrigger asChild>
                                    <Button variant="ghost" size="icon" className="h-8 w-8">
                                      <MoreHorizontal className="h-4 w-4" />
                                    </Button>
                                  </DropdownMenuTrigger>
                                  <DropdownMenuContent align="end">
                                    <DropdownMenuItem
                                      onClick={() =>
                                        updateRoleMutation.mutate({
                                          memberId: member.id,
                                          newRole: member.role === "admin" ? "member" : "admin",
                                        })
                                      }
                                    >
                                      {member.role === "admin" ? "Demote to Member" : "Promote to Admin"}
                                    </DropdownMenuItem>
                                    <DropdownMenuItem
                                      className="text-destructive"
                                      onClick={() => removeMemberMutation.mutate(member.id)}
                                    >
                                      <Trash2 className="mr-2 h-4 w-4" />
                                      Remove
                                    </DropdownMenuItem>
                                  </DropdownMenuContent>
                                </DropdownMenu>
                              )}
                            </TableCell>
                          )}
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </div>
          </div>

          {/* Pending Invites Section (Admin only) */}
          {isAdmin && pendingInvites.length > 0 && (
            <div className="space-y-4">
              <div className="flex items-center gap-2">
                <Clock className="h-5 w-5 text-muted-foreground" />
                <h2 className="text-lg font-medium">Pending Invites ({pendingInvites.length})</h2>
              </div>

              <div className="rounded-lg border border-border bg-card">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Email</TableHead>
                      <TableHead>Role</TableHead>
                      <TableHead>Sent</TableHead>
                      <TableHead className="w-12"></TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {pendingInvites.map((invite) => {
                      const RoleIcon = roleIcons[invite.role];

                      return (
                        <TableRow key={invite.id}>
                          <TableCell>
                            <div className="flex items-center gap-3">
                              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-muted">
                                <Mail className="h-4 w-4 text-muted-foreground" />
                              </div>
                              <span>{invite.email}</span>
                            </div>
                          </TableCell>
                          <TableCell>
                            <Badge
                              variant="secondary"
                              className={cn("gap-1 capitalize", roleColors[invite.role])}
                            >
                              <RoleIcon className="h-3 w-3" />
                              {invite.role}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-muted-foreground">
                            {formatDate(invite.created_at)}
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="icon"
                              className="h-8 w-8 text-destructive hover:text-destructive"
                              onClick={() => revokeInviteMutation.mutate(invite.id)}
                            >
                              <XCircle className="h-4 w-4" />
                            </Button>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}

          {/* Role Permissions Info */}
          <div className="rounded-lg border border-border bg-card p-6">
            <h3 className="font-medium mb-4">Role Permissions</h3>
            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <ShieldCheck className="h-4 w-4 text-primary" />
                  <span className="font-medium">Admin</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li>• Full organization access</li>
                  <li>• Manage members & invites</li>
                  <li>• Create & delete projects</li>
                  <li>• Configure settings</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <Shield className="h-4 w-4 text-amber-500" />
                  <span className="font-medium">Manager</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li>• Manage projects & sprints</li>
                  <li>• Create & assign tickets</li>
                  <li>• View team analytics</li>
                  <li>• Delete tickets</li>
                </ul>
              </div>
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <User className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Member</span>
                </div>
                <ul className="text-sm text-muted-foreground space-y-1 ml-6">
                  <li>• View assigned projects</li>
                  <li>• Create tickets</li>
                  <li>• Update assigned tickets</li>
                  <li>• Add comments</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
