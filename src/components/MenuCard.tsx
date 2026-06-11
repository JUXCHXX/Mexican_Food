import { motion } from "framer-motion";
import { Flame, Sparkles, Star } from "lucide-react";
import { useState } from "react";

export interface MenuItem {
  name: string;
  description?: string | null;
  price?: number;
  price_small?: number;
  price_large?: number;
  spicy?: boolean;
  isNew?: boolean;
  popular?: boolean;
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

function PriceBlock({ item }: { item: MenuItem }) {
  if (item.price_small != null && item.price_large != null) {
    return (
      <div className="text-right">
        <div className="text-xs text-muted-foreground font-[var(--font-heading)] uppercase tracking-wider">Sm / Lg</div>
        <div className="font-display text-sombrero text-xl leading-none">
          {fmt(item.price_small)} <span className="text-arena/40 mx-1">/</span> {fmt(item.price_large)}
        </div>
      </div>
    );
  }
  const p = item.price ?? item.price_large ?? item.price_small;
  if (p == null) return null;
  return <div className="font-display text-sombrero text-2xl leading-none">{fmt(p)}</div>;
}

export function MenuCard({ item, index }: { item: MenuItem; index: number }) {
  const [expanded, setExpanded] = useState(false);
  const longDesc = (item.description?.length ?? 0) > 110;
  const desc = expanded || !longDesc ? item.description : item.description!.slice(0, 110) + "…";

  return (
    <motion.article
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.6), ease: [0.22, 1, 0.36, 1] }}
      className="card-glow group relative flex flex-col gap-3 rounded-2xl border border-arena/10 bg-card p-5 transition-all duration-300 talavera-pattern"
    >
      <div className="flex items-start justify-between gap-4">
        <h3 className="font-[var(--font-heading)] font-semibold text-arena text-lg leading-tight">
          {item.name}
        </h3>
        <PriceBlock item={item} />
      </div>

      {item.description && (
        <p className="text-sm text-muted-foreground leading-relaxed font-body">
          {desc}
          {longDesc && (
            <button
              onClick={() => setExpanded(!expanded)}
              className="ml-1 text-sombrero hover:underline text-xs font-medium"
            >
              {expanded ? "less" : "more"}
            </button>
          )}
        </p>
      )}

      <div className="flex flex-wrap gap-2 mt-auto pt-1">
        {item.spicy && (
          <motion.span
            initial={{ scale: 0 }} whileInView={{ scale: 1 }} viewport={{ once: true }}
            transition={{ delay: 0.2, type: "spring", stiffness: 300 }}
            className="inline-flex items-center gap-1 rounded-full bg-tradicional/15 text-tradicional border border-tradicional/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider"
          >
            <Flame className="h-3 w-3" /> Picante
          </motion.span>
        )}
        {item.isNew && (
          <span className="inline-flex items-center gap-1 rounded-full bg-jalapeno/20 text-jalapeno border border-jalapeno/40 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
            <Sparkles className="h-3 w-3" /> Nuevo
          </span>
        )}
        {item.popular && (
          <span className="inline-flex items-center gap-1 rounded-full text-sombrero border border-sombrero/50 px-2.5 py-0.5 text-[11px] font-semibold uppercase tracking-wider">
            <Star className="h-3 w-3" /> Popular
          </span>
        )}
      </div>
    </motion.article>
  );
}
