import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getMeta } from "@/lib/menu-categories";

interface Cat { key: string; label: string }

export function CategoryNav({ categories }: { categories: Cat[] }) {
  const [active, setActive] = useState<string>(categories[0]?.key ?? "");

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((e) => e.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio)[0];
        if (visible) setActive(visible.target.id);
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: [0, 0.25, 0.5, 1] }
    );
    categories.forEach((c) => {
      const el = document.getElementById(c.key);
      if (el) observer.observe(el);
    });
    return () => observer.disconnect();
  }, [categories]);

  const handleClick = (id: string) => {
    const el = document.getElementById(id);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 border-b border-arena/10 bg-carbon/85 backdrop-blur-md"
    >
      <div className="no-scrollbar mx-auto flex max-w-7xl items-center gap-1 overflow-x-auto px-3 py-2.5">
        {categories.map((c) => {
          const Icon = getMeta(c.key).icon;
          const isActive = active === c.key;
          return (
            <button
              key={c.key}
              onClick={() => handleClick(c.key)}
              className={[
                "shrink-0 inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-[var(--font-heading)] font-semibold transition-all duration-200",
                isActive
                  ? "bg-sombrero text-carbon shadow-[0_8px_24px_-8px_rgba(242,178,51,0.6)]"
                  : "text-arena/70 hover:text-sombrero hover:bg-arena/5",
              ].join(" ")}
            >
              <Icon className="h-4 w-4" />
              <span className="whitespace-nowrap">{c.label}</span>
            </button>
          );
        })}
      </div>
    </motion.nav>
  );
}
