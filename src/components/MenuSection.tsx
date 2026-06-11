import { motion } from "framer-motion";
import { MenuCard, type MenuItem } from "./MenuCard";
import { TalaveraDivider } from "./TalaveraDivider";
import { getMeta } from "@/lib/menu-categories";
import { useMenuContext } from "@/contexts/MenuContext";

interface Props {
  id: string;
  label: string;
  items: MenuItem[];
  description?: string;
}

export function MenuSection({ id, label, items, description }: Props) {
  const meta = getMeta(id);
  const Icon = meta.icon;
  const { activeCategory } = useMenuContext();

  // Si hay categoría activa seleccionada y no es esta, no renderizar
  if (activeCategory !== null && activeCategory !== id) {
    return null;
  }

  return (
    <motion.section
      key={id}
      id={id}
      initial={activeCategory ? { opacity: 0, y: 30 } : undefined}
      animate={activeCategory ? { opacity: 1, y: 0 } : undefined}
      exit={activeCategory ? { opacity: 0, y: 30 } : undefined}
      transition={activeCategory ? { duration: 0.4, ease: [0.22, 1, 0.36, 1] } : undefined}
      className="relative scroll-mt-24 py-16 md:py-20"
    >
      {/* Header image banner */}
      <div className="relative mx-auto mb-10 max-w-7xl overflow-hidden rounded-3xl border border-arena/10">
        <div
          className="h-48 md:h-64 w-full bg-cover bg-center"
          style={{ backgroundImage: `url(${meta.image})` }}
          aria-hidden
        />
        <div className="absolute inset-0 bg-gradient-to-t from-carbon via-carbon/70 to-carbon/30" />
        <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4 text-center">
          <TalaveraDivider className="w-40 my-2" />
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="font-display text-3xl md:text-5xl text-arena flex items-center gap-3"
          >
            <Icon className="h-7 w-7 text-sombrero" />
            {label}
          </motion.h2>
          {description && (
            <p className="mt-2 text-sm md:text-base text-arena/70 font-body italic max-w-xl">{description}</p>
          )}
        </div>
      </div>

      <div className="mx-auto grid max-w-7xl gap-5 px-4 sm:grid-cols-2 lg:grid-cols-3">
        {items.map((item, i) => (
          <MenuCard key={`${id}-${item.name}-${i}`} item={item} index={i} categoryId={id} />
        ))}
      </div>
    </motion.section>
  );
}
