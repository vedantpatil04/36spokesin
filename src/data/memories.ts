import { media } from "@/data/media";
import { withAlt } from "@/lib/media";
import type { Memory } from "@/types";

/** Newest first. The first entry is presented as the featured memory. */
export const memories: Memory[] = [
  {
    id: "mem-khardung-la-2025",
    date: "2025-09",
    marker: "Leh",
    title: "Over Khardung La before the snow",
    location: "Khardung La, Ladakh",
    caption:
      "The last departure of the season. Numb fingers, a pass closing behind us, and the quietest cup of chai any of us have had.",
    kind: "Expedition",
    image: withAlt(
      media.destinations.ladakh,
      "Motorcycle on a snow-lined high mountain pass in Ladakh",
    ),
  },
  {
    id: "mem-chorla-2024",
    date: "2024-06",
    marker: "Chorla",
    title: "Chorla Ghat in the first rain",
    location: "Chorla Ghat, Karnataka–Goa border",
    caption: "A short Sunday ride that became a monsoon habit.",
    kind: "Ride",
    image: withAlt(media.site.heroRide, "Rider climbing a mountain road under heavy cloud"),
  },
  {
    id: "mem-losar-2023",
    date: "2023-07",
    marker: "Losar",
    title: "The river crossing at Losar",
    location: "Spiti Valley, Himachal Pradesh",
    caption: "Snowmelt up to the footpegs. Everyone made it across, some of us twice.",
    kind: "Expedition",
    image: withAlt(media.destinations.spiti, "Gravel road winding through the Spiti valley"),
  },
  {
    id: "mem-garage-night-2022",
    date: "2022-11",
    marker: "Pune",
    title: "The first garage night",
    location: "Pune, Maharashtra",
    caption: "A borrowed workshop and a lesson on chain slack that ran well past midnight.",
    kind: "Workshop",
    image: withAlt(media.garage.workshop, "Mechanic working on a motorcycle in a workshop"),
  },
  {
    id: "mem-cherrapunji-2019",
    date: "2019-10",
    marker: "Sohra",
    title: "Riding inside the clouds",
    location: "Cherrapunji, Meghalaya",
    caption: "Wet tarmac, root bridges and cloud sitting right on the road.",
    kind: "Expedition",
    image: media.destinations.meghalaya,
  },
];
