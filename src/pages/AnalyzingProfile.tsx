import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { Check, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";

const steps = [
  "Connecting to Instagram servers...",
  "Searching user profile...",
  "Fetching profile data anonymously...",
  "Analyzing recent follows...",
  "Finalizing & securing data...",
];

const AnalyzingProfile = () => {
  const { profileId, username } = useParams();
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);
  const scanStarted = useRef(false);

  useEffect(() => {
    // Step 1-2: visual only
    const t1 = setTimeout(() => { setCurrentStep(1); setProgress(20); }, 1200);
    const t2 = setTimeout(() => { setCurrentStep(2); setProgress(40); }, 2500);

    return () => { clearTimeout(t1); clearTimeout(t2); };
  }, []);

  useEffect(() => {
    if (currentStep < 2 || scanStarted.current) return;
    scanStarted.current = true;

    const runScan = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        const res = await supabase.functions.invoke("scan-profiles", {
          headers: session?.access_token
            ? { Authorization: `Bearer ${session.access_token}` }
            : {},
        });
        if (res.error) throw res.error;

        setCurrentStep(3); setProgress(70);
        await new Promise(r => setTimeout(r, 800));
        setCurrentStep(4); setProgress(90);
        await new Promise(r => setTimeout(r, 600));
        setCurrentStep(5); setProgress(100);

        queryClient.invalidateQueries({ queryKey: ["tracked_profiles"] });
        queryClient.invalidateQueries({ queryKey: ["follow_events"] });

        await new Promise(r => setTimeout(r, 800));
        navigate(`/profile/${profileId}`, { replace: true });
      } catch (err) {
        toast.error("Scan failed: " + (err instanceof Error ? err.message : String(err)));
        navigate("/dashboard", { replace: true });
      }
    };

    runScan();
  }, [currentStep, profileId, navigate, queryClient]);

  return (
    <div className="min-h-screen bg-background flex flex-col items-center pt-16 px-6">
      <h1 className="text-xl font-extrabold text-foreground">Analyzing Follows</h1>
      <p className="text-[13px] text-muted-foreground mt-1">@{username}</p>

      {/* Avatar with pink ring */}
      <div className="my-8">
        <div className="h-28 w-28 rounded-full p-[3px] bg-gradient-to-br from-primary to-accent">
          <img
            src={`https://ui-avatars.com/api/?name=${username}&background=random&size=200`}
            alt={username}
            className="h-full w-full rounded-full object-cover bg-card"
          />
        </div>
      </div>

      {/* Progress bar */}
      <div className="w-full max-w-xs mb-8">
        <div className="h-2 bg-muted rounded-full overflow-hidden">
          <motion.div
            className="h-full gradient-bg rounded-full"
            animate={{ width: `${progress}%` }}
            transition={{ duration: 0.5, ease: "easeOut" }}
          />
        </div>
        <p className="text-[12px] text-muted-foreground text-center mt-2 font-medium">{progress}%</p>
      </div>

      {/* Steps */}
      <div className="w-full max-w-sm space-y-3">
        {steps.map((step, i) => {
          const isDone = i < currentStep;
          const isCurrent = i === currentStep;

          return (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: i <= currentStep ? 1 : 0.4, y: 0 }}
              transition={{ delay: i * 0.1, duration: 0.3 }}
              className={`flex items-center gap-3 rounded-xl px-4 py-3 transition-colors ${
                isDone
                  ? "bg-green-50 border border-green-200"
                  : isCurrent
                  ? "bg-card border border-primary/20"
                  : "bg-muted border border-transparent"
              }`}
            >
              <div className={`flex-shrink-0 h-6 w-6 rounded-full flex items-center justify-center ${
                isDone
                  ? "bg-green-500 text-white"
                  : isCurrent
                  ? "bg-primary/10"
                  : "bg-muted-foreground/10"
              }`}>
                {isDone ? (
                  <Check className="h-3.5 w-3.5" />
                ) : isCurrent ? (
                  <Loader2 className="h-3.5 w-3.5 text-primary animate-spin" />
                ) : (
                  <span className="text-[10px] text-muted-foreground font-bold">{i + 1}</span>
                )}
              </div>
              <span className={`text-[13px] ${
                isDone ? "text-green-700 font-medium" : isCurrent ? "text-foreground font-medium" : "text-muted-foreground"
              }`}>
                {step}
              </span>
            </motion.div>
          );
        })}
      </div>
    </div>
  );
};

export default AnalyzingProfile;
