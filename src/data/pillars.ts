import { media } from "@/data/media";
import { withAlt } from "@/lib/media";
import type { Pillar } from "@/types";

/** The five entry points presented on the homepage: Rides, Plan, Shop, Garage, Community. */
export const pillars: Pillar[] = [
  {
    id: "rides",
    name: "Rides",
    tagline: "Routes, weekend runs and group rides near you.",
    description: "From Sahyadri ghat scrambles to Sunday sunrise loops.",
    cta: "Find a ride",
    to: "/rides",
    image: withAlt(
      media.destinations.spiti,
      "Motorcycle on a winding gravel road through a mountain valley",
    ),
  },
  {
    id: "plan",
    name: "Plan",
    tagline: "Custom journeys, route blueprints, and day-by-day itineraries.",
    description: "Map out waypoints, seasonal weather, fuel limits, and stays.",
    cta: "Plan your journey",
    to: "/plan",
    image: withAlt(
      media.destinations.ladakh,
      "Loaded motorcycle on a snow-lined mountain road in Ladakh",
    ),
  },
  {
    id: "shop",
    name: "Shop",
    tagline: "Curated protection and carry gear matched to your motorcycle.",
    description: "Hard-tested armor, weatherproof outerwear, and luggage systems.",
    cta: "Preview gear",
    to: "/shop",
    badge: "Coming soon",
    image: media.products.protect,
  },
  {
    id: "garage",
    name: "Garage",
    tagline: "Your motorcycle, maintenance log, and setup checklist.",
    description: "Keep track of every mod, service interval, and bolt check.",
    cta: "View garage",
    to: "/garage",
    badge: "Coming soon",
    image: media.garage.workshop,
  },
  {
    id: "community",
    name: "Community",
    tagline: "Founders, rider stories, regional chapters, and the road shared.",
    description: "The human side of 36 Spokes across India.",
    cta: "Enter community",
    to: "/community",
    image: media.riders.community,
  },
];
