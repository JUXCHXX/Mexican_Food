import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ChevronDown, Clock3, Languages, Loader2, Search, Star } from "lucide-react";
import { useEffect, useState } from "react";
import { getSupabase, ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/supabase";
import type { CartItem, OrderResult } from "@/lib/order-types";

export const Route = createFileRoute("/mis-pedidos")({
  head: () => ({ meta: [{ title: "Mis pedidos — Fabian's" }] }),
  component: MyOrdersPage,
});

function MyOrdersPage() {
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [phone, setPhone] = useState("");
  const [orders, setOrders] = useState<OrderResult[]>([]);
  const [searched, setSearched] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [hasSavedPhone, setHasSavedPhone] = useState(false);
  const t =
    language === "es"
      ? {
          title: "Mis pedidos",
          intro: "Consulta el estado con el teléfono que usaste al ordenar.",
          phone: "Número de teléfono",
          find: "Buscar pedidos",
          none: "No encontramos pedidos para ese teléfono.",
          edit: "Editar pedido",
          rating: "Califica tu pedido",
          comment: "Comentario (opcional)",
          send: "Enviar calificación",
          saved: "Calificación guardada",
          change: "No soy yo / Cambiar número",
        }
      : {
          title: "My orders",
          intro: "Check your status with the phone number used to order.",
          phone: "Phone number",
          find: "Find orders",
          none: "No orders found for this phone.",
          edit: "Edit order",
          rating: "Rate your order",
          comment: "Comment (optional)",
          send: "Send rating",
          saved: "Rating saved",
          change: "Not me / Change number",
        };
  const searchOrders = async (phoneValue = phone) => {
    const supabase = getSupabase();
    setError("");
    if (!supabase) {
      setError("Supabase is not configured.");
      return;
    }
    setLoading(true);
    const { data, error: rpcError } = await supabase.rpc("get_my_orders", { p_phone: phoneValue });
    setLoading(false);
    setSearched(true);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    localStorage.setItem("fabians_customer_phone", phoneValue.trim());
    setHasSavedPhone(true);
    const next = (data ?? []) as OrderResult[];
    setOrders(next);
    if (!next.length) return;
    const ids = next.map((entry) => entry.order.id);
    const channel = supabase
      .channel(`my-orders-${ids.join("-")}`)
      .on(
        "postgres_changes",
        { event: "UPDATE", schema: "public", table: "orders", filter: `id=in.(${ids.join(",")})` },
        (payload) =>
          setOrders((current) =>
            current.map((entry) =>
              entry.order.id === payload.new.id
                ? { ...entry, order: { ...entry.order, ...(payload.new as OrderResult["order"]) } }
                : entry,
            ),
          ),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  };
  useEffect(() => {
    const saved = localStorage.getItem("fabians_customer_phone");
    if (saved) {
      setPhone(saved);
      setHasSavedPhone(true);
      void searchOrders(saved);
    }
  }, []);
  const changePhone = () => {
    localStorage.removeItem("fabians_customer_phone");
    setHasSavedPhone(false);
    setPhone("");
    setOrders([]);
    setSearched(false);
  };
  return (
    <main className="min-h-screen bg-carbon px-4 py-6 text-arena">
      <header className="mx-auto flex max-w-5xl items-center justify-between">
        <Link to="/" className="inline-flex items-center gap-2 text-sm text-arena/70">
          <ArrowLeft className="h-4 w-4" /> Fabian's
        </Link>
        <button
          type="button"
          onClick={() => setLanguage(language === "es" ? "en" : "es")}
          className="inline-flex items-center gap-2 rounded-full border border-arena/20 px-3 py-2 text-xs"
        >
          <Languages className="h-4 w-4 text-sombrero" /> {language === "es" ? "EN" : "ES"}
        </button>
      </header>
      <section className="mx-auto max-w-5xl py-12">
        <p className="text-xs uppercase tracking-[0.3em] text-sombrero">
          Fabian's Mexican Restaurant
        </p>
        <h1 className="mt-2 font-display text-5xl text-arena">{t.title}</h1>
        <p className="mt-3 text-arena/60">{t.intro}</p>
        <div className="mt-8 flex max-w-xl gap-2">
          <input
            value={phone}
            onChange={(e) => setPhone(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && void searchOrders()}
            placeholder={t.phone}
            type="tel"
            className="min-w-0 flex-1 rounded-full border border-arena/15 bg-gris px-4 py-3 text-arena"
          />
          <button
            type="button"
            onClick={() => void searchOrders()}
            disabled={loading}
            className="rounded-full bg-sombrero px-5 py-3 font-bold text-carbon"
          >
            <Search className="mr-1 inline h-4 w-4" />
            {loading ? <Loader2 className="inline h-4 w-4 animate-spin" /> : t.find}
          </button>
        </div>
        {hasSavedPhone && (
          <button
            type="button"
            onClick={changePhone}
            className="mt-3 text-sm text-sombrero underline"
          >
            {t.change}
          </button>
        )}
        {error && <p className="mt-4 text-sm text-tradicional">{error}</p>}
        {searched && !orders.length && !error && (
          <p className="mt-12 text-center text-arena/50">{t.none}</p>
        )}
        <div className="mt-8 grid gap-5">
          {orders.map((entry) => (
            <OrderStatusCard
              key={entry.order.id}
              entry={entry}
              phone={phone}
              language={language}
              labels={t}
              onUpdate={(updated) =>
                setOrders((current) =>
                  current.map((item) => (item.order.id === updated.order.id ? updated : item)),
                )
              }
            />
          ))}
        </div>
      </section>
    </main>
  );
}

function OrderStatusCard({
  entry,
  phone,
  language,
  labels,
  onUpdate,
}: {
  entry: OrderResult;
  phone: string;
  language: "es" | "en";
  labels: Record<string, string>;
  onUpdate: (entry: OrderResult) => void;
}) {
  const [rating, setRating] = useState(entry.rating?.rating ?? 0);
  const [comment, setComment] = useState(entry.rating?.comment ?? "");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [editing, setEditing] = useState(false);
  const [expanded, setExpanded] = useState(false);
  const [items, setItems] = useState<CartItem[]>(entry.items);
  const status = entry.order.status as OrderStatus;
  const statusIndex = ORDER_STATUSES.indexOf(status);
  const canEdit = status === "nuevo";
  const saveRating = async () => {
    const supabase = getSupabase();
    if (!supabase || !rating) return;
    setSaving(true);
    const { error } = await supabase.rpc("submit_rating", {
      p_order_id: entry.order.id,
      p_phone: phone,
      p_rating: rating,
      p_comment: comment || null,
    });
    setSaving(false);
    setMessage(error?.message ?? labels.saved);
  };
  const saveItems = async () => {
    const supabase = getSupabase();
    if (!supabase) return;
    setSaving(true);
    const { data, error } = await supabase.rpc("update_my_order", {
      p_order_id: entry.order.id,
      p_phone: phone,
      p_items: items,
    });
    setSaving(false);
    if (error) {
      setMessage(error.message);
      return;
    }
    setEditing(false);
    const result = data as OrderResult;
    onUpdate(result);
  };
  const badge =
    status === "nuevo" ? "🆕" : status === "cocina" ? "🍳" : status === "listo" ? "✅" : "🎉";
  return (
    <article className="rounded-3xl border border-arena/10 bg-gris/60 p-5 shadow-lg">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <div className="text-xs uppercase tracking-widest text-arena/50">
            {entry.order.order_type === "pickup"
              ? "Pickup"
              : `${language === "es" ? "Mesa" : "Table"} ${entry.order.table_number ?? ""}`}
          </div>
          <h2 className="mt-1 font-display text-4xl text-sombrero">{entry.order.order_number}</h2>
          <p className="mt-1 text-xs text-arena/50">
            <Clock3 className="mr-1 inline h-3 w-3" />
            {new Date(entry.order.created_at).toLocaleString()}
          </p>
        </div>
        <div className="rounded-full border border-sombrero/40 px-3 py-2 text-sm font-semibold text-sombrero">
          {badge} {STATUS_LABELS[status][language]}
        </div>
      </div>
      <div className="mt-5 grid grid-cols-4 gap-1">
        {ORDER_STATUSES.map((step, index) => (
          <div
            key={step}
            className={`h-1.5 rounded-full ${index <= statusIndex ? "bg-sombrero" : "bg-arena/15"}`}
          />
        ))}
      </div>
      <div className="mt-5 space-y-2">
        {items.slice(0, expanded ? undefined : 3).map((item, index) => (
          <div
            key={`${item.item_slug}-${item.variant}`}
            className="flex items-center justify-between text-sm text-arena"
          >
            <span>
              {item.quantity} × {item.item_name}
              {(expanded || editing) && (
                <small className="ml-2 text-arena/50">{item.variant}</small>
              )}
            </span>
            <span>${(item.unit_price * item.quantity).toFixed(2)}</span>
            {editing && (
              <input
                type="number"
                min="1"
                value={item.quantity}
                onChange={(e) =>
                  setItems((current) =>
                    current.map((currentItem, currentIndex) =>
                      currentIndex === index
                        ? { ...currentItem, quantity: Math.max(1, Number(e.target.value)) }
                        : currentItem,
                    ),
                  )
                }
                className="ml-2 w-16 rounded bg-carbon px-2 py-1 text-arena"
              />
            )}
          </div>
        ))}
      </div>
      {items.length > 3 && (
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="mt-3 text-sm text-sombrero"
        >
          {expanded ? "Ver menos" : "Ver detalle"}{" "}
          <ChevronDown className={`inline h-4 w-4 ${expanded ? "rotate-180" : ""}`} />
        </button>
      )}
      <div className="mt-5 flex justify-between border-t border-arena/10 pt-4 text-lg font-bold text-sombrero">
        <span>Total</span>
        <span>${Number(entry.order.total).toFixed(2)}</span>
      </div>
      {canEdit && (
        <div className="mt-4">
          {editing ? (
            <button
              type="button"
              onClick={() => void saveItems()}
              disabled={saving}
              className="rounded-full bg-sombrero px-4 py-2 text-sm font-bold text-carbon"
            >
              {saving ? "..." : "Guardar cambios"}
            </button>
          ) : (
            <button
              type="button"
              onClick={() => setEditing(true)}
              className="rounded-full border border-sombrero/50 px-4 py-2 text-sm font-semibold text-sombrero"
            >
              {labels.edit}
            </button>
          )}
        </div>
      )}
      {status === "entregado" && (
        <div className="mt-6 border-t border-arena/10 pt-5">
          <p className="mb-2 text-sm font-semibold text-arena">{labels.rating}</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((value) => (
              <button
                type="button"
                key={value}
                onClick={() => setRating(value)}
                aria-label={`${value} stars`}
              >
                <Star
                  className={`h-6 w-6 ${value <= rating ? "fill-sombrero text-sombrero" : "text-arena/30"}`}
                />
              </button>
            ))}
          </div>
          <textarea
            value={comment}
            onChange={(e) => setComment(e.target.value)}
            placeholder={labels.comment}
            className="mt-3 min-h-20 w-full rounded-xl border border-arena/15 bg-carbon p-3 text-sm text-arena"
          />
          <button
            type="button"
            onClick={() => void saveRating()}
            disabled={saving || !rating}
            className="mt-2 rounded-full bg-sombrero px-4 py-2 text-sm font-bold text-carbon"
          >
            {labels.send}
          </button>
          {message && <p className="mt-2 text-sm text-jalapeno">{message}</p>}
        </div>
      )}
    </article>
  );
}
