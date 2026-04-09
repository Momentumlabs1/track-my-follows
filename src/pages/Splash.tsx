import { useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";

// Splash now just redirects – the actual animation lives in Onboarding
export default function Splash() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (loading) return;
    navigate(user ? "/dashboard" : "/", { replace: true });
  }, [user, loading, navigate]);

  return <div className="min-h-[100dvh] bg-background" />;
}
