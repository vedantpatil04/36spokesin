/**
 * Development bootstrap data: product categories, a small bike catalogue, six
 * sample products, three destinations with two trips, three rides and the two
 * confirmed founders (names only, and only when no founder exists). Run it
 * explicitly:
 *
 *   npm run db:seed
 *
 * It only ever CREATES rows whose slug is missing. Anything that already
 * exists — including everything edited in the admin CMS — is left untouched, so
 * re-running it is safe. Nothing runs it on server start or deploy.
 *
 * It refuses to run when NODE_ENV=production unless `--allow-production` is
 * passed. Images are not seeded: upload them through the admin CMS so they live
 * in R2 like every other image. Trip departures and rides are dated relative to
 * the day the seed runs.
 */
import { parseArgs } from "node:util";
import { PrismaPg } from "@prisma/adapter-pg";
import { seedFoundersIfEmpty } from "../src/community/founders.seed.js";
import { PrismaClient } from "../src/generated/prisma/client.js";
import {
  BikeSegment,
  ContentStatus,
  Difficulty,
  ProductStatus,
  RideStatus,
  RideType,
  SocialMediaType,
  SocialPlatform,
  SocialPostStatus,
  StockStatus,
} from "../src/generated/prisma/enums.js";

const INITIAL_SOCIAL_POSTS = [
  {
    postUrl: "https://www.instagram.com/reel/Ddgs-VpKlSy/?stkn=MWYxdDU0ajJrN3p0eQ==",
    mediaType: SocialMediaType.VIDEO,
    imageUrl: null,
    videoUrl: null,
    caption: null,
    username: null,
    platform: SocialPlatform.INSTAGRAM,
    status: SocialPostStatus.PUBLISHED,
    sortOrder: 0,
    isFeatured: false,
  },
  {
    postUrl: "https://www.instagram.com/reel/Ddf_jSxInDn/?stkn=MTA0aGZ2YW9hbjlicw==",
    mediaType: SocialMediaType.VIDEO,
    imageUrl: null,
    videoUrl: null,
    caption: null,
    username: null,
    platform: SocialPlatform.INSTAGRAM,
    status: SocialPostStatus.PUBLISHED,
    sortOrder: 1,
    isFeatured: false,
  },
  {
    postUrl: "https://www.instagram.com/p/Dderu-dyxUP/?stkn=MWc0Znp5b2ttdzBlaQ==",
    mediaType: SocialMediaType.IMAGE,
    imageUrl: null,
    videoUrl: null,
    caption: null,
    username: null,
    platform: SocialPlatform.INSTAGRAM,
    status: SocialPostStatus.PUBLISHED,
    sortOrder: 2,
    isFeatured: false,
  },
];

type SeedBike = {
  brand: string;
  brandSlug: string;
  name: string;
  slug: string;
  segment: BikeSegment;
  displacementCc: number;
  fuelEfficiencyKmpl: number;
  tankLitres: number;
  variants: string[];
};

const CATEGORIES = [
  { slug: "protect", name: "Protect", description: "Helmets, armour, guards" },
  { slug: "carry", name: "Carry", description: "Panniers, tail bags, racks" },
  { slug: "navigate", name: "Navigate", description: "Mounts, GPS, comms" },
  { slug: "light", name: "Light", description: "Auxiliary lights, wiring" },
  { slug: "ride", name: "Ride", description: "Seats, bars, footpegs" },
  { slug: "prepare", name: "Prepare", description: "Tools, spares, recovery" },
];

const BIKES: SeedBike[] = [
  {
    brand: "Royal Enfield",
    brandSlug: "royal-enfield",
    name: "Himalayan 450",
    slug: "royal-enfield-himalayan-450",
    segment: BikeSegment.ADVENTURE,
    displacementCc: 452,
    fuelEfficiencyKmpl: 30,
    tankLitres: 17,
    variants: ["Kaza Brown", "Slate Himalayan Salt", "Hanle Black"],
  },
  {
    brand: "KTM",
    brandSlug: "ktm",
    name: "390 Adventure",
    slug: "ktm-390-adventure",
    segment: BikeSegment.ADVENTURE,
    displacementCc: 399,
    fuelEfficiencyKmpl: 30,
    tankLitres: 14.5,
    variants: ["X", "S"],
  },
  {
    brand: "BMW",
    brandSlug: "bmw",
    name: "G 310 GS",
    slug: "bmw-g-310-gs",
    segment: BikeSegment.ADVENTURE,
    displacementCc: 313,
    fuelEfficiencyKmpl: 30,
    tankLitres: 11,
    variants: ["Standard", "Rallye"],
  },
  {
    brand: "Triumph",
    brandSlug: "triumph",
    name: "Scrambler 400 X",
    slug: "triumph-scrambler-400-x",
    segment: BikeSegment.SCRAMBLER,
    displacementCc: 398,
    fuelEfficiencyKmpl: 28,
    tankLitres: 13,
    variants: ["Standard"],
  },
  {
    brand: "Honda",
    brandSlug: "honda",
    name: "NX500",
    slug: "honda-nx500",
    segment: BikeSegment.TOURING,
    displacementCc: 471,
    fuelEfficiencyKmpl: 27,
    tankLitres: 17.5,
    variants: ["Standard"],
  },
  {
    brand: "Yamaha",
    brandSlug: "yamaha",
    name: "MT-15 V2",
    slug: "yamaha-mt-15-v2",
    segment: BikeSegment.STREET,
    displacementCc: 155,
    fuelEfficiencyKmpl: 45,
    tankLitres: 10,
    variants: ["Standard"],
  },
];

type SeedProduct = {
  slug: string;
  sku: string;
  name: string;
  shortDescription: string;
  category: string;
  /** Whole rupees; stored in paise. */
  rupees: number;
  stockQuantity: number;
  stockStatus: StockStatus;
  universalFit: boolean;
  fits: string[];
  specifications: { label: string; value: string }[];
};

const PRODUCTS: SeedProduct[] = [
  {
    slug: "expedition-aluminium-pannier-set-38l",
    sku: "36S-CRY-PAN-38",
    name: "Expedition Aluminium Pannier Set 38L",
    shortDescription:
      "A pair of lockable aluminium cases on bike-specific frames. Quick release, dust sealed.",
    category: "carry",
    rupees: 34900,
    stockQuantity: 12,
    stockStatus: StockStatus.IN_STOCK,
    universalFit: false,
    fits: [
      "royal-enfield-himalayan-450",
      "ktm-390-adventure",
      "bmw-g-310-gs",
      "triumph-scrambler-400-x",
      "honda-nx500",
    ],
    specifications: [
      { label: "Capacity", value: "38 L per side" },
      { label: "Material", value: "2 mm anodised aluminium" },
    ],
  },
  {
    slug: "ridgeline-adv-helmet-with-peak",
    sku: "36S-PRT-HLM-ADV",
    name: "Ridgeline ADV Helmet with Peak",
    shortDescription:
      "Dual-sport helmet with a removable peak, drop-down sun visor and pinlock-ready shield.",
    category: "protect",
    rupees: 18900,
    stockQuantity: 20,
    stockStatus: StockStatus.IN_STOCK,
    universalFit: true,
    fits: [],
    specifications: [
      { label: "Certification", value: "ECE 22.06, ISI" },
      { label: "Weight", value: "1,550 g (M)" },
    ],
  },
  {
    slug: "upper-and-lower-crash-guard",
    sku: "36S-PRT-CRG-UL",
    name: "Upper & Lower Crash Guard",
    shortDescription:
      "Powder-coated steel guards that protect the tank and engine cases in a tip-over.",
    category: "protect",
    rupees: 8450,
    stockQuantity: 3,
    stockStatus: StockStatus.LOW_STOCK,
    universalFit: false,
    fits: ["royal-enfield-himalayan-450", "ktm-390-adventure", "triumph-scrambler-400-x"],
    specifications: [{ label: "Material", value: "25 mm mild steel tube, powder coated" }],
  },
  {
    slug: "trailbeam-auxiliary-light-pair",
    sku: "36S-LGT-AUX-PR",
    name: "Trailbeam Auxiliary Light Pair",
    shortDescription:
      "A pair of LED fog lights with a switched wiring harness for night and cloud riding.",
    category: "light",
    rupees: 6200,
    stockQuantity: 8,
    stockStatus: StockStatus.IN_STOCK,
    universalFit: false,
    fits: ["ktm-390-adventure", "bmw-g-310-gs", "honda-nx500"],
    specifications: [{ label: "Output", value: "2 × 20 W" }],
  },
  {
    slug: "vibration-damped-phone-mount",
    sku: "36S-NAV-MNT-VD",
    name: "Vibration-Damped Phone Mount",
    shortDescription:
      "Handlebar mount with a damper that keeps single-cylinder vibration off your phone camera.",
    category: "navigate",
    rupees: 3450,
    stockQuantity: 30,
    stockStatus: StockStatus.IN_STOCK,
    universalFit: true,
    fits: [],
    specifications: [{ label: "Bar diameter", value: "22–32 mm" }],
  },
  {
    slug: "roadside-tool-roll-and-tyre-kit",
    sku: "36S-PRP-TOOL-KIT",
    name: "Roadside Tool Roll & Tyre Kit",
    shortDescription:
      "Tubeless plug kit, CO2 inflator and the spanners you actually need on the side of the road.",
    category: "prepare",
    rupees: 4290,
    stockQuantity: 0,
    stockStatus: StockStatus.OUT_OF_STOCK,
    universalFit: true,
    fits: [],
    specifications: [
      { label: "Contents", value: "Plugs, reamer, 3 CO2 cartridges, 8–17 mm spanners" },
    ],
  },
];

const DESTINATIONS = [
  {
    slug: "ladakh",
    name: "Ladakh",
    region: "Union Territory of Ladakh",
    shortDescription: "High passes, cold desert, thin air and very long horizons.",
    difficulty: Difficulty.CHALLENGING,
    bestSeason: "June to September",
    durationRecommendation: "10–12 days",
    usefulInfo: "Acclimatise for a day in Leh before crossing any pass. Carry fuel beyond Tandi.",
  },
  {
    slug: "spiti",
    name: "Spiti",
    region: "Himachal Pradesh",
    shortDescription: "Broken tracks, river crossings and monasteries above the treeline.",
    difficulty: Difficulty.CHALLENGING,
    bestSeason: "June to October",
    durationRecommendation: "8–10 days",
    usefulInfo: "An Inner Line Permit is needed for the Kinnaur side. ATMs are few beyond Kaza.",
  },
  {
    slug: "meghalaya",
    name: "Meghalaya",
    region: "North East India",
    shortDescription: "Wet tarmac, living root bridges and cloud that sits on the road.",
    difficulty: Difficulty.MODERATE,
    bestSeason: "October to April",
    durationRecommendation: "6–8 days",
    usefulInfo: null,
  },
];

const TRIPS = [
  {
    slug: "ladakh-passes-and-plateaus",
    name: "Ladakh: Passes & Plateaus",
    destination: "ladakh",
    durationDays: 11,
    distanceKm: 1820,
    difficulty: Difficulty.CHALLENGING,
    startingLocation: "Manali",
    endingLocation: "Leh",
    departures: [
      { inDays: 30, rupees: 62000, capacity: 12 },
      { inDays: 75, rupees: 62000, capacity: 12 },
    ],
    itinerary: ["Arrive in Manali", "Manali to Jispa", "Jispa to Sarchu", "Sarchu to Leh"],
  },
  {
    slug: "spiti-circuit",
    name: "Spiti Circuit",
    destination: "spiti",
    durationDays: 9,
    distanceKm: 1340,
    difficulty: Difficulty.CHALLENGING,
    startingLocation: "Shimla",
    endingLocation: "Manali",
    departures: [{ inDays: 45, rupees: 48000, capacity: 10 }],
    itinerary: ["Arrive in Shimla", "Shimla to Sangla", "Sangla to Kalpa", "Kalpa to Kaza"],
  },
];

const RIDES = [
  {
    slug: "nandi-hills-sunrise-loop",
    title: "Nandi Hills Sunrise Loop",
    type: RideType.DAY_RIDE,
    location: "Bengaluru",
    shortDescription: "An early climb to catch sunrise above the clouds, back before the traffic.",
    meetingPoint: "Hebbal flyover",
    inDays: 6,
    hour: 4,
    durationLabel: "5 hrs",
    routeStart: "Bengaluru",
    routeFinish: "Bengaluru",
    waypoints: ["Devanahalli", "Nandi Hills"],
    distanceKm: 120,
    difficulty: Difficulty.EASY,
    capacity: 20,
    destination: null,
  },
  {
    slug: "sahyadri-ghat-weekender",
    title: "Sahyadri Ghat Weekender",
    type: RideType.WEEKEND,
    location: "Pune",
    shortDescription:
      "Two days of ghat roads with a night in Mahabaleshwar. Expect fog on the climbs.",
    meetingPoint: "Chandni Chowk, Pune",
    inDays: 13,
    hour: 6,
    durationLabel: "2 days",
    routeStart: "Pune",
    routeFinish: "Pune",
    waypoints: ["Tamhini Ghat", "Kolad", "Mahabaleshwar"],
    distanceKm: 420,
    difficulty: Difficulty.MODERATE,
    capacity: 15,
    destination: null,
  },
  {
    slug: "spiti-warm-up-ride",
    title: "Spiti Warm-up Ride",
    type: RideType.GROUP_RIDE,
    location: "Chandigarh",
    shortDescription: "A shakedown day in the Shivaliks for riders heading to Spiti this season.",
    meetingPoint: "Sector 17 plaza, Chandigarh",
    inDays: 20,
    hour: 5,
    durationLabel: "1 day",
    routeStart: "Chandigarh",
    routeFinish: "Chandigarh",
    waypoints: ["Kasauli", "Barog"],
    distanceKm: 210,
    difficulty: Difficulty.MODERATE,
    capacity: 12,
    destination: "spiti",
  },
];

/** A date `days` from today (UTC midnight) for `@db.Date` columns. */
function daysFromToday(days: number): Date {
  const now = new Date();
  return new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate() + days));
}

async function main(): Promise<void> {
  try {
    process.loadEnvFile();
  } catch {
    // No .env file; use the process environment.
  }

  const { values } = parseArgs({
    options: { "allow-production": { type: "boolean", default: false } },
  });
  if (process.env["NODE_ENV"] === "production" && !values["allow-production"]) {
    throw new Error(
      "Refusing to seed with NODE_ENV=production. Pass --allow-production to override.",
    );
  }
  const databaseUrl = process.env["DATABASE_URL"];
  if (!databaseUrl) throw new Error("DATABASE_URL is not set");

  const prisma = new PrismaClient({ adapter: new PrismaPg({ connectionString: databaseUrl }) });
  const created = {
    categories: 0,
    bikeBrands: 0,
    bikeModels: 0,
    products: 0,
    destinations: 0,
    trips: 0,
    rides: 0,
    socialPosts: 0,
  };

  try {
    for (const [index, category] of CATEGORIES.entries()) {
      const exists = await prisma.productCategory.findUnique({ where: { slug: category.slug } });
      if (exists) continue;
      await prisma.productCategory.create({ data: { ...category, sortOrder: index } });
      created.categories += 1;
    }

    for (const bike of BIKES) {
      let brand = await prisma.bikeBrand.findUnique({ where: { slug: bike.brandSlug } });
      if (!brand) {
        brand = await prisma.bikeBrand.create({ data: { slug: bike.brandSlug, name: bike.brand } });
        created.bikeBrands += 1;
      }
      const exists = await prisma.bikeModel.findUnique({ where: { slug: bike.slug } });
      if (exists) continue;
      await prisma.bikeModel.create({
        data: {
          brandId: brand.id,
          slug: bike.slug,
          name: bike.name,
          segment: bike.segment,
          displacementCc: bike.displacementCc,
          fuelEfficiencyKmpl: bike.fuelEfficiencyKmpl,
          tankLitres: bike.tankLitres,
          variants: { create: bike.variants.map((name, sortOrder) => ({ name, sortOrder })) },
        },
      });
      created.bikeModels += 1;
    }

    const models = new Map(
      (await prisma.bikeModel.findMany({ select: { id: true, slug: true } })).map((model) => [
        model.slug,
        model.id,
      ]),
    );
    const categories = new Map(
      (await prisma.productCategory.findMany({ select: { id: true, slug: true } })).map(
        (category) => [category.slug, category.id],
      ),
    );

    for (const product of PRODUCTS) {
      const exists = await prisma.product.findFirst({
        where: { OR: [{ slug: product.slug }, { sku: product.sku }] },
      });
      const categoryId = categories.get(product.category);
      if (exists || !categoryId) continue;
      await prisma.product.create({
        data: {
          slug: product.slug,
          sku: product.sku,
          name: product.name,
          shortDescription: product.shortDescription,
          categoryId,
          price: product.rupees * 100,
          status: ProductStatus.PUBLISHED,
          publishedAt: new Date(),
          stockQuantity: product.stockQuantity,
          stockStatus: product.stockStatus,
          universalFit: product.universalFit,
          specifications: {
            create: product.specifications.map((spec, sortOrder) => ({ ...spec, sortOrder })),
          },
          compatibility: {
            create: product.fits.flatMap((slug) => {
              const bikeModelId = models.get(slug);
              return bikeModelId ? [{ bikeModelId }] : [];
            }),
          },
        },
      });
      created.products += 1;
    }

    for (const destination of DESTINATIONS) {
      if (await prisma.destination.findUnique({ where: { slug: destination.slug } })) continue;
      await prisma.destination.create({
        data: { ...destination, status: ContentStatus.PUBLISHED, publishedAt: new Date() },
      });
      created.destinations += 1;
    }
    const destinations = new Map(
      (await prisma.destination.findMany({ select: { id: true, slug: true } })).map((row) => [
        row.slug,
        row.id,
      ]),
    );

    for (const trip of TRIPS) {
      const destinationId = destinations.get(trip.destination);
      if (!destinationId || (await prisma.trip.findUnique({ where: { slug: trip.slug } })))
        continue;
      await prisma.trip.create({
        data: {
          slug: trip.slug,
          name: trip.name,
          destinationId,
          durationDays: trip.durationDays,
          distanceKm: trip.distanceKm,
          difficulty: trip.difficulty,
          startingLocation: trip.startingLocation,
          endingLocation: trip.endingLocation,
          status: ContentStatus.PUBLISHED,
          publishedAt: new Date(),
          itinerary: {
            create: trip.itinerary.map((title, index) => ({ dayNumber: index + 1, title })),
          },
          departures: {
            create: trip.departures.map((departure) => ({
              startDate: daysFromToday(departure.inDays),
              endDate: daysFromToday(departure.inDays + trip.durationDays - 1),
              price: departure.rupees * 100,
              capacity: departure.capacity,
            })),
          },
        },
      });
      created.trips += 1;
    }

    for (const { inDays, hour, destination, ...ride } of RIDES) {
      if (await prisma.ride.findUnique({ where: { slug: ride.slug } })) continue;
      const startsAt = daysFromToday(inDays);
      // `hour` is IST (UTC+5:30).
      startsAt.setUTCHours(hour - 6, 30);
      await prisma.ride.create({
        data: {
          ...ride,
          startsAt,
          status: RideStatus.UPCOMING,
          publishedAt: new Date(),
          destinationId: destination ? (destinations.get(destination) ?? null) : null,
        },
      });
      created.rides += 1;
    }

    const socialPostCount = await prisma.socialPost.count();
    if (socialPostCount === 0) {
      for (const post of INITIAL_SOCIAL_POSTS) {
        await prisma.socialPost.create({
          data: post,
        });
        created.socialPosts += 1;
      }
    }

    // Founders: names only, never overwriting anything an admin has changed.
    // Stories, rider spotlights and groups are not seeded: they are real
    // content, entered through the admin CMS.
    const founders = await seedFoundersIfEmpty(prisma);

    console.log(
      `Seed complete. Created ${created.categories} categories, ${created.bikeBrands} bike brands, ` +
        `${created.bikeModels} bike models, ${created.products} products, ${created.destinations} ` +
        `destinations, ${created.trips} trips, ${created.rides} rides, ${created.socialPosts} social posts and ${founders} founders. Existing rows were left unchanged.`,
    );
  } finally {
    await prisma.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error instanceof Error ? error.message : error);
  process.exit(1);
});
