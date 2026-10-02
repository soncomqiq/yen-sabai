import type { Booking, BookingDraft, OrderStatus, Role } from "./types";
export const transitions: Record<OrderStatus, OrderStatus[]> = {
  pending: ["paid", "cancelled"],
  paid: ["fulfillment", "cancelled"],
  fulfillment: ["completed", "cancelled"],
  completed: [],
  cancelled: [],
};
export function requireOffice(role: Role) {
  if (role === "technician") throw new Error("บัญชีช่างไม่มีสิทธิ์ทำรายการนี้");
}
export function validateBooking(draft: BookingDraft, bookings: Booking[]) {
  const start = new Date(draft.start),
    end = new Date(draft.end);
  if (
    !Number.isFinite(start.getTime()) ||
    !Number.isFinite(end.getTime()) ||
    end <= start ||
    start.toDateString() !== end.toDateString()
  )
    throw new Error("เวลาสิ้นสุดต้องอยู่หลังเวลาเริ่มและอยู่ในวันเดียวกัน");
  if (
    bookings.some(
      (job) =>
        job.id !== draft.id &&
        job.technicianId === draft.technicianId &&
        new Date(job.start) < end &&
        new Date(job.end) > start,
    )
  )
    throw new Error(
      "ช่างมีงานในช่วงเวลานี้แล้ว กรุณาเลือกเวลาอื่นหรือเปลี่ยนช่าง",
    );
}
export function isScreenshotMode(location: Pick<Location, "search" | "hash">) {
  return (
    new URLSearchParams(location.search).get("screenshot") === "1" ||
    new URLSearchParams(location.hash.split("?")[1] ?? "").get("screenshot") ===
      "1"
  );
}
