/**
 * Plan Your Journey: Phase 1 sample data.
 *
 * The planner UI is built against the TravelPlan contract below. In Phase 1 a
 * deterministic mock generator (src/lib/journey-planner.ts) produces plans from
 * these hand-authored routes. A future routing / weather / stays backend should
 * return the same TravelPlan shape so the UI does not need to change.
 *
 * Distances, stays, prices and weather are approximate sample values.
 */

/* ---------------------------------- Types ---------------------------------- */

export type TripStyle = "Adventure" | "Scenic" | "Relaxed" | "Fast-paced" | "Weekend";

export type ClimateZone =
  "konkan-coast" | "western-ghats" | "deccan-plateau" | "himalaya-mid" | "himalaya-high";

export type Terrain = "plains" | "ghats" | "coast" | "high-altitude";

export type Season = "winter" | "summer" | "monsoon" | "post-monsoon";

export type StayKind = "Homestay" | "Hotel" | "Guesthouse" | "Camp" | "Beach hut";

export type Stay = {
  name: string;
  kind: StayKind;
  pricePerNight: number;
};

export type RouteStop = {
  name: string;
  region: string;
  kmFromPrevious: number;
  climate: ClimateZone;
  elevationM?: number;
  fuel?: boolean;
  /** Present when riders can realistically stop overnight here. */
  stay?: Stay;
  /** Places worth stopping for on the way into, or around, this stop. */
  highlights: string[];
};

export type JourneyRoute = {
  id: string;
  from: string;
  to: string;
  via: string;
  terrain: Terrain;
  /** Shown when the chosen pace is too quick for the route (e.g. altitude). */
  advisory?: string;
  stops: RouteStop[];
};

export type WeatherOutlook = {
  summary: string;
  minC: number;
  maxC: number;
  note?: string;
};

export type TravelPlanRequest = {
  routeId: string;
  bikeId: string;
  style: TripStyle;
  /** YYYY-MM-DD */
  startDate: string;
  /** YYYY-MM-DD */
  endDate: string;
};

export type TravelPlanNotice = {
  tone: "info" | "warning";
  message: string;
};

export type TravelPlanDay = {
  day: number;
  /** YYYY-MM-DD */
  date: string;
  from: string;
  to: string;
  distanceKm: number;
  ridingMinutes: number;
  elevationM?: number;
  stay: Stay | null;
  places: string[];
  weather: WeatherOutlook;
  fuel: { stop: string; note?: string };
  cost: { fuel: number; stay: number; food: number; total: number };
};

export type TravelPlan = {
  request: TravelPlanRequest;
  from: string;
  to: string;
  via: string;
  bikeName: string;
  style: TripStyle;
  styleTip: string;
  /** Overnight points in order, starting point first. */
  overnights: string[];
  totalKm: number;
  totalCost: number;
  /** Approximate distance the chosen bike covers on one tank on this terrain. */
  tankRangeKm: number;
  days: TravelPlanDay[];
  notices: TravelPlanNotice[];
  /** Phase 1 plans are generated from sample data only. */
  source: "sample";
};

/* ------------------------------- Trip styles ------------------------------- */

export const tripStyles: { id: TripStyle; description: string; dailyKm: number; tip: string }[] = [
  {
    id: "Adventure",
    description: "Rougher roads, bigger days",
    dailyKm: 240,
    tip: "Expect broken patches and water on the road. Check tyre pressure every morning.",
  },
  {
    id: "Scenic",
    description: "Viewpoints and good light",
    dailyKm: 200,
    tip: "Stops lean toward viewpoints. Ride the best stretches in the morning light.",
  },
  {
    id: "Relaxed",
    description: "Short days, more time off the bike",
    dailyKm: 160,
    tip: "Short riding days, with time to explore after you check in.",
  },
  {
    id: "Fast-paced",
    description: "Long days, fewer stops",
    dailyKm: 380,
    tip: "Long days with fewer stops. Start early and keep breaks short.",
  },
  {
    id: "Weekend",
    description: "Fit it into two days",
    dailyKm: 300,
    tip: "Squeezed into two days, so pick the stops that matter most to you.",
  },
];

/* ------------------------------- Assumptions ------------------------------- */

export const planAssumptions = {
  fuelPricePerLitre: 105,
  foodPerDay: 900,
  terrain: {
    plains: { avgSpeedKmh: 50, paceFactor: 1, maxDailyKm: 450, efficiencyFactor: 1 },
    ghats: { avgSpeedKmh: 38, paceFactor: 0.8, maxDailyKm: 320, efficiencyFactor: 0.95 },
    coast: { avgSpeedKmh: 40, paceFactor: 0.85, maxDailyKm: 400, efficiencyFactor: 1 },
    "high-altitude": { avgSpeedKmh: 25, paceFactor: 0.55, maxDailyKm: 250, efficiencyFactor: 0.85 },
  } satisfies Record<
    Terrain,
    { avgSpeedKmh: number; paceFactor: number; maxDailyKm: number; efficiencyFactor: number }
  >,
  /** Share of a full tank treated as usable before looking for fuel. */
  usableTankShare: 0.85,
} as const;

/* ------------------------------ Climate data ------------------------------- */

export const climate: Record<ClimateZone, Record<Season, WeatherOutlook>> = {
  "konkan-coast": {
    winter: { summary: "Clear and dry", minC: 20, maxC: 32 },
    summer: {
      summary: "Hot and humid",
      minC: 26,
      maxC: 34,
      note: "Ride early; the afternoon heat on the coast is draining.",
    },
    monsoon: {
      summary: "Heavy rain, rough sea",
      minC: 24,
      maxC: 29,
      note: "Pack a rain layer. River ferries on the coast may not run.",
    },
    "post-monsoon": { summary: "Warm with passing showers", minC: 23, maxC: 32 },
  },
  "western-ghats": {
    winter: { summary: "Cool mornings, clear skies", minC: 14, maxC: 28 },
    summer: { summary: "Warm and hazy", minC: 20, maxC: 33 },
    monsoon: {
      summary: "Very heavy rain, fog on the ghats",
      minC: 18,
      maxC: 24,
      note: "Hairpins get slippery and visibility drops fast. Ride in daylight only.",
    },
    "post-monsoon": { summary: "Green and misty, light showers", minC: 17, maxC: 27 },
  },
  "deccan-plateau": {
    winter: { summary: "Dry and pleasant", minC: 14, maxC: 29 },
    summer: {
      summary: "Hot and dry",
      minC: 22,
      maxC: 37,
      note: "Carry water; highway stretches get very hot after noon.",
    },
    monsoon: { summary: "Moderate rain, overcast", minC: 20, maxC: 27 },
    "post-monsoon": { summary: "Mild with scattered showers", minC: 18, maxC: 29 },
  },
  "himalaya-mid": {
    winter: {
      summary: "Cold, snow likely",
      minC: -4,
      maxC: 10,
      note: "Snow and ice on the road are common in winter.",
    },
    summer: { summary: "Mild and clear", minC: 8, maxC: 24 },
    monsoon: {
      summary: "Rain, landslide risk",
      minC: 14,
      maxC: 24,
      note: "Landslides are common on this stretch. Keep a buffer day.",
    },
    "post-monsoon": { summary: "Crisp and clear", minC: 4, maxC: 18 },
  },
  "himalaya-high": {
    winter: {
      summary: "Snowbound, passes closed",
      minC: -18,
      maxC: 2,
      note: "This road is normally closed in winter. Treat this day as illustrative only.",
    },
    summer: {
      summary: "Cold, snow on the passes",
      minC: -4,
      maxC: 14,
      note: "High passes usually open in late May at the earliest. Check road status before you go.",
    },
    monsoon: {
      summary: "Dry, clear, strong sun",
      minC: 4,
      maxC: 22,
      note: "Cross streams early. Snowmelt rises through the afternoon.",
    },
    "post-monsoon": {
      summary: "Cold, early snow possible",
      minC: -8,
      maxC: 12,
      note: "Passes can close without warning after mid-October.",
    },
  },
};

/* --------------------------------- Routes ---------------------------------- */

const panajiStay: Stay = {
  name: "Heritage homestay, Fontainhas",
  kind: "Homestay",
  pricePerNight: 3800,
};
const palolemStay: Stay = { name: "Beach hut, Palolem", kind: "Beach hut", pricePerNight: 2600 };

export const journeyRoutes: JourneyRoute[] = [
  {
    id: "belagavi-goa",
    from: "Belagavi",
    to: "Goa",
    via: "Chorla Ghat",
    terrain: "ghats",
    stops: [
      {
        name: "Belagavi",
        region: "Karnataka",
        kmFromPrevious: 0,
        climate: "deccan-plateau",
        fuel: true,
        highlights: [],
      },
      {
        name: "Chorla Ghat",
        region: "Karnataka",
        kmFromPrevious: 55,
        climate: "western-ghats",
        stay: { name: "Forest eco-lodge, Chorla", kind: "Guesthouse", pricePerNight: 3200 },
        highlights: ["Chorla Ghat viewpoint", "Vajrapoha Falls trail"],
      },
      {
        name: "Valpoi",
        region: "Goa",
        kmFromPrevious: 30,
        climate: "western-ghats",
        fuel: true,
        highlights: ["Mhadei river bank"],
      },
      {
        name: "Panaji",
        region: "Goa",
        kmFromPrevious: 50,
        climate: "konkan-coast",
        fuel: true,
        stay: panajiStay,
        highlights: ["Fontainhas Latin Quarter", "Old Goa churches", "Miramar at sunset"],
      },
      {
        name: "Palolem",
        region: "Goa",
        kmFromPrevious: 70,
        climate: "konkan-coast",
        fuel: true,
        stay: palolemStay,
        highlights: ["Cabo de Rama Fort", "Palolem Beach", "Butterfly Beach"],
      },
    ],
  },
  {
    id: "bengaluru-coorg",
    from: "Bengaluru",
    to: "Coorg",
    via: "Mysuru",
    terrain: "plains",
    stops: [
      {
        name: "Bengaluru",
        region: "Karnataka",
        kmFromPrevious: 0,
        climate: "deccan-plateau",
        fuel: true,
        highlights: [],
      },
      {
        name: "Srirangapatna",
        region: "Karnataka",
        kmFromPrevious: 125,
        climate: "deccan-plateau",
        fuel: true,
        stay: {
          name: "Riverside guesthouse, Srirangapatna",
          kind: "Guesthouse",
          pricePerNight: 2800,
        },
        highlights: ["Ranganathaswamy Temple", "Daria Daulat Bagh"],
      },
      {
        name: "Mysuru",
        region: "Karnataka",
        kmFromPrevious: 16,
        climate: "deccan-plateau",
        fuel: true,
        stay: { name: "Heritage hotel near the palace", kind: "Hotel", pricePerNight: 4200 },
        highlights: ["Mysore Palace", "Chamundi Hills climb"],
      },
      {
        name: "Kushalnagar",
        region: "Karnataka",
        kmFromPrevious: 93,
        climate: "deccan-plateau",
        fuel: true,
        stay: { name: "Guesthouse, Bylakuppe", kind: "Guesthouse", pricePerNight: 2400 },
        highlights: ["Namdroling Monastery", "Dubare on the Kaveri"],
      },
      {
        name: "Madikeri",
        region: "Karnataka",
        kmFromPrevious: 32,
        climate: "western-ghats",
        fuel: true,
        stay: { name: "Coffee estate homestay", kind: "Homestay", pricePerNight: 4500 },
        highlights: ["Raja's Seat", "Abbey Falls", "Mandalpatti viewpoint"],
      },
      {
        name: "Talakaveri",
        region: "Karnataka",
        kmFromPrevious: 45,
        climate: "western-ghats",
        stay: { name: "Homestay, Bhagamandala", kind: "Homestay", pricePerNight: 3000 },
        highlights: ["Bhagamandala Triveni Sangama", "Talakaveri hilltop"],
      },
    ],
  },
  {
    id: "bengaluru-goa",
    from: "Bengaluru",
    to: "Goa",
    via: "Jog Falls",
    terrain: "coast",
    stops: [
      {
        name: "Bengaluru",
        region: "Karnataka",
        kmFromPrevious: 0,
        climate: "deccan-plateau",
        fuel: true,
        highlights: [],
      },
      {
        name: "Tumakuru",
        region: "Karnataka",
        kmFromPrevious: 70,
        climate: "deccan-plateau",
        fuel: true,
        highlights: ["Devarayanadurga hill road"],
      },
      {
        name: "Shivamogga",
        region: "Karnataka",
        kmFromPrevious: 205,
        climate: "deccan-plateau",
        fuel: true,
        stay: { name: "City hotel, Shivamogga", kind: "Hotel", pricePerNight: 2600 },
        highlights: ["Sakrebailu elephant camp"],
      },
      {
        name: "Jog Falls",
        region: "Karnataka",
        kmFromPrevious: 105,
        climate: "western-ghats",
        fuel: true,
        stay: { name: "Forest-edge homestay near Sagar", kind: "Homestay", pricePerNight: 3000 },
        highlights: ["Jog Falls viewpoint", "Linganamakki backwaters"],
      },
      {
        name: "Honnavar",
        region: "Karnataka",
        kmFromPrevious: 65,
        climate: "konkan-coast",
        fuel: true,
        stay: { name: "River-view guesthouse, Honnavar", kind: "Guesthouse", pricePerNight: 2500 },
        highlights: ["Sharavathi backwaters", "Kasarkod beach"],
      },
      {
        name: "Gokarna",
        region: "Karnataka",
        kmFromPrevious: 58,
        climate: "konkan-coast",
        fuel: true,
        stay: { name: "Clifftop beach hut, Gokarna", kind: "Beach hut", pricePerNight: 2800 },
        highlights: ["Om Beach", "Kudle Beach", "Mahabaleshwar Temple"],
      },
      {
        name: "Karwar",
        region: "Karnataka",
        kmFromPrevious: 60,
        climate: "konkan-coast",
        fuel: true,
        stay: { name: "Seafront hotel, Karwar", kind: "Hotel", pricePerNight: 2700 },
        highlights: ["Tagore Beach", "Kali river bridge"],
      },
      {
        name: "Palolem",
        region: "Goa",
        kmFromPrevious: 45,
        climate: "konkan-coast",
        fuel: true,
        stay: palolemStay,
        highlights: ["Galgibaga Beach", "Palolem Beach"],
      },
      {
        name: "Panaji",
        region: "Goa",
        kmFromPrevious: 70,
        climate: "konkan-coast",
        fuel: true,
        stay: panajiStay,
        highlights: ["Cabo de Rama Fort", "Fontainhas Latin Quarter"],
      },
    ],
  },
  {
    id: "pune-goa",
    from: "Pune",
    to: "Goa",
    via: "Konkan coast",
    terrain: "coast",
    stops: [
      {
        name: "Pune",
        region: "Maharashtra",
        kmFromPrevious: 0,
        climate: "deccan-plateau",
        fuel: true,
        highlights: [],
      },
      {
        name: "Tamhini Ghat",
        region: "Maharashtra",
        kmFromPrevious: 55,
        climate: "western-ghats",
        highlights: ["Tamhini Ghat waterfalls", "Mulshi backwaters"],
      },
      {
        name: "Mangaon",
        region: "Maharashtra",
        kmFromPrevious: 55,
        climate: "konkan-coast",
        fuel: true,
        highlights: [],
      },
      {
        name: "Dapoli",
        region: "Maharashtra",
        kmFromPrevious: 90,
        climate: "konkan-coast",
        fuel: true,
        stay: { name: "Beach homestay, Karde", kind: "Homestay", pricePerNight: 2800 },
        highlights: ["Karde Beach", "Harnai fish market", "Ladghar Beach"],
      },
      {
        name: "Ganpatipule",
        region: "Maharashtra",
        kmFromPrevious: 130,
        climate: "konkan-coast",
        stay: { name: "Seaside cottage, Ganpatipule", kind: "Homestay", pricePerNight: 3200 },
        highlights: ["Dabhol ferry crossing", "Ganpatipule beach temple", "Aare Ware coastal road"],
      },
      {
        name: "Ratnagiri",
        region: "Maharashtra",
        kmFromPrevious: 28,
        climate: "konkan-coast",
        fuel: true,
        highlights: ["Ratnadurg Fort", "Thibaw Palace"],
      },
      {
        name: "Devgad",
        region: "Maharashtra",
        kmFromPrevious: 110,
        climate: "konkan-coast",
        fuel: true,
        stay: { name: "Mango-orchard homestay, Devgad", kind: "Homestay", pricePerNight: 2600 },
        highlights: ["Devgad lighthouse", "Kunkeshwar Temple"],
      },
      {
        name: "Malvan",
        region: "Maharashtra",
        kmFromPrevious: 55,
        climate: "konkan-coast",
        fuel: true,
        stay: { name: "Beach homestay, Tarkarli", kind: "Homestay", pricePerNight: 3000 },
        highlights: ["Sindhudurg Fort", "Tarkarli Beach"],
      },
      {
        name: "Panaji",
        region: "Goa",
        kmFromPrevious: 115,
        climate: "konkan-coast",
        fuel: true,
        stay: panajiStay,
        highlights: ["Vengurla coast road", "Fontainhas Latin Quarter"],
      },
    ],
  },
  {
    id: "manali-leh",
    from: "Manali",
    to: "Leh",
    via: "Baralacha La",
    terrain: "high-altitude",
    advisory:
      "Climbing above 5,000 m this quickly risks altitude sickness. Add a night at Jispa or Sarchu if you can.",
    stops: [
      {
        name: "Manali",
        region: "Himachal Pradesh",
        kmFromPrevious: 0,
        climate: "himalaya-mid",
        elevationM: 2050,
        fuel: true,
        highlights: [],
      },
      {
        name: "Sissu",
        region: "Lahaul",
        kmFromPrevious: 40,
        climate: "himalaya-mid",
        elevationM: 3130,
        stay: { name: "Riverside camp, Sissu", kind: "Camp", pricePerNight: 2500 },
        highlights: ["Atal Tunnel", "Sissu waterfall"],
      },
      {
        name: "Keylong",
        region: "Lahaul",
        kmFromPrevious: 30,
        climate: "himalaya-high",
        elevationM: 3080,
        fuel: true,
        stay: { name: "Guesthouse, Keylong", kind: "Guesthouse", pricePerNight: 2200 },
        highlights: ["Tandi confluence", "Kardang Monastery"],
      },
      {
        name: "Jispa",
        region: "Lahaul",
        kmFromPrevious: 22,
        climate: "himalaya-high",
        elevationM: 3200,
        stay: { name: "Riverside camp, Jispa", kind: "Camp", pricePerNight: 2800 },
        highlights: ["Bhaga river bank"],
      },
      {
        name: "Sarchu",
        region: "Himachal–Ladakh border",
        kmFromPrevious: 88,
        climate: "himalaya-high",
        elevationM: 4290,
        stay: { name: "Tented camp, Sarchu", kind: "Camp", pricePerNight: 3000 },
        highlights: ["Suraj Tal", "Baralacha La"],
      },
      {
        name: "Pang",
        region: "Ladakh",
        kmFromPrevious: 80,
        climate: "himalaya-high",
        elevationM: 4600,
        stay: { name: "Parachute-tent camp, Pang", kind: "Camp", pricePerNight: 1500 },
        highlights: ["Gata Loops", "Nakee La", "Lachulung La"],
      },
      {
        name: "Debring",
        region: "Ladakh",
        kmFromPrevious: 45,
        climate: "himalaya-high",
        elevationM: 4700,
        stay: { name: "Camp near Tso Kar", kind: "Camp", pricePerNight: 2800 },
        highlights: ["More Plains", "Tso Kar detour"],
      },
      {
        name: "Upshi",
        region: "Ladakh",
        kmFromPrevious: 95,
        climate: "himalaya-high",
        elevationM: 3450,
        fuel: true,
        stay: { name: "Guesthouse, Upshi", kind: "Guesthouse", pricePerNight: 2000 },
        highlights: ["Tanglang La", "Rumtse"],
      },
      {
        name: "Leh",
        region: "Ladakh",
        kmFromPrevious: 50,
        climate: "himalaya-high",
        elevationM: 3500,
        fuel: true,
        stay: { name: "Family guesthouse, Leh old town", kind: "Guesthouse", pricePerNight: 2800 },
        highlights: ["Thiksey Monastery", "Shey Palace", "Leh Palace"],
      },
    ],
  },
];

/** Unique starting points in authored order. */
export const journeyStartingPoints: string[] = Array.from(
  new Set(journeyRoutes.map((route) => route.from)),
);
