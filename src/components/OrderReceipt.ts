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
    unit_price?: number;
    quantity: number;
    item_total: number;
    notes?: string | null;
  }>;
};

const money = (value: number | null | undefined) => `$${Number(value ?? 0).toFixed(2)}`;

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
        `<section class="item"><div class="item-line"><strong class="qty">${item.quantity}</strong><strong class="name">${escapeHtml(item.item_name)}</strong><strong class="price">${money(item.item_total)}</strong></div>${item.variant ? `<div class="variant">${escapeHtml(item.variant)}${item.unit_price != null ? ` · ${money(item.unit_price)} c/u` : ""}</div>` : item.unit_price != null ? `<div class="variant">${money(item.unit_price)} c/u</div>` : ""}${item.notes ? `<div class="item-note">Nota del plato: ${escapeHtml(item.notes)}</div>` : ""}</section>`,
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
  body { width: ${RECEIPT_PAPER_WIDTH} !important; min-width: ${RECEIPT_PAPER_WIDTH} !important; max-width: ${RECEIPT_PAPER_WIDTH} !important; margin: 0 !important; padding: 0 !important; background: #fff; color: #000; font-family: Arial, Helvetica, sans-serif; font-size: 13px; line-height: 1.2; }
  .receipt { display: block; width: ${RECEIPT_PAPER_WIDTH} !important; min-width: ${RECEIPT_PAPER_WIDTH} !important; max-width: ${RECEIPT_PAPER_WIDTH} !important; margin: 0 !important; padding: 2mm !important; overflow: visible; }
  header { border-bottom: 2px solid #000; padding: 0 0 2mm; text-align: center; }
  .restaurant { font-size: 15px; font-weight: 700; }
  .kitchen { margin-top: 1mm; font-size: 12px; font-weight: 700; letter-spacing: .12em; }
  .code { margin: 2mm 0 1mm; text-align: center; font-size: 25px; font-weight: 700; }
  .meta { display: flex; justify-content: space-between; gap: 2mm; margin-bottom: 2mm; font-size: 12px; font-weight: 700; overflow-wrap: anywhere; }
  .items { border-top: 2px solid #000; }
  .item { padding: 2mm 0; border-bottom: 1px dashed #000; break-inside: avoid; page-break-inside: avoid; overflow-wrap: anywhere; }
  .item-line { display: flex; align-items: baseline; gap: 2mm; }
  .qty { flex: 0 0 10mm; font-size: 20px; }
  .name { min-width: 0; flex: 1 1 auto; font-size: 16px; }
  .price { flex: 0 0 auto; font-size: 14px; white-space: nowrap; }
  .variant { margin: 1mm 0 0 12mm; font-size: 13px; font-weight: 700; text-transform: uppercase; }
  .item-note { margin: 1mm 0 0 12mm; font-size: 12px; font-style: italic; }
  .order-note { margin-top: 2mm; padding: 2mm 0; border-bottom: 2px solid #000; font-size: 14px; font-weight: 700; overflow-wrap: anywhere; }
  .totals { margin: 3mm 0 0 auto; width: 72%; font-size: 13px; }
  .total-row { display: flex; justify-content: space-between; gap: 3mm; padding: 1mm 0; }
  .grand-total { margin-top: 1mm; padding-top: 2mm; border-top: 2px solid #000; font-size: 18px; font-weight: 700; }
  .thanks { margin-top: 3mm; border-top: 1px dashed #000; padding-top: 2mm; text-align: center; font-size: 10px; }
  @media print {
    html, body, .receipt { width: ${RECEIPT_PAPER_WIDTH} !important; min-width: ${RECEIPT_PAPER_WIDTH} !important; max-width: ${RECEIPT_PAPER_WIDTH} !important; min-height: 0; overflow: visible; }
    .receipt { break-after: auto; page-break-after: auto; }
  }
</style></head><body><main class="receipt">
<header><div class="restaurant">Fabian's Mexican Restaurant</div><div class="kitchen">FACTURA / COMANDA</div></header>
<div class="code">${escapeHtml(order.order_number)}</div>
<div class="meta"><strong>${escapeHtml(new Date(order.created_at).toLocaleString())}</strong><strong>${service}</strong></div>
<div class="items">${items}</div>
${order.notes ? `<div class="order-note">NOTAS: ${escapeHtml(order.notes)}</div>` : ""}
<div class="totals">
  <div class="total-row"><span>Subtotal</span><strong>${money(order.subtotal)}</strong></div>
  <div class="total-row"><span>Impuesto</span><strong>${money(order.tax)}</strong></div>
  ${Number(order.surcharge) ? `<div class="total-row"><span>Recargo pickup</span><strong>${money(order.surcharge)}</strong></div>` : ""}
  <div class="total-row grand-total"><span>Total</span><strong>${money(order.total)}</strong></div>
</div>
<div class="thanks">Gracias por su compra</div>
</main></body></html>`);
  popup.document.close();
  // Some browsers do not dispatch load after document.write on about:blank.
  window.setTimeout(printPopup, 500);
}
