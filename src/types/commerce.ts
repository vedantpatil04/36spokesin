import type { ID, ISODateTime, RupeeAmount } from "./common";
import type { Product } from "./product";

/** Why a cart line can't be bought as it stands. */
export type CartLineIssue = "not_available" | "out_of_stock" | "insufficient_stock";

export type CartLine = {
  id: ID;
  product: Product;
  quantity: number;
  unitPrice: RupeeAmount;
  lineTotal: RupeeAmount;
  issue: CartLineIssue | null;
};

/** The signed-in rider's cart, as stored on the server. */
export type Cart = {
  lines: CartLine[];
  itemCount: number;
  /** Lines without an issue only. */
  subtotal: RupeeAmount;
  readyForCheckout: boolean;
};

export type WishlistItem = {
  id: ID;
  product: Product;
  /** Still for sale in the shop. */
  available: boolean;
  addedAt: ISODateTime;
};

export type OrderStatus =
  "pending_payment" | "placed" | "packed" | "shipped" | "delivered" | "cancelled";

export type OrderItem = {
  productId: ID | null;
  name: string;
  quantity: number;
  unitPrice: RupeeAmount;
};

export type Order = {
  id: ID;
  /** Customer-facing number, e.g. "10428". */
  number: string;
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
