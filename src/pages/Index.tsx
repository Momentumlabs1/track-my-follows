import { useEffect, useState, useCallback } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAuth } from "@/contexts/AuthContext";
import { useTranslation } from "react-i18next";
import useEmblaCarousel from "embla-carousel-react";
import { motion } from "framer-motion";
import { EyeOff, Bell, ArrowRight } from "lucide-react";
import logoSquare from "@/assets/logo-square.png";

const slides = [
  { key: "slide1", icon: null, useLogo: true },
  { key: "slide2", icon: EyeOff, useLogo: false },
  { key: "slide3", icon: Bell, useLogo: false },
] as const;

export default function Index() {
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

  const scrollNext = useCallback(() => emblaApi?.scrollNext(), [emblaApi]);

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="h-8 w-8 rounded-full border-2 border-primary border-t-transparent animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-[100dvh] bg-background flex flex-col relative overflow-hidden">
      {/* Aurora background blobs */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-32 -start-32 w-80 h-80 rounded-full bg-primary/8 blur-3xl" />
        <div className="absolute top-1/2 -end-20 w-64 h-64 rounded-full bg-accent/8 blur-3xl" />
        <div className="absolute -bottom-20 start-1/4 w-72 h-72 rounded-full bg-primary/5 blur-3xl" />
      </div>

      {/* Carousel */}
      <div className="flex-1 relative z-10" ref={emblaRef}>
        <div className="flex h-full">
          {slides.map((slide, i) => (
            <div key={slide.key} className="min-w-0 shrink-0 grow-0 basis-full">
              <div className="flex flex-col items-center justify-center min-h-[100dvh] px-8 text-center">
                {/* Icon / Logo */}
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.5 }}
                  className="mb-8"
                >
                  {slide.useLogo ? (
                    <img src={logoSquare} alt="Spy-Secret" className="h-24 w-24 rounded-3xl shadow-xl shadow-primary/20" />
                  ) : (
                    <div className="h-20 w-20 rounded-3xl gradient-bg flex items-center justify-center shadow-xl shadow-primary/20">
                      {slide.icon && <slide.icon className="h-10 w-10 text-primary-foreground" />}
                    </div>
                  )}
                </motion.div>

                {/* Title */}
                <motion.h1
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.2, duration: 0.5 }}
                  className="text-3xl font-extrabold tracking-tight text-foreground mb-2"
                >
                  {t(`onboarding.${slide.key}_title`)}
                </motion.h1>

                {/* Highlight (only slide 1) */}
                {i === 0 && (
                  <motion.p
                    initial={{ y: 20, opacity: 0 }}
                    animate={{ y: 0, opacity: 1 }}
                    transition={{ delay: 0.3, duration: 0.5 }}
                    className="text-2xl font-extrabold gradient-text mb-4"
                  >
                    {t("onboarding.slide1_highlight")}
                  </motion.p>
                )}

                {/* Description */}
                <motion.p
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.35, duration: 0.5 }}
                  className="text-base text-muted-foreground max-w-xs leading-relaxed"
                >
                  {t(`onboarding.${slide.key}_desc`)}
                </motion.p>

                {/* Buttons */}
                <motion.div
                  initial={{ y: 20, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ delay: 0.45, duration: 0.5 }}
                  className="mt-10 flex flex-col items-center gap-3 w-full max-w-xs"
                >
                  {i < 2 ? (
                    <button
                      onClick={scrollNext}
                      className="pill-btn-primary w-full justify-center px-6 py-3.5 text-[15px]"
                    >
                      {t("onboarding.next")}
                      <ArrowRight className="h-4 w-4" />
                    </button>
                  ) : (
                    <Link
                      to="/login"
                      className="pill-btn-primary w-full justify-center px-6 py-3.5 text-[15px]"
                    >
                      {t("onboarding.get_started")}
                      <ArrowRight className="h-4 w-4" />
                    </Link>
                  )}
                </motion.div>

                {/* Dots */}
                <div className="mt-10 flex items-center gap-2">
                  {slides.map((_, dotIndex) => (
                    <div
                      key={dotIndex}
                      className={`h-2 rounded-full transition-all duration-300 ${
                        dotIndex === selectedIndex
                          ? "w-6 gradient-bg"
                          : "w-2 bg-border"
                      }`}
                    />
                  ))}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
