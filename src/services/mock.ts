import type {
  BookingDraft,
  BookingStatus,
  OrderDraft,
  OrderStatus,
  ProductDraft,
  ShopState,
  User,
} from "../domain/types";
import { requireOffice } from "../domain/rules";
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
  async createOrder(_user: User, _draft: OrderDraft): Promise<string> {
    throw new Error("อยู่ระหว่างเตรียมคำสั่งซื้อ");
  }
  async transitionOrder(
    _user: User,
    _orderId: string,
    _status: OrderStatus,
  ): Promise<void> {
    throw new Error("อยู่ระหว่างเตรียมคำสั่งซื้อ");
  }
  async saveBooking(_user: User, _draft: BookingDraft): Promise<void> {
    throw new Error("อยู่ระหว่างเตรียมตารางงาน");
  }
  async transitionBooking(
    _user: User,
    _bookingId: string,
    _status: BookingStatus,
  ): Promise<void> {
    throw new Error("อยู่ระหว่างเตรียมตารางงาน");
  }
  async reset(user: User) {
    if (user.role !== "owner")
      throw new Error("เฉพาะเจ้าของร้านเท่านั้นที่รีเซ็ตข้อมูลได้");
    await this.wait();
    this.write(generateSeed());
  }
}
