import { chromium, expect } from "@playwright/test";
import { mkdir, writeFile } from "node:fs/promises";
import { resolve } from "node:path";

const baseURL = (
  process.env.CAPTURE_BASE_URL ?? "http://127.0.0.1:5173/"
).replace(/\/?$/, "/");
const root = resolve(process.env.CAPTURE_OUTPUT_DIR ?? "screenshots");
const manifest = {
  capturedAt: new Date().toISOString(),
  fictionalData: true,
  files: [],
};
const browser = await chromium.launch();

function localInput(value) {
  const date = new Date(value);
  const pad = (number) => String(number).padStart(2, "0");
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}T${pad(date.getHours())}:${pad(date.getMinutes())}`;
}

try {
  for (const device of [
    { name: "desktop", width: 1440, height: 1000 },
    { name: "mobile", width: 390, height: 844 },
  ]) {
    const context = await browser.newContext({
      viewport: { width: device.width, height: device.height },
      deviceScaleFactor: 2,
      isMobile: device.name === "mobile",
      hasTouch: device.name === "mobile",
      locale: "th-TH",
      timezoneId: "Asia/Bangkok",
    });
    const page = await context.newPage();
    const errors = [];
    page.on("pageerror", (error) => errors.push(error.message));
    const folder = resolve(root, device.name);
    const fullFolder = resolve(root, "full-page", device.name);
    await mkdir(folder, { recursive: true });
    await mkdir(fullFolder, { recursive: true });

    async function ready() {
      await page.evaluate(async () => {
        await document.fonts.ready;
        await Promise.all(
          [...document.images].map((image) => image.decode().catch(() => {})),
        );
      });
      await expect(page.locator(".demo-banner")).toHaveCount(0);
      expect(await page.evaluate(() => innerWidth)).toBe(device.width);
      expect(
        await page.evaluate(
          () => document.documentElement.scrollWidth <= innerWidth,
        ),
      ).toBe(true);
      expect(
        await page
          .locator("img")
          .evaluateAll((images) =>
            images.every((image) => image.complete && image.naturalWidth > 0),
          ),
      ).toBe(true);
    }
    async function capture(name, title, fullPage = false) {
      await ready();
      await page.screenshot({
        path: resolve(folder, `${name}.png`),
        animations: "disabled",
      });
      manifest.files.push({
        file: `${device.name}/${name}.png`,
        title,
        width: device.width * 2,
        height: device.height * 2,
      });
      if (fullPage) {
        await page.screenshot({
          path: resolve(fullFolder, `${name}.png`),
          fullPage: true,
          animations: "disabled",
        });
        manifest.files.push({
          file: `full-page/${device.name}/${name}.png`,
          title: `${title} (full page)`,
        });
      }
      console.log(`${device.name}: ${name}`);
    }
    async function route(name) {
      await page.goto(`${baseURL}?screenshot=1#/${name}`);
      await page.locator(".page-heading h1").waitFor();
      await page.evaluate(() => scrollTo(0, 0));
    }
    async function close() {
      await page
        .locator("dialog[open]")
        .last()
        .getByRole("button", { name: "ปิดหน้าต่าง", exact: true })
        .click();
    }
    async function login(role = "เจ้าของ") {
      await page.goto(`${baseURL}?screenshot=1#/login`);
      await page.getByRole("radio", { name: role, exact: true }).check();
      await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .click();
      await page.locator(".page-heading h1").waitFor();
    }
    async function logout() {
      if (device.name === "mobile")
        await page
          .getByRole("button", { name: "เปิดเมนู", exact: true })
          .click();
      await page
        .getByRole("button", { name: "ออกจากระบบ", exact: true })
        .click();
      await page
        .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
        .waitFor();
    }

    await page.goto(`${baseURL}?screenshot=1#/login`);
    await page
      .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
      .waitFor();
    await capture("01-login", "Login and role selection");
    await login();
    await capture("02-dashboard", "Owner sales and operations dashboard", true);
    await page.getByRole("button", { name: "สรุปยอดขาย", exact: true }).click();
    await capture(
      "02-sales-report",
      "Owner sales report using existing calculations",
      true,
    );

    await route("products");
    await capture("03-products", "Products and stock management", true);
    await page.getByLabel("สต็อกต่ำ", { exact: true }).check();
    await capture("04-low-stock", "Low stock alerts and filtering", true);
    await page.getByLabel("สต็อกต่ำ", { exact: true }).uncheck();
    await page
      .getByRole("button", { name: "เพิ่มสินค้า", exact: true })
      .click();
    await page.getByLabel("รหัสสินค้า", { exact: true }).fill("AC-041");
    await page
      .getByLabel("ชื่อสินค้า", { exact: true })
      .fill("แอร์ติดผนัง Inverter 12,000 BTU รุ่น G12");
    await page.getByLabel("ราคาขาย (บาท)", { exact: true }).fill("15900");
    await capture("05-product-form", "Validated add product form");
    await close();
    await page
      .getByRole("textbox", { name: "ค้นหาสินค้า", exact: true })
      .fill("AC-001");
    await page
      .getByRole("button", { name: "รับเข้า AC-001", exact: true })
      .click();
    await page.getByLabel("จำนวน (เครื่อง)", { exact: true }).fill("10");
    await page
      .getByLabel("เหตุผล / เลขที่อ้างอิง", { exact: true })
      .fill("รับสินค้าจากผู้จำหน่าย PO-0024");
    await capture("06-stock-in", "Stock receipt");
    await close();
    await page
      .getByRole("button", { name: "เบิกออก AC-001", exact: true })
      .click();
    await page
      .getByLabel("เหตุผล / เลขที่อ้างอิง", { exact: true })
      .fill("เบิกสำหรับงานติดตั้ง");
    await capture("07-stock-out", "Stock issue");
    await close();
    await page
      .getByRole("button", { name: "ประวัติ AC-001", exact: true })
      .click();
    await capture("08-stock-history", "Stock movement history");
    await close();

    await route("orders");
    await capture("09-orders", "Orders and status filters", true);
    await page
      .getByRole("combobox", { name: "สถานะคำสั่งซื้อ", exact: true })
      .selectOption("pending");
    await capture("10-orders-awaiting-payment", "Orders awaiting payment");
    await page.locator("tbody .text-link").first().click();
    await capture("11-order-detail", "Order detail and status timeline");
    await page
      .getByRole("button", { name: "ยกเลิกคำสั่งซื้อ", exact: true })
      .click();
    await capture(
      "12-cancel-confirmation",
      "Cancellation confirmation and stock restoration",
    );
    await close();
    await page
      .getByRole("button", { name: "ใบเสนอราคา PDF", exact: true })
      .click();
    await page.locator(".quotation-preview").first().waitFor();
    await capture(
      "13-quotation-preview",
      "Thai quotation preview and PDF download",
    );
    await mkdir(resolve(root, "documents"), { recursive: true });
    const preview = await page
      .locator(".quotation-preview")
      .first()
      .getAttribute("src");
    const documentName = `documents/quotation-a4-${device.name}.png`;
    await writeFile(
      resolve(root, documentName),
      Buffer.from(preview.split(",")[1], "base64"),
    );
    manifest.files.push({
      file: documentName,
      title: "Thai quotation A4",
      width: 1588,
      height: 2246,
    });
    await close();
    await close();
    await page
      .getByRole("button", { name: "สร้างคำสั่งซื้อ", exact: true })
      .click();
    await page.getByLabel("ลูกค้า", { exact: true }).selectOption("customer-1");
    await page
      .getByLabel("สินค้า 1", { exact: true })
      .selectOption("product-2");
    await capture("14-create-order", "Multi-product order creation");
    await close();

    await route("bookings");
    if (device.name === "mobile")
      await capture(
        "15-booking-agenda",
        "Today agenda with customer, technician and status",
      );
    await page.getByRole("button", { name: "สัปดาห์", exact: true }).click();
    await capture(
      "15-booking-week",
      "Weekly calendar with four technicians",
      true,
    );
    await page.getByRole("button", { name: "วัน", exact: true }).click();
    await capture("16-booking-day", "Daily technician calendar", true);
    await page.locator(".day-job").first().click();
    await capture("17-job-detail", "Technician job and customer contact");
    await page
      .getByRole("button", { name: "แก้ไขนัดหมาย", exact: true })
      .click();
    await capture(
      "18-reschedule-job",
      "Edit and reschedule technician booking",
    );
    await close();
    await page
      .getByRole("button", { name: "เพิ่มนัดหมาย", exact: true })
      .click();
    await page.getByLabel("ลูกค้า", { exact: true }).selectOption("customer-1");
    await page
      .getByLabel("หมายเหตุ", { exact: true })
      .fill("ติดตั้งแอร์ห้องนอนชั้น 2 โทรแจ้งก่อนถึง 30 นาที");
    await capture(
      "19-booking-form",
      "Create installation, cleaning or repair appointment",
    );
    const existing = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("yensabai-shop-v1"));
      return state.bookings.find(
        (job) =>
          job.technicianId === "tech-1" &&
          new Date(job.start).toDateString() === new Date().toDateString(),
      );
    });
    await page
      .getByLabel("ช่างผู้รับผิดชอบ", { exact: true })
      .selectOption("tech-1");
    await page
      .getByLabel("เริ่มงาน", { exact: true })
      .fill(localInput(existing.start));
    await page
      .getByLabel("สิ้นสุดงาน", { exact: true })
      .fill(localInput(existing.end));
    await page
      .getByRole("button", { name: "บันทึกนัดหมาย", exact: true })
      .click();
    await expect(page.getByRole("alert")).toContainText("ช่างมีงาน");
    await capture(
      "20-booking-conflict",
      "Double-booking protection and explanatory message",
    );
    await close();
    await expect(page.locator(".toast")).toHaveCount(0, { timeout: 10000 });

    await route("customers");
    await capture("21-customers", "Customer directory", true);
    const customerId = await page.evaluate(() => {
      const state = JSON.parse(localStorage.getItem("yensabai-shop-v1"));
      return state.customers.find(
        (customer) =>
          state.orders.some((order) => order.customerId === customer.id) &&
          state.bookings.some((job) => job.customerId === customer.id),
      ).id;
    });
    const customerName = await page.evaluate(
      (id) =>
        JSON.parse(localStorage.getItem("yensabai-shop-v1")).customers.find(
          (customer) => customer.id === id,
        ).name,
      customerId,
    );
    await page
      .getByRole("textbox", { name: "ค้นหาลูกค้า", exact: true })
      .fill(customerName);
    await page.locator(".customer-name").first().click();
    await page
      .getByRole("tab", { name: "ประวัติซื้อสินค้า", exact: true })
      .click();
    await capture(
      "22-customer-purchases",
      "Customer profile and purchase history",
    );
    await page
      .getByRole("tab", { name: "ประวัติงานบริการ", exact: true })
      .click();
    await capture("23-customer-services", "Customer service history");
    await page
      .getByRole("button", { name: "เพิ่มนัดหมาย", exact: true })
      .click();
    await capture(
      "23-customer-booking",
      "Booking from customer profile with customer preselected",
    );
    await close();
    await close();

    await logout();
    await login("แอดมิน");
    await expect(page.getByText("ยอดขายวันนี้", { exact: true })).toHaveCount(
      0,
    );
    await capture(
      "24-admin-dashboard",
      "Admin dashboard without sales totals",
      true,
    );
    await logout();
    await login("ช่าง");
    await expect(page.locator(".technician-heading")).toHaveCount(1);
    await expect(page.locator(".page")).not.toContainText("฿");
    await capture("25-technician-jobs", "Technician own jobs only", true);
    await page.getByRole("button", { name: "วัน", exact: true }).click();
    await page.locator(".day-job").first().click();
    await capture(
      "26-technician-job-detail",
      "Technician job status and customer contact without prices",
    );
    await close();
    if (device.name === "mobile") {
      await logout();
      await login();
      await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
      await capture(
        "27-mobile-navigation",
        "Owner mobile navigation with all shop modules",
      );
    }
    expect(errors).toEqual([]);
    await context.close();
  }
  await writeFile(
    resolve(root, "manifest.json"),
    JSON.stringify(manifest, null, 2) + "\n",
  );
  console.log(`Saved ${manifest.files.length} PNG files in ${root}`);
} finally {
  await browser.close();
}
