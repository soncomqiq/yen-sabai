import type {
  BookingDraft,
  BookingStatus,
  OrderDraft,
  OrderStatus,
  ProductDraft,
  ShopState,
  User,
} from "../domain/types";
import { requireOffice, transitions, validateBooking } from "../domain/rules";
import type { ShopService } from "./interface";
import { generateSeed } from "./seed";

export const STORAGE_KEY = "yensabai-shop-v1";
export class MockShopService implements ShopService {
  constructor(
    privateStorage: Pick<Storage, "getItem" | "setItem">,
    latency = 180,
  ) {
    this.storage = privateStorage;
    this.latency = latency;
  }
  private storage: Pick<Storage, "getItem" | "setItem">;
  private latency: number;
  protected async wait() {
    if (this.latency)
      await new Promise((resolve) => setTimeout(resolve, this.latency));
  }
  protected read(): ShopState {
    const stored = this.storage.getItem(STORAGE_KEY);
    if (!stored) {
      const state = generateSeed();
      this.write(state);
      return state;
    }
    try {
      const state = JSON.parse(stored);
      if (state.schemaVersion !== 1 || !Array.isArray(state.products))
        throw new Error();
      return state;
    } catch {
      throw new Error(
        "ข้อมูลตัวอย่างในเครื่องไม่สมบูรณ์ กรุณารีเซ็ตข้อมูลด้วยบัญชีเจ้าของ",
      );
    }
  }
  protected write(state: ShopState) {
    try {
      this.storage.setItem(STORAGE_KEY, JSON.stringify(state));
    } catch {
      throw new Error(
        "บันทึกข้อมูลไม่ได้ กรุณาตรวจสอบพื้นที่จัดเก็บและสิทธิ์ของเบราว์เซอร์",
      );
    }
  }
  async snapshot(user: User) {
    await this.wait();
    const state = this.read();
    if (user.role === "technician") {
      const bookings = state.bookings.filter(
        (job) => job.technicianId === user.technicianId,
      );
      return {
        ...state,
        products: [],
        orders: [],
        movements: [],
        bookings,
        customers: state.customers.filter((customer) =>
          bookings.some((job) => job.customerId === customer.id),
        ),
        technicians: state.technicians.filter(
          (tech) => tech.id === user.technicianId,
        ),
      };
    }
    return state;
  }
  async saveProduct(user: User, draft: ProductDraft) {
    requireOffice(user.role);
    await this.wait();
    const state = this.read();
    if (!draft.sku.trim() || !draft.name.trim() || !draft.unit.trim())
      throw new Error("กรุณากรอกรหัสสินค้า ชื่อสินค้า และหน่วยนับ");
    if (
      !["aircon", "parts"].includes(draft.category) ||
      !Number.isFinite(draft.price) ||
      draft.price < 0 ||
      !Number.isInteger(draft.minimumStock) ||
      draft.minimumStock < 0
    )
      throw new Error(
        "ราคาและสต็อกขั้นต่ำต้องไม่ติดลบ สต็อกขั้นต่ำต้องเป็นจำนวนเต็ม",
      );
    if (
      state.products.some(
        (product) =>
          product.id !== draft.id &&
          product.sku.toLowerCase() === draft.sku.trim().toLowerCase(),
      )
    )
      throw new Error("รหัสสินค้านี้มีอยู่แล้ว กรุณาใช้รหัสอื่น");
    const product = draft.id
      ? state.products.find((item) => item.id === draft.id)
      : undefined;
    if (draft.id && !product) throw new Error("ไม่พบสินค้า");
    const value = {
      ...draft,
      id: product?.id ?? `product-${crypto.randomUUID()}`,
      sku: draft.sku.trim(),
      name: draft.name.trim(),
      unit: draft.unit.trim(),
      stock: product?.stock ?? 0,
    };
    if (product) Object.assign(product, value);
    else state.products.push(value);
    this.write(state);
  }
  async moveStock(
    user: User,
    productId: string,
    delta: number,
    reason: string,
  ) {
    requireOffice(user.role);
    await this.wait();
    const state = this.read(),
      product = state.products.find((item) => item.id === productId);
    if (!product) throw new Error("ไม่พบสินค้า");
    if (!Number.isInteger(delta) || delta === 0 || !reason.trim())
      throw new Error("จำนวนต้องเป็นจำนวนเต็มมากกว่าศูนย์และระบุเหตุผล");
    if (product.stock + delta < 0)
      throw new Error(
        `สินค้าเหลือ ${product.stock} ${product.unit} ไม่สามารถเบิกเกินจำนวนคงเหลือ`,
      );
    product.stock += delta;
    state.movements.unshift({
      id: crypto.randomUUID(),
      productId,
      delta,
      reason: reason.trim(),
      createdAt: new Date().toISOString(),
    });
    this.write(state);
  }
  async createOrder(user: User, draft: OrderDraft): Promise<string> {
    requireOffice(user.role);
    await this.wait();
    const state = this.read();
    if (!state.customers.some((customer) => customer.id === draft.customerId))
      throw new Error("กรุณาเลือกลูกค้า");
    if (!draft.items.length) throw new Error("เพิ่มสินค้าอย่างน้อยหนึ่งรายการ");
    const quantities = new Map<string, number>();
    draft.items.forEach((item) => {
      if (!Number.isInteger(item.quantity) || item.quantity < 1)
        throw new Error("จำนวนสินค้าต้องเป็นจำนวนเต็มมากกว่าศูนย์");
      quantities.set(
        item.productId,
        (quantities.get(item.productId) ?? 0) + item.quantity,
      );
    });
    const items = [...quantities].map(([productId, quantity]) => {
      const product = state.products.find(
        (product) => product.id === productId,
      );
      if (!product) throw new Error("ไม่พบสินค้าที่เลือก");
      if (product.stock < quantity)
        throw new Error(
          `${product.name} เหลือ ${product.stock} ${product.unit} ไม่เพียงพอสำหรับ ${quantity} ${product.unit}`,
        );
      return {
        productId,
        quantity,
        name: product.name,
        unitPrice: product.price,
      };
    });
    const id = `YS-${String(Math.max(0, ...state.orders.map((order) => Number(order.id.split("-")[1]) || 0)) + 1).padStart(4, "0")}`,
      now = new Date().toISOString();
    items.forEach((item) => {
      state.products.find((product) => product.id === item.productId)!.stock -=
        item.quantity;
      state.movements.unshift({
        id: crypto.randomUUID(),
        productId: item.productId,
        delta: -item.quantity,
        reason: "ขายสินค้า",
        orderId: id,
        createdAt: now,
      });
    });
    state.orders.unshift({
      id,
      customerId: draft.customerId,
      createdAt: now,
      status: "pending",
      items,
      timeline: [{ status: "pending", at: now }],
    });
    this.write(state);
    return id;
  }
  async transitionOrder(
    user: User,
    orderId: string,
    status: OrderStatus,
  ): Promise<void> {
    requireOffice(user.role);
    await this.wait();
    const state = this.read(),
      order = state.orders.find((order) => order.id === orderId);
    if (!order) throw new Error("ไม่พบคำสั่งซื้อ");
    if (!transitions[order.status].includes(status))
      throw new Error(
        "ไม่สามารถเปลี่ยนสถานะนี้ได้ ต้องทำตามลำดับและห้ามเปลี่ยนรายการที่สำเร็จหรือยกเลิกแล้ว",
      );
    const now = new Date().toISOString();
    if (status === "cancelled")
      order.items.forEach((item) => {
        const product = state.products.find(
          (product) => product.id === item.productId,
        );
        if (!product) throw new Error("ไม่พบสินค้าสำหรับคืนสต็อก");
        product.stock += item.quantity;
        state.movements.unshift({
          id: crypto.randomUUID(),
          productId: product.id,
          delta: item.quantity,
          reason: "คืนจากยกเลิกคำสั่งซื้อ",
          orderId,
          createdAt: now,
        });
      });
    order.status = status;
    order.timeline.push({ status, at: now });
    this.write(state);
  }
  async saveBooking(user: User, draft: BookingDraft): Promise<void> {
    requireOffice(user.role);
    await this.wait();
    const state = this.read();
    if (
      !state.customers.some((customer) => customer.id === draft.customerId) ||
      !state.technicians.some((tech) => tech.id === draft.technicianId)
    )
      throw new Error("กรุณาเลือกลูกค้าและช่างให้ถูกต้อง");
    if (!["installation", "cleaning", "repair"].includes(draft.type))
      throw new Error("ประเภทงานไม่ถูกต้อง");
    if (
      draft.orderId &&
      !state.orders.some(
        (order) =>
          order.id === draft.orderId &&
          order.customerId === draft.customerId &&
          order.status !== "cancelled",
      )
    )
      throw new Error("คำสั่งซื้อต้องเป็นของลูกค้ารายนี้และยังไม่ยกเลิก");
    const existing = draft.id
      ? state.bookings.find((job) => job.id === draft.id)
      : undefined;
    if (draft.id && !existing) throw new Error("ไม่พบงานช่าง");
    validateBooking(draft, state.bookings);
    const value = {
      id: existing?.id ?? `JOB-${crypto.randomUUID().slice(0, 8)}`,
      customerId: draft.customerId,
      technicianId: draft.technicianId,
      orderId: draft.orderId || undefined,
      type: draft.type,
      start: new Date(draft.start).toISOString(),
      end: new Date(draft.end).toISOString(),
      notes: draft.notes.trim().slice(0, 500),
      status: existing?.status ?? ("scheduled" as const),
    };
    if (existing) Object.assign(existing, value);
    else state.bookings.push(value);
    this.write(state);
  }
  async transitionBooking(
    user: User,
    bookingId: string,
    status: BookingStatus,
  ): Promise<void> {
    await this.wait();
    const state = this.read(),
      job = state.bookings.find((job) => job.id === bookingId);
    if (!job) throw new Error("ไม่พบงานช่าง");
    if (user.role === "technician" && job.technicianId !== user.technicianId)
      throw new Error("เปลี่ยนสถานะได้เฉพาะงานของตัวเอง");
    if (
      !(job.status === "scheduled" && status === "working") &&
      !(job.status === "working" && status === "done")
    )
      throw new Error(
        "สถานะงานต้องเปลี่ยนจาก นัดแล้ว → กำลังทำ → เสร็จ เท่านั้น",
      );
    job.status = status;
    this.write(state);
  }
  async reset(user: User) {
    if (user.role !== "owner")
      throw new Error("เฉพาะเจ้าของร้านเท่านั้นที่รีเซ็ตข้อมูลได้");
    await this.wait();
    this.write(generateSeed());
  }
}
