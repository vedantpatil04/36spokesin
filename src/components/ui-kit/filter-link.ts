/**
 * URL filters keep scroll position, replace history so flicking between filters
 * doesn't bury the back button, and only report the exact match as current.
 */
export const filterLinkBehavior = {
  replace: true,
  resetScroll: false,
  activeOptions: { exact: true, includeSearch: true },
} as const;
