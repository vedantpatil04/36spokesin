import { createFileRoute } from "@tanstack/react-router";
import { ShopComingSoon } from "@/components/coming-soon/ShopComingSoon";
import { seo } from "@/lib/seo";

export const Route = createFileRoute("/shop/")({
  head: () =>
    seo({
      title: "Shop: Gear for the Road Ahead | 36 Spokes",
      description: "Curated motorcycle gear and equipment are coming to 36 Spokes. Coming soon.",
      socialDescription: "Gear for the road ahead.",
      path: "/shop",
    }),
  component: ShopComingSoon,
});
