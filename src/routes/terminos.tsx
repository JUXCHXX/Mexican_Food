import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/terminos")({
  component: TermsPage,
  head: () => ({ meta: [{ title: "Términos — Fabian's" }] }),
});

function TermsPage() {
  const [es, setEs] = useState(true);
  const copy = es
    ? {
        title: "Términos del pedido",
        one: "Los tiempos de preparación son estimados y no están garantizados.",
        two: "El restaurante puede rechazar o ajustar un pedido si un plato no está disponible.",
        three:
          "Avisar al servidor si alguien del grupo tiene una alergia alimentaria. Consumir carne, aves, mariscos, crustáceos o huevos crudos o poco cocidos puede aumentar el riesgo de enfermedades transmitidas por alimentos.",
      }
    : {
        title: "Order terms",
        one: "Preparation times are estimates and are not guaranteed.",
        two: "The restaurant may decline or adjust an order when an item is unavailable.",
        three:
          "Tell your server if anyone in your party has a food allergy. Consuming raw or undercooked meat, poultry, seafood, shellfish or eggs may increase the risk of foodborne illness.",
      };
  return (
    <main className="min-h-screen bg-carbon px-5 py-8 text-arena">
      <header className="mx-auto flex max-w-3xl justify-between">
        <Link to="/" className="text-sombrero">
          ← Fabian's
        </Link>
        <button
          type="button"
          onClick={() => setEs(!es)}
          className="rounded-full border border-arena/20 px-3 py-1 text-sm"
        >
          <Languages className="mr-1 inline h-4 w-4" />
          {es ? "EN" : "ES"}
        </button>
      </header>
      <article className="mx-auto max-w-3xl py-14">
        <p className="text-xs uppercase tracking-[.25em] text-sombrero">
          Fabian's Mexican Restaurant
        </p>
        <h1 className="mt-3 font-display text-4xl">{copy.title}</h1>
        <div className="mt-8 space-y-4">
          {[copy.one, copy.two, copy.three].map((text) => (
            <p
              key={text}
              className="rounded-2xl border border-arena/10 bg-gris/50 p-5 leading-relaxed text-arena/75"
            >
              {text}
            </p>
          ))}
        </div>
      </article>
    </main>
  );
}
