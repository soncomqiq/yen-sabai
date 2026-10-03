import { test, expect } from "@playwright/test";
import AxeBuilder from "@axe-core/playwright";

test("WCAG AA on shop pages and active detail forms", async ({ page }) => {
  async function check(name: string) {
    await page.evaluate(() => document.fonts.ready);
    const results = await new AxeBuilder({ page })
      .withTags(["wcag2a", "wcag2aa", "wcag21aa", "wcag22aa"])
      .analyze();
    expect(
      results.violations.map((violation) => ({
        id: violation.id,
        nodes: violation.nodes.map((node) => ({
          target: node.target,
          message: node.failureSummary,
        })),
      })),
      name,
    ).toEqual([]);
  }
  await page.goto("./#/login");
  await check("login");
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.locator(".page-heading h1").waitFor();
  for (const route of [
    "dashboard",
    "bookings",
    "customers",
    "orders",
    "products",
  ]) {
    await page.goto(`./#/${route}`);
    await page.locator(".page-heading h1").waitFor();
    await check(route);
    if (route === "dashboard") {
      await page
        .getByRole("button", { name: "สรุปยอดขาย", exact: true })
        .click();
      await check("sales report");
    }
    if (route === "bookings") {
      await page
        .getByRole("button", { name: "เพิ่มนัดหมาย", exact: true })
        .click();
      await check("booking form");
    }
    if (route === "customers") {
      await page.locator(".customer-name").first().click();
      await check("customer history");
    }
    if (route === "orders") {
      await page.locator("tbody .text-link").first().click();
      await check("order detail");
    }
    if (route === "products") {
      await page
        .getByRole("button", { name: "เพิ่มสินค้า", exact: true })
        .click();
      await check("product form");
    }
    if (await page.locator("dialog[open]").count())
      await page
        .locator("dialog[open]")
        .last()
        .getByRole("button", { name: "ปิดหน้าต่าง", exact: true })
        .click();
  }
});

test("keyboard focus, stable working views and reduced motion", async ({
  page,
}, info) => {
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./#/login");
  await page.keyboard.press("Tab");
  const focused = page.locator(":focus");
  expect(
    await focused.evaluate((element) =>
      parseFloat(getComputedStyle(element).outlineWidth),
    ),
  ).toBeGreaterThanOrEqual(2);
  await page.getByRole("button", { name: "เข้าสู่ระบบ", exact: true }).click();
  await page.locator(".page-heading h1").waitFor();
  await expect(
    page.getByRole("heading", { name: "งานวันนี้", exact: true }),
  ).toBeVisible();
  await expect(page.locator(".stat-card")).toHaveCount(0);
  expect(
    (await page.locator(".schedule-row").first().boundingBox())!.y,
  ).toBeLessThan(info.project.name === "mobile" ? 650 : 500);
  expect(
    await page
      .locator(".page-heading")
      .evaluate((element) => getComputedStyle(element).animationName),
  ).toBe("none");
  if (info.project.name === "mobile") {
    await page.getByRole("button", { name: "เปิดเมนู", exact: true }).click();
    await expect(page.locator(".sidebar")).toHaveAttribute(
      "aria-modal",
      "true",
    );
    await page.keyboard.press("Escape");
    await expect(
      page.getByRole("button", { name: "เปิดเมนู", exact: true }),
    ).toBeFocused();
  }
  await page.goto("./#/products");
  await page.getByRole("button", { name: "เพิ่มสินค้า", exact: true }).click();
  await page.keyboard.press("Tab");
  expect(
    await page
      .locator(":focus")
      .evaluate((element) => Boolean(element.closest("dialog"))),
  ).toBe(true);
  await page.keyboard.press("Escape");
  await expect(page.locator("dialog[open]")).toHaveCount(0);
  await page.goto("./#/bookings");
  await page.locator(".page-heading h1").waitFor();
  if (info.project.name === "mobile")
    await expect(page.locator(".booking-agenda")).toBeVisible();
  await page.getByRole("button", { name: "วัน", exact: true }).click();
  await expect(page.locator(".day-technician")).toHaveCount(4);
  await page.getByRole("button", { name: "สัปดาห์", exact: true }).click();
  await expect(page.locator(".week-picker button")).toHaveCount(7);
});
