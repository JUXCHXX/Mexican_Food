import { motion } from "framer-motion";
import { Ban, Flame, Sparkles, Star } from "lucide-react";
import { useState, useEffect } from "react";
import { useMenuContext } from "@/contexts/MenuContext";
import { getMenuItemSlug } from "@/lib/menu-data";

export interface MenuItem {
  name: string;
  description?: string | null;
  price?: number;
  price_small?: number;
  price_large?: number;
  price_single?: number;
  price_double?: number;
  price_half?: number;
  price_full?: number;
  price_regular?: number;
  price_mixed?: number;
  price_shrimp?: number;
  price_texana?: number;
  price_3?: number;
  prices?: Record<string, number>;
  spicy?: boolean;
  isNew?: boolean;
  popular?: boolean;
}

const fmt = (n: number) => `$${n.toFixed(2)}`;

export const resolvePrice = (
  item: MenuItem
): { label?: string; display: string } | null => {
  // 1. prices (objeto)
  if (item.prices != null && typeof item.prices === "object") {
    const values = Object.values(item.prices).filter((v) => typeof v === "number");
    if (values.length > 0) {
      return {
        display: values.map((v) => fmt(v as number)).join(" / "),
      };
    }
  }

  // 2. price_small + price_large
  if (item.price_small != null && item.price_large != null) {
    return {
      label: "SM / LG",
      display: `${fmt(item.price_small)} - ${fmt(item.price_large)}`,
    };
  }

  // 3. price_single + price_double
  if (item.price_single != null && item.price_double != null) {
    return {
      label: "SGL / DBL",
      display: `${fmt(item.price_single)} / ${fmt(item.price_double)}`,
    };
  }

  // 4. price_half + price_full
  if (item.price_half != null && item.price_full != null) {
    return {
      label: "½ / FULL",
      display: `${fmt(item.price_half)} / ${fmt(item.price_full)}`,
    };
  }

  // 5. price
  if (item.price != null) {
    return { display: fmt(item.price) };
  }

  // 6. price_regular
  if (item.price_regular != null) {
    return { display: fmt(item.price_regular) };
  }

  // 7. price_large (solo)
  if (item.price_large != null) {
    return { display: fmt(item.price_large) };
  }

  // 8. price_small (solo)
  if (item.price_small != null) {
    return { display: fmt(item.price_small) };
  }

  // 9. price_mixed
  if (item.price_mixed != null) {
    return { display: fmt(item.price_mixed) };
  }

  // 10. price_shrimp
  if (item.price_shrimp != null) {
    return { display: fmt(item.price_shrimp) };
  }

  // 11. price_texana
  if (item.price_texana != null) {
    return { display: fmt(item.price_texana) };
  }

  // 12. price_3
  if (item.price_3 != null) {
    return { display: fmt(item.price_3) };
  }

  return null;
};

function PriceBlock({ item }: { item: MenuItem }) {
  const priceInfo = resolvePrice(item);

  if (!priceInfo) {
    return null;
  }

  return (
    <div className="text-right">
      {priceInfo.label && (
        <div className="text-xs text-arena/50 uppercase tracking-wider font-body">
          {priceInfo.label}
        </div>
      )}
      <div className="font-display text-sombrero text-xl leading-none">
        {priceInfo.display}
      </div>
    </div>
  );
}

export function MenuCard({
  item,
  index,
  categoryId,
  variant = "default",
}: {
  item: MenuItem;
  index: number;
  categoryId: string;
  variant?: "default" | "modal";
}) {
  const [expanded, setExpanded] = useState(false);
  const [isGlowing, setIsGlowing] = useState(false);
  const [isFadingOut, setIsFadingOut] = useState(false);
  const { highlightedItemId, unavailableItems } = useMenuContext();

  const itemSlug = getMenuItemSlug(categoryId, item.name);
  const itemId = `item-${itemSlug}`;
  const isAvailable = unavailableItems[itemSlug] !== true;
  const isHighlighted = highlightedItemId === itemId;

  useEffect(() => {
    if (isHighlighted) {
      setIsGlowing(true);
      setIsFadingOut(false);

      const glowTimer = setTimeout(() => {
        setIsFadingOut(true);
      }, 2500);

      const fadeTimer = setTimeout(() => {
        setIsGlowing(false);
        setIsFadingOut(false);
      }, 2500 + 800);

      return () => {
        clearTimeout(glowTimer);
        clearTimeout(fadeTimer);
      };
    }
  }, [isHighlighted]);

  const hasDescription = item.description && item.description.trim().length > 0;
  const longDesc = hasDescription && item.description!.length > 110;
  const desc = expanded || !longDesc ? item.description : item.description!.slice(0, 110) + "…";

  const glowShadow = isGlowing
    ? `0 0 40px ${isFadingOut ? "rgba(242, 178, 51, 0.2)" : "rgba(242, 178, 51, 0.8)"}`
    : "none";

  // Variante MODAL
  if (variant === "modal") {
    const priceInfo = resolvePrice(item);

    return (
      <motion.button
          type="button"
          disabled={!isAvailable}
        id={itemId}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, delay: Math.min(index * 0.05, 0.4) }}
        whileHover={{ scale: 1.02 }}
        className="group relative flex flex-col h-40 md:h-48 overflow-hidden rounded-2xl border border-arena/10 transition-all duration-300"
        style={{
          boxShadow: isGlowing ? glowShadow : undefined,
        }}
      >
        {/* Fondo degradado / Color sólido */}
        <div className="absolute inset-0 bg-gradient-to-br from-gris/60 via-gris/40 to-carbon" />
        <div className="absolute inset-0 group-hover:bg-black/10 transition-colors duration-300" />
          {!isAvailable && (
            <div className="absolute inset-0 z-10 flex items-center justify-center bg-carbon/75">
              <span className="flex items-center gap-2 rounded-full border border-tradicional/60 bg-carbon/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-tradicional">
                <Ban className="h-4 w-4" /> Agotado / Sold out
              </span>
            </div>
          )}

        {/* Contenido */}
        <div className="relative flex flex-col h-full p-4 md:p-5">
          {/* Nombre - Arriba */}
          <h3 className="font-display text-lg md:text-xl text-arena font-semibold leading-tight line-clamp-2">
            {item.name}
          </h3>

          {/* Descripción - Centro (solo si existe) */}
          {hasDescription && (
            <p className="text-xs md:text-sm text-arena/60 font-body mt-2 flex-1 line-clamp-2">
              {item.description}
            </p>
          )}

          {/* Precio - Abajo derecha */}
          <div className="mt-auto flex items-end justify-between gap-3">
            <div className="flex gap-1">
              {item.spicy && (
                <Flame className="h-3 w-3 md:h-4 md:w-4 text-tradicional" />
              )}
              {item.isNew && (
                <Sparkles className="h-3 w-3 md:h-4 md:w-4 text-jalapeno" />
              )}
              {item.popular && (
                <Star className="h-3 w-3 md:h-4 md:w-4 text-sombrero" />
              )}
            </div>
            {priceInfo && (
              <div>
                {priceInfo.label && (
                  <div className="text-xs text-arena/50 uppercase tracking-wider font-body">
                    {priceInfo.label}
                  </div>
                )}
                <div className="font-display text-sombrero text-lg md:text-xl font-semibold whitespace-nowrap">
                  {priceInfo.display}
                </div>
              </div>
            )}
          </div>
        </div>
      </motion.button>
    );
  }

  // Variante DEFAULT (original)
  const priceInfo = resolvePrice(item);
  const showKidsPrice = !priceInfo && categoryId === "kids_menu";

  return (
    <motion.article
      id={itemId}
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-50px" }}
      transition={{ duration: 0.5, delay: Math.min(index * 0.08, 0.6), ease: [0.22, 1, 0.36, 1] }}
      animate={isGlowing ? { boxShadow: glowShadow } : undefined}
      className="card-glow group relative flex flex-col gap-3 rounded-2xl border border-arena/10 bg-card p-5 transition-all duration-300 talavera-pattern"
      style={{
        boxShadow: isGlowing ? glowShadow : undefined,
      }}
    >
      {!isAvailable && (
        <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-carbon/70">
          <span className="flex items-center gap-2 rounded-full border border-tradicional/60 bg-carbon/90 px-3 py-1.5 text-xs font-bold uppercase tracking-wider text-tradicional">
            <Ban className="h-4 w-4" /> Agotado / Sold out
          </span>
        </div>
      )}
      <div className="flex items-start justify-between gap-4">
        <div className="flex-1">
          <h3 className="font-[var(--font-heading)] font-semibold text-arena text-lg leading-tight">
            {item.name}
          </h3>
          {showKidsPrice && (
            <div className="text-xs text-arena/40 italic mt-1">~$7.50</div>
          )}
        </div>
        {priceInfo && <PriceBlock item={item} />}
      </div>

      {hasDescription && (
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
            initial={{ scale: 0 }}
            whileInView={{ scale: 1 }}
            viewport={{ once: true }}
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
