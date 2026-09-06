import { useEffect, useMemo, useState } from "react";
import { Check, ChevronDown, Minus, Plus, ShoppingBag, ShoppingCart, Trash2 } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getMeta } from "@/lib/menu-categories";
import { resolvePrice } from "@/components/MenuCard";
import { ALCOHOL_CATEGORY_KEYS, calculateOrderTax, ORDER_TAX_RATE } from "@/lib/order-tax";
import { Link } from "@tanstack/react-router";
import { getMenuItemSlug, menuSections, type RawMenuItem } from "@/lib/menu-data";
import { getSupabase, type OrderType } from "@/lib/supabase";
import type { CartItem, OrderResult } from "@/lib/order-types";

type Language = "es" | "en";

const copy = {
  es: {
    menu: "Menú",
    cart: "Tu pedido",
    empty: "Aún no hay platos",
    add: "Agregar",
    name: "Nombre",
    phone: "Teléfono",
    send: "Confirmar pedido",
    table: "Mesa",
    pickup: "Para recoger",
    notes: "Notas para cocina",
    success: "Pedido recibido",
    reference: "Tu código de comanda es",
    noBackend: "Configura Supabase para activar los pedidos.",
    soldout: "Agotado",
    subtotal: "Subtotal",
    tax: "Impuesto",
    surcharge: "Recargo pickup",
    total: "Total",
    items: "platos",
    out: "Cerrar",
  },
  en: {
    menu: "Menu",
    cart: "Your order",
    empty: "No dishes yet",
    add: "Add",
    name: "Name",
    phone: "Phone",
    send: "Confirm order",
    table: "Table",
    pickup: "Pickup",
    notes: "Kitchen notes",
    success: "Order received",
    reference: "Your order code is",
    noBackend: "Configure Supabase to enable ordering.",
    soldout: "Sold out",
    subtotal: "Subtotal",
    tax: "Tax",
    surcharge: "Pickup surcharge",
    total: "Total",
    items: "items",
    out: "Close",
  },
};

function getPriceOptions(item: RawMenuItem) {
  const fields: Array<[string, string]> = [
    ["price", "Standard"],
    ["price_small", "Small"],
    ["price_large", "Large"],
    ["price_single", "Single"],
    ["price_double", "Double"],
    ["price_half", "Half"],
    ["price_full", "Full"],
    ["price_regular", "Regular"],
    ["price_mixed", "Mixed"],
    ["price_shrimp", "Shrimp"],
    ["price_texana", "Texana"],
    ["price_3", "3 pieces"],
    ["price_ref", "Kids"],
  ];
  const options = fields.flatMap(([field, label]) =>
    typeof item[field] === "number" ? [{ label, price: item[field] as number }] : [],
  );
  if (options.length) return options;
  if (item.prices && typeof item.prices === "object")
    return Object.entries(item.prices as Record<string, number>).map(([label, price]) => ({
      label: label.replaceAll("_", " "),
      price,
    }));
  return [];
}

export function OrderBuilder({
  orderType,
  tableToken,
  language,
  onComplete,
}: {
  orderType: OrderType;
  tableToken?: string;
  language: Language;
  onComplete: (result: OrderResult) => void;
}) {
  const t = copy[language];
  const [cart, setCart] = useState<CartItem[]>([]);
  const [category, setCategory] = useState(Object.keys(menuSections)[0]);
  const [unavailable, setUnavailable] = useState<Record<string, boolean>>({});
  const [customerName, setCustomerName] = useState("");
  const [customerPhone, setCustomerPhone] = useState("");
  const [notes, setNotes] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [categoryOpen, setCategoryOpen] = useState(false);
  const section = menuSections[category];

  useEffect(() => {
    const supabase = getSupabase();
    if (!supabase) return;
    const load = () =>
      void supabase
        .from("menu_item_status")
        .select("item_slug,is_available")
        .then(({ data }) =>
          setUnavailable(
            Object.fromEntries(
              (data ?? [])
                .filter((item) => !item.is_available)
                .map((item) => [item.item_slug, true]),
            ),
          ),
        );
    load();
    const channel = supabase
      .channel("order-menu-availability")
      .on("postgres_changes", { event: "*", schema: "public", table: "menu_item_status" }, load)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, []);

  const subtotal = useMemo(
    () => cart.reduce((sum, item) => sum + item.unit_price * item.quantity, 0),
    [cart],
  );
  const tax = calculateOrderTax(subtotal);
  const surcharge = orderType === "pickup" ? 0.5 : 0;
  const visibleSections = useMemo(
    () =>
      Object.entries(menuSections).filter(
        ([key, value]) =>
          value.items?.length && (orderType === "dine_in" || !ALCOHOL_CATEGORY_KEYS.has(key)),
      ),
    [orderType],
  );
  useEffect(() => {
    if (orderType !== "pickup") return;
    setCart((current) => current.filter((item) => !ALCOHOL_CATEGORY_KEYS.has(item.category_key)));
    if (ALCOHOL_CATEGORY_KEYS.has(category)) setCategory(visibleSections[0]?.[0] ?? "appetizers");
  }, [category, orderType, visibleSections]);
  const add = (item: RawMenuItem, variant: { label: string; price: number }) => {
    const slug = getMenuItemSlug(category, item.name);
    if (unavailable[slug]) return;
    setCart((current) => {
      const found = current.find(
        (cartItem) => cartItem.item_slug === slug && cartItem.variant === variant.label,
      );
      if (found)
        return current.map((cartItem) =>
          cartItem === found ? { ...cartItem, quantity: cartItem.quantity + 1 } : cartItem,
        );
      return [
        ...current,
        {
          item_slug: slug,
          item_name: item.name,
          category_key: category,
          variant: variant.label,
          unit_price: variant.price,
          quantity: 1,
        },
      ];
    });
  };
  const changeQuantity = (index: number, delta: number) =>
    setCart((current) =>
      current.flatMap((item, itemIndex) =>
        itemIndex === index
          ? item.quantity + delta > 0
            ? [{ ...item, quantity: item.quantity + delta }]
            : []
          : [item],
      ),
    );
  const submit = async () => {
    setError("");
    if (!customerName.trim() || customerPhone.replace(/\D/g, "").length < 7 || !cart.length) {
      setError(
        language === "es"
          ? "Completa nombre, teléfono y agrega al menos un plato."
          : "Enter your name, phone and at least one dish.",
      );
      return;
    }
    const supabase = getSupabase();
    if (!supabase) {
      setError(t.noBackend);
      return;
    }
    setSubmitting(true);
    const { data, error: rpcError } = await supabase.rpc("create_order", {
      p_order_type: orderType,
      p_table_token: tableToken ?? null,
      p_customer_name: customerName,
      p_customer_phone: customerPhone,
      p_items: cart,
      p_notes: notes || null,
      p_tip: 0,
    });
    setSubmitting(false);
    if (rpcError) {
      setError(rpcError.message);
      return;
    }
    localStorage.setItem("fabians_customer_phone", customerPhone.trim());
    onComplete(data as OrderResult);
    // Future SMS updates require explicit opt-in consent before any automated message (TCPA).
  };

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        <div className="mb-6 grid grid-cols-[repeat(auto-fit,minmax(130px,1fr))] gap-3">
          {visibleSections.map(([key, value]) => {
            const Icon = getMeta(key).icon;
            return (
              <button
                key={key}
                type="button"
                onClick={() => {
                  setCategory(key);
                  setCategoryOpen(true);
                }}
                aria-label={`${language === "es" ? "Ver categoría" : "View category"}: ${value.label}`}
                aria-pressed={key === category}
                className={`flex min-h-24 flex-col items-center justify-center gap-2 rounded-2xl border p-3 text-center text-xs font-semibold transition ${key === category ? "border-sombrero bg-sombrero text-carbon shadow-[0_8px_28px_rgba(242,178,51,0.2)]" : "border-arena/15 bg-gris/50 text-arena hover:border-sombrero/60"}`}
              >
                <span
                  className={`rounded-full p-2 ${key === category ? "bg-carbon/15" : "bg-sombrero/10 text-sombrero"}`}
                >
                  <Icon className="h-5 w-5" />
                </span>
                <span>{value.label}</span>
              </button>
            );
          })}
        </div>
        {cart.length > 0 && (
          <div className="sticky top-[calc(100vh-5.5rem)] z-20 mb-4 lg:hidden">
            <button
              type="button"
              onClick={() => {
                setCheckoutOpen(true);
                document
                  .getElementById("order-checkout")
                  ?.scrollIntoView({ behavior: "smooth", block: "start" });
              }}
              className="flex w-full items-center justify-between rounded-2xl border border-sombrero/60 bg-sombrero px-4 py-3 text-left font-bold text-carbon shadow-xl"
            >
              <span className="inline-flex items-center gap-2">
                <ShoppingCart className="h-5 w-5" /> Checkout
              </span>
              <span>
                {cart.reduce((sum, item) => sum + item.quantity, 0)} · $
                {(subtotal + tax + surcharge).toFixed(2)}{" "}
                <ChevronDown className="ml-1 inline h-4 w-4" />
              </span>
            </button>
          </div>
        )}
        <p className="rounded-2xl border border-arena/10 bg-gris/35 p-5 text-sm text-arena/60">
          {language === "es"
            ? "Elige una categoría para ver sus platos y agregarlos a tu pedido."
            : "Choose a category to see its dishes and add them to your order."}
        </p>
        <Dialog open={categoryOpen} onOpenChange={setCategoryOpen}>
          <DialogContent className="top-auto max-h-[88dvh] max-w-5xl translate-y-0 overflow-y-auto rounded-t-3xl border-arena/15 bg-carbon p-5 text-arena sm:top-1/2 sm:translate-y-[-50%] sm:rounded-3xl sm:p-7">
            <DialogTitle className="pr-9 font-display text-3xl text-sombrero">
              {section?.label}
            </DialogTitle>
            <p className="-mt-2 text-sm text-arena/60">
              {language === "es"
                ? "Agrega los platos y sus variantes a tu pedido."
                : "Add dishes and their variants to your order."}
            </p>
            <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
              {(section?.items ?? []).map((item) => {
                const slug = getMenuItemSlug(category, item.name);
                const soldOut = unavailable[slug];
                const options = getPriceOptions(item);
                const priceSummary = resolvePrice(item);
                return (
                  <article
                    key={slug}
                    className={`relative rounded-2xl border border-arena/10 bg-gris/50 p-4 ${soldOut ? "opacity-60" : ""}`}
                  >
                    {soldOut && (
                      <div className="absolute inset-0 z-10 flex items-center justify-center rounded-2xl bg-carbon/55 p-4">
                        <span className="-rotate-12 rounded border-4 border-tradicional bg-carbon/90 px-4 py-2 text-center text-lg font-black uppercase tracking-[0.18em] text-tradicional">
                          {t.soldout}
                        </span>
                      </div>
                    )}
                    <h3 className="font-display text-lg text-arena">{item.name}</h3>
                    <p className="mt-2 line-clamp-3 text-xs leading-relaxed text-arena/60">
                      {item.description}
                    </p>
                    <div className="mt-4 flex flex-wrap gap-2">
                      {options.map((option) => (
                        <button
                          disabled={soldOut}
                          key={`${slug}-${option.label}`}
                          type="button"
                          onClick={() => add(item, option)}
                          className="rounded-full border border-sombrero/50 px-3 py-1.5 text-xs font-semibold text-sombrero hover:bg-sombrero hover:text-carbon disabled:cursor-not-allowed disabled:border-arena/20 disabled:text-arena/40"
                        >
                          {option.label} ${option.price.toFixed(2)}{" "}
                          <Plus className="ml-1 inline h-3 w-3" />
                        </button>
                      ))}
                      {!options.length && priceSummary && (
                        <span className="text-sm font-semibold text-sombrero">
                          {priceSummary.display}
                        </span>
                      )}
                    </div>
                  </article>
                );
              })}
            </div>
          </DialogContent>
        </Dialog>
      </section>
      <aside
        id="order-checkout"
        className={`h-fit scroll-mt-4 rounded-3xl border border-sombrero/25 bg-gris/70 p-5 lg:sticky lg:top-4 ${checkoutOpen ? "ring-2 ring-sombrero/50" : ""}`}
      >
        <div className="mb-4 flex items-center justify-between">
          <h2 className="font-display text-2xl text-arena">{t.cart}</h2>
          <ShoppingBag className="text-sombrero" />
        </div>
        {!cart.length ? (
          <p className="py-8 text-center text-sm text-arena/50">{t.empty}</p>
        ) : (
          <div className="space-y-3">
            {cart.map((item, index) => (
              <div
                key={`${item.item_slug}-${item.variant}`}
                className="border-b border-arena/10 pb-3"
              >
                <div className="flex justify-between gap-3 text-sm text-arena">
                  <span>
                    {item.item_name}
                    <small className="block text-arena/50">
                      {item.variant} · ${item.unit_price.toFixed(2)}
                    </small>
                  </span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(index, -item.quantity)}
                    aria-label="Remove"
                  >
                    <Trash2 className="h-4 w-4 text-tradicional" />
                  </button>
                </div>
                <div className="mt-2 flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => changeQuantity(index, -1)}
                    className="rounded-full border border-arena/20 p-1"
                  >
                    <Minus className="h-3 w-3" />
                  </button>
                  <span className="min-w-5 text-center text-sm text-arena">{item.quantity}</span>
                  <button
                    type="button"
                    onClick={() => changeQuantity(index, 1)}
                    className="rounded-full border border-arena/20 p-1"
                  >
                    <Plus className="h-3 w-3" />
                  </button>
                  <span className="ml-auto text-sm font-semibold text-sombrero">
                    ${(item.unit_price * item.quantity).toFixed(2)}
                  </span>
                </div>
              </div>
            ))}
          </div>
        )}
        <div className="mt-5 space-y-2 border-t border-arena/10 pt-4 text-sm">
          <div className="flex justify-between text-arena/70">
            <span>{t.subtotal}</span>
            <span>${subtotal.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-arena/70">
            <span>
              {t.tax} ({(ORDER_TAX_RATE * 100).toFixed(2)}%)
            </span>
            <span>${tax.toFixed(2)}</span>
          </div>
          {surcharge > 0 && (
            <div className="flex justify-between text-arena/70">
              <span>{t.surcharge}</span>
              <span>$0.50</span>
            </div>
          )}
          <div className="flex justify-between text-lg font-bold text-sombrero">
            <span>{t.total}</span>
            <span>${(subtotal + tax + surcharge).toFixed(2)}</span>
          </div>
        </div>
        <div className="mt-5 space-y-3">
          <input
            value={customerName}
            onChange={(e) => setCustomerName(e.target.value)}
            placeholder={t.name}
            className="w-full rounded-xl border border-arena/15 bg-carbon px-3 py-2.5 text-sm text-arena"
          />
          <input
            value={customerPhone}
            onChange={(e) => setCustomerPhone(e.target.value)}
            placeholder={t.phone}
            type="tel"
            className="w-full rounded-xl border border-arena/15 bg-carbon px-3 py-2.5 text-sm text-arena"
          />
          <textarea
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t.notes}
            className="min-h-20 w-full rounded-xl border border-arena/15 bg-carbon px-3 py-2.5 text-sm text-arena"
          />
          <p className="text-xs leading-relaxed text-arena/60">
            {language === "es"
              ? "Los tiempos son estimados. Consulta nuestros "
              : "Preparation times are estimates. See our "}
            <Link to="/terminos" className="text-sombrero underline">
              {language === "es" ? "términos" : "terms"}
            </Link>
            {language === "es"
              ? ". Advierte al personal sobre alergias; los alimentos crudos o poco cocidos pueden aumentar el riesgo de enfermedades."
              : ". Tell staff about allergies; consuming raw or undercooked foods may increase foodborne illness risk."}
          </p>
          {error && <p className="text-sm text-tradicional">{error}</p>}
          <button
            type="button"
            onClick={submit}
            disabled={submitting || !cart.length}
            className="w-full rounded-full bg-sombrero px-4 py-3 font-bold text-carbon disabled:opacity-40"
          >
            {submitting ? "..." : t.send}
          </button>
        </div>
      </aside>
    </div>
  );
}

export function OrderConfirmation({
  result,
  language,
}: {
  result: OrderResult;
  language: Language;
}) {
  const t = copy[language];
  return (
    <div className="mx-auto max-w-xl rounded-3xl border border-jalapeno/50 bg-gris/70 p-8 text-center">
      <Check className="mx-auto h-12 w-12 text-jalapeno" />
      <h2 className="mt-4 font-display text-3xl text-arena">{t.success}</h2>
      <p className="mt-4 text-arena/70">{t.reference}</p>
      <div className="my-4 text-5xl font-display text-sombrero">{result.order.order_number}</div>
      <p className="text-sm text-arena/60">
        {result.order.order_type === "pickup"
          ? t.pickup
          : `${t.table} · ${result.order.table_id ?? ""}`}
      </p>
      <p className="mt-5 text-lg font-bold text-sombrero">
        ${Number(result.order.total).toFixed(2)}
      </p>
    </div>
  );
}
