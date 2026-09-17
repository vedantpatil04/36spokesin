import { media } from "@/data/media";
import { withAlt } from "@/lib/media";
import type { Pillar } from "@/types";

/** The five entry points presented on the homepage. */
export const pillars: Pillar[] = [
  {
    id: "garage",
    name: "Garage",
    tagline: "Your bike. Your setup. Your machine.",
    cta: "Open the garage",
    to: "/garage",
    image: media.garage.workshop,
  },
  {
    id: "shop",
    name: "Shop",
    tagline: "Gear and parts matched to the bike you ride.",
    cta: "Browse gear",
    to: "/shop",
    image: media.products.protect,
  },
  {
    id: "travel",
    name: "Travel",
    tagline: "Destinations, tours and long motorcycle journeys.",
    cta: "Explore trips",
    to: "/travel",
    image: withAlt(
      media.destinations.ladakh,
      "Loaded motorcycle on a snow-lined mountain road in Ladakh",
    ),
  },
  {
    id: "rides",
    name: "Rides",
    tagline: "Routes, weekend runs and group rides near you.",
    cta: "Find a ride",
    to: "/rides",
    image: withAlt(
      media.destinations.spiti,
      "Motorcycle on a winding gravel road through a mountain valley",
    ),
  },
  {
    id: "community",
    name: "Community",
    tagline: "Riders, groups, stories and meets.",
    cta: "Meet the riders",
    to: "/community",
    image: media.riders.community,
  },
];
