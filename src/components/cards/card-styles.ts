/** Shared surface for entity cards. `group` drives image hover zoom. */
export const cardBase =
  "group relative flex flex-col overflow-hidden rounded-sm border border-border bg-card shadow-card transition-colors hover:border-border-strong";

/**
 * For cards whose whole surface is clickable through one stretched link or
 * button: the card draws the focus ring, the control itself does not.
 */
export const stretchedCardFocus =
  "has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring";

/** Makes a link or button cover its nearest positioned ancestor. */
export const stretchedControl = "after:absolute after:inset-0 focus-visible:outline-none";
