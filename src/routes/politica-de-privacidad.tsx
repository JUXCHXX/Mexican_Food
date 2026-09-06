import { createFileRoute, Link } from "@tanstack/react-router";
import { Languages } from "lucide-react";
import { useState } from "react";

export const Route = createFileRoute("/politica-de-privacidad")({
  component: PrivacyPage,
  head: () => ({ meta: [{ title: "Política de privacidad — Fabian's" }] }),
});

function PrivacyPage() {
  const [es, setEs] = useState(true);
  const copy = es
    ? {
        title: "Política de privacidad",
        lead: "Explicada de forma simple.",
        data: "Datos que recogemos",
        dataText:
          "Cuando haces un pedido guardamos tu nombre, teléfono, historial de pedidos y, si la envías, tu calificación y comentario.",
        use: "Cómo los usamos",
        useText:
          "Los usamos únicamente para identificar y gestionar tu pedido, consultar su estado y mejorar el servicio. No usamos estos datos para marketing sin tu consentimiento explícito.",
        share: "Con quién se comparten",
        shareText:
          "No vendemos ni compartimos tus datos con terceros. Supabase puede procesarlos como proveedor de base de datos para operar este servicio.",
        back: "Volver al menú",
      }
    : {
        title: "Privacy policy",
        lead: "In plain language.",
        data: "Data we collect",
        dataText:
          "When you place an order, we keep your name, phone number, order history and, if you send it, your rating and comment.",
        use: "How we use it",
        useText:
          "We use it only to identify and manage your order, check its status and improve the service. We do not use it for marketing without your explicit consent.",
        share: "Who receives it",
        shareText:
          "We do not sell or share your data with third parties. Supabase may process it as our database provider to operate this service.",
        back: "Back to menu",
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
        <p className="mt-3 text-arena/65">{copy.lead}</p>
        {[
          [copy.data, copy.dataText],
          [copy.use, copy.useText],
          [copy.share, copy.shareText],
        ].map(([heading, text]) => (
          <section key={heading} className="mt-8 rounded-2xl border border-arena/10 bg-gris/50 p-5">
            <h2 className="font-display text-2xl text-sombrero">{heading}</h2>
            <p className="mt-2 leading-relaxed text-arena/75">{text}</p>
          </section>
        ))}
      </article>
    </main>
  );
}
