test("skeleton, status/date filtering, owner reset confirmation and corrupt storage recovery", async ({
  page,
}, info) => {
  await login(page);
  await page.clock.install();
  await page.goto("./#/products");
  await page.clock.pauseAt(new Date(Date.now() + 1000));
  await page.reload();
  await expect(page.locator(".skeleton-view")).toBeVisible();
  await page.screenshot({ path: info.outputPath("skeleton.png") });
  await page.clock.runFor(500);
  await page.locator(".page-heading h1").waitFor();
  await page.clock.resume();
  await page.goto("./#/orders");
  await page
    .getByRole("combobox", { name: "สถานะคำสั่งซื้อ", exact: true })
    .selectOption("pending");
  const date = format(new Date(), "yyyy-MM-dd");
  await page.getByLabel("วันที่เริ่มต้น", { exact: true }).fill(date);
  await page.getByLabel("วันที่สิ้นสุด", { exact: true }).fill(date);
  await expect(page.locator("tbody tr").first()).toBeVisible();
  for (const status of await page.locator("tbody .badge").allTextContents())
    expect(status).toBe("รอชำระ");
  await page.goto("./#/dashboard");
  await page
    .getByRole("button", { name: "รีเซ็ตข้อมูลตัวอย่าง", exact: true })
    .click();
  await page.getByRole("button", { name: "กลับ", exact: true }).click();
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page
    .getByRole("button", { name: "รีเซ็ตข้อมูลตัวอย่าง", exact: true })
    .click();
  await page.getByRole("button", { name: "ยืนยันรีเซ็ต", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("รีเซ็ต");
  expect((await snapshot(page)).orders).toHaveLength(150);
  await page.evaluate(() =>
    localStorage.setItem("yensabai-shop-v1", "{broken"),
  );
  await page.reload();
  await expect(
    page.getByRole("heading", { name: "โหลดข้อมูลไม่สำเร็จ", exact: true }),
  ).toBeVisible();
  await page.getByRole("button", { name: "รีเซ็ตข้อมูล", exact: true }).click();
  await page.getByRole("button", { name: "ยืนยันรีเซ็ต", exact: true }).click();
  await page.locator(".page-heading h1").waitFor();
  expect((await snapshot(page)).products).toHaveLength(40);
});
import { test, expect, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";
import ExcelJS from "exceljs";
import { addDays, format } from "date-fns";
import type { ShopState } from "../src/domain/types";

async function login(page: Page, role = "เจ้าของ") {
  await page.goto("./#/login");
  await page.getByRole("radio", { name: role, exact: true }).check();
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.locator(".page-heading h1").waitFor();
}
const snapshot = (page: Page): Promise<ShopState> =>
  page.evaluate(() => JSON.parse(localStorage.getItem("yensabai-shop-v1")!));
async function noOverflow(page: Page) {
  expect(
    await page.evaluate(
      () => document.documentElement.scrollWidth <= innerWidth,
    ),
  ).toBe(true);
}
async function closeDialog(page: Page) {
  await page
    .locator("dialog[open]")
    .last()
    .getByRole("button", { name: "ปิดหน้าต่าง", exact: true })
    .click();
}
async function logout(page: Page) {
  if (
    await page
      .getByRole("button", { name: "เปิดเมนู", exact: true })
      .isVisible()
  )
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
  await page.getByRole("button", { name: "ออกจากระบบ", exact: true }).click();
  await page
    .getByRole("button", { name: "เข้าสู่ระบบ", exact: true })
    .waitFor();
}

test("login and every page at the exact viewport, with screenshots and empty states", async ({
  page,
}, info) => {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(error.message));
  await page.goto("./#/login");
  await page.evaluate(() => document.fonts.ready);
  expect(await page.evaluate(() => innerWidth)).toBe(
    info.project.name === "mobile" ? 390 : 1440,
  );
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("login.png"), fullPage: true });
  await page
    .getByRole("textbox", { name: "อีเมล", exact: true })
    .fill("wrong@example.com");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("demo@yensabai.shop");
  await page
    .getByRole("textbox", { name: "อีเมล", exact: true })
    .fill("demo@yensabai.shop");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.locator(".page-heading h1").waitFor();
  for (const route of [
    "dashboard",
    "products",
    "orders",
    "bookings",
    "customers",
  ]) {
    await page.goto(`./#/${route}`);
    await page.locator(".page-heading h1").waitFor();
    await page.evaluate(() => document.fonts.ready);
    await noOverflow(page);
    expect(await page.evaluate(() => innerWidth)).toBe(
      info.project.name === "mobile" ? 390 : 1440,
    );
    expect(
      await page
        .locator("img")
        .evaluateAll((images) =>
          images.every((image) => image.complete && image.naturalWidth > 0),
        ),
    ).toBe(true);
    await page.screenshot({
      path: info.outputPath(`${route}.png`),
      fullPage: true,
    });
    if (route === "products" || route === "orders" || route === "customers") {
      if (info.project.name === "mobile")
        expect(
          await page
            .locator("tbody tr")
            .first()
            .evaluate((element) => getComputedStyle(element).display),
        ).toBe("grid");
      await page.locator(".search-input input").fill("NO-MATCH-123456");
      await expect(page.locator(".empty-state")).toBeVisible();
      await page
        .getByRole("button", { name: "ล้างตัวกรอง", exact: true })
        .click();
      await expect(page.locator("tbody tr").first()).toBeVisible();
    }
    if (route === "bookings") {
      await expect(page.locator(".technician-heading")).toHaveCount(4);
      await page.getByRole("button", { name: "วัน", exact: true }).click();
      await expect(page.locator(".day-technician")).toHaveCount(4);
      await page.screenshot({
        path: info.outputPath("booking-day.png"),
        fullPage: true,
      });
      await page
        .getByRole("textbox", { name: "เลือกวันในตาราง", exact: true })
        .fill("2099-01-01");
      await expect(
        page.getByRole("heading", { name: "ไม่มีงานในช่วงนี้" }),
      ).toBeVisible();
    }
  }
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
    await expect(page.locator(".sidebar")).toHaveClass(/open/);
    await page.getByRole("link", { name: "คำสั่งซื้อ", exact: true }).click();
    await expect(page.locator(".sidebar")).not.toHaveClass(/open/);
  }
  expect(errors).toEqual([]);
});

test("product form, stock rules, order creation, status flow, cancellation and persistence", async ({
  page,
}, info) => {
  await login(page);
  await page.goto("./#/products");
  await page.getByRole("button", { name: "เพิ่มสินค้า", exact: true }).click();
  await page.getByLabel("รหัสสินค้า", { exact: true }).fill("QA-001");
  await page
    .getByLabel("ชื่อสินค้า", { exact: true })
    .fill("แอร์ติดผนัง Inverter 12,000 BTU รุ่น QA12");
  await page.getByLabel("ราคาขาย (บาท)", { exact: true }).fill("12000");
  await page.getByLabel("สต็อกขั้นต่ำ", { exact: true }).fill("2");
  await page.getByRole("button", { name: "บันทึกสินค้า", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("บันทึก");
  await page
    .getByRole("textbox", { name: "ค้นหาสินค้า", exact: true })
    .fill("QA-001");
  await expect(page.locator("tbody tr")).toHaveCount(1);
  await page
    .getByRole("button", { name: "รับเข้า QA-001", exact: true })
    .click();
  await page.getByLabel("จำนวน (เครื่อง)", { exact: true }).fill("5");
  await page
    .getByLabel("เหตุผล / เลขที่อ้างอิง", { exact: true })
    .fill("QA รับเข้า");
  await page.getByRole("button", { name: "ยืนยันรายการ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("รับสินค้าเข้า");
  await page
    .getByRole("button", { name: "เบิกออก QA-001", exact: true })
    .click();
  await page.getByLabel("จำนวน (เครื่อง)", { exact: true }).fill("6");
  await page
    .getByLabel("เหตุผล / เลขที่อ้างอิง", { exact: true })
    .fill("QA เบิก");
  await page.getByRole("button", { name: "ยืนยันรายการ", exact: true }).click();
  await expect(page.getByRole("alert")).toContainText("ไม่สามารถเบิก");
  expect(
    (await snapshot(page)).products.find((product) => product.sku === "QA-001")!
      .stock,
  ).toBe(5);
  await page.getByLabel("จำนวน (เครื่อง)", { exact: true }).fill("1");
  await page.getByRole("button", { name: "ยืนยันรายการ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("เบิกสินค้าออก");
  await page
    .getByRole("button", { name: "ประวัติ QA-001", exact: true })
    .click();
  await expect(page.locator("dialog")).toContainText("QA รับเข้า");
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("stock-history.png") });
  await closeDialog(page);
  await page.getByRole("button", { name: "แก้ไข QA-001", exact: true }).click();
  await page.getByLabel("ราคาขาย (บาท)", { exact: true }).fill("12500");
  await page.getByRole("button", { name: "บันทึกสินค้า", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("บันทึก");
  const product = (await snapshot(page)).products.find(
    (product) => product.sku === "QA-001",
  )!;
  async function create(quantity: string) {
    await page.goto("./#/orders");
    await page
      .getByRole("button", { name: "สร้างคำสั่งซื้อ", exact: true })
      .first()
      .click();
    await page.getByLabel("ลูกค้า", { exact: true }).selectOption("customer-1");
    await page.getByLabel("สินค้า 1", { exact: true }).selectOption(product.id);
    await page.getByLabel("จำนวนสินค้า 1", { exact: true }).fill(quantity);
    await page
      .locator("dialog")
      .getByRole("button", { name: "สร้างคำสั่งซื้อ", exact: true })
      .click();
  }
  await create("5");
  await expect(page.getByRole("alert")).toContainText("ไม่เพียงพอ");
  expect(
    (await snapshot(page)).products.find((item) => item.id === product.id)!
      .stock,
  ).toBe(4);
  await page.getByLabel("จำนวนสินค้า 1", { exact: true }).fill("2");
  await page
    .locator("dialog")
    .getByRole("button", { name: "สร้างคำสั่งซื้อ", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("ตัดสต็อก");
  for (const [name, action] of [["ชำระแล้ว", "บันทึกการชำระเงิน"], ["รอติดตั้ง/จัดส่ง", "เตรียมติดตั้งหรือจัดส่ง"], ["สำเร็จ", "บันทึกการส่งมอบ"]]) {
    await page
      .locator("dialog")
      .getByRole("button", { name: action, exact: true })
      .click();
    await expect(page.getByRole("status")).toContainText(`เปลี่ยนเป็น ${name}`);
  }
  await expect(
    page.getByRole("button", { name: "ยกเลิกคำสั่งซื้อ", exact: true }),
  ).toHaveCount(0);
  expect(
    (await snapshot(page)).products.find((item) => item.id === product.id)!
      .stock,
  ).toBe(2);
  await closeDialog(page);
  await create("1");
  await expect(page.getByRole("status")).toContainText("ตัดสต็อก");
  await page
    .getByRole("button", { name: "ยกเลิกคำสั่งซื้อ", exact: true })
    .click();
  await page
    .locator("dialog")
    .last()
    .getByRole("button", { name: "ไม่ยกเลิกคำสั่งซื้อ", exact: true })
    .click();
  expect(
    (await snapshot(page)).products.find((item) => item.id === product.id)!
      .stock,
  ).toBe(1);
  await page
    .getByRole("button", { name: "ยกเลิกคำสั่งซื้อ", exact: true })
    .click();
  await page.getByRole("button", { name: "ยกเลิกคำสั่งซื้อ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("คืนสต็อก");
  expect(
    (await snapshot(page)).products.find((item) => item.id === product.id)!
      .stock,
  ).toBe(2);
  await page.reload();
  await page.locator(".page-heading h1").waitFor();
  expect(
    (await snapshot(page)).products.find((item) => item.id === product.id)!
      .stock,
  ).toBe(2);
});

test("booking creation and rescheduling reject conflicts and allow adjacency", async ({
  page,
}, info) => {
  await login(page);
  await page.goto("./#/bookings");
  await page.getByRole("button", { name: "วัน", exact: true }).click();
  const original = (await snapshot(page)).bookings[28],
    input = (value: string) => format(new Date(value), "yyyy-MM-dd'T'HH:mm");
  await page
    .getByRole("button", { name: "เพิ่มนัดหมาย", exact: true })
    .click();
  await page.getByLabel("ลูกค้า", { exact: true }).selectOption("customer-1");
  await page
    .getByLabel("ช่างผู้รับผิดชอบ", { exact: true })
    .selectOption("tech-1");
  await page
    .getByLabel("เริ่มงาน", { exact: true })
    .fill(input(original.start));
  await page
    .getByLabel("สิ้นสุดงาน", { exact: true })
    .fill(input(original.end));
  await page
    .getByRole("button", { name: "บันทึกนัดหมาย", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("ช่างมีงาน");
  expect((await snapshot(page)).bookings).toHaveLength(80);
  await page.getByLabel("เริ่มงาน", { exact: true }).fill(input(original.end));
  const adjacentEnd = new Date(
    new Date(original.end).getTime() + 3600000,
  ).toISOString();
  await page.getByLabel("สิ้นสุดงาน", { exact: true }).fill(input(adjacentEnd));
  await page.getByLabel("หมายเหตุ", { exact: true }).fill("QA นัดหมาย");
  await page
    .getByRole("button", { name: "บันทึกนัดหมาย", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("สร้างนัดหมาย");
  await page
    .locator(".day-technician")
    .first()
    .locator(".day-job")
    .last()
    .click();
  await page
    .getByRole("button", { name: "แก้ไขนัดหมาย", exact: true })
    .click();
  await page
    .getByLabel("เริ่มงาน", { exact: true })
    .fill(input(original.start));
  await page
    .getByLabel("สิ้นสุดงาน", { exact: true })
    .fill(input(original.end));
  await page
    .getByRole("button", { name: "บันทึกนัดหมาย", exact: true })
    .click();
  await expect(page.getByRole("alert")).toContainText("ช่างมีงาน");
  await page
    .getByLabel("เริ่มงาน", { exact: true })
    .fill(format(addDays(new Date(original.end), 1), "yyyy-MM-dd'T'HH:mm"));
  await page
    .getByLabel("สิ้นสุดงาน", { exact: true })
    .fill(format(addDays(new Date(adjacentEnd), 1), "yyyy-MM-dd'T'HH:mm"));
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("reschedule.png") });
  await page
    .getByRole("button", { name: "บันทึกนัดหมาย", exact: true })
    .click();
  await expect(page.getByRole("status")).toContainText("แก้ไขนัดหมาย");
  expect((await snapshot(page)).bookings).toHaveLength(81);
});

test("roles, guarded direct links, own job completion and screenshot mode", async ({
  page,
}, info) => {
  await login(page, "แอดมิน");
  await expect(
    page.getByRole("heading", { name: "ยอดขายรายเดือน", exact: true }),
  ).toHaveCount(0);
  await expect(page.getByText("ยอดขายวันนี้", { exact: true })).toHaveCount(0);
  await expect(
    page.getByRole("heading", { name: "สถานะคำสั่งซื้อ", exact: true }),
  ).toBeVisible();
  await page.screenshot({
    path: info.outputPath("admin-dashboard.png"),
    fullPage: true,
  });
  await logout(page);
  await login(page, "ช่าง");
  await expect(page.locator(".technician-heading")).toHaveCount(1);
  await expect(page.locator(".sidebar nav a")).toHaveCount(1);
  await expect(
    page.getByRole("button", { name: "เพิ่มนัดหมาย", exact: true }),
  ).toHaveCount(0);
  for (const route of ["dashboard", "products", "orders", "customers"]) {
    await page.goto(`./#/${route}`);
    await expect(page).toHaveURL(/#\/bookings$/);
    await page.locator(".page-heading h1").waitFor();
    await expect(page.locator(".page")).not.toContainText("฿");
  }
  await page.getByRole("button", { name: "วัน", exact: true }).click();
  await page.locator(".day-job").first().click();
  await expect(
    page.getByRole("button", { name: "แก้ไขนัดหมาย", exact: true }),
  ).toHaveCount(0);
  await page.getByRole("button", { name: "บันทึกงานเสร็จ", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("เปลี่ยนเป็น เสร็จ");
  await closeDialog(page);
  await noOverflow(page);
  await page.screenshot({
    path: info.outputPath("technician.png"),
    fullPage: true,
  });
  await logout(page);
  await login(page);
  for (const url of [
    "./?screenshot=1#/dashboard",
    "./#/dashboard?screenshot=1",
  ]) {
    await page.goto(url);
    await page.locator(".page-heading h1").waitFor();
    await expect(page.locator(".demo-banner")).toHaveCount(0);
  }
  await page.goto("./#/dashboard");
  await page.locator(".page-heading h1").waitFor();
  await expect(page.locator(".demo-banner")).toBeVisible();
});

test("customer purchase and service histories and empty history states", async ({
  page,
}, info) => {
  await login(page);
  await page.goto("./#/customers");
  await page.locator(".customer-name").first().click();
  await expect(page.getByRole('tab', { name: 'ประวัติงานบริการ', exact: true })).toHaveAttribute('aria-selected', 'true');
  await page.getByRole('tab', { name: 'ประวัติซื้อสินค้า', exact: true }).click();
  await expect(page.getByRole("dialog")).toContainText("ยอดซื้อที่ชำระแล้ว");
  await expect(
    page.getByRole("tab", { name: "ประวัติซื้อสินค้า", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await page
    .getByRole("tab", { name: "ประวัติงานบริการ", exact: true })
    .click();
  await expect(
    page.getByRole("tab", { name: "ประวัติงานบริการ", exact: true }),
  ).toHaveAttribute("aria-selected", "true");
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("customer-detail.png") });
  const profileName = await page.locator('.customer-profile h2').innerText();
  const profileId = (await snapshot(page)).customers.find(customer => customer.name === profileName)!.id;
  await page.getByRole('button', { name: 'เพิ่มนัดหมาย', exact: true }).click();
  await expect(page.getByLabel('ลูกค้า', { exact: true })).toHaveValue(profileId);
  await closeDialog(page);
  await closeDialog(page);
  const state = await snapshot(page),
    customer = state.customers.find(
      (customer) =>
        !state.orders.some((order) => order.customerId === customer.id),
    );
  if (customer) {
    await page
      .getByRole("textbox", { name: "ค้นหาลูกค้า", exact: true })
      .fill(customer.name);
    await page.locator(".customer-name").click();
    await page.getByRole('tab', { name: 'ประวัติซื้อสินค้า', exact: true }).click();
    await expect(
      page.getByRole("heading", {
        name: "ยังไม่มีประวัติซื้อสินค้า",
        exact: true,
      }),
    ).toBeVisible();
  }
});

test("Thai PDF and XLSX downloads, multipage PDF and nonblank previews", async ({
  page,
}, info) => {
  await login(page);
  for (const route of ["products", "orders"]) {
    await page.goto(`./#/${route}`);
    await page.locator(".page-heading h1").waitFor();
    const downloading = page.waitForEvent("download");
    await page
      .getByRole("button", { name: "ส่งออก Excel", exact: true })
      .click();
    const download = await downloading;
    const path = info.outputPath(`${route}.xlsx`);
    await download.saveAs(path);
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(path);
    expect(workbook.worksheets[0].rowCount).toBe(
      route === "products" ? 41 : 151,
    );
  }
  await page.locator("tbody .text-link").first().click();
  await page
    .getByRole("button", { name: "ใบเสนอราคา PDF", exact: true })
    .click();
  await expect(page.locator(".quotation-preview")).toBeVisible();
  await noOverflow(page);
  await page.screenshot({ path: info.outputPath("quotation.png") });
  const pixelCount = await page
    .locator(".quotation-preview")
    .evaluate((image: HTMLImageElement) => {
      const canvas = document.createElement("canvas");
      canvas.width = image.naturalWidth;
      canvas.height = image.naturalHeight;
      const context = canvas.getContext("2d")!;
      context.drawImage(image, 0, 0);
      const data = context.getImageData(0, 0, canvas.width, canvas.height).data;
      let pixels = 0;
      for (let index = 0; index < data.length; index += 4)
        if (data[index] < 200 || data[index + 1] < 200 || data[index + 2] < 200)
          pixels++;
      return pixels;
    });
  expect(pixelCount).toBeGreaterThan(10000);
  const downloading = page.waitForEvent("download");
  await page
    .getByRole("button", { name: "ดาวน์โหลด PDF", exact: true })
    .click();
  const download = await downloading,
    pdfPath = info.outputPath("quotation.pdf");
  await download.saveAs(pdfPath);
  const bytes = await readFile(pdfPath);
  expect(bytes.subarray(0, 5).toString()).toBe("%PDF-");
  expect(bytes.length).toBeGreaterThan(20000);
  await closeDialog(page);
  await closeDialog(page);
  await page.evaluate(() => {
    const state = JSON.parse(localStorage.getItem("yensabai-shop-v1")!);
    state.orders[0].items = state.products.map(
      (product: { id: string; name: string; price: number }) => ({
        productId: product.id,
        name: product.name,
        quantity: 1,
        unitPrice: product.price,
      }),
    );
    localStorage.setItem("yensabai-shop-v1", JSON.stringify(state));
  });
  await page.reload();
  await page.locator("tbody .text-link").first().click();
  await page
    .getByRole("button", { name: "ใบเสนอราคา PDF", exact: true })
    .click();
  await page.locator(".quotation-preview").first().waitFor();
  expect(await page.locator(".quotation-preview").count()).toBeGreaterThan(1);
});
