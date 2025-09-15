import { useLocation, Link } from "react-router-dom";
import { useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Home, AlertCircle } from "lucide-react";

const NotFound = () => {
  const location = useLocation();

  useEffect(() => {
    console.error("404 Error: User attempted to access non-existent route:", location.pathname);
  }, [location.pathname]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-background relative overflow-hidden">
      {/* Animated background gradient */}
      <div className="fixed inset-0 bg-gradient-radial from-primary/20 via-background to-background animate-pulse-glow"></div>
      
      <div className="relative z-10 text-center space-y-6 p-8">
        <div className="mx-auto h-24 w-24 bg-destructive/20 rounded-full flex items-center justify-center mb-6">
          <AlertCircle className="h-12 w-12 text-destructive" />
        </div>
        <h1 className="text-6xl font-display font-bold text-foreground">404</h1>
        <p className="text-2xl text-muted-foreground">Page not found</p>
        <p className="text-lg text-muted-foreground max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>
        <Link to="/">
          <Button className="bg-gradient-primary hover:shadow-glow">
            <Home className="h-4 w-4 mr-2" />
            Return Home
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default NotFound;
