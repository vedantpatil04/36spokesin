import type { ID, ISODateTime, RupeeAmount } from "./common";

export type CartItem = {
  productId: ID;
  quantity: number;
};

export type WishlistItem = {
  productId: ID;
  addedAt: ISODateTime;
};

export type OrderStatus = "placed" | "packed" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  productId: ID;
  name: string;
  quantity: number;
  unitPrice: RupeeAmount;
};

export type Order = {
  id: ID;
  /** Customer-facing number, e.g. "10428". */
  number: string;
  riderId: ID;
  status: OrderStatus;
  items: OrderItem[];
  total: RupeeAmount;
  placedAt: ISODateTime;
};

export type BookingStatus = "enquiry" | "held" | "confirmed" | "cancelled";

export type Booking = {
  id: ID;
  riderId: ID;
  tripId: ID;
  departureId: ID;
  status: BookingStatus;
  seats: number;
  amount: RupeeAmount;
  createdAt: ISODateTime;
};
