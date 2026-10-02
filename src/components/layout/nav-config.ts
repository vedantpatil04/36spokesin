import { Compass, Home, Map, ShoppingBag, Users, Wrench } from "lucide-react";

/**
 * Every navigation list in one place. `as const` keeps `to` values literal so
 * TanStack Router type-checks each destination.
 */

export const primaryNav = [
  { label: "Rides", to: "/rides" },
  { label: "Plan", to: "/plan" },
  { label: "Shop", to: "/shop" },
  { label: "Garage", to: "/garage" },
  { label: "Community", to: "/community" },
  { label: "About", to: "/about" },
] as const;

/** Extra destinations shown only in the mobile menu. */
export const mobileMenuExtras = [{ label: "Stories", to: "/stories" }] as const;

/** The signed-in rider's account menu. Log out is rendered after these. */
export const accountNav = [
  { label: "My Profile", to: "/profile" },
  { label: "My 36 Spokes", to: "/my-36-spokes" },
] as const;

export const mobileTabs = [
  { label: "Home", to: "/", icon: Home },
  { label: "Rides", to: "/rides", icon: Compass },
  { label: "Plan", to: "/plan", icon: Map },
  { label: "Community", to: "/community", icon: Users },
  { label: "Garage", to: "/garage", icon: Wrench },
] as const;

export const footerColumns = [
  {
    title: "The Ride",
    links: [
      { label: "Rides", to: "/rides" },
      { label: "Plan", to: "/plan" },
    ],
  },
  {
    title: "The Community",
    links: [
      { label: "Community", to: "/community" },
      { label: "About", to: "/about" },
    ],
  },
  {
    title: "Bike & Gear",
    links: [
      { label: "Shop", to: "/shop" },
      { label: "Garage", to: "/garage" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My 36 Spokes", to: "/my-36-spokes" },
      { label: "Login", to: "/login" },
      { label: "Join 36 Spokes", to: "/join" },
    ],
  },
] as const;

/** My 36 Spokes sections. `exact` keeps Overview from matching every sub-page. */
export const memberNav = [
  { label: "Overview", to: "/my-36-spokes", exact: true },
  { label: "My Garage", to: "/my-36-spokes/garage", exact: false },
  { label: "My Rides", to: "/my-36-spokes/rides", exact: false },
  { label: "My Journeys", to: "/my-36-spokes/journeys", exact: false },
  { label: "My Travel", to: "/my-36-spokes/travel", exact: false },
  { label: "My Shop", to: "/my-36-spokes/shop", exact: false },
  { label: "My Community", to: "/my-36-spokes/community", exact: false },
] as const;
