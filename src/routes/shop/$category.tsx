import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/shop/$category")({
  beforeLoad: () => {
    throw redirect({ to: "/shop" });
  },
});
