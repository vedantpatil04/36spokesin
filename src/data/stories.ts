import { media } from "@/data/media";
import type { Story } from "@/types";

export const stories: Story[] = [
  {
    slug: "eleven-days-above-4000",
    title: "Eleven Days Above 4,000 Metres",
    rider: "Abhishek Sharma",
    riderId: "u-ankit",
    destination: "Ladakh",
    destinationSlug: "ladakh",
    publishedAt: "2025-10-04",
    readMinutes: 8,
    excerpt: "What the altitude does to a rider, a bike and a very carefully packed pannier.",
    body: [
      "The first thing Ladakh takes is your appetite. The second is the power from a carburetted engine, and by day three you stop noticing either, because the road has your full attention.",
      "We rode acclimatisation days on purpose: short hops, early stops, and water with every chai. Nobody on the group was fast. Everybody made it over Khardung La.",
      "The pannier list that worked: one warm layer too many, a tyre plug kit, spare clutch and throttle cables, and a thermos. The one that didn't: anything packed for how it looks.",
    ],
    image: media.destinations.ladakh,
  },
  {
    slug: "spiti-in-shoulder-season",
    title: "Spiti in Shoulder Season",
    rider: "Simran Kathuria",
    riderId: "u-meera",
    destination: "Spiti",
    destinationSlug: "spiti",
    publishedAt: "2025-11-12",
    readMinutes: 6,
    excerpt: "Fewer riders, colder mornings, and river crossings that change by the hour.",
    body: [
      "Late September in Spiti means empty homestays and frost on the seat at breakfast. It also means the water crossings you read about in July are knee-deep in the morning and ankle-deep by the afternoon.",
      "We timed every crossing for after lunch and never regretted it. The monasteries were quiet, the light was sharp, and the road from Kaza to Losar felt like it belonged to us.",
    ],
    image: media.destinations.spiti,
  },
  {
    slug: "packing-for-rain",
    title: "Packing for Rain That Never Stops",
    rider: "sammets",
    riderId: "u-sahil",
    destination: "Meghalaya",
    destinationSlug: "meghalaya",
    publishedAt: "2026-01-20",
    readMinutes: 5,
    excerpt: "A practical kit list built over three monsoon runs through the North East.",
    body: [
      "Waterproof is a spectrum, and Meghalaya finds the weak end of it. After three monsoon runs, the kit that works is the one that dries overnight, not the one that promises never to get wet.",
      "Dry bags inside the panniers, a spare pair of gloves in a zip bag, anti-fog on the visor and a phone mount that doesn't mind water. Ride slower than you think you need to; the tarmac is always wetter than it looks.",
    ],
    image: media.destinations.meghalaya,
  },
];
