import { Badge } from "@/components/ui-kit";
import { formatINR } from "@/lib/format";
import type { Order, OrderStatus } from "@/types";

const statusLabel: Record<OrderStatus, string> = {
  placed: "Placed",
  packed: "Packed",
  shipped: "Shipped",
  delivered: "Delivered",
  cancelled: "Cancelled",
};

export function OrderList({ orders }: { orders: Order[] }) {
  return (
    <ul className="mt-4 divide-y divide-border">
      {orders.map((order) => (
        <li
          key={order.id}
          className="flex flex-col gap-2 py-4 first:pt-0 last:pb-0 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="min-w-0">
            <p className="font-display text-base uppercase">Order #{order.number}</p>
            <p className="mt-1 truncate text-sm text-muted-foreground">
              {order.items.map((item) => item.name).join(", ")} <span aria-hidden>·</span>{" "}
              {formatINR(order.total)}
            </p>
          </div>
          <Badge tone={order.status === "delivered" ? "success" : "primary"}>
            {statusLabel[order.status]}
          </Badge>
        </li>
      ))}
    </ul>
  );
}
