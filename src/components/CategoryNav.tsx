import { motion } from "framer-motion";
import { getMeta } from "@/lib/menu-categories";
import { useMenuContext } from "@/contexts/MenuContext";

interface Cat { key: string; label: string }

export function CategoryNav({ categories }: { categories: Cat[] }) {
  const { setIsModalOpen, setSelectedCategoryKey } = useMenuContext();

  const handleSelectCategory = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey);
    setIsModalOpen(true);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 bg-carbon/90 backdrop-blur-md border-b border-arena/10"
    >
      {/* Móvil: Scroll horizontal */}
      <div className="md:hidden">
        <div
          className="flex flex-row overflow-x-auto px-4 pb-3 gap-3 scrollbar-hide"
          style={{ scrollSnapType: "x mandatory" }}
        >
          {categories.map((c) => {
            const meta = getMeta(c.key);
            const Icon = meta.icon;

            return (
              <motion.button
                key={c.key}
                onClick={() => handleSelectCategory(c.key)}
                className="shrink-0 flex flex-col items-center justify-center gap-2 rounded-2xl p-3 h-24 min-w-[110px] transition-all duration-300 bg-gris/40 border border-arena/10 text-arena hover:bg-gris/60 hover:border-arena/20"
                style={{ scrollSnapAlign: "start" }}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold text-center leading-tight line-clamp-2">
                  {c.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Tablet: Grid 4 columnas con scroll vertical limitado */}
      <div className="hidden md:block lg:hidden px-4 py-4">
        <div className="grid grid-cols-4 gap-3 max-h-[40vh] overflow-y-auto scrollbar-hide">
          {categories.map((c) => {
            const meta = getMeta(c.key);
            const Icon = meta.icon;

            return (
              <motion.button
                key={c.key}
                onClick={() => handleSelectCategory(c.key)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-3 h-20 transition-all duration-300 bg-gris/40 border border-arena/10 text-arena hover:bg-gris/60 hover:border-arena/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold text-center leading-tight line-clamp-2">
                  {c.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Desktop: Grid 6 columnas centrado */}
      <div className="hidden lg:block px-4 py-4">
        <div className="grid grid-cols-6 gap-3 max-w-7xl mx-auto">
          {categories.map((c) => {
            const meta = getMeta(c.key);
            const Icon = meta.icon;

            return (
              <motion.button
                key={c.key}
                onClick={() => handleSelectCategory(c.key)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-3 h-20 transition-all duration-300 bg-gris/40 border border-arena/10 text-arena hover:bg-gris/60 hover:border-arena/20"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                <Icon className="h-6 w-6" />
                <span className="text-xs font-semibold text-center leading-tight line-clamp-2">
                  {c.label}
                </span>
              </motion.button>
            );
          })}
        </div>
      </div>
    </motion.nav>
  );
}
