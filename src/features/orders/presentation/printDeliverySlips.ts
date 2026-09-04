import type { OrderEntity } from "@/features/orders/domain";

export type DeliverySlipLabels = {
  title: string;
  order: string;
  tracking: string;
  customer: string;
  phone: string;
  phone2: string;
  address: string;
  wilaya: string;
  commune: string;
  product: string;
  color: string;
  size: string;
  qty: string;
  amount: string;
  stopdesk: string;
  notes: string;
  yes: string;
  no: string;
};

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");

const text = (value?: string | number | null) => {
  if (value == null || value === "") return "—";
  return escapeHtml(String(value));
};

const customerName = (order: OrderEntity) =>
  [order.first_name, order.last_name].filter(Boolean).join(" ") || "—";

const orderAmount = (order: OrderEntity) => {
  const productTotal = (order.product_price ?? 0) * (order.product_qty ?? 0);
  const shipping = order.shipping_price ?? order.delivery_fees ?? 0;
  return productTotal + shipping;
};

const formatAmount = (amount: number) =>
  new Intl.NumberFormat("en-US", {
    maximumFractionDigits: 0,
    numberingSystem: "latn",
  }).format(amount);

const buildSlipHtml = (order: OrderEntity, labels: DeliverySlipLabels) => {
  const amount = formatAmount(orderAmount(order));
  const stopdesk =
    order.is_stopdesk || order.stopdesk
      ? `${labels.yes}${order.stopdesk ? ` · ${text(order.stopdesk)}` : ""}`
      : labels.no;

  return `
    <article class="slip">
      <header class="slip-header">
        <div>
          <h1>${escapeHtml(labels.title)}</h1>
          <p class="muted">${escapeHtml(labels.order)} #${text(order.id)}</p>
        </div>
        <div class="tracking">
          <span class="label">${escapeHtml(labels.tracking)}</span>
          <strong>${text(order.tracking_id)}</strong>
        </div>
      </header>

      <section class="grid">
        <div>
          <span class="label">${escapeHtml(labels.customer)}</span>
          <strong>${text(customerName(order))}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.phone)}</span>
          <strong dir="ltr">${text(order.phone)}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.phone2)}</span>
          <strong dir="ltr">${text(order.phone2)}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.wilaya)}</span>
          <strong>${text(order.wilaya)}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.commune)}</span>
          <strong>${text(order.commune)}</strong>
        </div>
        <div class="span-2">
          <span class="label">${escapeHtml(labels.address)}</span>
          <strong>${text(order.address)}</strong>
        </div>
      </section>

      <section class="grid product">
        <div class="span-2">
          <span class="label">${escapeHtml(labels.product)}</span>
          <strong>${text(order.product)}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.color)}</span>
          <strong>${text(order.product_color)}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.size)}</span>
          <strong>${text(order.product_size)}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.qty)}</span>
          <strong>${text(order.product_qty)}</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.amount)}</span>
          <strong>${escapeHtml(amount)} DA</strong>
        </div>
        <div>
          <span class="label">${escapeHtml(labels.stopdesk)}</span>
          <strong>${stopdesk}</strong>
        </div>
        <div class="span-2">
          <span class="label">${escapeHtml(labels.notes)}</span>
          <strong>${text(order.comment ?? order.delivery_notes)}</strong>
        </div>
      </section>
    </article>
  `;
};

const buildDocumentHtml = (
  orders: OrderEntity[],
  labels: DeliverySlipLabels
) => `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <title>${escapeHtml(labels.title)}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      padding: 16px;
      font-family: Arial, Helvetica, sans-serif;
      color: #111;
      background: #fff;
    }
    .slip {
      border: 2px solid #111;
      border-radius: 8px;
      padding: 16px;
      margin: 0 0 16px;
      page-break-after: always;
      break-after: page;
    }
    .slip:last-child {
      page-break-after: auto;
      break-after: auto;
      margin-bottom: 0;
    }
    .slip-header {
      display: flex;
      justify-content: space-between;
      gap: 16px;
      border-bottom: 1px solid #d4d4d4;
      padding-bottom: 12px;
      margin-bottom: 12px;
    }
    h1 {
      margin: 0 0 4px;
      font-size: 18px;
    }
    .muted { margin: 0; color: #525252; font-size: 12px; }
    .tracking { text-align: right; }
    .label {
      display: block;
      font-size: 11px;
      text-transform: uppercase;
      letter-spacing: 0.04em;
      color: #737373;
      margin-bottom: 2px;
    }
    strong { font-size: 14px; font-weight: 700; }
    .grid {
      display: grid;
      grid-template-columns: repeat(2, minmax(0, 1fr));
      gap: 10px 16px;
    }
    .product {
      margin-top: 14px;
      padding-top: 12px;
      border-top: 1px dashed #a3a3a3;
    }
    .span-2 { grid-column: span 2; }
    @media print {
      body { padding: 0; }
      .slip { border-radius: 0; }
    }
  </style>
</head>
<body>
  ${orders.map((order) => buildSlipHtml(order, labels)).join("")}
</body>
</html>`;

/**
 * Opens a print window with one delivery slip per order.
 */
export const printDeliverySlips = (
  orders: OrderEntity[],
  labels: DeliverySlipLabels
): boolean => {
  if (orders.length === 0 || typeof window === "undefined") return false;

  const printWindow = window.open(
    "",
    "_blank",
    "noopener,noreferrer,width=900,height=1000"
  );
  if (!printWindow) return false;

  printWindow.document.open();
  printWindow.document.write(buildDocumentHtml(orders, labels));
  printWindow.document.close();

  const triggerPrint = () => {
    try {
      printWindow.focus();
      printWindow.print();
    } catch {
      // Ignore print abort / popup blockers mid-flow
    }
  };

  if (printWindow.document.readyState === "complete") {
    setTimeout(triggerPrint, 100);
  } else {
    printWindow.onload = () => setTimeout(triggerPrint, 100);
  }

  return true;
};
