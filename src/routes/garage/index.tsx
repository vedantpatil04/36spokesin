import { createFileRoute } from "@tanstack/react-router";
import { GarageComingSoon } from "@/components/coming-soon/GarageComingSoon";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/garage/")({
  head: () =>
    seo({
      title: "Garage: Your Bike. Your Setup. Your Road. | 36 Spokes",
      description:
        "Your personalized motorcycle garage is on the way. Coming soon to 36 Spokes.",
      socialDescription: "Your bike. Your setup. Your road.",
      path: "/garage",
    }),
  component: GarageComingSoon,
});
