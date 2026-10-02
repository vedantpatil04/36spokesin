import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/admin/community/")({
  beforeLoad: () => {
    throw redirect({ to: "/admin/community/founders", replace: true });
  },
});
