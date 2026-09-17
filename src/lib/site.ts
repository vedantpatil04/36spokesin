/** Site-wide identity used by metadata and layout. */
export const site = {
  name: "36 Spokes",
  defaultTitle: "36 Spokes | Motorcycle Travel, Gear & Rider Community",
  defaultDescription:
    "36 Spokes is a motorcycle lifestyle platform: expeditions, gear matched to your bike, rides and a rider community.",
  defaultSocialDescription:
    "Motorcycle travel, gear matched to your bike, rides and a rider community.",
  /** Served from /public so crawlers can fetch it at a stable URL. */
  socialImagePath: "/brand-logo.jpg",
  locale: "en_IN",
} as const;
