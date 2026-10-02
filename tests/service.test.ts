describe("bookings", () => {
  it("rejects overlapping create and reschedule without changing data", async () => {
    const state = await service.snapshot(owner),
      job = state.bookings[0],
      before = data.get(STORAGE_KEY);
    await expect(
      service.saveBooking(owner, { ...job, id: undefined }),
    ).rejects.toThrow("ช่วงเวลา");
    expect(data.get(STORAGE_KEY)).toBe(before);
    await expect(
      service.saveBooking(owner, {
        ...state.bookings[4],
        start: job.start,
        end: job.end,
      }),
    ).rejects.toThrow("ช่วงเวลา");
    expect(data.get(STORAGE_KEY)).toBe(before);
    await service.saveBooking(owner, { ...job, notes: "edited self" });
    expect((await service.snapshot(owner)).bookings[0].notes).toBe(
      "edited self",
    );
  });
  it("permits adjacent intervals but rejects backwards and cross-day intervals", async () => {
    const job = (await service.snapshot(owner)).bookings[0];
    await service.saveBooking(owner, {
      ...job,
      id: undefined,
      start: job.end,
      end: new Date(new Date(job.end).getTime() + 3600000).toISOString(),
    });
    await expect(
      service.saveBooking(owner, { ...job, end: job.start }),
    ).rejects.toThrow("เวลาสิ้นสุด");
    await expect(
      service.saveBooking(owner, {
        ...job,
        end: new Date(new Date(job.end).getTime() + 86400000).toISOString(),
      }),
    ).rejects.toThrow("วันเดียวกัน");
  });
  it("technicians can advance only their own jobs and cannot reschedule", async () => {
    const state = await service.snapshot(owner),
      own = state.bookings.find(
        (job) => job.technicianId === "tech-1" && job.status === "scheduled",
      )!,
      other = state.bookings.find(
        (job) => job.technicianId === "tech-2" && job.status === "scheduled",
      )!;
    await expect(
      service.transitionBooking(technician, other.id, "working"),
    ).rejects.toThrow("ตัวเอง");
    await expect(
      service.transitionBooking(technician, own.id, "done"),
    ).rejects.toThrow("สถานะ");
    await service.transitionBooking(technician, own.id, "working");
    await service.transitionBooking(technician, own.id, "done");
    await expect(
      service.transitionBooking(technician, own.id, "working"),
    ).rejects.toThrow("สถานะ");
    await expect(service.saveBooking(technician, own)).rejects.toThrow(
      "สิทธิ์",
    );
  });
});
describe("orders", () => {
  it("deducts merged lines, preserves historical prices, restores only once", async () => {
    const product = (await service.snapshot(owner)).products[1];
    const id = await service.createOrder(owner, {
      customerId: "customer-1",
      items: [
        { productId: product.id, quantity: 1 },
        { productId: product.id, quantity: 2 },
      ],
    });
    let state = await service.snapshot(owner);
    expect(state.products[1].stock).toBe(product.stock - 3);
    expect(state.orders[0].items).toHaveLength(1);
    await service.saveProduct(owner, { ...product, price: 999 });
    expect((await service.snapshot(owner)).orders[0].items[0].unitPrice).toBe(
      product.price,
    );
    await service.transitionOrder(owner, id, "cancelled");
    state = await service.snapshot(owner);
    expect(state.products[1].stock).toBe(product.stock);
    const before = data.get(STORAGE_KEY);
    await expect(
      service.transitionOrder(owner, id, "cancelled"),
    ).rejects.toThrow("สถานะ");
    expect(data.get(STORAGE_KEY)).toBe(before);
  });
  it("validates all lines before deduction and blocks negative quantities", async () => {
    const state = await service.snapshot(owner),
      before = data.get(STORAGE_KEY);
    await expect(
      service.createOrder(owner, {
        customerId: "customer-1",
        items: [
          { productId: "product-2", quantity: 1 },
          { productId: "product-1", quantity: state.products[0].stock + 1 },
        ],
      }),
    ).rejects.toThrow("ไม่เพียงพอ");
    expect(data.get(STORAGE_KEY)).toBe(before);
    await expect(
      service.createOrder(owner, {
        customerId: "customer-1",
        items: [{ productId: "product-1", quantity: -1 }],
      }),
    ).rejects.toThrow("จำนวน");
  });
  it("only advances permitted transitions and denies technician orders", async () => {
    const id = await service.createOrder(owner, {
      customerId: "customer-1",
      items: [{ productId: "product-2", quantity: 1 }],
    });
    await expect(
      service.transitionOrder(owner, id, "completed"),
    ).rejects.toThrow("ลำดับ");
    for (const status of ["paid", "fulfillment", "completed"] as const)
      await service.transitionOrder(owner, id, status);
    await expect(
      service.transitionOrder(owner, id, "cancelled"),
    ).rejects.toThrow("สถานะ");
    await expect(
      service.createOrder(technician, { customerId: "customer-1", items: [] }),
    ).rejects.toThrow("สิทธิ์");
  });
});
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
