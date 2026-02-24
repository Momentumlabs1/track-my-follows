import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
import logoSquare from "@/assets/logo-square.png";

const slides = [
  { emoji: "🔍", key: "1" },
  { emoji: "⚡", key: "2" },
  { emoji: "🔥", key: "3" },
] as const;

export default function Onboarding() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [emblaRef, emblaApi] = useEmblaCarousel({ loop: false });
  const [selectedIndex, setSelectedIndex] = useState(0);

  useEffect(() => {
    if (!loading && user) navigate("/dashboard", { replace: true });
  }, [user, loading, navigate]);

  const onSelect = useCallback(() => {
    if (!emblaApi) return;
    setSelectedIndex(emblaApi.selectedScrollSnap());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    emblaApi.on("select", onSelect);
    onSelect();
    return () => { emblaApi.off("select", onSelect); };
  }, [emblaApi, onSelect]);

  const isLast = selectedIndex === slides.length - 1;

  const handleNext = useCallback(() => {
    if (isLast) {
      navigate("/login");
    } else {
      emblaApi?.scrollNext();
    }
  }, [emblaApi, isLast, navigate]);

  if (loading) return null;

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      {/* Aurora blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -start-32 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -end-20 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute -bottom-20 start-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Logo top */}
      <div className="absolute top-[calc(env(safe-area-inset-top)+20px)] inset-x-0 flex justify-center z-20">
        <div className="flex items-center gap-2">
          <img src={logoSquare} alt="Spy-Secret" className="h-8 w-8 drop-shadow-md" />
          <span className="text-base font-extrabold text-foreground">
            Spy<span className="text-primary">Secret</span>
          </span>
        </div>
      </div>

      {/* Carousel */}
      <div className="flex-1 relative z-10" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div key={slide.key} className="min-w-0 shrink-0 grow-0 basis-full">
              <div className="flex flex-col items-center justify-center min-h-[100dvh] px-8 text-center">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="mb-8"
                >
                  <div className="h-24 w-24 rounded-3xl gradient-bg flex items-center justify-center shadow-xl shadow-primary/20">
                    <span className="text-5xl">{slide.emoji}</span>
                  </div>
                </motion.div>

                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-3xl font-extrabold tracking-tight text-foreground mb-3"
                >
                  {t(`onboarding.title_${slide.key}`)}
                </motion.h1>

                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-base text-muted-foreground max-w-xs leading-relaxed"
                >
                  {t(`onboarding.sub_${slide.key}`)}
                </motion.p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls - fixed */}
      <div className="fixed bottom-0 inset-x-0 z-20 pb-[calc(env(safe-area-inset-bottom)+24px)] px-8">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-6">
          {slides.map((_, i) => (
            <div
              key={i}
              className={`h-2 rounded-full transition-all duration-300 ${
                i === selectedIndex ? "w-6 gradient-bg" : "w-2 bg-border"
              }`}
            />
          ))}
        </div>

        <button
          onClick={handleNext}
          className="w-full pill-btn-primary justify-center py-3.5 text-[15px] mb-3"
        >
          {isLast ? t("onboarding.get_started") : t("onboarding.next")}
          <ArrowRight className="h-4 w-4" />
        </button>

        <p className="text-center text-[13px] text-muted-foreground">
          {t("onboarding.already_have_account")}{" "}
          <Link to="/login" className="text-primary font-semibold hover:underline">
            {t("onboarding.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
