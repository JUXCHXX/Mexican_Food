import { motion } from "framer-motion";
import { getMeta } from "@/lib/menu-categories";
import { useMenuContext } from "@/contexts/MenuContext";
import { useState, useRef, useEffect } from "react";

interface Cat { key: string; label: string }

export function CategoryNav({ categories }: { categories: Cat[] }) {
  const { setIsModalOpen, setSelectedCategoryKey } = useMenuContext();
  const [isDragging, setIsDragging] = useState(false);
  const [animationPaused, setAnimationPaused] = useState(false);
  const dragTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const handleSelectCategory = (categoryKey: string) => {
    setSelectedCategoryKey(categoryKey);
    setIsModalOpen(true);
  };

  const handleDragStart = () => {
    setIsDragging(true);
    setAnimationPaused(true);
    if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
  };

  const handleDragEnd = () => {
    setIsDragging(false);
    dragTimeoutRef.current = setTimeout(() => {
      setAnimationPaused(false);
    }, 3000);
  };

  useEffect(() => {
    return () => {
      if (dragTimeoutRef.current) clearTimeout(dragTimeoutRef.current);
    };
  }, []);

  const midpoint = Math.ceil(categories.length / 2);
  const topRow = categories.slice(0, midpoint);
  const bottomRow = categories.slice(midpoint);

  // Duplicar arrays para bucle infinito sin saltos
  const topRowDuplicated = [...topRow, ...topRow];
  const bottomRowDuplicated = [...bottomRow, ...bottomRow];

  const itemWidth = 110 + 12; // min-w-[110px] + gap-3
  const topRowWidth = topRowDuplicated.length * itemWidth;
  const bottomRowWidth = bottomRowDuplicated.length * itemWidth;

  const renderRow = (row: Cat[], duplicated: Cat[], totalWidth: number) => (
    <motion.div
      drag="x"
      dragElastic={0.2}
      onDragStart={handleDragStart}
      onDragEnd={handleDragEnd}
      animate={
        !animationPaused
          ? { x: [0, -totalWidth / 2] }
          : undefined
      }
      transition={
        !animationPaused
          ? { duration: 35, repeat: Infinity, ease: "linear" }
          : undefined
      }
      className="flex gap-3 cursor-grab active:cursor-grabbing"
    >
      {duplicated.map((c, idx) => {
        const meta = getMeta(c.key);
        const Icon = meta.icon;

        return (
          <motion.button
            key={`${c.key}-${idx}`}
            onClick={() => handleSelectCategory(c.key)}
            className="flex flex-col items-center justify-center gap-1 rounded-2xl p-3 h-20 min-w-[110px] w-[110px] transition-all duration-300 bg-gris/40 border border-arena/10 text-arena hover:bg-gris/60 hover:border-arena/20"
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
    </motion.div>
  );

  return (
    <motion.nav
      initial={{ y: -20, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ duration: 0.5 }}
      className="sticky top-0 z-30 bg-carbon/90 backdrop-blur-md py-3 max-h-[35vh]"
    >
      <div className="overflow-hidden relative">
        {/* Gradiente fade izquierdo */}
        <div className="absolute left-0 top-0 bottom-0 w-12 bg-gradient-to-r from-carbon/90 to-transparent z-10 pointer-events-none" />

        {/* Fila superior */}
        <div className="overflow-hidden mb-3 px-4">
          {renderRow(topRow, topRowDuplicated, topRowWidth)}
        </div>

        {/* Fila inferior */}
        <div className="overflow-hidden px-4">
          {renderRow(bottomRow, bottomRowDuplicated, bottomRowWidth)}
        </div>

        {/* Gradiente fade derecho */}
        <div className="absolute right-0 top-0 bottom-0 w-12 bg-gradient-to-l from-carbon/90 to-transparent z-10 pointer-events-none" />
      </div>
    </motion.nav>
  );
}
