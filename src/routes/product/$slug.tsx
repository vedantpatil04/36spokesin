import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/product/$slug")({
  beforeLoad: () => {
    throw redirect({ to: "/shop" });
  },
});
