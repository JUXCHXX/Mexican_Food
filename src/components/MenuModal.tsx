import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import menuData from "@/data/menu.json";
import { getMeta } from "@/lib/menu-categories";
import { MenuCard, type MenuItem } from "./MenuCard";
import { TalaveraDivider } from "./TalaveraDivider";
import { useMenuContext } from "@/contexts/MenuContext";

type MenuShape = {
  menu: Record<string, { label: string; description?: string; items: any[] }>;
};

export function MenuModal() {
  const {
    isModalOpen,
    setIsModalOpen,
    selectedCategoryKey,
    setSelectedCategoryKey,
  } = useMenuContext();

  const [direction, setDirection] = useState<"left" | "right">("right");
  const data = menuData as unknown as MenuShape;

  const categories = Object.entries(data.menu)
    .filter(([k]) => k !== "build_your_own_combo")
    .map(([key, val]) => ({ key, label: val.label }));

  const currentIndex = categories.findIndex((c) => c.key === selectedCategoryKey);
  const currentCategory = currentIndex !== -1 ? categories[currentIndex] : null;
  const currentSection = currentCategory ? data.menu[currentCategory.key] : null;
  const meta = currentCategory ? getMeta(currentCategory.key) : null;
  const Icon = meta?.icon;

  // Bloquear scroll cuando modal está abierto
  useEffect(() => {
    if (isModalOpen) {
      document.body.style.overflow = "hidden";
      return () => {
        document.body.style.overflow = "";
      };
    }
  }, [isModalOpen]);

  // Cerrar con tecla Escape
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isModalOpen) {
        setIsModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleEscape);
    return () => window.removeEventListener("keydown", handleEscape);
  }, [isModalOpen, setIsModalOpen]);

  const handleNavigate = (newIndex: number) => {
    const nextCategory = categories[newIndex];
    if (nextCategory) {
      setDirection(newIndex > currentIndex ? "right" : "left");
      setSelectedCategoryKey(nextCategory.key);
    }
  };

  const handleClose = () => {
    setIsModalOpen(false);
  };

  const handleBackdropClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      handleClose();
    }
  };

  if (!currentCategory || !currentSection || !meta || !Icon) {
    return null;
  }

  return (
    <AnimatePresence>
      {isModalOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="fixed inset-0 z-40 backdrop-blur-sm bg-black/70"
            onClick={handleBackdropClick}
          />

          {/* Modal */}
          <motion.div
            initial={{ y: "100%" }}
            animate={{ y: 0 }}
            exit={{ y: "100%" }}
            transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col rounded-t-3xl bg-carbon md:inset-y-16 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-6xl md:rounded-3xl"
          >
            {/* Header - Sticky */}
            <div className="sticky top-0 z-10 border-b border-arena/20 bg-carbon/95 backdrop-blur-sm px-4 py-5">
              <div className="flex items-start justify-between gap-4">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <Icon className="h-7 w-7 text-sombrero shrink-0" />
                    <h2 className="font-display text-3xl md:text-4xl text-arena">
                      {currentCategory.label}
                    </h2>
                  </div>
                  {currentSection.description && (
                    <p className="text-sm text-arena/70 italic font-body">
                      {currentSection.description}
                    </p>
                  )}
                </div>
                <button
                  onClick={handleClose}
                  className="shrink-0 text-arena/70 hover:text-sombrero p-2 rounded-full hover:bg-arena/10 transition-all duration-200"
                  aria-label="Cerrar"
                >
                  <X className="h-6 w-6" />
                </button>
              </div>
              <TalaveraDivider className="w-48 mt-4" />
            </div>

            {/* Products Grid - Scrollable */}
            <motion.div
              key={selectedCategoryKey}
              initial={{ x: direction === "right" ? 100 : -100, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction === "right" ? -100 : 100, opacity: 0 }}
              transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 overflow-y-auto px-4 py-6 md:px-6"
            >
              <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3 mb-20">
                {(currentSection.items ?? []).map((item: MenuItem, i: number) => (
                  <MenuCard
                    key={`${selectedCategoryKey}-${item.name}-${i}`}
                    item={item}
                    index={i}
                    categoryId={selectedCategoryKey}
                  />
                ))}
              </div>
            </motion.div>

            {/* Navigation Footer - Sticky */}
            <div className="sticky bottom-0 z-10 border-t border-arena/20 bg-carbon/95 backdrop-blur-sm px-4 py-4">
              <div className="flex items-center justify-between gap-4">
                <button
                  onClick={() => handleNavigate(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gris/40 border border-arena/20 text-arena hover:bg-gris/60 hover:border-arena/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Categoría anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                <span className="text-sm font-medium text-arena">
                  {currentIndex + 1} / {categories.length}
                </span>

                <button
                  onClick={() => handleNavigate(currentIndex + 1)}
                  disabled={currentIndex === categories.length - 1}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gris/40 border border-arena/20 text-arena hover:bg-gris/60 hover:border-arena/40 disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Siguiente categoría"
                >
                  <ChevronRight className="h-5 w-5" />
                </button>
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
