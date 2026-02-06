import { ReactNode, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { useOrganization } from "@/contexts/OrganizationContext";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

interface OrganizationGuardProps {
  children: ReactNode;
}

const PROTECTED_ROUTES = [
  "/dashboard",
  "/projects",
  "/tickets",
  "/team",
  "/settings",
];

export function OrganizationGuard({ children }: OrganizationGuardProps) {
  const navigate = useNavigate();
  const location = useLocation();
  const { user, isLoading: authLoading } = useAuth();
  const { organizations, isLoading: orgLoading } = useOrganization();

  const isProtectedRoute = PROTECTED_ROUTES.some((route) =>
    location.pathname.startsWith(route)
  );

  useEffect(() => {
    // Wait for both auth and org data to load
    if (authLoading || orgLoading) return;

    // If user is not logged in and on protected route, redirect to login
    if (!user && isProtectedRoute) {
      navigate("/login", { 
        replace: true,
        state: { returnTo: location.pathname }
      });
      return;
    }

    // If user is logged in but has no organizations, redirect to onboarding
    if (user && !orgLoading && organizations.length === 0 && isProtectedRoute) {
      navigate("/onboarding/create-organization", { replace: true });
      return;
    }
  }, [user, authLoading, organizations, orgLoading, isProtectedRoute, navigate, location]);

  // Show loading state while checking auth/org status
  if ((authLoading || orgLoading) && isProtectedRoute) {
    return (
      <div className="flex h-screen items-center justify-center bg-background">
        <div className="flex flex-col items-center gap-4">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-sm text-muted-foreground">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  // Block rendering if on protected route without org
  if (user && organizations.length === 0 && isProtectedRoute) {
    return null; // Will redirect via useEffect
  }

  return <>{children}</>;
}
