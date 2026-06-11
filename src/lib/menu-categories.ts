// Category metadata: display label, icon, header image
import {
  Beef, Drumstick, Salad, Soup, Fish, Wheat, Sandwich, Flame, Cookie,
  Wine, Beer, GlassWater, Coffee, IceCream, Baby, UtensilsCrossed,
  ChefHat, Carrot, Pizza, Sparkles, Citrus, Martini, type LucideIcon
} from "lucide-react";

export interface CategoryMeta {
  key: string;
  icon: LucideIcon;
  image: string; // Unsplash food photo
}

// Curated Unsplash images per category, food-themed, warm cinematic
const img = (id: string) =>
  `https://images.unsplash.com/${id}?auto=format&fit=crop&w=1600&q=80`;

export const CATEGORY_META: Record<string, CategoryMeta> = {
  appetizers:           { key: "appetizers",           icon: Flame,             image: img("photo-1604908176997-125f25cc6f3d") },
  nachos:               { key: "nachos",               icon: Pizza,             image: img("photo-1582169296194-e4d644c48063") },
  salads:               { key: "salads",               icon: Salad,             image: img("photo-1540420773420-3366772f4999") },
  fajitas:              { key: "fajitas",              icon: ChefHat,           image: img("photo-1565299585323-38d6b0865b47") },
  steaks:               { key: "steaks",               icon: Beef,              image: img("photo-1600891964092-4316c288032e") },
  chicken:              { key: "chicken",              icon: Drumstick,         image: img("photo-1598103442097-8b74394b95c6") },
  pork:                 { key: "pork",                 icon: Sandwich,          image: img("photo-1544025162-d76694265947") },
  seafood:              { key: "seafood",              icon: Fish,              image: img("photo-1559847844-5315695dadae") },
  burritos:             { key: "burritos",             icon: Wheat,             image: img("photo-1626700051175-6818013e1d4f") },
  enchiladas:           { key: "enchiladas",           icon: UtensilsCrossed,   image: img("photo-1599974579688-8dbdd335c77f") },
  quesadilla_dinners:   { key: "quesadilla_dinners",   icon: Pizza,             image: img("photo-1618040996337-11d5c3f2306f") },
  house_specials:       { key: "house_specials",       icon: Sparkles,          image: img("photo-1565299624946-b28f40a0ae38") },
  a_la_carte:           { key: "a_la_carte",           icon: UtensilsCrossed,   image: img("photo-1551504734-5ee1c4a1479b") },
  side_orders:          { key: "side_orders",          icon: Soup,              image: img("photo-1546069901-ba9599a7e63c") },
  vegetarian:           { key: "vegetarian",           icon: Carrot,            image: img("photo-1540189549336-e6e99c3679fe") },
  build_your_own_combo: { key: "build_your_own_combo", icon: ChefHat,           image: img("photo-1599974579688-8dbdd335c77f") },
  kids_menu:            { key: "kids_menu",            icon: Baby,              image: img("photo-1565299624946-b28f40a0ae38") },
  lunch:                { key: "lunch",                icon: Soup,              image: img("photo-1604908554007-09253be25770") },
  desserts:             { key: "desserts",             icon: IceCream,          image: img("photo-1551024506-0bccd828d307") },
  soft_drinks:          { key: "soft_drinks",          icon: GlassWater,        image: img("photo-1554866585-cd94860890b7") },
  daiquiris:            { key: "daiquiris",            icon: Citrus,            image: img("photo-1551538827-9c037cb4f32a") },
  margaritas:           { key: "margaritas",           icon: Martini,           image: img("photo-1556679343-c7306c1976bc") },
  beers:                { key: "beers",                icon: Beer,              image: img("photo-1535958636474-b021ee887b13") },
  mixed_drinks:         { key: "mixed_drinks",         icon: Martini,           image: img("photo-1514362545857-3bc16c4c7d1b") },
  wines:                { key: "wines",                icon: Wine,              image: img("photo-1510812431401-41d2bd2722f3") },
};

export function getMeta(key: string): CategoryMeta {
  return CATEGORY_META[key] ?? { key, icon: UtensilsCrossed, image: img("photo-1504674900247-0877df9cc836") };
}

// Suppress unused warning for any imports the curated list doesn't use
void Cookie; void Coffee; void Wine;
