import { createContext, useContext, useState, ReactNode } from "react";

export interface MenuContextType {
  activeCategory: string | null;
  setActiveCategory: (id: string | null) => void;
  highlightedItemId: string | null;
  setHighlightedItemId: (id: string | null) => void;
}

const MenuContext = createContext<MenuContextType | undefined>(undefined);

export function MenuProvider({ children }: { children: ReactNode }) {
  const [activeCategory, setActiveCategory] = useState<string | null>(null);
  const [highlightedItemId, setHighlightedItemId] = useState<string | null>(null);

  return (
    <MenuContext.Provider
      value={{
        activeCategory,
        setActiveCategory,
        highlightedItemId,
        setHighlightedItemId,
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
