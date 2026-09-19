/** Change this single value to "58mm" when the kitchen printer uses 58 mm rolls. */
const RECEIPT_PAPER_WIDTH = "80mm";
const RECEIPT_PAGE_MARGIN = "0";

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
  const popup = window.open("", "_blank", "popup,width=302,height=900");
  if (!popup) return;

  let printed = false;
  const printPopup = () => {
    if (printed || popup.closed) return;
    printed = true;
    popup.focus();
    popup.print();
  };

  popup.addEventListener("load", () => {
    window.setTimeout(printPopup, 150);
  });

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
  @page { size: ${RECEIPT_PAPER_WIDTH} auto; margin: ${RECEIPT_PAGE_MARGIN} !important; }
  *, *::before, *::after { box-sizing: border-box; }
  html { width: ${RECEIPT_PAPER_WIDTH} !important; min-width: ${RECEIPT_PAPER_WIDTH} !important; max-width: ${RECEIPT_PAPER_WIDTH} !important; margin: 0 !important; padding: 0 !important; background: #fff; }
  body { width: ${RECEIPT_PAPER_WIDTH} !important; min-width: ${RECEIPT_PAPER_WIDTH} !important; max-width: ${RECEIPT_PAPER_WIDTH} !important; margin: 0 !important; padding: 0 !important; background: #fff; color: #111; font-family: Arial, Helvetica, sans-serif; font-size: 11px; line-height: 1.3; }
  .receipt { display: block; width: ${RECEIPT_PAPER_WIDTH} !important; min-width: ${RECEIPT_PAPER_WIDTH} !important; max-width: ${RECEIPT_PAPER_WIDTH} !important; margin: 0 !important; padding: 2mm !important; overflow: visible; }
  header { border-bottom: 1px solid #111; padding: 0 0 2mm; text-align: center; }
  .restaurant { font-size: 14px; font-weight: 700; }
  .code { margin: 2mm 0; border: 1px solid #111; padding: 1.5mm; text-align: center; font-size: 18px; font-weight: 700; }
  .meta { margin-bottom: 2mm; font-size: 10px; overflow-wrap: anywhere; }
  table { width: 100%; margin: 0; border-collapse: collapse; table-layout: fixed; break-inside: auto; }
  tr { break-inside: avoid; page-break-inside: avoid; }
  td { padding: 1.5mm 0; border-bottom: 1px solid #ddd; vertical-align: top; overflow-wrap: anywhere; word-break: normal; }
  td:first-child { width: 76%; padding-right: 2mm; }
  td:last-child { width: 24%; text-align: right; white-space: nowrap; }
  .notes { margin: 2mm 0; padding: 1.5mm; border-left: 1mm solid #111; background: #f1f1f1; overflow-wrap: anywhere; }
  .totals { margin: 2mm 0 0 auto; width: 70%; }
  .total td { border-top: 1px solid #111; font-size: 13px; font-weight: 700; }
  .footer { margin: 3mm 0 0; text-align: center; font-size: 8px; color: #444; }
  @media print {
    html, body, .receipt { width: ${RECEIPT_PAPER_WIDTH} !important; min-width: ${RECEIPT_PAPER_WIDTH} !important; max-width: ${RECEIPT_PAPER_WIDTH} !important; min-height: 0; overflow: visible; }
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
</main></body></html>`);
  popup.document.close();
  // Some browsers do not dispatch load after document.write on about:blank.
  window.setTimeout(printPopup, 500);
}
