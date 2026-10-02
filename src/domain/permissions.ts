import type { Role } from "./types";
export type Page =
  "dashboard" | "products" | "orders" | "bookings" | "customers";
export function canAccessPage(role: Role, page: string) {
  return role !== "technician" || page === "bookings";
}
export const canSeeDashboardSales = (role: Role) => role === "owner";
