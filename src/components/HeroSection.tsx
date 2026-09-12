import { motion, useScroll, useTransform } from "framer-motion";
import { ChevronDown, Languages } from "lucide-react";
import { useRef, useState } from "react";
import { Link } from "@tanstack/react-router";
import logo from "@/assets/fabians-logo.png";

export function HeroSection({ onCtaClick }: { onCtaClick: () => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollY } = useScroll();
  const y = useTransform(scrollY, [0, 600], [0, 150]);
  const opacity = useTransform(scrollY, [0, 400], [1, 0]);
  const [language, setLanguage] = useState<"en" | "es">("en");
  const isSpanish = language === "es";

  const handleScroll = () => {
    document.getElementById("category-nav")?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <section
      ref={ref}
      className="relative isolate overflow-hidden min-h-[100svh] flex items-center justify-center px-4"
    >
      {/* Parallax background */}
      <motion.div
        style={{ y, opacity }}
        className="absolute inset-0 -z-10 bg-cover bg-center"
      >
        <div
          className="absolute inset-0 bg-cover bg-center"
          style={{
            backgroundImage:
              "url(https://images.unsplash.com/photo-1551504734-5ee1c4a1479b?auto=format&fit=crop&w=1920&q=80)",
          }}
        />
        <div className="absolute inset-0 bg-gradient-to-b from-carbon/85 via-carbon/75 to-carbon" />
        <div className="absolute inset-0 sarape-bg opacity-60" />
      </motion.div>

      <button
        type="button"
        onClick={() => setLanguage(isSpanish ? "en" : "es")}
        className="absolute right-5 top-5 z-20 inline-flex items-center gap-2 rounded-full border border-arena/30 bg-carbon/55 px-3 py-2 text-xs font-bold text-arena backdrop-blur hover:border-sombrero"
        aria-label={isSpanish ? "Switch to English" : "Cambiar a español"}
      >
        <Languages className="h-4 w-4 text-sombrero" /> {isSpanish ? "EN" : "ES"}
      </button>
      <div className="relative z-10 text-center max-w-3xl mx-auto">
        <motion.div
          initial={{ opacity: 0, scale: 0.85, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          transition={{ duration: 1, ease: [0.22, 1, 0.36, 1] }}
        >
          <img
            src={logo}
            alt="Fabian's Mexican Restaurant"
            className="mx-auto w-[280px] md:w-[420px] drop-shadow-[0_10px_40px_rgba(242,178,51,0.35)]"
          />
        </motion.div>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5, duration: 0.7 }}
          className="mt-4 text-arena/80 font-body text-base md:text-lg italic max-w-xl mx-auto"
        >
          {isSpanish
            ? "Sabores auténticos de México, hechos con tradición — en el corazón de Brentwood, TN."
            : "Authentic Mexican flavors, made with tradition — in the heart of Brentwood, TN."}
        </motion.p>

        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.8, duration: 0.6 }}
          className="mt-8 flex flex-wrap items-center justify-center gap-3"
        >
          <button
            onClick={handleScroll}
            className="rounded-full bg-sombrero px-7 py-3 font-[var(--font-heading)] font-bold text-carbon shadow-[0_15px_40px_-10px_rgba(242,178,51,0.6)] hover:scale-105 transition-transform"
          >
            {isSpanish ? "Explorar el menú" : "Explore the menu"}
          </button>
          <a
            href="tel:+16153769978"
            className="rounded-full border-2 border-sombrero px-7 py-3 font-[var(--font-heading)] font-bold text-sombrero hover:bg-sombrero/10 transition-colors"
          >
            (615) 376-9978
          </a>
          <Link
            to="/pedir"
            search={{ tipo: "pickup", mesa: undefined }}
            className="rounded-full border border-jalapeno px-7 py-3 font-[var(--font-heading)] font-bold text-jalapeno hover:bg-jalapeno/10 transition-colors"
          >
            {isSpanish ? "Pedir para recoger" : "Order pickup"}
          </Link>
        </motion.div>
      </div>

      {/* Scroll-down indicator */}
      <button
        aria-label="Scroll down"
        onClick={handleScroll}
        className="bounce-soft absolute bottom-8 left-1/2 -translate-x-1/2 text-sombrero"
      >
        <ChevronDown className="h-8 w-8" />
      </button>
    </section>
  );
}
