import { media } from "@/data/media";
import type { Group } from "@/types";

export const groups: Group[] = [
  {
    id: "g-pune",
    slug: "36-spokes-pune",
    name: "36 Spokes Pune",
    city: "Pune, Maharashtra",
    description:
      "Ghat runs before the traffic, garage nights in Baner and the odd Konkan weekender.",
    memberCount: 214,
    rideCadence: "Sunday mornings",
    image: media.site.heroRide,
  },
  {
    id: "g-bengaluru",
    slug: "36-spokes-bengaluru",
    name: "36 Spokes Bengaluru",
    city: "Bengaluru, Karnataka",
    description: "Sunrise loops to Nandi Hills and monthly meetups at a partner workshop.",
    memberCount: 186,
    rideCadence: "Alternate Saturdays",
    image: media.riders.community,
  },
  {
    id: "g-belagavi",
    slug: "36-spokes-belagavi",
    name: "36 Spokes Belagavi",
    city: "Belagavi, Karnataka",
    description: "Forest roads toward Dandeli and Goa, with a camp or two every season.",
    memberCount: 58,
    rideCadence: "Once a month",
    image: media.destinations.meghalaya,
  },
  {
    id: "g-mumbai",
    slug: "36-spokes-mumbai",
    name: "36 Spokes Mumbai",
    city: "Mumbai, Maharashtra",
    description: "Early exits from the city for the coast road and the Sahyadri ghats.",
    memberCount: 142,
    rideCadence: "Sunday mornings",
    image: media.products.luggage,
  },
];
