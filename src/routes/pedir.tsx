import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Languages, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { MenuProvider } from "@/contexts/MenuContext";
import { OrderBuilder, OrderConfirmation } from "@/components/OrderBuilder";
import { MyOrdersBubble } from "@/components/MyOrdersBubble";
import type { OrderResult } from "@/lib/order-types";
import type { OrderType } from "@/lib/supabase";

export const Route = createFileRoute("/pedir")({
  head: () => ({ meta: [{ title: "Pedir — Fabian's Mexican Restaurant" }] }),
  validateSearch: (search: Record<string, unknown>) => ({
    tipo: search.tipo === "pickup" ? "pickup" : undefined,
    mesa: typeof search.mesa === "string" ? search.mesa : undefined,
  }),
  component: OrderPage,
});

function OrderPage() {
  const [orderType, setOrderType] = useState<OrderType>("pickup");
  const [tableToken, setTableToken] = useState<string>();
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [result, setResult] = useState<OrderResult>();
  const search = Route.useSearch();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesa = search.mesa ?? params.get("mesa") ?? undefined;
    setTableToken(mesa);
    setOrderType(mesa && search.tipo !== "pickup" ? "dine_in" : "pickup");
  }, [search.mesa, search.tipo]);
  const es = language === "es";
  return (
    <MenuProvider>
      <main className="min-h-screen bg-carbon px-4 py-5 text-arena">
        <header className="mx-auto flex max-w-7xl items-center justify-between gap-4">
          <Link
            to="/"
            className="inline-flex items-center gap-2 text-sm text-arena/70 hover:text-sombrero"
          >
            <ArrowLeft className="h-4 w-4" /> Fabian's
          </Link>
          <button
            type="button"
            onClick={() => setLanguage(es ? "en" : "es")}
            className="inline-flex items-center gap-2 rounded-full border border-arena/20 px-3 py-2 text-xs font-semibold"
          >
            <Languages className="h-4 w-4 text-sombrero" /> {es ? "EN" : "ES"}
          </button>
        </header>
        <div className="mx-auto max-w-7xl py-8">
          <div className="mb-8 flex flex-col justify-between gap-5 md:flex-row md:items-end">
            <div>
              <p className="text-xs uppercase tracking-[0.3em] text-sombrero">
                Fabian's Mexican Restaurant
              </p>
              <h1 className="mt-2 font-display text-4xl text-arena md:text-6xl">
                {es ? "Arma tu pedido" : "Build your order"}
              </h1>
              <p className="mt-3 max-w-xl text-arena/60">
                {es
                  ? "Elige tus platos, confirma tus datos y guarda tu código de comanda."
                  : "Choose your dishes, confirm your details and keep your order code."}
              </p>
            </div>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setOrderType("dine_in")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${orderType === "dine_in" ? "bg-sombrero text-carbon" : "border border-arena/20"}`}
              >
                <MapPin className="mr-1 inline h-4 w-4" />
                {es ? "En mesa" : "Dine in"}
              </button>
              <button
                type="button"
                onClick={() => setOrderType("pickup")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${orderType === "pickup" ? "bg-sombrero text-carbon" : "border border-arena/20"}`}
              >
                <Phone className="mr-1 inline h-4 w-4" />
                {es ? "Pickup" : "Pickup"}
              </button>
            </div>
          </div>
          {result ? (
            <OrderConfirmation result={result} language={language} />
          ) : (
            <OrderBuilder
              orderType={orderType}
              tableToken={tableToken}
              language={language}
              onComplete={setResult}
            />
          )}
        </div>
      </main>
      <MyOrdersBubble />
    </MenuProvider>
  );
}
