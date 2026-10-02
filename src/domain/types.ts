export type Role = "owner" | "admin" | "technician";
export interface User {
  id: string;
  name: string;
  role: Role;
  technicianId?: string;
}
export type Category = "aircon" | "parts";
export interface Product {
  id: string;
  sku: string;
  name: string;
  category: Category;
  unit: string;
  price: number;
  stock: number;
  minimumStock: number;
}
export interface Customer {
  id: string;
  name: string;
  phone: string;
  address: string;
}
export type OrderStatus =
  "pending" | "paid" | "fulfillment" | "completed" | "cancelled";
export interface OrderItem {
  productId: string;
  name: string;
  quantity: number;
  unitPrice: number;
}
export interface TimelineEntry {
  status: OrderStatus;
  at: string;
}
export interface Order {
  id: string;
  customerId: string;
  createdAt: string;
  status: OrderStatus;
  items: OrderItem[];
  timeline: TimelineEntry[];
}
export interface StockMovement {
  id: string;
  productId: string;
  delta: number;
  reason: string;
  createdAt: string;
  orderId?: string;
}
export interface Technician {
  id: string;
  name: string;
  phone: string;
  color: string;
}
export type BookingType = "installation" | "cleaning" | "repair";
export type BookingStatus = "scheduled" | "working" | "done";
export interface Booking {
  id: string;
  customerId: string;
  technicianId: string;
  orderId?: string;
  type: BookingType;
  start: string;
  end: string;
  status: BookingStatus;
  notes: string;
}
export interface ShopState {
  schemaVersion: number;
  products: Product[];
  customers: Customer[];
  orders: Order[];
  movements: StockMovement[];
  technicians: Technician[];
  bookings: Booking[];
}
export interface OrderDraft {
  customerId: string;
  items: { productId: string; quantity: number }[];
}
export type ProductDraft = Omit<Product, "id" | "stock"> & { id?: string };
export type BookingDraft = Omit<Booking, "id" | "status"> & { id?: string };
export const orderLabels: Record<OrderStatus, string> = {
  pending: "รอชำระ",
  paid: "ชำระแล้ว",
  fulfillment: "รอติดตั้ง/จัดส่ง",
  completed: "สำเร็จ",
  cancelled: "ยกเลิก",
};
export const bookingLabels: Record<BookingStatus, string> = {
  scheduled: "นัดแล้ว",
  working: "กำลังทำ",
  done: "เสร็จ",
};
export const bookingTypeLabels: Record<BookingType, string> = {
  installation: "ติดตั้ง",
  cleaning: "ล้างแอร์",
  repair: "ซ่อม",
};
export const roleLabels: Record<Role, string> = {
  owner: "เจ้าของ",
  admin: "แอดมิน",
  technician: "ช่าง",
};
export const orderTotal = (order: Order) =>
  order.items.reduce(
    (total, item) => total + item.quantity * item.unitPrice,
    0,
  );
