import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Organization, OrganizationMembership, OrganizationRole } from "@/types/domain";
import { useAuth } from "./AuthContext";

interface OrganizationContextType {
  organizations: Organization[];
  currentOrganization: Organization | null;
  currentMembership: OrganizationMembership | null;
  currentRole: OrganizationRole | null;
  isLoading: boolean;
  setCurrentOrganization: (org: Organization) => void;
  refreshOrganizations: () => Promise<void>;
}

const OrganizationContext = createContext<OrganizationContextType | undefined>(undefined);

export function OrganizationProvider({ children }: { children: ReactNode }) {
  const { user } = useAuth();
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [currentOrganization, setCurrentOrganization] = useState<Organization | null>(null);
  const [memberships, setMemberships] = useState<OrganizationMembership[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchOrganizations = async () => {
    if (!user) {
      setOrganizations([]);
      setCurrentOrganization(null);
      setMemberships([]);
      setIsLoading(false);
      return;
    }

    try {
      // Fetch user's organization memberships with organization data
      const { data: membershipData, error } = await supabase
        .from("organization_memberships")
        .select(`
          *,
          organization:organizations(*)
        `)
        .eq("user_id", user.id);

      if (error) throw error;

      const orgs = membershipData
        ?.map((m) => m.organization as Organization)
        .filter(Boolean) || [];
      
      setOrganizations(orgs);
      setMemberships(membershipData || []);

      // Set current organization from localStorage or first one
      const savedOrgId = localStorage.getItem("nexus_current_org");
      const savedOrg = orgs.find((o) => o.id === savedOrgId);
      
      if (savedOrg) {
        setCurrentOrganization(savedOrg);
      } else if (orgs.length > 0) {
        setCurrentOrganization(orgs[0]);
        localStorage.setItem("nexus_current_org", orgs[0].id);
      }
    } catch (error) {
      console.error("Error fetching organizations:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchOrganizations();
  }, [user]);

  const handleSetCurrentOrganization = (org: Organization) => {
    setCurrentOrganization(org);
    localStorage.setItem("nexus_current_org", org.id);
  };

  const currentMembership = memberships.find(
    (m) => m.organization_id === currentOrganization?.id
  ) || null;

  const currentRole = currentMembership?.role || null;

  return (
    <OrganizationContext.Provider
      value={{
        organizations,
        currentOrganization,
        currentMembership,
        currentRole,
        isLoading,
        setCurrentOrganization: handleSetCurrentOrganization,
        refreshOrganizations: fetchOrganizations,
      }}
    >
      {children}
    </OrganizationContext.Provider>
  );
}

export function useOrganization() {
  const context = useContext(OrganizationContext);
  if (context === undefined) {
    throw new Error("useOrganization must be used within an OrganizationProvider");
  }
  return context;
}
