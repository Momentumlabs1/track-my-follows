import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { Loader2 } from "lucide-react";

/**
 * /auth/callback — deterministic landing page for OAuth returns.
 * The actual code exchange now happens globally in AuthContext,
 * so this page just waits for the session and redirects.
 */
const AuthCallback = () => {
  const navigate = useNavigate();
  const { user, loading } = useAuth();

  useEffect(() => {
    if (loading) return;
    // AuthContext already exchanged the code; just navigate
    navigate(user ? "/dashboard" : "/login", { replace: true });
  }, [user, loading, navigate]);

  return (
    <div className="min-h-screen bg-background flex items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-primary" />
    </div>
  );
};

export default AuthCallback;
