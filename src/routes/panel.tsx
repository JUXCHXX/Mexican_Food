import { createFileRoute, Link } from "@tanstack/react-router";
import {
  BarChart3,
  ChefHat,
  ChevronDown,
  DoorOpen,
  LogIn,
  LogOut,
  Printer,
  Search,
  Settings2,
  Star,
  Table2,
  ToggleLeft,
  ToggleRight,
  UtensilsCrossed,
  Volume2,
  VolumeX,
} from "lucide-react";
import { useEffect, useMemo, useRef, useState } from "react";
import QRCode from "qrcode";
import { getAllMenuItems, getMenuItemSlug } from "@/lib/menu-data";
import { openOrderReceipt } from "@/components/OrderReceipt";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { getSupabase, ORDER_STATUSES, STATUS_LABELS, type OrderStatus } from "@/lib/supabase";

export const Route = createFileRoute("/panel")({
  head: () => ({ meta: [{ title: "Panel — Fabian's" }] }),
  component: PanelPage,
});

type PanelOrder = {
  id: string;
  order_number: string;
  order_type: "dine_in" | "pickup";
  customer_name: string;
  customer_phone: string;
  notes?: string | null;
  table_id: string | null;
  tables?: { number: number } | null;
  status: OrderStatus;
  subtotal: number;
  tax: number;
  surcharge: number;
  total: number;
  created_at: string;
  order_items: Array<{
    item_name: string;
    variant: string | null;
    quantity: number;
    unit_price: number;
    item_total: number;
  }>;
};
type Role = "admin" | "super_admin";

const NEW_ORDER_ALERT_AFTER_MS = 60_000;
const NEW_ORDER_SOUND_INTERVAL_MS = 10_000;

function orderStatusIndex(status: OrderStatus) {
  return ORDER_STATUSES.indexOf(status);
}

function PanelPage() {
  const supabase = getSupabase();
  const panelAudioRef = useRef<HTMLAudioElement | null>(null);
  const [audioUnlocked, setAudioUnlocked] = useState(false);
  const [session, setSession] = useState<boolean | null>(null);
  const [role, setRole] = useState<Role>();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [authError, setAuthError] = useState("");
  const unlockPanelAudio = () => {
    if (audioUnlocked) return;
    const audio = panelAudioRef.current;
    if (!audio) return;
    void audio
      .play()
      .then(() => {
        audio.pause();
        audio.currentTime = 0;
        setAudioUnlocked(true);
      })
      .catch(() => setAudioUnlocked(false));
  };
  useEffect(() => {
    const audio = new Audio("/sounds/nuevo.mp3");
    audio.preload = "auto";
    panelAudioRef.current = audio;
    const unlock = () => unlockPanelAudio();
    document.addEventListener("pointerdown", unlock, { capture: true, once: true });
    document.addEventListener("keydown", unlock, { capture: true, once: true });
    return () => {
      document.removeEventListener("pointerdown", unlock, { capture: true });
      document.removeEventListener("keydown", unlock, { capture: true });
      audio.pause();
      audio.src = "";
      panelAudioRef.current = null;
    };
  }, []);
  useEffect(() => {
    if (!supabase) {
      setSession(false);
      return;
    }
    void supabase.auth.getSession().then(async ({ data }) => {
      setSession(Boolean(data.session));
      if (data.session) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("role,full_name")
          .eq("id", data.session.user.id)
          .single();
        setRole(profile?.role as Role);
        setName(profile?.full_name ?? "");
      }
    });
    const { data: listener } = supabase.auth.onAuthStateChange(
      () => void supabase.auth.getSession().then(({ data }) => setSession(Boolean(data.session))),
    );
    return () => listener.subscription.unsubscribe();
  }, [supabase]);
  const login = async () => {
    if (!supabase) {
      setAuthError("Supabase is not configured.");
      return;
    }
    setAuthError("");
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) setAuthError(error.message);
    else {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        setSession(true);
        const { data: profile } = await supabase
          .from("profiles")
          .select("role,full_name")
          .eq("id", data.session.user.id)
          .single();
        setRole(profile?.role as Role);
        setName(profile?.full_name ?? "");
      }
    }
  };
  if (session === null)
    return (
      <div className="flex min-h-screen items-center justify-center bg-carbon text-arena">
        Loading...
      </div>
    );
  if (!session)
    return (
      <LoginScreen
        email={email}
        password={password}
        error={authError}
        setEmail={setEmail}
        setPassword={setPassword}
        onLogin={() => void login()}
      />
    );
  return (
    <Dashboard
      role={role ?? "admin"}
      name={name}
      audio={panelAudioRef.current}
      audioUnlocked={audioUnlocked}
      unlockAudio={unlockPanelAudio}
      onLogout={() => void supabase?.auth.signOut()}
    />
  );
}

function LoginScreen({
  email,
  password,
  error,
  setEmail,
  setPassword,
  onLogin,
}: {
  email: string;
  password: string;
  error: string;
  setEmail: (value: string) => void;
  setPassword: (value: string) => void;
  onLogin: () => void;
}) {
  return (
    <main className="flex min-h-screen items-center justify-center bg-carbon px-4 text-arena">
      <div className="w-full max-w-md rounded-3xl border border-sombrero/25 bg-gris/70 p-7">
        <Link to="/" className="text-sm text-arena/60">
          ← Fabian's
        </Link>
        <ChefHat className="mt-8 h-10 w-10 text-sombrero" />
        <h1 className="mt-3 font-display text-4xl">Panel</h1>
        <p className="mt-2 text-sm text-arena/60">Acceso para administración y cocina.</p>
        <div className="mt-7 space-y-3">
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            type="email"
            placeholder="Email"
            className="w-full rounded-xl border border-arena/15 bg-carbon px-4 py-3 text-arena"
          />
          <input
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            type="password"
            placeholder="Password"
            onKeyDown={(e) => e.key === "Enter" && onLogin()}
            className="w-full rounded-xl border border-arena/15 bg-carbon px-4 py-3 text-arena"
          />
          {error && <p className="text-sm text-tradicional">{error}</p>}
          <button
            type="button"
            onClick={onLogin}
            className="w-full rounded-full bg-sombrero py-3 font-bold text-carbon"
          >
            <LogIn className="mr-2 inline h-4 w-4" /> Entrar
          </button>
        </div>
      </div>
    </main>
  );
}

function Dashboard({
  role,
  name,
  audio,
  audioUnlocked,
  unlockAudio,
  onLogout,
}: {
  role: Role;
  name: string;
  audio: HTMLAudioElement | null;
  audioUnlocked: boolean;
  unlockAudio: () => void;
  onLogout: () => void;
}) {
  const [orders, setOrders] = useState<PanelOrder[]>([]);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState<"kanban" | "settings" | "stats">(
    role === "super_admin" ? "settings" : "kanban",
  );
  const supabase = getSupabase();
  const [now, setNow] = useState(() => Date.now());
  const [soundMuted, setSoundMuted] = useState(false);
  const [selectedOrder, setSelectedOrder] = useState<PanelOrder | null>(null);
  const [orderHistory, setOrderHistory] = useState<
    Array<{ status: OrderStatus; changed_at: string }>
  >([]);
  const soundReady = audioUnlocked;
  const loadOrders = async () => {
    if (!supabase) return;
    const { data } = await supabase
      .from("orders")
      .select("*,order_items(*),tables(number)")
      .order("created_at", { ascending: false })
      .limit(300);
    setOrders((data ?? []) as PanelOrder[]);
  };
  useEffect(() => {
    void loadOrders();
    if (!supabase) return;
    const channel = supabase
      .channel("staff-orders")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "orders" },
        () => void loadOrders(),
      )
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  }, [supabase]);
  const move = async (order: PanelOrder, status: OrderStatus) => {
    if (!supabase) return;
    if (orderStatusIndex(status) <= orderStatusIndex(order.status)) return;
    const { error } = await supabase.from("orders").update({ status }).eq("id", order.id);
    if (error) return;
    setOrders((current) =>
      current.map((item) => (item.id === order.id ? { ...item, status } : item)),
    );
    setSelectedOrder((current) => (current?.id === order.id ? { ...current, status } : current));
  };
  const openOrder = async (order: PanelOrder) => {
    setSelectedOrder(order);
    setOrderHistory([]);
    if (!supabase) return;
    const { data } = await supabase
      .from("order_status_history")
      .select("status,changed_at")
      .eq("order_id", order.id)
      .order("changed_at", { ascending: true });
    setOrderHistory((data ?? []) as Array<{ status: OrderStatus; changed_at: string }>);
  };
  const filtered = orders.filter((order) =>
    order.order_number.toLowerCase().includes(query.toLowerCase()),
  );
  const hasNewOrders = orders.some((order) => order.status === "nuevo");
  const playNewOrderTone = () => {
    if (!audio) return;
    audio.pause();
    audio.currentTime = 0;
    void audio.play().catch(() => undefined);
  };
  useEffect(() => {
    const clock = window.setInterval(() => setNow(Date.now()), 2_000);
    return () => window.clearInterval(clock);
  }, []);
  useEffect(() => {
    if (soundMuted || !soundReady || !hasNewOrders) return;
    const interval = window.setInterval(playNewOrderTone, NEW_ORDER_SOUND_INTERVAL_MS);
    return () => window.clearInterval(interval);
  }, [hasNewOrders, soundMuted, soundReady]);
  return (
    <main className="min-h-screen bg-carbon px-4 py-5 text-arena">
      <header className="mx-auto flex max-w-[1500px] flex-wrap items-center justify-between gap-4">
        <Link to="/" className="font-display text-xl text-sombrero">
          Fabian's · Panel
        </Link>
        <div className="flex items-center gap-3 text-sm text-arena/60">
          {name && <span>{name}</span>}
          <span className="rounded-full border border-jalapeno/40 px-3 py-1 text-jalapeno">
            {role}
          </span>
          <button
            type="button"
            onClick={onLogout}
            aria-label="Logout"
            className="rounded-full border border-arena/20 p-2 hover:border-tradicional"
          >
            <LogOut className="h-4 w-4" />
          </button>
        </div>
      </header>
      <div className="mx-auto mt-8 max-w-[1500px]">
        <nav className="mb-6 flex flex-wrap gap-2">
          {role === "admin" && (
            <button
              type="button"
              onClick={() => setActive("kanban")}
              className={`rounded-full px-4 py-2 text-sm font-semibold ${active === "kanban" ? "bg-sombrero text-carbon" : "border border-arena/20"}`}
            >
              <UtensilsCrossed className="mr-1 inline h-4 w-4" />
              Kanban
            </button>
          )}
          {role === "super_admin" && (
            <>
              <button
                type="button"
                onClick={() => setActive("settings")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${active === "settings" ? "bg-sombrero text-carbon" : "border border-arena/20"}`}
              >
                <Settings2 className="mr-1 inline h-4 w-4" />
                Super Admin
              </button>
              <button
                type="button"
                onClick={() => setActive("stats")}
                className={`rounded-full px-4 py-2 text-sm font-semibold ${active === "stats" ? "bg-sombrero text-carbon" : "border border-arena/20"}`}
              >
                <BarChart3 className="mr-1 inline h-4 w-4" />
                Stats
              </button>
            </>
          )}
        </nav>
        {role === "admin" && active === "kanban" && (
          <>
            <div className="mb-5 flex max-w-sm items-center gap-2">
              <div className="flex flex-1 items-center gap-2 rounded-full border border-arena/15 bg-gris px-4 py-2">
                <Search className="h-4 w-4 text-sombrero" />
                <input
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Buscar #0042"
                  className="w-full bg-transparent text-sm text-arena outline-none"
                />
              </div>
              <button
                type="button"
                onClick={() => {
                  unlockAudio();
                  setSoundMuted((muted) => !muted);
                }}
                aria-label={
                  soundMuted
                    ? "Activar sonido de pedidos nuevos"
                    : "Silenciar sonido de pedidos nuevos"
                }
                title={soundMuted ? "Activar sonido" : "Silenciar sonido"}
                className={`rounded-full border p-2.5 ${soundMuted ? "border-tradicional/60 text-tradicional" : "border-jalapeno/60 text-jalapeno"}`}
              >
                {soundMuted ? <VolumeX className="h-4 w-4" /> : <Volume2 className="h-4 w-4" />}
              </button>
            </div>
            {hasNewOrders && !soundReady && !soundMuted && (
              <p className="-mt-3 mb-4 text-xs text-arena/60">
                Haz clic en el panel para activar el sonido de pedidos nuevos.
              </p>
            )}
            <div className="grid gap-4 xl:grid-cols-4">
              {ORDER_STATUSES.map((status) => (
                <section
                  key={status}
                  className="min-h-80 rounded-2xl border border-arena/10 bg-gris/35 p-3"
                  onDragOver={(event) => event.preventDefault()}
                  onDrop={(event) => {
                    event.preventDefault();
                    const orderId = event.dataTransfer.getData("application/x-fabians-order");
                    const order = orders.find((item) => item.id === orderId);
                    if (order) void move(order, status);
                  }}
                >
                  <h2 className="mb-3 flex items-center justify-between font-display text-lg text-arena">
                    {STATUS_LABELS[status].es}
                    <span className="rounded-full bg-arena/10 px-2 py-1 text-xs">
                      {filtered.filter((o) => o.status === status).length}
                    </span>
                  </h2>
                  <div className="space-y-3">
                    {filtered
                      .filter((o) => o.status === status)
                      .map((order) => (
                        <OrderCard
                          key={order.id}
                          order={order}
                          onMove={move}
                          onOpen={openOrder}
                          isOverdue={
                            order.status === "nuevo" &&
                            now - new Date(order.created_at).getTime() >= NEW_ORDER_ALERT_AFTER_MS
                          }
                        />
                      ))}
                  </div>
                </section>
              ))}
            </div>
            <OrderInvoiceDialog
              order={selectedOrder}
              history={orderHistory}
              onOpenChange={(open) => !open && setSelectedOrder(null)}
              onMove={move}
            />
          </>
        )}
        {role === "super_admin" && active === "settings" && <SuperAdminSettings />}
        {role === "super_admin" && active === "stats" && <Stats orders={orders} />}
      </div>
    </main>
  );
}

function OrderCard({
  order,
  onMove,
  onOpen,
  isOverdue,
}: {
  order: PanelOrder;
  onMove: (order: PanelOrder, status: OrderStatus) => Promise<void>;
  onOpen: (order: PanelOrder) => void;
  isOverdue: boolean;
}) {
  const dragged = useRef(false);
  const next =
    ORDER_STATUSES[Math.min(ORDER_STATUSES.indexOf(order.status) + 1, ORDER_STATUSES.length - 1)];
  const print = () => openOrderReceipt(order);
  return (
    <article
      draggable
      onDragStart={(event) => {
        dragged.current = true;
        event.dataTransfer.effectAllowed = "move";
        event.dataTransfer.setData("application/x-fabians-order", order.id);
      }}
      onDragEnd={() => window.setTimeout(() => (dragged.current = false), 0)}
      onClick={() => {
        if (!dragged.current) onOpen(order);
      }}
      className={`cursor-grab rounded-2xl border bg-carbon/70 p-3 active:cursor-grabbing ${isOverdue ? "new-order-overdue" : "border-arena/10"}`}
      aria-label={`${order.order_number}, ${STATUS_LABELS[order.status].es}${isOverdue ? ", pedido atrasado" : ""}`}
    >
      <div className="flex justify-between gap-2">
        <h3 className="font-bold text-sombrero">{order.order_number}</h3>
        <button
          type="button"
          onClick={(event) => {
            event.stopPropagation();
            print();
          }}
          aria-label={`Imprimir comanda ${order.order_number}`}
        >
          <Printer className="h-4 w-4 text-arena/60" />
        </button>
      </div>
      <p className="mt-1 text-xs text-arena/50">
        {order.order_type === "pickup" ? "Pickup" : "Mesa"} ·{" "}
        {new Date(order.created_at).toLocaleTimeString()}
      </p>
      <div className="mt-3 space-y-1 text-sm text-arena">
        {order.order_items.map((item, index) => (
          <div key={`${item.item_name}-${index}`}>
            {item.quantity} × {item.item_name}
            <span className="float-right">${Number(item.item_total).toFixed(2)}</span>
          </div>
        ))}
      </div>
      <div className="mt-3 flex items-center justify-between border-t border-arena/10 pt-2 text-sm font-bold text-sombrero">
        <span>${Number(order.total).toFixed(2)}</span>
        {next !== order.status && (
          <button
            type="button"
            onClick={(event) => {
              event.stopPropagation();
              void onMove(order, next);
            }}
            aria-label={`${STATUS_LABELS[next].es} ${order.order_number}`}
            className="rounded-full bg-jalapeno px-3 py-1 text-xs text-arena"
          >
            {STATUS_LABELS[next].es}
          </button>
        )}
      </div>
    </article>
  );
}

function OrderInvoiceDialog({
  order,
  history,
  onOpenChange,
  onMove,
}: {
  order: PanelOrder | null;
  history: Array<{ status: OrderStatus; changed_at: string }>;
  onOpenChange: (open: boolean) => void;
  onMove: (order: PanelOrder, status: OrderStatus) => Promise<void>;
}) {
  if (!order) return null;
  const next =
    ORDER_STATUSES[Math.min(orderStatusIndex(order.status) + 1, ORDER_STATUSES.length - 1)];
  return (
    <Dialog open={Boolean(order)} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] max-w-2xl overflow-y-auto border-arena/20 bg-[#fffaf0] p-0 text-[#24201b] sm:rounded-2xl">
        <div className="border-b-4 border-sombrero px-7 pb-5 pt-7">
          <p className="text-xs font-bold uppercase tracking-[0.22em] text-jalapeno">
            Fabian's Mexican Restaurant
          </p>
          <div className="mt-3 flex flex-wrap items-end justify-between gap-3">
            <DialogTitle className="font-display text-4xl text-carbon">
              Factura de pedido
            </DialogTitle>
            <span className="rounded-full bg-carbon px-4 py-2 font-mono text-lg font-bold text-sombrero">
              {order.order_number}
            </span>
          </div>
        </div>
        <div className="space-y-5 px-7 pb-7">
          <div className="grid gap-3 rounded-xl border border-carbon/15 bg-carbon/[0.035] p-4 text-sm sm:grid-cols-2">
            <div>
              <p className="text-xs font-bold uppercase tracking-wide text-carbon/55">Cliente</p>
              <p className="font-semibold">{order.customer_name}</p>
              <p>{order.customer_phone}</p>
            </div>
            <div className="sm:text-right">
              <p className="text-xs font-bold uppercase tracking-wide text-carbon/55">Servicio</p>
              <p className="font-semibold">
                {order.order_type === "pickup"
                  ? "Para recoger"
                  : `Mesa ${order.tables?.number ?? "—"}`}
              </p>
              <p>{new Date(order.created_at).toLocaleString()}</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-xl border border-carbon/15">
            <table className="w-full text-sm">
              <thead className="bg-carbon text-left text-xs uppercase tracking-wide text-[#fffaf0]">
                <tr>
                  <th className="px-3 py-3">Cant.</th>
                  <th className="px-3 py-3">Plato</th>
                  <th className="px-3 py-3 text-right">Precio</th>
                  <th className="px-3 py-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody>
                {order.order_items.map((item, index) => (
                  <tr key={`${item.item_name}-${index}`} className="border-t border-carbon/10">
                    <td className="px-3 py-3 font-semibold">{item.quantity}</td>
                    <td className="px-3 py-3">
                      {item.item_name}
                      {item.variant && (
                        <small className="block text-carbon/60">{item.variant}</small>
                      )}
                    </td>
                    <td className="px-3 py-3 text-right">${Number(item.unit_price).toFixed(2)}</td>
                    <td className="px-3 py-3 text-right font-semibold">
                      ${Number(item.item_total).toFixed(2)}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {order.notes && (
            <div className="rounded-xl border-l-4 border-tradicional bg-tradicional/10 px-4 py-3 text-sm">
              <strong>Notas para cocina:</strong> {order.notes}
            </div>
          )}
          <div className="ml-auto max-w-xs space-y-1 border-t-2 border-carbon pt-3 text-sm">
            <div className="flex justify-between">
              <span>Subtotal</span>
              <span>${Number(order.subtotal).toFixed(2)}</span>
            </div>
            <div className="flex justify-between">
              <span>Impuesto</span>
              <span>${Number(order.tax).toFixed(2)}</span>
            </div>
            {Number(order.surcharge) > 0 && (
              <div className="flex justify-between">
                <span>Recargo pickup</span>
                <span>${Number(order.surcharge).toFixed(2)}</span>
              </div>
            )}
            <div className="flex justify-between pt-2 text-lg font-black">
              <span>Total</span>
              <span>${Number(order.total).toFixed(2)}</span>
            </div>
          </div>
          {history.length > 0 && (
            <div className="border-t border-carbon/15 pt-4 text-xs text-carbon/65">
              <strong className="text-carbon">Historial: </strong>
              {history
                .map(
                  (entry) =>
                    `${STATUS_LABELS[entry.status].es} · ${new Date(entry.changed_at).toLocaleTimeString()}`,
                )
                .join("  →  ")}
            </div>
          )}
          <div className="flex flex-wrap justify-end gap-2 border-t border-carbon/15 pt-5">
            <button
              type="button"
              onClick={() => openOrderReceipt(order)}
              className="rounded-full border border-carbon/30 px-4 py-2 text-sm font-bold"
            >
              <Printer className="mr-1 inline h-4 w-4" /> Imprimir
            </button>
            {next !== order.status && (
              <button
                type="button"
                onClick={() => void onMove(order, next)}
                className="rounded-full bg-jalapeno px-4 py-2 text-sm font-bold text-arena"
              >
                Marcar como {STATUS_LABELS[next].es}
              </button>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function SuperAdminSettings() {
  const supabase = getSupabase();
  const [status, setStatus] = useState<Record<string, boolean>>({});
  const [tables, setTables] = useState<
    Array<{ id: string; number: number; qr_token: string; active: boolean }>
  >([]);
  const [tableCount, setTableCount] = useState(0);
  const [itemQuery, setItemQuery] = useState("");
  const [qr, setQr] = useState<{ number: number; dataUrl: string }>();
  const items = useMemo(() => getAllMenuItems(), []);
  const filteredItems = items.filter(({ item }) =>
    item.name.toLowerCase().includes(itemQuery.toLowerCase()),
  );
  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("menu_item_status")
      .select("item_slug,is_available")
      .then(({ data }) =>
        setStatus(
          Object.fromEntries((data ?? []).map((item) => [item.item_slug, item.is_available])),
        ),
      );
    void supabase
      .from("tables")
      .select("id,number,qr_token,active")
      .order("number")
      .then(({ data }) => {
        setTables(data ?? []);
        setTableCount(data?.length ?? 0);
      });
  }, [supabase]);
  const toggle = async (slug: string, available: boolean) => {
    if (!supabase) return;
    await supabase.from("menu_item_status").upsert({ item_slug: slug, is_available: available });
    setStatus((current) => ({ ...current, [slug]: available }));
  };
  const createTables = async () => {
    if (!supabase || tableCount < 1) return;
    const existing = new Set(tables.map((table) => table.number));
    const rows = Array.from({ length: tableCount }, (_, index) => index + 1)
      .filter((number) => !existing.has(number))
      .map((number) => ({ number }));
    if (rows.length) {
      const { data } = await supabase
        .from("tables")
        .insert(rows)
        .select("id,number,qr_token,active");
      setTables((current) => [...current, ...(data ?? [])].sort((a, b) => a.number - b.number));
    }
  };
  const generateQr = async (table: { number: number; qr_token: string }) => {
    const url = new URL(`/pedir?mesa=${table.qr_token}`, window.location.origin).toString();
    setQr({
      number: table.number,
      dataUrl: await QRCode.toDataURL(url, {
        width: 720,
        margin: 2,
        color: { dark: "#121212", light: "#F5E6C8" },
      }),
    });
  };
  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="rounded-3xl border border-arena/10 bg-gris/50 p-5">
        <h2 className="font-display text-2xl">Agotados</h2>
        <p className="mt-2 text-sm text-arena/60">
          Los cambios afectan menú público y creación de pedidos.
        </p>
        <div className="mt-4 flex items-center gap-2 rounded-xl border border-arena/15 bg-carbon px-3">
          <Search className="h-4 w-4 text-sombrero" />
          <input
            value={itemQuery}
            onChange={(e) => setItemQuery(e.target.value)}
            placeholder="Buscar plato"
            className="w-full bg-transparent py-3 text-sm text-arena outline-none"
          />
        </div>
        <div className="mt-4 max-h-[600px] space-y-2 overflow-auto">
          {filteredItems.map(({ categoryKey, item, itemSlug }) => (
            <label
              key={itemSlug}
              className="flex items-center justify-between gap-3 rounded-xl border border-arena/10 bg-carbon/40 p-3 text-sm"
            >
              <span>
                {item.name}
                <small className="ml-2 text-arena/40">{categoryKey}</small>
              </span>
              <button
                type="button"
                onClick={() => void toggle(itemSlug, status[itemSlug] === false)}
                aria-label={`Toggle ${item.name}`}
              >
                {status[itemSlug] === false ? (
                  <ToggleLeft className="h-7 w-7 text-tradicional" />
                ) : (
                  <ToggleRight className="h-7 w-7 text-jalapeno" />
                )}
              </button>
            </label>
          ))}
        </div>
      </section>
      <section className="rounded-3xl border border-arena/10 bg-gris/50 p-5">
        <h2 className="font-display text-2xl">Mesas y QR</h2>
        <p className="mt-2 text-sm text-arena/60">
          Define el total y genera códigos para imprimir.
        </p>
        <div className="mt-4 flex gap-2">
          <input
            type="number"
            min="1"
            value={tableCount}
            onChange={(e) => setTableCount(Number(e.target.value))}
            className="w-24 rounded-xl border border-arena/15 bg-carbon p-3 text-arena"
          />
          <button
            type="button"
            onClick={() => void createTables()}
            className="rounded-full bg-sombrero px-4 py-2 font-bold text-carbon"
          >
            <Table2 className="mr-1 inline h-4 w-4" />
            Generar mesas
          </button>
        </div>
        <div className="mt-5 space-y-2">
          {tables.map((table) => (
            <div
              key={table.id}
              className="rounded-xl border border-arena/10 bg-carbon/50 p-3 text-sm"
            >
              <div className="flex items-center justify-between gap-3">
                <span>
                  Mesa {table.number}{" "}
                  <small className="block text-arena/40">/pedir?mesa={table.qr_token}</small>
                </span>
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={() => void generateQr(table)}
                    className="text-sombrero"
                  >
                    Generar QR
                  </button>
                  <a
                    href={`/pedir?mesa=${table.qr_token}`}
                    target="_blank"
                    rel="noreferrer"
                    className="text-arena/60"
                  >
                    Abrir
                  </a>
                </div>
              </div>
              {qr?.number === table.number && (
                <div className="mt-4 flex items-end gap-4">
                  <img
                    src={qr.dataUrl}
                    alt={`QR mesa ${table.number}`}
                    className="h-32 w-32 rounded-lg bg-arena p-1"
                  />
                  <a
                    href={qr.dataUrl}
                    download={`fabians-mesa-${table.number}.png`}
                    className="rounded-full border border-sombrero/50 px-3 py-2 text-xs font-semibold text-sombrero"
                  >
                    Descargar QR
                  </a>
                </div>
              )}
            </div>
          ))}
        </div>
      </section>
    </div>
  );
}

function Stats({ orders }: { orders: PanelOrder[] }) {
  const [period, setPeriod] = useState<"day" | "week" | "month">("day");
  const [type, setType] = useState<"all" | "dine_in" | "pickup">("all");
  const [ratings, setRatings] = useState<Array<{ order_id: string; rating: number }>>([]);
  const [history, setHistory] = useState<
    Array<{ order_id: string; status: OrderStatus; changed_at: string }>
  >([]);
  const supabase = getSupabase();
  useEffect(() => {
    if (!supabase) return;
    void supabase
      .from("order_ratings")
      .select("order_id,rating")
      .then(({ data }) => setRatings(data ?? []));
    void supabase
      .from("order_status_history")
      .select("order_id,status,changed_at")
      .order("changed_at")
      .then(({ data }) => setHistory(data ?? []));
  }, [supabase]);
  const filtered = orders.filter((order) => {
    const now = Date.now();
    const age = now - new Date(order.created_at).getTime();
    const periodMs = period === "day" ? 86400000 : period === "week" ? 604800000 : 2592000000;
    return age <= periodMs && (type === "all" || order.order_type === type);
  });
  const total = filtered.reduce((sum, order) => sum + Number(order.total), 0);
  const average = filtered.length ? total / filtered.length : 0;
  const top = filtered
    .flatMap((order) => order.order_items)
    .reduce<Record<string, number>>((map, item) => {
      map[item.item_name] = (map[item.item_name] ?? 0) + item.quantity;
      return map;
    }, {});
  const best = Object.entries(top).sort((a, b) => b[1] - a[1])[0];
  const bestRating = ratings
    .filter((rating) => filtered.some((order) => order.id === rating.order_id))
    .sort((a, b) => b.rating - a.rating)[0];
  const counts = ORDER_STATUSES.map(
    (status) =>
      `${STATUS_LABELS[status].es}: ${filtered.filter((order) => order.status === status).length}`,
  ).join(" · ");
  const durations = filtered.flatMap((order) => {
    const entries = history.filter((event) => event.order_id === order.id);
    return entries
      .slice(1)
      .map(
        (event, index) =>
          new Date(event.changed_at).getTime() - new Date(entries[index].changed_at).getTime(),
      );
  });
  const avgMinutes = durations.length
    ? Math.round(durations.reduce((sum, value) => sum + value, 0) / durations.length / 60000)
    : 0;
  return (
    <div>
      <div className="mb-5 flex flex-wrap gap-2">
        {(["day", "week", "month"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setPeriod(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${period === value ? "bg-sombrero text-carbon" : "border border-arena/20"}`}
          >
            {value === "day" ? "Día" : value === "week" ? "Semana" : "Mes"}
          </button>
        ))}
        {(["all", "dine_in", "pickup"] as const).map((value) => (
          <button
            key={value}
            type="button"
            onClick={() => setType(value)}
            className={`rounded-full px-4 py-2 text-sm font-semibold ${type === value ? "bg-jalapeno text-arena" : "border border-arena/20"}`}
          >
            {value === "all" ? "Todos" : value === "dine_in" ? "Mesa" : "Pickup"}
          </button>
        ))}
      </div>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <Stat icon={<BarChart3 />} label="Ventas" value={`$${total.toFixed(2)}`} />
        <Stat icon={<UtensilsCrossed />} label="Pedidos" value={String(filtered.length)} />
        <Stat icon={<ChevronDown />} label="Ticket promedio" value={`$${average.toFixed(2)}`} />
        <Stat
          icon={<Star />}
          label="Plato mejor calificado"
          value={
            bestRating
              ? `${filtered.find((order) => order.id === bestRating.order_id)?.order_number ?? ""} · ${bestRating.rating}/5`
              : "Sin datos"
          }
        />
      </div>
      <div className="mt-4 grid gap-4 md:grid-cols-3">
        <div className="rounded-2xl border border-arena/10 bg-gris/50 p-4 text-sm text-arena/70">
          <b className="text-arena">Más vendido:</b>{" "}
          {best ? `${best[0]} (${best[1]})` : "Sin datos"}
        </div>
        <div className="rounded-2xl border border-arena/10 bg-gris/50 p-4 text-sm text-arena/70">
          <b className="text-arena">Estados:</b> {counts}
        </div>
        <div className="rounded-2xl border border-arena/10 bg-gris/50 p-4 text-sm text-arena/70">
          <b className="text-arena">Tiempo promedio entre estados:</b> {avgMinutes} min
        </div>
      </div>
    </div>
  );
}
function Stat({ icon, label, value }: { icon: React.ReactNode; label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-arena/10 bg-gris/50 p-5">
      <div className="text-sombrero">{icon}</div>
      <p className="mt-4 text-xs uppercase tracking-wider text-arena/50">{label}</p>
      <p className="mt-1 text-2xl font-bold text-arena">{value}</p>
    </div>
  );
}
