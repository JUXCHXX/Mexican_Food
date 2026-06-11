import { createFileRoute } from "@tanstack/react-router";
import menuData from "@/data/menu.json";
import { HeroSection } from "@/components/HeroSection";
import { CategoryNav } from "@/components/CategoryNav";
import { MenuSection } from "@/components/MenuSection";
import { Footer } from "@/components/Footer";
import { ChatBubble } from "@/components/ChatBubble";
import { SearchBubble } from "@/components/SearchBubble";
import { MenuProvider } from "@/contexts/MenuContext";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Fabian's Mexican Restaurant — Menú Digital" },
      { name: "description", content: "Sabores auténticos de México en Brentwood, TN. Explora el menú completo de Fabian's: tacos, fajitas, margaritas y más." },
      { property: "og:title", content: "Fabian's Mexican Restaurant — Menú Digital" },
      { property: "og:description", content: "Sabores auténticos de México en Brentwood, TN. Explora el menú completo." },
      { property: "og:type", content: "website" },
    ],
  }),
  component: Index,
});

type MenuShape = {
  menu: Record<string, { label: string; description?: string; items: any[] }>;
};

function Index() {
  const data = menuData as unknown as MenuShape;
  const categories = Object.entries(data.menu).filter(([k]) => k !== "build_your_own_combo").map(([key, val]) => ({ key, label: val.label }));

  const scrollToMenu = () => {
    const first = categories[0]?.key;
    if (first) document.getElementById(first)?.scrollIntoView({ behavior: "smooth" });
  };

  return (
    <MenuProvider>
      <main className="min-h-screen bg-carbon">
        <HeroSection onCtaClick={scrollToMenu} />
        <CategoryNav categories={categories} />

        <div className="relative">
          {Object.entries(data.menu).filter(([k]) => k !== "build_your_own_combo").map(([key, section]) => (
            <MenuSection
              key={key}
              id={key}
              label={section.label}
              description={section.description}
              items={section.items ?? []}
            />
          ))}
        </div>

        <Footer />
        <ChatBubble />
        <SearchBubble />
      </main>
    </MenuProvider>
  );
}
