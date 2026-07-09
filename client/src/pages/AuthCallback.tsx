import { useEffect } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";

export default function AuthCallback() {
  const [, setLocation] = useLocation();
  const { isAuthenticated, loading } = useAuth();

  useEffect(() => {
    if (!loading && isAuthenticated) {
      // Redirect to home after successful auth
      setLocation("/");
    }
  }, [isAuthenticated, loading, setLocation]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="w-12 h-12 rounded-full bg-accent/20 animate-pulse mx-auto mb-4" />
        <h1 className="text-2xl font-serif text-foreground mb-2">Signing you in...</h1>
        <p className="text-muted-foreground font-sans">Please wait while we complete your authentication.</p>
      </div>
    </div>
  );
}
