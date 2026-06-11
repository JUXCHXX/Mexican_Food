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
      className="sticky top-0 z-30 border-b border-arena/10 bg-carbon/85 backdrop-blur-md py-6"
    >
      <div className="mx-auto max-w-7xl px-4">
        <div className="grid grid-cols-2 gap-3 md:grid-cols-3 lg:grid-cols-6 justify-center">
          {categories.map((c) => {
            const meta = getMeta(c.key);
            const Icon = meta.icon;

            return (
              <motion.button
                key={c.key}
                onClick={() => handleSelectCategory(c.key)}
                className="flex flex-col items-center justify-center gap-2 rounded-2xl p-4 h-20 min-w-[120px] snap-start transition-all duration-300 bg-gris/40 border border-arena/10 text-arena hover:bg-gris/60 hover:border-arena/20 hover:scale-105"
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
