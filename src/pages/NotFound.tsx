import { Link, useLocation } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Sparkles, ArrowLeft, Home } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-background px-6">
      {/* Background Effects */}
      <div className="pointer-events-none absolute inset-0">
        <div className="absolute left-1/2 top-1/2 h-[400px] w-[600px] -translate-x-1/2 -translate-y-1/2 rounded-full bg-primary/5 blur-[100px]" />
      </div>

      <div className="relative text-center">
        <div className="mb-6 flex items-center justify-center">
          <div className="flex h-16 w-16 items-center justify-center rounded-2xl bg-primary/10">
            <Sparkles className="h-8 w-8 text-primary" />
          </div>
        </div>

        <h1 className="text-7xl font-bold text-foreground">404</h1>
        <p className="mt-4 text-xl text-muted-foreground">
          Oops! This page doesn't exist.
        </p>
        <p className="mt-2 text-muted-foreground">
          The page you're looking for might have been moved or deleted.
        </p>

        <div className="mt-8 flex flex-col items-center justify-center gap-4 sm:flex-row">
          <Link to="/">
            <Button variant="glow" className="gap-2">
              <Home className="h-4 w-4" />
              Go home
            </Button>
          </Link>
          <Link to="/dashboard">
            <Button variant="outline" className="gap-2">
              <ArrowLeft className="h-4 w-4" />
              Back to dashboard
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
