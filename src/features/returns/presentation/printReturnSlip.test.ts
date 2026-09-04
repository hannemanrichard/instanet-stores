import {
  buildReturnSlipPdfBytes,
  getReturnSlipFileName,
} from "../presentation/printReturnSlip";
import { buildQrModules, QR_MODULE_COUNT } from "../presentation/qrCode";
import type { ReturnEntity } from "../domain";

const sampleReturn: ReturnEntity = {
  id: 801,
  code: "RET-4XEE9K",
  store_id: 1,
  status: "processed",
  created_at: "2026-08-30T10:00:00.000Z",
  modified_at: "2026-08-30T10:00:00.000Z",
  order_ids: [10432, 10433],
  orders: [
    {
      id: 10432,
      product: "Linen Abaya",
      product_qty: 1,
      tracking_id: "YL-884204",
    },
    {
      id: 10433,
      product: "Silk Hijab Set",
      product_qty: 2,
      tracking_id: "YL-884205",
    },
  ],
  items: [
    {
      order_id: 10432,
      item_id: 201,
      product: "Linen Abaya",
      color: "Sand",
      size: "M",
      qty: 1,
    },
    {
      order_id: 10433,
      item_id: 103,
      product: "Silk Hijab Set",
      color: "Rose",
      size: "One Size",
      qty: 2,
    },
  ],
};

describe("return slip PDF", () => {
  it("names the downloaded file from the return tracking", () => {
    expect(getReturnSlipFileName("RET-4XEE9K")).toBe(
      "return-acknowledgement-RET-4XEE9K.pdf"
    );
  });

  it("builds an English acknowledgement with items, colors, sizes and quantities", () => {
    const pdf = Buffer.from(
      buildReturnSlipPdfBytes(sampleReturn, { storeName: "Demo Store" })
    ).toString("latin1");
    expect(pdf.startsWith("%PDF-1.4")).toBe(true);
    expect(pdf).toContain("RET-4XEE9K");
    expect(pdf).not.toContain("Instanet");
    expect(pdf).not.toContain("Tracking");
    expect(pdf).not.toContain("parcel");
    expect(pdf).toContain("/Encoding /WinAnsiEncoding");
    expect(pdf).toContain("Demo Store");
    expect(pdf).toContain("Return acknowledgement");
    expect(pdf).toContain("I the undersigned");
    expect(pdf).toContain("3 items");
    expect(pdf).toContain("Linen Abaya");
    expect(pdf).toContain("Sand");
    expect(pdf).toContain("Silk Hijab Set");
    expect(pdf).toContain("Rose");
    expect(pdf).toContain("One Size");
    expect(pdf).toContain("30/08/2026");
    expect(pdf.split("30/08/2026").length - 1).toBe(1);
  });
});

describe("buildQrModules", () => {
  it("builds a version-1 matrix with finder patterns", () => {
    const modules = buildQrModules("RET-4XEE9K");
    expect(modules).toHaveLength(QR_MODULE_COUNT);
    expect(modules[0]).toHaveLength(QR_MODULE_COUNT);
    expect(modules[0][0]).toBe(true);
    expect(modules[0][QR_MODULE_COUNT - 1]).toBe(true);
    expect(modules[QR_MODULE_COUNT - 1][0]).toBe(true);
  });
});
