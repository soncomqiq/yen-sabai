import { format } from "date-fns";
import { th } from "date-fns/locale";
export const money = (value: number) =>
  new Intl.NumberFormat("th-TH", {
    style: "currency",
    currency: "THB",
    maximumFractionDigits: 0,
  }).format(value);
export const number = (value: number) =>
  new Intl.NumberFormat("th-TH").format(value);
export const dateText = (value: string | Date, pattern = "d MMM yyyy") =>
  format(new Date(value), pattern, { locale: th });
export const localInput = (value: string | Date) =>
  format(new Date(value), "yyyy-MM-dd'T'HH:mm");
export const todayInput = () => format(new Date(), "yyyy-MM-dd");
