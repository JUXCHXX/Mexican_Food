import { AnimatePresence, motion } from "framer-motion";
import { useEffect, useState } from "react";
import { Search, X, ArrowRight } from "lucide-react";
import menuData from "@/data/menu.json";
import { useMenuContext } from "@/contexts/MenuContext";
import { getMenuItemSlug } from "@/lib/menu-data";

interface MenuItem {
  name: string;
  description?: string;
  price?: number;
  price_small?: number;
  price_large?: number;
  [key: string]: any;
}

interface SearchResult extends MenuItem {
  category: string;
}

export function SearchBubble() {
  const [open, setOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [results, setResults] = useState<SearchResult[]>([]);
  const { setIsModalOpen, setSelectedCategoryKey, setHighlightedItemId } = useMenuContext();

  const searchMenu = (query: string) => {
    if (!query.trim()) {
      setResults([]);
      return;
    }
    const q = query.toLowerCase();
    const matches: SearchResult[] = [];
    const menu = menuData.menu as unknown as Record<string, { items?: MenuItem[] }>;

    for (const [category, section] of Object.entries(menu)) {
      if (section.items) {
        for (const item of section.items) {
          const nameMatch = item.name?.toLowerCase().includes(q);
          const descMatch = item.description?.toLowerCase().includes(q);
          if (nameMatch || descMatch) {
            matches.push({ ...item, category });
          }
        }
      }
    }
    setResults(matches.slice(0, 20));
  };

  const getPrice = (item: MenuItem): string => {
    if (item.price) return `$${item.price.toFixed(2)}`;
    if (item.price_small && item.price_large)
      return `$${item.price_small.toFixed(2)} - $${item.price_large.toFixed(2)}`;
    if (item.price_large) return `$${item.price_large.toFixed(2)}`;
    return "N/A";
  };

  const truncateDesc = (desc: string | undefined, maxLen: number = 60): string => {
    if (!desc) return "";
    return desc.length > maxLen ? desc.slice(0, maxLen) + "..." : desc;
  };

  const handleGoToItem = (item: SearchResult) => {
    const itemId = `item-${getMenuItemSlug(item.category, item.name)}`;

    // Cerrar panel de búsqueda
    setOpen(false);
    setSearch("");
    setResults([]);

    // Activar categoría y abrir modal
    setSelectedCategoryKey(item.category);
    setIsModalOpen(true);

    // Esperar a que el modal termine la animación de entrada (450ms)
    setTimeout(() => {
      const element = document.getElementById(itemId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "center" });
        setHighlightedItemId(itemId);

        // Limpiar highlight después de 2500 + 800ms (duración total del glow + fade)
        setTimeout(() => {
          setHighlightedItemId(null);
        }, 3300);
      }
    }, 400);
  };

  return (
    <>
      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: 40, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: 40, scale: 0.97 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
            className="fixed bottom-24 left-4 z-50 w-[min(340px,calc(100vw-2rem))] h-[min(500px,calc(100vh-8rem))] flex flex-col overflow-hidden rounded-3xl border border-sombrero/30 bg-carbon shadow-[0_30px_80px_-20px_rgba(0,0,0,0.8)]"
          >
            {/* Header */}
            <div className="flex items-center justify-between gap-3 border-b border-arena/10 bg-gris px-4 py-3">
              <div className="flex items-center gap-2">
                <Search className="h-5 w-5 text-sombrero" />
                <span className="font-[var(--font-heading)] font-semibold text-arena leading-tight">
                  Buscar Platos
                </span>
              </div>
              <button
                onClick={() => {
                  setOpen(false);
                  setSearch("");
                  setResults([]);
                }}
                className="text-arena/70 hover:text-sombrero p-1 rounded-full hover:bg-arena/5"
                aria-label="Cerrar"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Search Input */}
            <div className="border-b border-arena/10 bg-gris/60 p-3">
              <input
                autoFocus
                value={search}
                onChange={(e) => {
                  const val = e.target.value;
                  setSearch(val);
                  searchMenu(val);
                }}
                placeholder="Busca por nombre o ingrediente…"
                className="w-full rounded-full bg-carbon border border-arena/15 px-4 py-2.5 text-sm text-arena placeholder:text-arena/40 focus:outline-none focus:border-sombrero/60 font-body"
              />
            </div>

            {/* Results */}
            <div className="flex-1 overflow-y-auto px-3 py-3 space-y-2">
              {results.length === 0 && search ? (
                <div className="text-center py-6 text-arena/50 text-sm">No se encontraron platos.</div>
              ) : results.length === 0 ? (
                <div className="text-center py-6 text-arena/50 text-sm">Escribe para buscar platos…</div>
              ) : (
                results.map((item, i) => (
                  <div key={i} className="bg-gris/40 border border-arena/10 rounded-xl p-3 space-y-2 hover:bg-gris/60 transition">
                    {/* Nombre y Precio */}
                    <div className="flex justify-between items-start gap-2">
                      <div className="font-medium text-arena text-sm flex-1">{item.name}</div>
                      <div className="text-jalapeno font-semibold text-xs whitespace-nowrap">
                        {getPrice(item)}
                      </div>
                    </div>

                    {/* Descripción */}
                    {item.description && (
                      <div className="text-arena/60 text-xs line-clamp-2">
                        {truncateDesc(item.description, 60)}
                      </div>
                    )}

                    {/* Botón "Ir al plato →" */}
                    <button
                      onClick={() => handleGoToItem(item)}
                      className="w-full mt-2 bg-sombrero hover:bg-sombrero/90 text-carbon font-semibold text-xs py-2 px-3 rounded-lg flex items-center justify-center gap-1 transition-all duration-200 hover:scale-105"
                    >
                      Ir al plato
                      <ArrowRight className="h-3 w-3" />
                    </button>
                  </div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      <button
        onClick={() => setOpen((o) => !o)}
        className="fixed bottom-5 left-4 z-40 h-16 w-16 rounded-full overflow-hidden ring-2 ring-sombrero/70 shadow-[0_10px_30px_-5px_rgba(0,0,0,0.6)] hover:scale-105 transition-transform bg-gris flex items-center justify-center"
        aria-label="Abrir búsqueda de platos"
      >
        <Search className="h-6 w-6 text-arena" />
      </button>
    </>
  );
}
