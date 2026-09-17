import { Compass, Home, Map, ShoppingBag, Wrench } from "lucide-react";

/**
 * Every navigation list in one place. `as const` keeps `to` values literal so
 * TanStack Router type-checks each destination.
 */

export const primaryNav = [
  { label: "Garage", to: "/garage" },
  { label: "Travel", to: "/travel" },
  { label: "Shop", to: "/shop" },
  { label: "Rides", to: "/rides" },
  { label: "Community", to: "/community" },
] as const;

/** Extra destinations shown only in the mobile menu. */
export const mobileMenuExtras = [
  { label: "Stories", to: "/stories" },
  { label: "My 36 Spokes", to: "/my-36-spokes" },
] as const;

export const mobileTabs = [
  { label: "Home", to: "/", icon: Home },
  { label: "Travel", to: "/travel", icon: Map },
  { label: "Shop", to: "/shop", icon: ShoppingBag },
  { label: "Rides", to: "/rides", icon: Compass },
  { label: "Garage", to: "/garage", icon: Wrench },
] as const;

export const footerColumns = [
  {
    title: "Explore",
    links: [
      { label: "Travel", to: "/travel" },
      { label: "Rides", to: "/rides" },
      { label: "Stories", to: "/stories" },
      { label: "Community", to: "/community" },
    ],
  },
  {
    title: "Ride & Gear",
    links: [
      { label: "Shop", to: "/shop" },
      { label: "Garage", to: "/garage" },
      { label: "My 36 Spokes", to: "/my-36-spokes" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "Login", to: "/login" },
      { label: "Join 36 Spokes", to: "/join" },
    ],
  },
] as const;

/** My 36 Spokes sections. `exact` keeps Dashboard from matching every sub-page. */
export const memberNav = [
  { label: "Dashboard", to: "/my-36-spokes", exact: true },
  { label: "My Garage", to: "/my-36-spokes/garage", exact: false },
  { label: "My Rides", to: "/my-36-spokes/rides", exact: false },
  { label: "My Travel", to: "/my-36-spokes/travel", exact: false },
  { label: "My Shop", to: "/my-36-spokes/shop", exact: false },
  { label: "My Community", to: "/my-36-spokes/community", exact: false },
  { label: "My Profile", to: "/profile", exact: false },
] as const;
