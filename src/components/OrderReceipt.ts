export type ReceiptOrder = {
  order_number: string;
  order_type: "dine_in" | "pickup";
  customer_name: string;
  customer_phone: string;
  table_id: string | null;
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

export function openOrderReceipt(order: ReceiptOrder) {
  const popup = window.open("", "_blank", "width=460,height=720");
  if (!popup) return;
  const items = order.order_items
    .map(
      (item) =>
        `<tr><td>${item.quantity} × ${item.item_name}${item.variant ? ` · ${item.variant}` : ""}</td><td>${money(item.item_total)}</td></tr>`,
    )
    .join("");
  popup.document.write(
    `<!doctype html><html><head><title>${order.order_number}</title><style>body{font-family:Arial,sans-serif;color:#111;background:#fff;margin:0;padding:24px;max-width:460px}header{text-align:center;border-bottom:2px solid #111;padding-bottom:14px}.code{font-size:32px;font-weight:700;margin:16px 0;text-align:center;border:2px solid #111;padding:8px}table{width:100%;border-collapse:collapse}td{padding:8px 0;border-bottom:1px solid #ddd;vertical-align:top}td:last-child{text-align:right;white-space:nowrap}.meta{font-size:13px;line-height:1.6}.notes{margin:18px 0;padding:10px;border-left:4px solid #111;background:#f1f1f1}.totals{margin-left:auto;width:230px}.total{font-size:20px;font-weight:700;border-top:2px solid #111}.footer{text-align:center;font-size:11px;margin-top:28px;color:#444}@media print{body{padding:0}}</style></head><body><header><strong>Fabian's Mexican Restaurant</strong><div>116 Wilson Pike Circle, Brentwood, TN 37027</div><div>(615) 376-9978</div></header><div class="code">${order.order_number}</div><div class="meta"><strong>${new Date(order.created_at).toLocaleString()}</strong><br>${order.order_type === "pickup" ? `PICKUP · ${order.customer_name} · ${order.customer_phone}` : `DINE IN · Mesa ${order.table_id ?? ""}`}</div><table><tbody>${items}</tbody></table>${order.notes ? `<div class="notes"><strong>Notas:</strong><br>${order.notes}</div>` : ""}<table class="totals"><tbody><tr><td>Subtotal</td><td>${money(order.subtotal)}</td></tr><tr><td>Impuesto (9.75%)</td><td>${money(order.tax ?? 0)}</td></tr>${Number(order.surcharge) ? `<tr><td>Recargo pickup</td><td>${money(order.surcharge)}</td></tr>` : ""}<tr class="total"><td>Total</td><td>${money(order.total)}</td></tr></tbody></table><p class="footer">Gracias por su compra. Consumir alimentos crudos o poco cocidos puede aumentar el riesgo de enfermedades transmitidas por alimentos.</p><script>window.print()</script></body></html>`,
  );
  popup.document.close();
}
