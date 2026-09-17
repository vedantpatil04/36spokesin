import { media } from "@/data/media";
import { withAlt } from "@/lib/media";
import type { CommunityEvent } from "@/types";

/** Sample listings hosted by 36 Spokes crews. */
export const events: CommunityEvent[] = [
  {
    id: "ev-sahyadri-sunrise",
    title: "Tamhini Ghat Sunrise Run",
    type: "Weekend Ride",
    startDate: "2026-10-17",
    location: "Pune, Maharashtra",
    meetingPoint: "Chandni Chowk, Pune, 5:30 am",
    level: "Open to all riders",
    host: "36 Spokes Pune",
    groupId: "g-pune",
    description:
      "An early run through the ghat while the road is empty, breakfast at Mulshi, back in the city before the traffic.",
    image: withAlt(media.site.heroRide, "Rider on a mountain road at sunrise"),
  },
  {
    id: "ev-garage-night-blr",
    title: "Garage Night: Bengaluru",
    type: "Community Meetup",
    startDate: "2026-10-23",
    location: "Bengaluru, Karnataka",
    meetingPoint: "Partner workshop, Indiranagar, 7:00 pm",
    level: "Open to all riders",
    host: "36 Spokes Bengaluru",
    groupId: "g-bengaluru",
    description:
      "Bring your bike, meet the riders from the group chat, and swap notes on the routes everyone keeps talking about.",
    image: withAlt(media.riders.community, "Riders gathered around their motorcycles"),
  },
  {
    id: "ev-roadside-repair",
    title: "Roadside Repair Basics",
    type: "Workshop",
    startDate: "2026-11-08",
    location: "Pune, Maharashtra",
    meetingPoint: "36 Spokes partner garage, Baner, 10:00 am",
    level: "Beginner friendly",
    host: "36 Spokes Garage",
    description:
      "Tubeless puncture repair, chain slack and lubing, and swapping a clutch cable on the side of the road.",
    image: withAlt(media.garage.workshop, "Mechanic fitting parts to an adventure motorcycle"),
  },
  {
    id: "ev-dandeli-camp",
    title: "Dandeli Ride & Riverside Camp",
    type: "Ride & Camp",
    startDate: "2026-11-21",
    endDate: "2026-11-22",
    location: "Dandeli, Karnataka",
    meetingPoint: "Belagavi bypass, 6:30 am",
    level: "Open to all riders",
    host: "36 Spokes Belagavi",
    groupId: "g-belagavi",
    description:
      "Forest roads to a camp on the Kali river. Tents, dinner and a slow ride home through the backroads on Sunday.",
    image: withAlt(
      media.destinations.meghalaya,
      "Motorcycle on a forest road surrounded by dense trees",
    ),
  },
  {
    id: "ev-desert-flag-off",
    title: "Desert Highways Flag-off",
    type: "Adventure Departure",
    startDate: "2026-12-06",
    location: "Jaipur, Rajasthan",
    meetingPoint: "Group hotel, Jaipur, 7:00 am",
    level: "Experienced riders",
    host: "36 Spokes Travel",
    description:
      "Send-off for the eight-day Desert Highways expedition. Riders on the trip meet the crew; anyone can ride the first 50 km.",
    image: withAlt(
      media.destinations.ladakh,
      "Loaded motorcycles ready for a long-distance departure",
    ),
  },
  {
    id: "ev-packing-talk",
    title: "Packing a Loaded Bike",
    type: "Workshop",
    startDate: "2026-12-13",
    location: "Mumbai, Maharashtra",
    meetingPoint: "36 Spokes partner store, Andheri, 4:00 pm",
    level: "Beginner friendly",
    host: "36 Spokes Garage",
    description:
      "Weight distribution, pannier vs soft luggage, and what riders who have done Ladakh twice would leave at home.",
    image: media.products.luggage,
  },
];
