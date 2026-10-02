import { isSameDay, isSameMonth, startOfMonth, subMonths } from "date-fns";
import type { ShopState } from "./types";
import { orderTotal } from "./types";
export function dashboardMetrics(state: ShopState, today = new Date()) {
  const sales = state.orders.filter((order) =>
    ["paid", "fulfillment", "completed"].includes(order.status),
  );
  const months = Array.from({ length: 6 }, (_, index) => {
    const month = startOfMonth(subMonths(today, 5 - index));
    return {
      month,
      total: sales
        .filter((order) => isSameMonth(new Date(order.createdAt), month))
        .reduce((total, order) => total + orderTotal(order), 0),
    };
  });
  const quantities = new Map<string, number>();
  sales
    .filter((order) => new Date(order.createdAt) >= months[0].month)
    .forEach((order) =>
      order.items.forEach((item) =>
        quantities.set(
          item.productId,
          (quantities.get(item.productId) ?? 0) + item.quantity,
        ),
      ),
    );
  return {
    todaySales: sales
      .filter((order) => isSameDay(new Date(order.createdAt), today))
      .reduce((total, order) => total + orderTotal(order), 0),
    months,
    top: [...quantities]
      .sort((left, right) => right[1] - left[1])
      .slice(0, 5)
      .map(([id, quantity]) => ({
        product: state.products.find((product) => product.id === id)!,
        quantity,
      })),
    low: state.products
      .filter((product) => product.stock <= product.minimumStock)
      .sort((left, right) => left.stock - right.stock),
    todayJobs: state.bookings
      .filter((job) => isSameDay(new Date(job.start), today))
      .sort((left, right) => left.start.localeCompare(right.start)),
    awaiting: state.orders
      .filter((order) => !["completed", "cancelled"].includes(order.status))
      .sort((left, right) => right.createdAt.localeCompare(left.createdAt)),
  };
}
