import type { Customer, Order } from "../domain/types";
import { orderLabels, orderTotal } from "../domain/types";
import { dateText } from "./format";
import { addDays } from "date-fns";

export function wrapThaiText(
  text: string,
  width: number,
  measure: (text: string) => number,
) {
  const words = new Intl.Segmenter("th", { granularity: "word" }).segment(text),
    lines: string[] = [];
  let line = "";
  for (const { segment } of words) {
    if (measure(line + segment) <= width) {
      line += segment;
      continue;
    }
    if (line.trim()) lines.push(line.trim());
    line = "";
    for (const { segment: character } of new Intl.Segmenter("th", {
      granularity: "grapheme",
    }).segment(segment)) {
      if (line && measure(line + character) > width) {
        lines.push(line.trim());
        line = "";
      }
      line += character;
    }
  }
  if (line.trim()) lines.push(line.trim());
  return lines.length ? lines : [""];
}
export async function prepareQuotation(order: Order, customer: Customer) {
  await Promise.all([
    document.fonts.load('400 16px "IBM Plex Sans Thai"'),
    document.fonts.load('600 16px "IBM Plex Sans Thai"'),
  ]);
  if (!document.fonts.check('400 16px "IBM Plex Sans Thai"'))
    throw new Error("โหลดฟอนต์ไทยไม่สำเร็จ กรุณาลองอีกครั้ง");
  const { jsPDF } = await import("jspdf"),
    pdf = new jsPDF({ unit: "mm", format: "a4", compress: true });
  const pages: HTMLCanvasElement[] = [],
    now = new Date();
  let context: CanvasRenderingContext2D,
    y = 310;
  const currency = (amount: number) =>
    amount.toLocaleString("th-TH", {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    });
  function text(
    value: string,
    x: number,
    top: number,
    size = 13,
    color = "#50665d",
    bold = false,
    align: CanvasTextAlign = "left",
  ) {
    context.font = `${bold ? 600 : 400} ${size}px "IBM Plex Sans Thai"`;
    context.fillStyle = color;
    context.textAlign = align;
    context.fillText(value, x, top);
  }
  function line(top: number, color = "#e1e9e4") {
    context.strokeStyle = color;
    context.lineWidth = 1;
    context.beginPath();
    context.moveTo(52, top);
    context.lineTo(742, top);
    context.stroke();
  }
  function newPage() {
    const canvas = document.createElement("canvas");
    canvas.width = 1588;
    canvas.height = 2246;
    context = canvas.getContext("2d")!;
    context.scale(2, 2);
    context.textBaseline = "top";
    context.fillStyle = "#ffffff";
    context.fillRect(0, 0, 794, 1123);
    pages.push(canvas);
    context.fillStyle = "#087f6b";
    context.fillRect(52, 52, 7, 51);
    text("ร้านเย็นสบาย", 74, 49, 26, "#174c3e", true);
    text("แอร์แอนด์เซอร์วิส", 74, 81, 15);
    text("สาขาบางนา · กรุงเทพมหานคร", 52, 120, 12);
    text("โทร. 02-999-0001 · demo@yensabai.shop", 52, 143, 11);
    text("ใบเสนอราคา", 742, 52, 27, "#087f6b", true, "right");
    text(`QT-${order.id}`, 742, 89, 13, "#6b8377", false, "right");
    text(`วันที่ ${dateText(now)}`, 742, 120, 12, "#6b8377", false, "right");
    text(
      `ยืนยันราคาถึง ${dateText(addDays(now, 15))}`,
      742,
      143,
      11,
      "#6b8377",
      false,
      "right",
    );
    line(176);
    text("เสนอถึง", 52, 195, 11, "#8b9f93");
    text(customer.name, 52, 218, 17, "#355e49", true);
    text(`โทร. ${customer.phone}`, 52, 246, 12);
    context.font = '400 12px "IBM Plex Sans Thai"';
    wrapThaiText(
      customer.address,
      455,
      (value) => context.measureText(value).width,
    )
      .slice(0, 2)
      .forEach((value, index) => text(value, 52, 270 + index * 18, 12));
    text(`อ้างอิง ${order.id}`, 742, 220, 11, "#8b9f93", false, "right");
    text(orderLabels[order.status], 742, 246, 11, "#8b9f93", false, "right");
    context.fillStyle = "#edf5f0";
    context.fillRect(52, 316, 690, 38);
    text("รายการสินค้า", 65, 328, 12, "#46715a", true);
    text("จำนวน", 525, 328, 12, "#46715a", true, "right");
    text("ราคา / หน่วย", 628, 328, 12, "#46715a", true, "right");
    text("รวม (บาท)", 730, 328, 12, "#46715a", true, "right");
    y = 367;
  }
  newPage();
  order.items.forEach((item, index) => {
    context.font = '400 13px "IBM Plex Sans Thai"';
    const lines = wrapThaiText(
        `${index + 1}. ${item.name}`,
        415,
        (value) => context.measureText(value).width,
      ),
      height = Math.max(45, lines.length * 22 + 18);
    if (y + height > 875) newPage();
    lines.forEach((value, offset) => text(value, 65, y + offset * 22));
    text(String(item.quantity), 525, y, 13, "#50665d", false, "right");
    text(currency(item.unitPrice), 628, y, 12, "#50665d", false, "right");
    text(
      currency(item.quantity * item.unitPrice),
      730,
      y,
      12,
      "#355e49",
      true,
      "right",
    );
    y += height;
    line(y - 10);
  });
  if (y > 840) newPage();
  y += 15;
  text("ยอดรวมสุทธิ (บาท)", 495, y + 6, 14, "#4c715e", true);
  text(currency(orderTotal(order)), 730, y, 23, "#087f6b", true, "right");
  y += 60;
  text("ราคาตามรายการ ไม่แยกภาษีมูลค่าเพิ่ม", 52, y, 11, "#869e90");
  text(
    "เงื่อนไข: ยืนยันรุ่น จำนวน และวันติดตั้งกับร้านก่อนสั่งซื้อ",
    52,
    y + 23,
    11,
    "#869e90",
  );
  const signatureY = Math.max(960, y + 80);
  line(signatureY);
  text(
    "ผู้เสนอราคา / ร้านเย็นสบาย",
    150,
    signatureY + 18,
    11,
    "#869e90",
    false,
    "center",
  );
  text(
    "ผู้ยืนยันใบเสนอราคา",
    622,
    signatureY + 18,
    11,
    "#869e90",
    false,
    "center",
  );
  const previews = pages.map((canvas, index) => {
    context = canvas.getContext("2d")!;
    text(
      "เอกสารตัวอย่าง · ข้อมูลทั้งหมดเป็นข้อมูลสมมติ · ไม่ใช่เอกสารทางภาษี",
      52,
      1071,
      10,
      "#9aaca1",
    );
    text(
      `หน้า ${index + 1} / ${pages.length}`,
      742,
      1071,
      10,
      "#9aaca1",
      false,
      "right",
    );
    const preview = canvas.toDataURL("image/png");
    if (index) pdf.addPage();
    pdf.addImage(preview, "PNG", 0, 0, 210, 297);
    return preview;
  });
  pdf.setProperties({
    title: `Quotation ${order.id}`,
    subject: "Fictional Yensabai demo quotation",
    author: "Yensabai Demo",
  });
  return { blob: pdf.output("blob"), previews };
}
