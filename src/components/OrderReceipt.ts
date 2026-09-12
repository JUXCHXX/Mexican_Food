/** Change this single value to "58mm" when the kitchen printer uses 58 mm rolls. */
const RECEIPT_PAPER_WIDTH = "80mm";
const RECEIPT_PAGE_MARGIN = "3mm";

export type ReceiptOrder = {
  order_number: string;
  order_type: "dine_in" | "pickup";
  customer_name: string;
  customer_phone: string;
  table_id: string | null;
  table_number?: number | null;
  tables?: { number: number } | null;
  created_at: string;
  notes?: string | null;
  subtotal: number;
  tax: number;
  surcharge: number;
  total: number;
  order_items: Array<{
    item_name: string;
    variant: string | null;
    quantity: number;
    item_total: number;
  }>;
};

const money = (value: number) => `$${Number(value).toFixed(2)}`;

const escapeHtml = (value: string | number | null | undefined) =>
  String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");

export function openOrderReceipt(order: ReceiptOrder) {
  const popup = window.open("", "_blank", "width=460,height=720");
  if (!popup) return;

  const items = order.order_items
    .map(
      (item) =>
        `<tr><td>${item.quantity} × ${escapeHtml(item.item_name)}${item.variant ? ` · ${escapeHtml(item.variant)}` : ""}</td><td>${money(item.item_total)}</td></tr>`,
    )
    .join("");
  const tableNumber = order.tables?.number ?? order.table_number ?? order.table_id ?? "";
  const service =
    order.order_type === "pickup"
      ? `PICKUP · ${escapeHtml(order.customer_name)} · ${escapeHtml(order.customer_phone)}`
      : `DINE IN · Mesa ${escapeHtml(tableNumber)}`;

  popup.document.write(`<!doctype html>
<html><head><meta charset="utf-8"><title>${escapeHtml(order.order_number)}</title>
<style>
  @page { size: ${RECEIPT_PAPER_WIDTH} auto; margin: ${RECEIPT_PAGE_MARGIN}; }
  * { box-sizing: border-box; }
  html, body { width: 100%; margin: 0; padding: 0; background: #fff; }
  body { font-family: Arial, sans-serif; color: #111; font-size: 11px; line-height: 1.35; }
  .receipt { width: 100%; max-width: none; margin: 0; padding: 0; overflow: visible; }
  header { border-bottom: 1px solid #111; padding: 0 0 3mm; text-align: center; }
  .restaurant { font-size: 14px; font-weight: 700; }
  .code { margin: 3mm 0; border: 1px solid #111; padding: 2mm; text-align: center; font-size: 20px; font-weight: 700; }
  .meta { margin-bottom: 3mm; font-size: 10px; overflow-wrap: anywhere; }
  table { width: 100%; border-collapse: collapse; table-layout: fixed; break-inside: auto; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  td { padding: 2mm 0; border-bottom: 1px solid #ddd; vertical-align: top; overflow-wrap: anywhere; }
  td:first-child { padding-right: 2mm; }
  td:last-child { width: 24%; text-align: right; white-space: nowrap; }
  .notes { margin: 3mm 0; padding: 2mm; border-left: 1mm solid #111; background: #f1f1f1; overflow-wrap: anywhere; }
  .totals { margin-left: auto; width: 62%; }
  .total td { border-top: 1px solid #111; font-size: 14px; font-weight: 700; }
  .footer { margin: 5mm 0 0; text-align: center; font-size: 8px; color: #444; }
  @media print {
    html, body, .receipt { width: 100%; min-height: 0; overflow: visible; }
    .receipt { break-after: auto; page-break-after: auto; }
  }
</style></head><body><main class="receipt">
<header><div class="restaurant">Fabian's Mexican Restaurant</div><div>116 Wilson Pike Circle, Brentwood, TN 37027</div><div>(615) 376-9978</div></header>
<div class="code">${escapeHtml(order.order_number)}</div>
<div class="meta"><strong>${escapeHtml(new Date(order.created_at).toLocaleString())}</strong><br>${service}</div>
<table><tbody>${items}</tbody></table>
${order.notes ? `<div class="notes"><strong>Notas:</strong><br>${escapeHtml(order.notes)}</div>` : ""}
<table class="totals"><tbody><tr><td>Subtotal</td><td>${money(order.subtotal)}</td></tr><tr><td>Impuesto (9.75%)</td><td>${money(order.tax ?? 0)}</td></tr>${Number(order.surcharge) ? `<tr><td>Recargo pickup</td><td>${money(order.surcharge)}</td></tr>` : ""}<tr class="total"><td>Total</td><td>${money(order.total)}</td></tr></tbody></table>
<p class="footer">Gracias por su compra. Consumir alimentos crudos o poco cocidos puede aumentar el riesgo de enfermedades transmitidas por alimentos.</p>
</main><script>window.print()</script></body></html>`);
  popup.document.close();
  // In Chrome --kiosk-printing, this same direct print call is sent silently to the default printer.
}
