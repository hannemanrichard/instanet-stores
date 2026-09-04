import {
  buildPaymentSlipPdfBytes,
  getPaymentSlipFileName,
} from "../presentation/printPaymentSlip";
import type { PaymentEntity } from "../domain";

const samplePayment: PaymentEntity = {
  id: 501,
  code: "PMT-4K2M9A",
  store_id: 1,
  amount: 9900,
  is_paid: false,
  created_at: "2026-08-30T10:00:00.000Z",
  orders: [
    {
      order_id: 10410,
      amount: 4400,
      product: "Silk Hijab Set",
      product_qty: 2,
    },
    {
      order_id: 10411,
      amount: 5500,
      product: "Linen Abaya",
      product_qty: 1,
    },
  ],
};

describe("payment slip PDF", () => {
  it("names the downloaded file from the payment identifier", () => {
    expect(getPaymentSlipFileName("PMT-4K2M9A")).toBe(
      "payment-acknowledgement-PMT-4K2M9A.pdf"
    );
  });

  it("builds an English acknowledgement with amount, status and orders", () => {
    const pdf = Buffer.from(
      buildPaymentSlipPdfBytes(samplePayment, {
        storeName: "Demo Store",
        currency: "DA",
      })
    ).toString("latin1");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("PMT-4K2M9A");
    expect(pdf).not.toContain("Instanet");
    expect(pdf).not.toContain("parcel");
    expect(pdf).toContain("/Encoding /WinAnsiEncoding");
    expect(pdf).toContain("Demo Store");
    expect(pdf).toContain("PAYMENT ACKNOWLEDGEMENT");
    expect(pdf).toContain("Payment acknowledgement");
    expect(pdf).toContain("I, the undersigned");
    expect(pdf).toContain("acknowledge receipt of the sum of");
    expect(pdf).toContain("9,900 DZD.");
    expect(pdf).toContain("Silk Hijab Set");
    expect(pdf).toContain("Linen Abaya");
    expect(pdf).toContain("30/08/2026");
    expect(pdf.split("30/08/2026").length - 1).toBe(1);
  });

  it("always prints DZD even when a non-Latin currency label is provided", () => {
    const pdf = Buffer.from(
      buildPaymentSlipPdfBytes(samplePayment, {
        storeName: "Demo Store",
        currency: "دج",
      })
    ).toString("latin1");
    expect(pdf).toContain("9,900 DZD.");
    expect(pdf).not.toContain("??");
  });
});
