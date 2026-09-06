import { AnimatePresence, motion } from "framer-motion";
import { X, ChevronLeft, ChevronRight } from "lucide-react";
import { useEffect, useState } from "react";
import menuData from "@/data/menu.json";
import { getMeta } from "@/lib/menu-categories";
import { MenuCard, type MenuItem } from "./MenuCard";
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
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            className="fixed inset-0 z-50 flex flex-col rounded-t-3xl bg-carbon md:inset-y-20 md:bottom-0 md:left-1/2 md:-translate-x-1/2 md:w-full md:max-w-5xl md:rounded-3xl overflow-hidden"
          >
            {/* Header con imagen de fondo */}
            <div className="relative h-48 md:h-64 shrink-0 overflow-hidden">
              {/* Imagen de fondo */}
              <div
                className="absolute inset-0 bg-cover bg-center"
                style={{ backgroundImage: `url(${meta.image})` }}
                aria-hidden
              />

              {/* Overlay degradado */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/40 to-transparent" />

              {/* Contenido del header */}
              <div className="absolute inset-0 flex flex-col items-center justify-end pb-6 px-4 text-center">
                <Icon className="h-8 w-8 md:h-10 md:w-10 text-sombrero mb-2" />
                <h2 className="font-display text-4xl md:text-5xl text-arena font-bold">
                  {currentCategory.label}
                </h2>
                {currentSection.description && (
                  <p className="text-sm md:text-base text-arena/80 italic font-body mt-2 max-w-2xl">
                    {currentSection.description}
                  </p>
                )}
              </div>

              {/* Botón cerrar */}
              <button
                onClick={handleClose}
                className="absolute top-4 right-4 z-10 h-10 w-10 rounded-full bg-black/50 hover:bg-black/70 text-arena hover:text-sombrero transition-all duration-200 flex items-center justify-center backdrop-blur-sm"
                aria-label="Cerrar"
              >
                <X className="h-6 w-6" />
              </button>
            </div>

            {/* Grid de productos - Scrollable */}
            <motion.div
              key={selectedCategoryKey}
              initial={{ x: direction === "right" ? 60 : -60, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: direction === "right" ? -60 : 60, opacity: 0 }}
              transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
              className="flex-1 overflow-y-auto bg-carbon px-4 py-6 md:px-6"
            >
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 pb-20">
                {(currentSection.items ?? []).map((item: MenuItem, i: number) => (
                  <MenuCard
                    key={`${selectedCategoryKey}-${item.name}-${i}`}
                    item={item}
                    index={i}
                    categoryId={currentCategory.key}
                    variant="modal"
                  />
                ))}
              </div>
            </motion.div>

            {/* Footer - Navegación sticky */}
            <div className="sticky bottom-0 z-10 border-t border-arena/20 bg-carbon/95 backdrop-blur px-4 py-4 md:py-5">
              <div className="flex items-center justify-between gap-4">
                {/* Botón anterior */}
                <button
                  onClick={() => handleNavigate(currentIndex - 1)}
                  disabled={currentIndex === 0}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gris/40 border border-arena/20 text-arena hover:bg-gris/60 hover:border-arena/40 hover:text-sombrero disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
                  aria-label="Categoría anterior"
                >
                  <ChevronLeft className="h-5 w-5" />
                </button>

                {/* Nombre categoría actual */}
                <div className="text-center flex-1">
                  <div className="text-xs uppercase text-arena/60 font-medium tracking-wide">
                    {currentIndex + 1} / {categories.length}
                  </div>
                  <div className="text-sm md:text-base font-semibold text-arena truncate">
                    {currentCategory.label}
                  </div>
                </div>

                {/* Botón siguiente */}
                <button
                  onClick={() => handleNavigate(currentIndex + 1)}
                  disabled={currentIndex === categories.length - 1}
                  className="flex items-center justify-center h-10 w-10 rounded-full bg-gris/40 border border-arena/20 text-arena hover:bg-gris/60 hover:border-arena/40 hover:text-sombrero disabled:opacity-30 disabled:cursor-not-allowed transition-all duration-200"
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
