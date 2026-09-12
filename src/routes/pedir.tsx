import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, Languages, MapPin, Phone } from "lucide-react";
import { useEffect, useState } from "react";
import { MenuProvider } from "@/contexts/MenuContext";
import { OrderBuilder, OrderConfirmation } from "@/components/OrderBuilder";
import { MyOrdersBubble } from "@/components/MyOrdersBubble";
import type { OrderResult } from "@/lib/order-types";
import { getSupabase, type OrderType } from "@/lib/supabase";

type ActiveTable = { id: string; number: number; qr_token: string };

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
  const [activeTables, setActiveTables] = useState<ActiveTable[]>([]);
  const [tableLoading, setTableLoading] = useState(false);
  const [tableOrderingEnabled, setTableOrderingEnabled] = useState(false);
  const [language, setLanguage] = useState<"es" | "en">("en");
  const [result, setResult] = useState<OrderResult>();
  const search = Route.useSearch();
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const mesa = search.mesa ?? params.get("mesa") ?? undefined;
    setTableToken(undefined);
    setOrderType("pickup");
    const supabase = getSupabase();
    if (!supabase) return;
    void supabase
      .from("app_settings")
      .select("table_ordering_enabled")
      .eq("id", true)
      .maybeSingle()
      .then(({ data }) => {
        const enabled = data?.table_ordering_enabled === true;
        setTableOrderingEnabled(enabled);
        if (!enabled || !mesa || search.tipo === "pickup") return;
        setTableLoading(true);
        void supabase
          .from("tables")
          .select("id,number,qr_token")
          .eq("active", true)
          .order("number")
          .then(({ data: tableData }) => {
            const tables = (tableData ?? []) as ActiveTable[];
            setActiveTables(tables);
            setTableToken(tables.find((table) => table.qr_token === mesa)?.qr_token);
            setOrderType("dine_in");
            setTableLoading(false);
          });
      });
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
                {es ? "Haz tu pedido" : "Build your order"}
              </h1>
              <p className="mt-3 max-w-xl text-arena/60">
                {es
                  ? "Elige tus platos, confirma tus datos y guarda tu código de comanda."
                  : "Choose your dishes, confirm your details and keep your order code."}
              </p>
            </div>
            <div className="flex gap-2">
              {tableOrderingEnabled && (
                <button
                  type="button"
                  onClick={() => setOrderType("dine_in")}
                  className={`rounded-full px-4 py-2 text-sm font-semibold ${orderType === "dine_in" ? "bg-sombrero text-carbon" : "border border-arena/20"}`}
                >
                  <MapPin className="mr-1 inline h-4 w-4" />
                  {es ? "En mesa" : "Dine in"}
                </button>
              )}
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
          {orderType === "dine_in" && !tableToken && (
            <section className="mb-6 max-w-2xl rounded-2xl border border-sombrero/30 bg-gris/50 p-4">
              <p className="font-semibold text-arena">
                {es ? "Selecciona tu mesa" : "Select your table"}
              </p>
              <p className="mt-1 text-sm text-arena/60">
                {es
                  ? "No encontramos un código QR válido. Elige tu mesa para continuar."
                  : "We could not find a valid QR code. Choose your table to continue."}
              </p>
              <div className="mt-3 flex flex-wrap gap-2">
                {tableLoading ? (
                  <span className="text-sm text-arena/60">...</span>
                ) : activeTables.length ? (
                  activeTables.map((table) => (
                    <button
                      key={table.id}
                      type="button"
                      onClick={() => setTableToken(table.qr_token)}
                      className="rounded-full border border-sombrero/50 px-4 py-2 text-sm font-bold text-sombrero transition hover:bg-sombrero hover:text-carbon"
                    >
                      {es ? "Mesa" : "Table"} {table.number}
                    </button>
                  ))
                ) : (
                  <span className="text-sm text-tradicional">
                    {es
                      ? "No hay mesas activas disponibles."
                      : "There are no active tables available."}
                  </span>
                )}
              </div>
            </section>
          )}
          {result ? (
            <OrderConfirmation result={result} language={language} />
          ) : (
            <OrderBuilder
              orderType={orderType}
              tableToken={tableToken}
              tableRequired={orderType === "dine_in"}
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
