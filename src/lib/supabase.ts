import { createClient, type SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null | undefined;

export function getSupabase() {
  if (client !== undefined) return client;
  const url = import.meta.env.VITE_SUPABASE_URL;
  const key = import.meta.env.VITE_SUPABASE_ANON_KEY;
  client = url && key ? createClient(url, key) : null;
  return client;
}

export type OrderType = "dine_in" | "pickup";
export type OrderStatus = "nuevo" | "cocina" | "listo" | "entregado";

export const ORDER_STATUSES: OrderStatus[] = ["nuevo", "cocina", "listo", "entregado"];

export const STATUS_LABELS: Record<OrderStatus, { es: string; en: string }> = {
  nuevo: { es: "Nuevo pedido", en: "New order" },
  cocina: { es: "Enviar a cocina", en: "Send to kitchen" },
  listo: { es: "Pedido listo", en: "Ready" },
  entregado: { es: "Entregado", en: "Delivered" },
};