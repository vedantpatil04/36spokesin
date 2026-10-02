import { createFileRoute, redirect } from "@tanstack/react-router";

export const Route = createFileRoute("/garage/$bike")({
  beforeLoad: () => {
    throw redirect({ to: "/garage" });
  },
});
