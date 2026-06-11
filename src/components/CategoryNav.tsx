import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { getMeta } from "@/lib/menu-categories";
import { useMenuContext } from "@/contexts/MenuContext";

interface Cat { key: string; label: string }

export function CategoryNav({ categories }: { categories: Cat[] }) {
  const { activeCategory, setActiveCategory } = useMenuContext();

  const handleSelectCategory = (categoryKey: string) => {
    setActiveCategory(categoryKey);
  };

  const handleClose = () => {
    setActiveCategory(null);
  };

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 border-b border-arena/10 bg-carbon/85 backdrop-blur-md py-6"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 justify-center">
          {categories.map((c) => {
            const meta = getMeta(c.key);
            const Icon = meta.icon;
            const isActive = activeCategory === c.key;

            return (
              <motion.button
                key={c.key}
                onClick={() => handleSelectCategory(c.key)}
                className={`flex flex-col items-center justify-center gap-2 rounded-2xl p-4 h-20 transition-all duration-300 ${
                  isActive
                    ? "bg-sombrero text-carbon scale-105 shadow-[0_0_24px_rgba(242,178,51,0.6)]"
                    : "bg-gris/40 border border-arena/10 text-arena hover:bg-gris/60 hover:border-arena/20"
                }`}
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

        <AnimatePresence>
          {activeCategory && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.2 }}
              className="flex justify-center mt-4"
            >
              <button
                onClick={handleClose}
                className="inline-flex items-center gap-2 rounded-full px-4 py-2 bg-arena/10 border border-arena/30 text-arena hover:bg-arena/20 hover:border-arena/50 transition-all duration-200"
              >
                <X className="h-4 w-4" />
                <span className="text-sm font-medium">Cerrar</span>
              </button>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </motion.nav>
  );
}
