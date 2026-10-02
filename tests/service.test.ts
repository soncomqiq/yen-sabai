import { beforeEach, describe, expect, it } from "vitest";
import { MockShopService, STORAGE_KEY } from "../src/services/mock";
import { generateSeed } from "../src/services/seed";
import { isScreenshotMode, validateBooking } from "../src/domain/rules";
import type { User } from "../src/domain/types";
const owner: User = { id: "owner", name: "Owner", role: "owner" };
const technician: User = {
  id: "tech",
  name: "Tech",
  role: "technician",
  technicianId: "tech-1",
};
let data: Map<string, string>, service: MockShopService;
beforeEach(() => {
  data = new Map();
  service = new MockShopService(
    {
      getItem: (key) => data.get(key) ?? null,
      setItem: (key, value) => {
        data.set(key, value);
      },
    },
    0,
  );
});
describe("seed and stock", () => {
  it("has reproducible counts and balanced inventory", () => {
    const state = generateSeed(new Date("2026-06-18T10:00:00"));
    expect(state).toEqual(generateSeed(new Date("2026-06-18T10:00:00")));
    expect([
      state.products.length,
      state.customers.length,
      state.orders.length,
      state.bookings.length,
    ]).toEqual([40, 60, 150, 80]);
    state.products.forEach((product) =>
      expect(
        state.movements
          .filter((move) => move.productId === product.id)
          .reduce((total, move) => total + move.delta, 0),
      ).toBe(product.stock),
    );
    state.bookings.forEach((job) =>
      expect(() => validateBooking(job, state.bookings)).not.toThrow(),
    );
    const sums = [2, 3, 4].map((month) =>
      state.orders
        .filter(
          (order) =>
            new Date(order.createdAt).getMonth() === month &&
            order.status !== "cancelled",
        )
        .reduce(
          (sum, order) =>
            sum +
            order.items.reduce(
              (total, item) => total + item.quantity * item.unitPrice,
              0,
            ),
          0,
        ),
    );
    const winter = state.orders
      .filter(
        (order) =>
          new Date(order.createdAt).getMonth() === 1 &&
          order.status !== "cancelled",
      )
      .reduce(
        (sum, order) =>
          sum +
          order.items.reduce(
            (total, item) => total + item.quantity * item.unitPrice,
            0,
          ),
        0,
      );
    expect(Math.min(...sums)).toBeGreaterThan(winter);
  });
  it("persists product edits, preserves stock, rejects duplicate SKU", async () => {
    const product = (await service.snapshot(owner)).products[0];
    await service.saveProduct(owner, { ...product, name: "Updated" });
    expect((await service.snapshot(owner)).products[0]).toMatchObject({
      name: "Updated",
      stock: product.stock,
    });
    await expect(
      service.saveProduct(owner, { ...product, id: undefined }),
    ).rejects.toThrow("รหัสสินค้า");
  });
  it("rejects negative stock atomically and logs valid movements", async () => {
    const product = (await service.snapshot(owner)).products[0],
      before = data.get(STORAGE_KEY);
    await expect(
      service.moveStock(owner, product.id, -product.stock - 1, "test"),
    ).rejects.toThrow("คงเหลือ");
    expect(data.get(STORAGE_KEY)).toBe(before);
    await service.moveStock(owner, product.id, 5, "รับเข้า");
    expect((await service.snapshot(owner)).products[0].stock).toBe(
      product.stock + 5,
    );
  });
  it("redacts technician data and blocks writes", async () => {
    const state = await service.snapshot(technician);
    expect(state.products).toHaveLength(0);
    expect(state.orders).toHaveLength(0);
    expect(state.movements).toHaveLength(0);
    expect(state.bookings.every((job) => job.technicianId === "tech-1")).toBe(
      true,
    );
    await expect(
      service.moveStock(technician, "product-1", 1, "test"),
    ).rejects.toThrow("สิทธิ์");
    await expect(service.reset(technician)).rejects.toThrow("เจ้าของ");
  });
  it("handles screenshot query on either side of the hash", () => {
    expect(
      isScreenshotMode({ search: "?screenshot=1", hash: "#/dashboard" }),
    ).toBe(true);
    expect(
      isScreenshotMode({ search: "", hash: "#/products?screenshot=1" }),
    ).toBe(true);
    expect(
      isScreenshotMode({ search: "?screenshot=0", hash: "#/dashboard" }),
    ).toBe(false);
  });
});
