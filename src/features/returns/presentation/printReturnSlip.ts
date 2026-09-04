import { BRAND_PDF_LOGO_SRC } from "@/shared/lib/brand";
import { brand } from "@/design-system/tokens";
import type { ReturnEntity } from "../domain";
import { getReturnItemCount, getReturnItems } from "../domain";
import { QR_MODULE_COUNT, buildQrModules } from "./qrCode";

export type ReturnSlipLogo = {
  width: number;
  height: number;
  rgb: Uint8Array;
};

export type ReturnSlipOptions = {
  storeName: string;
  logo?: ReturnSlipLogo | null;
};

const PAGE_WIDTH = 595.28;
const PAGE_HEIGHT = 841.89;
const MARGIN = 48;

type PdfRgb = { r: number; g: number; b: number };

const hexToRgb = (hex: string): PdfRgb => {
  const value = hex.replace("#", "");
  return {
    r: Number.parseInt(value.slice(0, 2), 16) / 255,
    g: Number.parseInt(value.slice(2, 4), 16) / 255,
    b: Number.parseInt(value.slice(4, 6), 16) / 255,
  };
};

const PRIMARY = hexToRgb(brand.primaryHex);
const INK = { r: 0.1, g: 0.11, b: 0.1 };
const MUTED = { r: 0.42, g: 0.42, b: 0.42 };
const RULE = { r: 0.86, g: 0.87, b: 0.86 };
const SURFACE = { r: 0.97, g: 0.98, b: 0.97 };
const ACCENT = hexToRgb(brand.accentHex);
const WHITE = { r: 1, g: 1, b: 1 };
const BLACK = INK;

const formatSlipDate = (value?: string) => {
  const date = value ? new Date(value) : new Date();
  const day = String(date.getDate()).padStart(2, "0");
  const month = String(date.getMonth() + 1).padStart(2, "0");
  return `${day}/${month}/${date.getFullYear()}`;
};

export const getReturnSlipFileName = (code: string) =>
  `return-acknowledgement-${code}.pdf`;

const escapePdfString = (value: string) => {
  let output = "";
  for (const char of value) {
    if (char === "\\" || char === "(" || char === ")") {
      output += `\\${char}`;
      continue;
    }
    const code = char.charCodeAt(0);
    if (code >= 32 && code <= 126) {
      output += char;
      continue;
    }
    if (code <= 255) {
      output += `\\${code.toString(8).padStart(3, "0")}`;
      continue;
    }
    output += "?";
  }
  return output;
};

const pdfColor = (color: PdfRgb) =>
  `${color.r.toFixed(3)} ${color.g.toFixed(3)} ${color.b.toFixed(3)}`;

const estimateWidth = (value: string, fontSize: number) =>
  value.length * fontSize * 0.5;

const fitText = (value: string, maxWidth: number, fontSize: number) => {
  if (estimateWidth(value, fontSize) <= maxWidth) return value;
  let output = value;
  while (output.length > 1 && estimateWidth(`${output}...`, fontSize) > maxWidth) {
    output = output.slice(0, -1);
  }
  return `${output}...`;
};

const rgbToHex = (rgb: Uint8Array) => {
  let hex = "";
  for (const byte of rgb) {
    hex += byte.toString(16).padStart(2, "0");
  }
  return `${hex}>`;
};

class SimplePdf {
  private pages: string[][] = [[]];
  private images: Array<{
    name: string;
    width: number;
    height: number;
    hex: string;
  }> = [];

  private get ops() {
    return this.pages[this.pages.length - 1];
  }

  fillRect = (x: number, yTop: number, width: number, height: number, color: PdfRgb) => {
    const y = PAGE_HEIGHT - yTop - height;
    this.ops.push(`${pdfColor(color)} rg`);
    this.ops.push(
      `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re f`
    );
  };

  strokeRect = (
    x: number,
    yTop: number,
    width: number,
    height: number,
    color: PdfRgb,
    lineWidth = 0.6
  ) => {
    const y = PAGE_HEIGHT - yTop - height;
    this.ops.push(`${pdfColor(color)} RG`);
    this.ops.push(`${lineWidth.toFixed(2)} w`);
    this.ops.push(
      `${x.toFixed(2)} ${y.toFixed(2)} ${width.toFixed(2)} ${height.toFixed(2)} re S`
    );
  };

  line = (
    x1: number,
    y1Top: number,
    x2: number,
    y2Top: number,
    color: PdfRgb,
    lineWidth = 0.6
  ) => {
    this.ops.push(`${pdfColor(color)} RG`);
    this.ops.push(`${lineWidth.toFixed(2)} w`);
    this.ops.push(
      `${x1.toFixed(2)} ${(PAGE_HEIGHT - y1Top).toFixed(2)} m ${x2.toFixed(2)} ${(PAGE_HEIGHT - y2Top).toFixed(2)} l S`
    );
  };

  text = (
    value: string,
    x: number,
    yTop: number,
    options?: {
      size?: number;
      bold?: boolean;
      color?: PdfRgb;
      align?: "left" | "center" | "right";
    }
  ) => {
    const size = options?.size ?? 11;
    const color = options?.color ?? BLACK;
    const font = options?.bold ? "F2" : "F1";
    const y = PAGE_HEIGHT - yTop;
    let drawX = x;
    if (options?.align === "right") drawX = x - estimateWidth(value, size);
    if (options?.align === "center") drawX = x - estimateWidth(value, size) / 2;
    this.ops.push("BT");
    this.ops.push(`${pdfColor(color)} rg`);
    this.ops.push(`/${font} ${size} Tf`);
    this.ops.push(`1 0 0 1 ${drawX.toFixed(2)} ${y.toFixed(2)} Tm`);
    this.ops.push(`(${escapePdfString(value)}) Tj`);
    this.ops.push("ET");
  };

  addImage = (image: ReturnSlipLogo) => {
    const name = `Im${this.images.length + 1}`;
    this.images.push({
      name,
      width: image.width,
      height: image.height,
      hex: rgbToHex(image.rgb),
    });
    return name;
  };

  drawImage = (
    name: string,
    x: number,
    yTop: number,
    width: number,
    height: number
  ) => {
    const y = PAGE_HEIGHT - yTop - height;
    this.ops.push(
      `q ${width.toFixed(2)} 0 0 ${height.toFixed(2)} ${x.toFixed(2)} ${y.toFixed(2)} cm /${name} Do Q`
    );
  };

  build = (): Uint8Array => {
    const objects: string[] = [];
    const addObject = (body: string) => {
      objects.push(body);
      return objects.length;
    };

    const fontRegular = addObject(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica /Encoding /WinAnsiEncoding >>"
    );
    const fontBold = addObject(
      "<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica-Bold /Encoding /WinAnsiEncoding >>"
    );
    const imageIds = this.images.map((image) =>
      addObject(
        `<< /Type /XObject /Subtype /Image /Width ${image.width} /Height ${image.height} /ColorSpace /DeviceRGB /BitsPerComponent 8 /Filter /ASCIIHexDecode /Length ${image.hex.length} /Name /${image.name} >>\nstream\n${image.hex}\nendstream`
      )
    );
    const xObject =
      this.images.length > 0
        ? `/XObject << ${this.images
            .map((image, index) => `/${image.name} ${imageIds[index]} 0 R`)
            .join(" ")} >>`
        : "";

    const contentIds = this.pages.map((ops) => {
      const stream = ops.join("\n");
      return addObject(
        `<< /Length ${stream.length} >>\nstream\n${stream}\nendstream`
      );
    });

    const pageIds = contentIds.map((contentId) =>
      addObject(
        `<< /Type /Page /Parent 0 0 R /MediaBox [0 0 ${PAGE_WIDTH} ${PAGE_HEIGHT}] /Resources << /Font << /F1 ${fontRegular} 0 R /F2 ${fontBold} 0 R >> ${xObject} >> /Contents ${contentId} 0 R >>`
      )
    );

    const pagesId = addObject(
      `<< /Type /Pages /Kids [${pageIds.map((id) => `${id} 0 R`).join(" ")}] /Count ${pageIds.length} >>`
    );

    const patchedPages = objects.map((body) =>
      body.includes("/Parent 0 0 R")
        ? body.replace("/Parent 0 0 R", `/Parent ${pagesId} 0 R`)
        : body
    );

    const catalogId = patchedPages.length + 1;
    const allObjects = [
      ...patchedPages,
      `<< /Type /Catalog /Pages ${pagesId} 0 R >>`,
    ];

    let offset = 0;
    const header = "%PDF-1.4\n";
    const chunks = [header];
    offset += header.length;
    const xref = [0];
    allObjects.forEach((body, index) => {
      xref.push(offset);
      const obj = `${index + 1} 0 obj\n${body}\nendobj\n`;
      chunks.push(obj);
      offset += obj.length;
    });
    const xrefStart = offset;
    chunks.push(`xref\n0 ${allObjects.length + 1}\n`);
    chunks.push("0000000000 65535 f \n");
    xref.slice(1).forEach((value) => {
      chunks.push(`${String(value).padStart(10, "0")} 00000 n \n`);
    });
    chunks.push(
      `trailer\n<< /Size ${allObjects.length + 1} /Root ${catalogId} 0 R >>\nstartxref\n${xrefStart}\n%%EOF`
    );

    const pdf = chunks.join("");
    const bytes = new Uint8Array(pdf.length);
    for (let index = 0; index < pdf.length; index += 1) {
      bytes[index] = pdf.charCodeAt(index) & 0xff;
    }
    return bytes;
  };
}

const drawQrCode = (pdf: SimplePdf, value: string, x: number, yTop: number, size: number) => {
  const modules = buildQrModules(value);
  const quiet = 2;
  const moduleSize = size / (QR_MODULE_COUNT + quiet * 2);
  pdf.fillRect(x, yTop, size, size, WHITE);
  pdf.strokeRect(x, yTop, size, size, RULE, 0.5);
  for (let row = 0; row < QR_MODULE_COUNT; row += 1) {
    for (let col = 0; col < QR_MODULE_COUNT; col += 1) {
      if (!modules[row][col]) continue;
      pdf.fillRect(
        x + (col + quiet) * moduleSize,
        yTop + (row + quiet) * moduleSize,
        moduleSize,
        moduleSize,
        INK
      );
    }
  }
};

const HELVETICA_CAP_HEIGHT = 0.72;
const LOGO_HEIGHT = 40;

const drawFallbackLogo = (pdf: SimplePdf, x: number, yTop: number, size: number) => {
  pdf.fillRect(x, yTop, size, size, PRIMARY);
  const letterSize = 22;
  pdf.text("I", x + size / 2, yTop + size / 2 + (letterSize * HELVETICA_CAP_HEIGHT) / 2, {
    size: letterSize,
    bold: true,
    color: WHITE,
    align: "center",
  });
};

const drawLogo = (
  pdf: SimplePdf,
  x: number,
  yTop: number,
  logo?: ReturnSlipLogo | null
) => {
  if (!logo) {
    drawFallbackLogo(pdf, x, yTop, LOGO_HEIGHT);
    return;
  }

  const width = LOGO_HEIGHT * (logo.width / logo.height);
  pdf.fillRect(x, yTop, width, LOGO_HEIGHT, WHITE);
  const imageName = pdf.addImage(logo);
  pdf.drawImage(imageName, x, yTop, width, LOGO_HEIGHT);
};

export const buildReturnSlipPdfBytes = (
  item: ReturnEntity,
  options: ReturnSlipOptions
): Uint8Array => {
  const pdf = new SimplePdf();
  const tracking = item.code;
  const lines = getReturnItems(item);
  const itemCount = getReturnItemCount(item);
  const date = formatSlipDate(item.created_at);
  const storeName = options.storeName || "-";
  const contentWidth = PAGE_WIDTH - MARGIN * 2;
  const qrSize = 72;
  const headerY = 28;
  const lockupY = headerY + (qrSize - LOGO_HEIGHT) / 2;

  pdf.fillRect(0, 0, PAGE_WIDTH, 5, PRIMARY);
  drawLogo(pdf, MARGIN, lockupY, options.logo);

  const qrX = PAGE_WIDTH - MARGIN - qrSize;
  drawQrCode(pdf, tracking, qrX, headerY, qrSize);
  pdf.text(tracking, qrX + qrSize / 2, headerY + qrSize + 14, {
    size: 9,
    bold: true,
    align: "center",
    color: INK,
  });

  const headerBottom = headerY + qrSize + 26;
  pdf.line(MARGIN, headerBottom, PAGE_WIDTH - MARGIN, headerBottom, PRIMARY, 1.2);

  pdf.text("RETURN ACKNOWLEDGEMENT", PAGE_WIDTH / 2, headerBottom + 28, {
    size: 9,
    bold: true,
    align: "center",
    color: MUTED,
  });
  pdf.text(storeName, PAGE_WIDTH / 2, headerBottom + 52, {
    size: 18,
    bold: true,
    align: "center",
    color: INK,
  });
  const storeUnderlineWidth = Math.min(160, estimateWidth(storeName, 18));
  pdf.line(
    (PAGE_WIDTH - storeUnderlineWidth) / 2,
    headerBottom + 58,
    (PAGE_WIDTH + storeUnderlineWidth) / 2,
    headerBottom + 58,
    PRIMARY,
    1.4
  );

  const declarationStart = headerBottom + 88;
  const itemWord = itemCount === 1 ? "item" : "items";
  const nameLabel = "I the undersigned";
  pdf.text(nameLabel, MARGIN, declarationStart, { size: 12 });
  pdf.line(
    MARGIN + estimateWidth(nameLabel, 12) + 10,
    declarationStart + 2,
    PAGE_WIDTH - MARGIN,
    declarationStart + 2,
    RULE,
    0.8
  );
  const receiptPrefix = "hereby declare receipt, as a return, of a total of";
  pdf.text(receiptPrefix, MARGIN, declarationStart + 26, { size: 12 });
  pdf.text(`${itemCount} ${itemWord}.`, MARGIN + estimateWidth(receiptPrefix, 12) + 6, declarationStart + 26, {
    size: 12,
    bold: true,
    color: PRIMARY,
  });

  const productCol = MARGIN + 12;
  const colorCol = MARGIN + 230;
  const sizeCol = MARGIN + 350;
  const qtyCol = PAGE_WIDTH - MARGIN - 12;
  const productWidth = 200;
  const headerH = 24;
  const rowH = 22;
  const tableTop = declarationStart + 54;
  const tableHeight = headerH + Math.max(lines.length, 1) * rowH;

  pdf.fillRect(MARGIN, tableTop, contentWidth, headerH, ACCENT);
  if (lines.length === 0) {
    pdf.fillRect(MARGIN, tableTop + headerH, contentWidth, rowH, WHITE);
  }
  lines.forEach((_, index) => {
    if (index % 2 === 1) {
      pdf.fillRect(MARGIN, tableTop + headerH + index * rowH, contentWidth, rowH, SURFACE);
    }
  });
  pdf.strokeRect(MARGIN, tableTop, contentWidth, tableHeight, RULE, 0.6);
  pdf.line(MARGIN, tableTop + headerH, PAGE_WIDTH - MARGIN, tableTop + headerH, RULE, 0.6);

  const headerBaseline = tableTop + 16;
  pdf.text("Product", productCol, headerBaseline, { size: 8, bold: true, color: MUTED });
  pdf.text("Color", colorCol, headerBaseline, { size: 8, bold: true, color: MUTED });
  pdf.text("Size", sizeCol, headerBaseline, { size: 8, bold: true, color: MUTED });
  pdf.text("Qty", qtyCol, headerBaseline, {
    size: 8,
    bold: true,
    color: MUTED,
    align: "right",
  });

  if (lines.length === 0) {
    pdf.text("No items", PAGE_WIDTH / 2, tableTop + headerH + 15, {
      size: 10,
      align: "center",
      color: MUTED,
    });
  }

  lines.forEach((line, index) => {
    const y = tableTop + headerH + index * rowH + 15;
    pdf.text(fitText(line.product || "-", productWidth, 10), productCol, y, { size: 10 });
    pdf.text(fitText(line.color || "-", 110, 10), colorCol, y, { size: 10 });
    pdf.text(fitText(line.size || "-", 80, 10), sizeCol, y, { size: 10 });
    pdf.text(String(line.qty), qtyCol, y, { size: 10, bold: true, align: "right" });
  });

  const blockH = 64;
  const blockGap = 16;
  const blockW = (contentWidth - blockGap) / 2;
  const dateBlockX = MARGIN;
  const signBlockX = MARGIN + blockW + blockGap;
  const footerTop = PAGE_HEIGHT - 44;
  const blockY = Math.min(tableTop + tableHeight + 32, footerTop - blockH);

  pdf.strokeRect(dateBlockX, blockY, blockW, blockH, RULE, 0.6);
  pdf.strokeRect(signBlockX, blockY, blockW, blockH, RULE, 0.6);
  pdf.text("Date", dateBlockX + 14, blockY + 20, { size: 8, bold: true, color: MUTED });
  pdf.text(date, dateBlockX + 14, blockY + 42, { size: 13, bold: true });
  pdf.text("Signature", signBlockX + 14, blockY + 20, { size: 8, bold: true, color: MUTED });
  pdf.line(signBlockX + 14, blockY + 46, signBlockX + blockW - 14, blockY + 46, INK, 0.8);

  pdf.line(MARGIN, PAGE_HEIGHT - 32, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 32, RULE, 0.5);
  pdf.text("Return acknowledgement", MARGIN, PAGE_HEIGHT - 18, {
    size: 8,
    color: MUTED,
  });
  pdf.text(tracking, PAGE_WIDTH - MARGIN, PAGE_HEIGHT - 18, {
    size: 8,
    color: MUTED,
    align: "right",
  });

  return pdf.build();
};

const loadLogo = async (): Promise<ReturnSlipLogo | null> => {
  if (typeof window === "undefined" || typeof document === "undefined") {
    return null;
  }

  try {
    const image = document.createElement("img");
    image.crossOrigin = "anonymous";
    image.src = `${window.location.origin}${BRAND_PDF_LOGO_SRC}`;
    await image.decode();
    const naturalWidth = image.naturalWidth || 551;
    const naturalHeight = image.naturalHeight || 158;
    const height = 160;
    const width = Math.max(1, Math.round((naturalWidth / naturalHeight) * height));
    const canvas = document.createElement("canvas");
    canvas.width = width;
    canvas.height = height;
    const context = canvas.getContext("2d");
    if (!context) return null;
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    const pixels = context.getImageData(0, 0, width, height).data;
    const rgb = new Uint8Array(width * height * 3);
    for (let i = 0, j = 0; i < pixels.length; i += 4, j += 3) {
      const alpha = pixels[i + 3] / 255;
      rgb[j] = Math.round(pixels[i] * alpha + 255 * (1 - alpha));
      rgb[j + 1] = Math.round(pixels[i + 1] * alpha + 255 * (1 - alpha));
      rgb[j + 2] = Math.round(pixels[i + 2] * alpha + 255 * (1 - alpha));
    }
    return { width, height, rgb };
  } catch {
    return null;
  }
};

const triggerDownload = (bytes: Uint8Array, fileName: string) => {
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = fileName;
  link.rel = "noopener";
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1000);
};

export const downloadReturnSlip = async (
  item: ReturnEntity,
  options: ReturnSlipOptions
): Promise<boolean> => {
  if (typeof window === "undefined") return false;

  try {
    const logo = options.logo ?? (await loadLogo());
    const bytes = buildReturnSlipPdfBytes(item, {
      storeName: options.storeName,
      logo,
    });
    triggerDownload(bytes, getReturnSlipFileName(item.code));
    return true;
  } catch {
    return false;
  }
};
