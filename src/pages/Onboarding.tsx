import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight } from "lucide-react";
import spyLogoGif from "@/assets/spy-logo-animated.gif";

const slides = [
  {
    key: "1",
    icon: "🔍",
    gradient: "from-pink-500/20 via-rose-500/10 to-transparent",
    glowColor: "shadow-pink-500/30",
  },
  {
    key: "2",
    icon: "⚡",
    gradient: "from-amber-500/20 via-orange-500/10 to-transparent",
    glowColor: "shadow-amber-500/30",
  },
  {
    key: "3",
    icon: "🔥",
    gradient: "from-red-500/20 via-rose-500/10 to-transparent",
    glowColor: "shadow-red-500/30",
  },
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

  const current = slides[selectedIndex];

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden select-none">
      {/* Dynamic glow behind icon – changes per slide */}
      <AnimatePresence mode="wait">
        <motion.div
          key={selectedIndex}
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          transition={{ duration: 0.6 }}
          className="absolute inset-0 pointer-events-none"
        >
          <div className={`absolute top-1/4 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[320px] h-[320px] rounded-full bg-gradient-radial ${current.gradient} blur-3xl opacity-60`} />
        </motion.div>
      </AnimatePresence>

      {/* Carousel */}
      <div className="flex-1 relative z-10" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide) => (
            <div key={slide.key} className="min-w-0 shrink-0 grow-0 basis-full">
              <div className="flex flex-col items-center justify-center min-h-[100dvh] px-8 text-center pb-48">
                {/* Floating icon with glow */}
                <motion.div
                  initial={{ scale: 0.6, opacity: 0, y: 30 }}
                  animate={{ scale: 1, opacity: 1, y: 0 }}
                  transition={{ delay: 0.05, duration: 0.7, ease: [0.16, 1, 0.3, 1] }}
                  className="mb-10 relative"
                >
                  {/* Glow ring */}
                  <div className={`absolute inset-0 rounded-[28px] blur-2xl opacity-40 bg-primary/30 scale-125`} />
                  <div className={`relative h-28 w-28 rounded-[28px] bg-[hsl(var(--card))]/80 backdrop-blur-xl border border-white/[0.06] flex items-center justify-center shadow-2xl ${slide.glowColor} overflow-hidden`}>
                    {slide.key === "1" ? (
                      <img src={spyLogoGif} alt="Spy" className="h-24 w-24 object-contain" />
                    ) : (
                      <span className="text-6xl drop-shadow-lg">{slide.icon}</span>
                    )}
                  </div>
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 30, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.15, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[28px] leading-tight font-extrabold tracking-tight text-foreground mb-4"
                >
                  {t(`onboarding.title_${slide.key}`)}
                </motion.h1>

                {/* Subtitle */}
                <motion.p
                  initial={{ y: 25, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.25, duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
                  className="text-[15px] text-muted-foreground max-w-[280px] leading-relaxed"
                >
                  {t(`onboarding.sub_${slide.key}`)}
                </motion.p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Bottom controls */}
      <div className="fixed bottom-0 inset-x-0 z-20 bg-gradient-to-t from-background via-background/95 to-transparent pt-16 pb-[calc(env(safe-area-inset-bottom)+16px)] px-6">
        {/* Dots */}
        <div className="flex items-center justify-center gap-2 mb-5">
          {slides.map((_, i) => (
            <motion.div
              key={i}
              animate={{
                width: i === selectedIndex ? 24 : 8,
                opacity: i === selectedIndex ? 1 : 0.3,
              }}
              transition={{ duration: 0.3, ease: "easeInOut" }}
              className={`h-2 rounded-full ${
                i === selectedIndex ? "bg-primary" : "bg-foreground/30"
              }`}
            />
          ))}
        </div>

        {/* CTA Button */}
        <motion.button
          whileTap={{ scale: 0.97 }}
          onClick={handleNext}
          className="w-full flex items-center justify-center gap-2 rounded-2xl bg-primary text-primary-foreground py-4 text-[15px] font-bold shadow-lg shadow-primary/25 active:shadow-primary/10 transition-shadow mb-4"
        >
          {isLast ? t("onboarding.get_started") : t("onboarding.next")}
          <ArrowRight className="h-4 w-4" />
        </motion.button>

        {/* Login link */}
        <p className="text-center text-[13px] text-muted-foreground pb-1">
          {t("onboarding.already_have_account")}{" "}
          <Link to="/login" className="text-primary font-semibold">
            {t("onboarding.login")}
          </Link>
        </p>
      </div>
    </div>
  );
}
