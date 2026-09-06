import menuData from "@/data/menu.json";

export type RawMenuItem = {
  name: string;
  description?: string | null;
  [key: string]: unknown;
};

export type MenuSection = {
  label: string;
  description?: string;
  notes?: string[];
  items?: RawMenuItem[];
  pricing?: Record<string, number>;
  entree_options?: string[];
};

export const menuSections = menuData.menu as Record<string, MenuSection>;

export function slugifyMenuPart(value: string) {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

export function getMenuItemSlug(categoryKey: string, itemName: string) {
  return `${slugifyMenuPart(categoryKey)}-${slugifyMenuPart(itemName)}`;
}

export function getAllMenuItems() {
  return Object.entries(menuSections).flatMap(([categoryKey, section]) =>
    (section.items ?? []).map((item) => ({ categoryKey, section, item, itemSlug: getMenuItemSlug(categoryKey, item.name) })),
  );
}

export function formatCurrency(value: number) {
  return `$${value.toFixed(2)}`;
}