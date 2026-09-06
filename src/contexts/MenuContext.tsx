import { createContext, useContext, useEffect, useState, ReactNode } from "react";
import { getSupabase } from "@/lib/supabase";

export interface MenuContextType {
  isModalOpen: boolean;
  setIsModalOpen: (open: boolean) => void;
  selectedCategoryKey: string | null;
  setSelectedCategoryKey: (key: string | null) => void;
  highlightedItemId: string | null;
  setHighlightedItemId: (id: string | null) => void;
  unavailableItems: Record<string, boolean>;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedCategoryKey, setSelectedCategoryKey] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);
  const [unavailableItems, setUnavailableItems] = useState<Record<string, boolean>>({});

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    let mounted = true;
    const load = async () => {
      const { data } = await supabase.from("menu_item_status").select("item_slug,is_available");
      if (!mounted || !data) return;
      setUnavailableItems(Object.fromEntries(data.filter((item) => !item.is_available).map((item) => [item.item_slug, true])));
    };
    void load();
    const channel = supabase
      .channel("public-menu-item-status")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_item_status" }, load)
      .subscribe();
    return () => {
      mounted = false;
      void supabase.removeChannel(channel);
    };
  }, []);

  return (
    <MenuContext.Provider
      value={{
        isModalOpen,
        setIsModalOpen,
        selectedCategoryKey,
        setSelectedCategoryKey,
        highlightedItemId,
        setHighlightedItemId,
        unavailableItems,
      }}
    >
      {children}
    </MenuContext.Provider>
  );
}

export function useMenuContext() {
  const context = useContext(MenuContext);
  if (context === undefined) {
    throw new Error("useMenuContext must be used within MenuProvider");
  }
  return context;
}
