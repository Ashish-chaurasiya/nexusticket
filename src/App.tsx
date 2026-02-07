import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { OrganizationProvider } from "@/contexts/OrganizationContext";
import { OrganizationGuard } from "@/components/onboarding/OrganizationGuard";
import Landing from "./pages/Landing";
import Login from "./pages/Login";
import Signup from "./pages/Signup";
import Dashboard from "./pages/Dashboard";
import ProjectBoard from "./pages/ProjectBoard";
import TicketCreate from "./pages/TicketCreate";
import TicketDetail from "./pages/TicketDetail";
import CreateOrganization from "./pages/onboarding/CreateOrganization";
import AcceptInvite from "./pages/onboarding/AcceptInvite";
import Team from "./pages/Team";
import NotFound from "./pages/NotFound";

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <AuthProvider>
      <OrganizationProvider>
        <TooltipProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <OrganizationGuard>
              <Routes>
                <Route path="/" element={<Landing />} />
                <Route path="/login" element={<Login />} />
                <Route path="/signup" element={<Signup />} />
                <Route path="/onboarding/create-organization" element={<CreateOrganization />} />
                <Route path="/invite" element={<AcceptInvite />} />
                <Route path="/dashboard" element={<Dashboard />} />
                <Route path="/projects" element={<ProjectBoard />} />
                <Route path="/projects/:projectId" element={<ProjectBoard />} />
                <Route path="/projects/:projectId/tickets/new" element={<TicketCreate />} />
                <Route path="/tickets/:ticketId" element={<TicketDetail />} />
                <Route path="/tickets" element={<Dashboard />} />
                <Route path="/team" element={<Team />} />
                <Route path="/settings" element={<Dashboard />} />
                {/* ADD ALL CUSTOM ROUTES ABOVE THE CATCH-ALL "*" ROUTE */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </OrganizationGuard>
          </BrowserRouter>
        </TooltipProvider>
      </OrganizationProvider>
    </AuthProvider>
  </QueryClientProvider>
);

export default App;
