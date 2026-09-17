/**
 * The sample signed-in rider behind "My 36 Spokes".
 *
 * Stored as ids, the way a backend returns them. src/services/member.ts joins
 * these with catalogue data into a MemberOverview.
 */

import type {
  ActivityItem,
  Booking,
  ID,
  MaintenanceRecord,
  Order,
  OwnedBike,
  RiderProfile,
} from "@/types";

export const memberProfile: RiderProfile = {
  id: "member-ankit",
  firstName: "Ankit",
  lastName: "Deshmukh",
  email: "ankit@example.com",
  city: "Pune",
  memberSince: "2022",
};

/** Static so server and client render the same text. */
export const memberGreeting = "Evening, Ankit";

export const memberBikes: OwnedBike[] = [
  { id: "ob-himalayan", bikeId: "re-himalayan-450", odometerKm: 18420, serviceDueInKm: 1580 },
];

export const memberMaintenance: MaintenanceRecord[] = [];

export const memberUpcomingRideId: ID | null = "r-sahyadri";

export const memberBookings: Booking[] = [
  {
    id: "bk-ladakh",
    riderId: "member-ankit",
    tripId: "t-ladakh-sep",
    departureId: "dep-ladakh-2026-09",
    status: "confirmed",
    seats: 1,
    amount: 62000,
    createdAt: "2026-06-02T10:15:00+05:30",
  },
];

export const memberSavedRideIds: ID[] = ["r-coast"];
export const memberSavedTripIds: ID[] = ["t-spiti-oct"];
export const memberGroupIds: ID[] = ["g-pune"];
export const memberStorySlugs: string[] = [];

export const memberOrders: Order[] = [
  {
    id: "ord-10428",
    number: "10428",
    riderId: "member-ankit",
    status: "packed",
    items: [
      {
        productId: "p-alu-pannier-38",
        name: "Expedition Aluminium Pannier Set 38L",
        quantity: 1,
        unitPrice: 34900,
      },
    ],
    total: 34900,
    placedAt: "2026-09-10T18:40:00+05:30",
  },
];

export const memberActivity: ActivityItem[] = [
  { id: "act-order", label: "Order #10428 packed — Expedition Aluminium Pannier Set" },
  { id: "act-ride", label: "Joined group ride: Sahyadri Ghat Weekender" },
  { id: "act-route", label: "Saved route: Konkan Coast Run" },
  { id: "act-enquiry", label: "Enquiry sent: Spiti Circuit, October departure" },
];
