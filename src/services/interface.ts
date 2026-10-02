import type {
  BookingDraft,
  BookingStatus,
  OrderDraft,
  OrderStatus,
  ProductDraft,
  ShopState,
  User,
} from "../domain/types";
export interface ShopService {
  snapshot(user: User): Promise<ShopState>;
  saveProduct(user: User, product: ProductDraft): Promise<void>;
  moveStock(
    user: User,
    productId: string,
    delta: number,
    reason: string,
  ): Promise<void>;
  createOrder(user: User, order: OrderDraft): Promise<string>;
  transitionOrder(
    user: User,
    orderId: string,
    status: OrderStatus,
  ): Promise<void>;
  saveBooking(user: User, booking: BookingDraft): Promise<void>;
  transitionBooking(
    user: User,
    bookingId: string,
    status: BookingStatus,
  ): Promise<void>;
  reset(user: User): Promise<void>;
}
