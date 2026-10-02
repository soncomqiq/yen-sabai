import {
  addDays,
  addHours,
  startOfDay,
  startOfMonth,
  subMonths,
} from "date-fns";
import type {
  Booking,
  Customer,
  Order,
  OrderStatus,
  Product,
  ShopState,
} from "../domain/types";
import { transitions } from "../domain/rules";

export function seededRandom(seed = 20261003) {
  let value = seed >>> 0;
  return () => {
    value = (Math.imul(value, 1664525) + 1013904223) >>> 0;
    return value / 4294967296;
  };
}
export function generateSeed(today = new Date()): ShopState {
  const random = seededRandom(),
    day = startOfDay(today);
  const parts = [
    "ท่อทองแดง 1/4 นิ้ว",
    "ท่อทองแดง 3/8 นิ้ว",
    "ฉนวนหุ้มท่อ",
    "ขาแขวนคอยล์ร้อน",
    "รีโมตแอร์",
    "น้ำยาล้างคอยล์",
    "สายไฟ 2.5 ตร.มม.",
    "สายระบายน้ำ",
    "คาปาซิเตอร์",
    "แผ่นกรองอากาศ",
  ];
  const products: Product[] = Array.from({ length: 40 }, (_, index) => {
    const aircon = index < 24,
      btu = [9000, 12000, 18000, 24000][index % 4];
    return {
      id: `product-${index + 1}`,
      sku: `${aircon ? "AC" : "PT"}-${String(index + 1).padStart(3, "0")}`,
      name: aircon
        ? `แอร์ติดผนัง ${index < 16 ? "Inverter" : "Standard"} ${btu.toLocaleString("en")} BTU รุ่น ${String.fromCharCode(65 + Math.floor(index / 4))}${btu / 1000}`
        : `${parts[(index - 24) % parts.length]} รุ่น P${index - 23}`,
      category: aircon ? "aircon" : "parts",
      unit: aircon ? "เครื่อง" : "ชิ้น",
      price: aircon
        ? 9800 + (index % 4) * 3900 + Math.floor(index / 4) * 700
        : 150 + Math.floor(random() * 19) * 50,
      stock: index % 7 === 0 ? 2 : 8 + Math.floor(random() * 25),
      minimumStock: aircon ? 5 : 10,
    };
  });
  const first = [
    "กมล",
    "ปรียา",
    "วรินทร์",
    "ธนกฤต",
    "ศิริพร",
    "ณัฐพล",
    "พิมพ์ใจ",
    "สุรชัย",
    "อรทัย",
    "ชยพล",
    "รัตนา",
    "วิภา",
  ];
  const last = ["สุขสบาย", "ใจดี", "วัฒนา", "บุญรักษ์", "ศรีสุข"];
  const customers: Customer[] = Array.from({ length: 60 }, (_, index) => ({
    id: `customer-${index + 1}`,
    name: `${first[index % 12]} ${last[Math.floor(index / 12)]}`,
    phone: `08${String(10000000 + index * 12731).slice(0, 8)}`,
    address: `${12 + index}/ ${3 + (index % 9)} ซอย${["ลาซาล", "แบริ่ง", "บางนา", "อุดมสุข"][index % 4]} ${(index % 30) + 1} แขวงบางนา เขตบางนา กรุงเทพฯ 10260`,
  }));
  const orders: Order[] = Array.from({ length: 150 }, (_, index) => {
    const monthOffset = Math.floor(index / 25),
      month = startOfMonth(subMonths(day, 5 - monthOffset));
    const maxDay = monthOffset === 5 ? Math.max(1, today.getDate()) : 27;
    const createdAt =
      index >= 146
        ? addHours(day, 8 + (index - 146))
        : addHours(addDays(month, Math.floor(random() * maxDay)), 8);
    const status: OrderStatus =
      index >= 146
        ? (["pending", "paid", "fulfillment", "completed"] as OrderStatus[])[
            index - 146
          ]
        : (
            [
              "completed",
              "completed",
              "completed",
              "fulfillment",
              "paid",
              "pending",
              "cancelled",
            ] as OrderStatus[]
          )[Math.floor(random() * 7)];
    const product = products[Math.floor(random() * products.length)],
      hot = createdAt.getMonth() >= 2 && createdAt.getMonth() <= 4;
    const items = [
      {
        productId: product.id,
        name: product.name,
        quantity: hot
          ? 3 + Math.floor(random() * 2)
          : 1 + Math.floor(random() * 2),
        unitPrice: product.price,
      },
    ];
    const flow: OrderStatus[] = ["pending"];
    let current: OrderStatus = "pending";
    while (current !== status) {
      current =
        status === "cancelled"
          ? "cancelled"
          : transitions[current].find((next) => next !== "cancelled")!;
      flow.push(current);
    }
    return {
      id: `YS-${String(index + 1).padStart(4, "0")}`,
      customerId: customers[Math.floor(random() * 60)].id,
      createdAt: createdAt.toISOString(),
      status,
      items,
      timeline: flow.map((step, offset) => ({
        status: step,
        at: addHours(createdAt, offset).toISOString(),
      })),
    };
  }).sort((left, right) => right.createdAt.localeCompare(left.createdAt));
  const technicians = [
    { id: "tech-1", name: "ช่างเอก", phone: "0812345601", color: "#087f6b" },
    { id: "tech-2", name: "ช่างบอย", phone: "0812345602", color: "#4888c3" },
    { id: "tech-3", name: "ช่างต้น", phone: "0812345603", color: "#bb8c32" },
    { id: "tech-4", name: "ช่างนัท", phone: "0812345604", color: "#b76378" },
  ];
  const bookings: Booking[] = Array.from({ length: 80 }, (_, index) => {
    const offset = Math.floor(index / 4) - 7,
      tech = index % 4,
      start = addHours(addDays(day, offset), 9 + tech * 2);
    return {
      id: `JOB-${String(index + 1).padStart(3, "0")}`,
      customerId: customers[Math.floor(random() * 60)].id,
      technicianId: technicians[tech].id,
      type: (["installation", "cleaning", "repair"] as const)[index % 3],
      start: start.toISOString(),
      end: addHours(start, 2).toISOString(),
      status:
        offset < 0
          ? "done"
          : offset === 0 && tech === 0
            ? "working"
            : "scheduled",
      notes: [
        "โทรแจ้งลูกค้าก่อนถึง 30 นาที",
        "จอดรถหน้าบ้านได้",
        "แอร์อยู่ชั้น 2 กรุณาเตรียมบันได",
        "ลูกค้าสะดวกตามเวลานัด",
      ][index % 4],
    };
  });
  const movements: ShopState["movements"] = products.map((product) => ({
    id: `seed-in-${product.id}`,
    productId: product.id,
    delta:
      product.stock +
      orders
        .filter((order) => order.status !== "cancelled")
        .flatMap((order) => order.items)
        .filter((item) => item.productId === product.id)
        .reduce((total, item) => total + item.quantity, 0),
    reason: "รับสินค้าเริ่มต้น",
    createdAt: subMonths(day, 6).toISOString(),
  }));
  orders.forEach((order) =>
    order.items.forEach((item) => {
      movements.push({
        id: `seed-out-${order.id}`,
        productId: item.productId,
        delta: -item.quantity,
        reason: "ขายสินค้า",
        createdAt: order.createdAt,
        orderId: order.id,
      });
      if (order.status === "cancelled")
        movements.push({
          id: `seed-return-${order.id}`,
          productId: item.productId,
          delta: item.quantity,
          reason: "คืนจากยกเลิกคำสั่งซื้อ",
          createdAt: order.timeline.at(-1)!.at,
          orderId: order.id,
        });
    }),
  );
  return {
    schemaVersion: 1,
    products,
    customers,
    orders,
    movements,
    technicians,
    bookings,
  };
}
