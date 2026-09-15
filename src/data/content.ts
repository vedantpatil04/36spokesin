/**
 * Centralised mock content for the 36 Spokes frontend foundation.
 * Shapes here mirror what a future backend (Cloud/Postgres) will return,
 * so components never hardcode business content.
 *
 * NOTE: all values below are placeholder development content.
 */

import heroRide from "@/assets/hero-ride.jpg";
import destLadakh from "@/assets/dest-ladakh.jpg";
import destSpiti from "@/assets/dest-spiti.jpg";
import destMeghalaya from "@/assets/dest-meghalaya.jpg";
import productLuggage from "@/assets/product-luggage.jpg";
import productProtect from "@/assets/product-protect.jpg";
import garageWorkshop from "@/assets/garage-workshop.jpg";
import communityRiders from "@/assets/community-riders.jpg";
import brandLogo from "@/assets/brand-logo.jpg";

export const media = {
  brandLogo,
  heroRide,
  destLadakh,
  destSpiti,
  destMeghalaya,
  productLuggage,
  productProtect,
  garageWorkshop,
  communityRiders,
};

export type Bike = {
  id: string;
  brand: string;
  model: string;
  variant: string;
  segment: string;
  image: string;
};

export const bikes: Bike[] = [
  {
    id: "re-himalayan-450",
    brand: "Royal Enfield",
    model: "Himalayan 450",
    variant: "Kaza Brown",
    segment: "Adventure",
    image: productLuggage,
  },
  {
    id: "ktm-390-adv",
    brand: "KTM",
    model: "390 Adventure",
    variant: "X",
    segment: "Adventure",
    image: productLuggage,
  },
  {
    id: "bmw-g310gs",
    brand: "BMW",
    model: "G 310 GS",
    variant: "Rallye",
    segment: "Adventure",
    image: productLuggage,
  },
  {
    id: "triumph-scrambler-400x",
    brand: "Triumph",
    model: "Scrambler 400 X",
    variant: "Standard",
    segment: "Scrambler",
    image: productLuggage,
  },
  {
    id: "honda-nx500",
    brand: "Honda",
    model: "NX500",
    variant: "Standard",
    segment: "Touring",
    image: productLuggage,
  },
  {
    id: "yamaha-mt15",
    brand: "Yamaha",
    model: "MT-15 V2",
    variant: "Standard",
    segment: "Street",
    image: productLuggage,
  },
];

export const bikeBrands = ["Royal Enfield", "KTM", "BMW", "Triumph", "Honda", "Yamaha"];

export type ShopCategory = {
  slug: string;
  name: string;
  purpose: string;
  image: string;
};

export const shopCategories: ShopCategory[] = [
  { slug: "protect", name: "Protect", purpose: "Helmets, armour, guards", image: productProtect },
  { slug: "carry", name: "Carry", purpose: "Panniers, tail bags, racks", image: productLuggage },
  { slug: "navigate", name: "Navigate", purpose: "Mounts, GPS, comms", image: productLuggage },
  { slug: "light", name: "Light", purpose: "Auxiliary lights, wiring", image: productLuggage },
  { slug: "ride", name: "Ride", purpose: "Seats, bars, footpegs", image: productProtect },
  { slug: "prepare", name: "Prepare", purpose: "Tools, spares, recovery", image: productLuggage },
];

export type Product = {
  id: string;
  name: string;
  category: string;
  price: number;
  rating: number;
  reviews: number;
  fitsSelectedBike: boolean;
  inStock: boolean;
  image: string;
};

export const products: Product[] = [
  {
    id: "p-alu-pannier-38",
    name: "Expedition Aluminium Pannier Set 38L",
    category: "Carry",
    price: 34900,
    rating: 4.7,
    reviews: 128,
    fitsSelectedBike: true,
    inStock: true,
    image: productLuggage,
  },
  {
    id: "p-adv-helmet",
    name: "Ridgeline ADV Helmet with Peak",
    category: "Protect",
    price: 18900,
    rating: 4.6,
    reviews: 214,
    fitsSelectedBike: true,
    inStock: true,
    image: productProtect,
  },
  {
    id: "p-crash-guard",
    name: "Upper & Lower Crash Guard",
    category: "Protect",
    price: 8450,
    rating: 4.8,
    reviews: 96,
    fitsSelectedBike: true,
    inStock: true,
    image: productLuggage,
  },
  {
    id: "p-aux-lights",
    name: "Trailbeam Auxiliary Light Pair",
    category: "Light",
    price: 6200,
    rating: 4.4,
    reviews: 61,
    fitsSelectedBike: false,
    inStock: true,
    image: productLuggage,
  },
  {
    id: "p-phone-mount",
    name: "Vibration-Damped Phone Mount",
    category: "Navigate",
    price: 3450,
    rating: 4.5,
    reviews: 187,
    fitsSelectedBike: true,
    inStock: true,
    image: productProtect,
  },
  {
    id: "p-tool-roll",
    name: "Roadside Tool Roll & Tyre Kit",
    category: "Prepare",
    price: 4290,
    rating: 4.6,
    reviews: 54,
    fitsSelectedBike: true,
    inStock: false,
    image: productLuggage,
  },
];

export type Destination = {
  slug: string;
  name: string;
  region: string;
  descriptor: string;
  days: number;
  difficulty: "Moderate" | "Challenging" | "Expert";
  startingPrice: number;
  image: string;
};

export const destinations: Destination[] = [
  {
    slug: "ladakh",
    name: "Ladakh",
    region: "Union Territory of Ladakh",
    descriptor: "High passes, cold desert, thin air and very long horizons.",
    days: 11,
    difficulty: "Challenging",
    startingPrice: 62000,
    image: destLadakh,
  },
  {
    slug: "spiti",
    name: "Spiti",
    region: "Himachal Pradesh",
    descriptor: "Broken tracks, river crossings and monasteries above the treeline.",
    days: 9,
    difficulty: "Challenging",
    startingPrice: 48000,
    image: destSpiti,
  },
  {
    slug: "meghalaya",
    name: "Meghalaya",
    region: "North East India",
    descriptor: "Wet tarmac, living root bridges and cloud that sits on the road.",
    days: 7,
    difficulty: "Moderate",
    startingPrice: 41000,
    image: destMeghalaya,
  },
  {
    slug: "rajasthan",
    name: "Rajasthan",
    region: "Western India",
    descriptor: "Desert highways, forts at dusk and long open-throttle stretches.",
    days: 8,
    difficulty: "Moderate",
    startingPrice: 38000,
    image: destLadakh,
  },
  {
    slug: "nepal",
    name: "Nepal",
    region: "Himalaya",
    descriptor: "Border crossings, mountain switchbacks and old trade routes.",
    days: 10,
    difficulty: "Challenging",
    startingPrice: 58000,
    image: destSpiti,
  },
  {
    slug: "bhutan",
    name: "Bhutan",
    region: "Eastern Himalaya",
    descriptor: "Quiet passes, pine forest and immaculate mountain tarmac.",
    days: 9,
    difficulty: "Moderate",
    startingPrice: 55000,
    image: destMeghalaya,
  },
];

export type Trip = {
  id: string;
  name: string;
  destination: string;
  dates: string;
  days: number;
  distanceKm: number;
  difficulty: string;
  start: string;
  price: number;
  seatsLeft: number;
  image: string;
};

export const trips: Trip[] = [
  {
    id: "t-ladakh-sep",
    name: "Ladakh: Passes & Plateaus",
    destination: "Ladakh",
    dates: "12 – 22 Sep",
    days: 11,
    distanceKm: 1820,
    difficulty: "Challenging",
    start: "Manali",
    price: 62000,
    seatsLeft: 4,
    image: destLadakh,
  },
  {
    id: "t-spiti-oct",
    name: "Spiti Circuit",
    destination: "Spiti",
    dates: "03 – 11 Oct",
    days: 9,
    distanceKm: 1340,
    difficulty: "Challenging",
    start: "Shimla",
    price: 48000,
    seatsLeft: 7,
    image: destSpiti,
  },
  {
    id: "t-megh-nov",
    name: "Meghalaya Cloud Roads",
    destination: "Meghalaya",
    dates: "08 – 14 Nov",
    days: 7,
    distanceKm: 980,
    difficulty: "Moderate",
    start: "Guwahati",
    price: 41000,
    seatsLeft: 9,
    image: destMeghalaya,
  },
  {
    id: "t-raj-dec",
    name: "Desert Highways",
    destination: "Rajasthan",
    dates: "06 – 13 Dec",
    days: 8,
    distanceKm: 1460,
    difficulty: "Moderate",
    start: "Jaipur",
    price: 38000,
    seatsLeft: 12,
    image: destLadakh,
  },
];

export type Ride = {
  id: string;
  name: string;
  type: "Weekend" | "Day Ride" | "Group Ride" | "Event";
  location: string;
  distanceKm: number;
  duration: string;
  difficulty: string;
  riders: number;
};

export const rides: Ride[] = [
  {
    id: "r-nandi",
    name: "Nandi Hills Sunrise Loop",
    type: "Day Ride",
    location: "Bengaluru",
    distanceKm: 120,
    duration: "5 hrs",
    difficulty: "Easy",
    riders: 18,
  },
  {
    id: "r-sahyadri",
    name: "Sahyadri Ghat Weekender",
    type: "Weekend",
    location: "Pune",
    distanceKm: 420,
    duration: "2 days",
    difficulty: "Moderate",
    riders: 11,
  },
  {
    id: "r-aravalli",
    name: "Aravalli Backroads",
    type: "Group Ride",
    location: "Delhi NCR",
    distanceKm: 260,
    duration: "1 day",
    difficulty: "Moderate",
    riders: 24,
  },
  {
    id: "r-coast",
    name: "Konkan Coast Run",
    type: "Weekend",
    location: "Mumbai",
    distanceKm: 510,
    duration: "3 days",
    difficulty: "Moderate",
    riders: 9,
  },
  {
    id: "r-breakfast",
    name: "Saturday Breakfast Meet",
    type: "Event",
    location: "Hyderabad",
    distanceKm: 60,
    duration: "3 hrs",
    difficulty: "Easy",
    riders: 32,
  },
  {
    id: "r-valparai",
    name: "Valparai Hairpins",
    type: "Weekend",
    location: "Coimbatore",
    distanceKm: 340,
    duration: "2 days",
    difficulty: "Challenging",
    riders: 7,
  },
];

export type Rider = {
  id: string;
  name: string;
  bike: string;
  location: string;
  kmThisYear: number;
  ridesLed: number;
};

export const riders: Rider[] = [
  { id: "u-ankit", name: "Ankit Rawat", bike: "Himalayan 450", location: "Dehradun", kmThisYear: 9400, ridesLed: 6 },
  { id: "u-meera", name: "Meera Iyer", bike: "KTM 390 Adventure", location: "Bengaluru", kmThisYear: 7200, ridesLed: 4 },
  { id: "u-sahil", name: "Sahil Khan", bike: "BMW G 310 GS", location: "Pune", kmThisYear: 11300, ridesLed: 9 },
  { id: "u-tenzin", name: "Tenzin Dolma", bike: "Scrambler 400 X", location: "Leh", kmThisYear: 6100, ridesLed: 3 },
];

export type Story = {
  slug: string;
  title: string;
  rider: string;
  destination: string;
  readMinutes: number;
  excerpt: string;
  image: string;
};

export const stories: Story[] = [
  {
    slug: "eleven-days-above-4000",
    title: "Eleven Days Above 4,000 Metres",
    rider: "Ankit Rawat",
    destination: "Ladakh",
    readMinutes: 8,
    excerpt: "What the altitude does to a rider, a bike and a very carefully packed pannier.",
    image: destLadakh,
  },
  {
    slug: "spiti-in-shoulder-season",
    title: "Spiti in Shoulder Season",
    rider: "Meera Iyer",
    destination: "Spiti",
    readMinutes: 6,
    excerpt: "Fewer riders, colder mornings, and river crossings that change by the hour.",
    image: destSpiti,
  },
  {
    slug: "packing-for-rain",
    title: "Packing for Rain That Never Stops",
    rider: "Sahil Khan",
    destination: "Meghalaya",
    readMinutes: 5,
    excerpt: "A practical kit list built over three monsoon runs through the North East.",
    image: destMeghalaya,
  },
];

export const setupChecklist = [
  { label: "Protection", status: "ready" as const, note: "Crash guards + armoured jacket" },
  { label: "Luggage", status: "missing" as const, note: "No hard panniers registered" },
  { label: "Navigation", status: "ready" as const, note: "Damped mount fitted" },
  { label: "Emergency", status: "missing" as const, note: "No tyre repair kit" },
  { label: "Rain Protection", status: "missing" as const, note: "Rain layer recommended" },
];

export const garageServices = [
  { name: "Find Your Bike", note: "Match parts and gear to your exact model and variant." },
  { name: "Maintenance", note: "Pre-trip checks, service schedules and consumables." },
  { name: "Installation", note: "Fitment of luggage, guards, lighting and electronics." },
  { name: "Customization", note: "Ergonomics, seats, suspension and touring setups." },
  { name: "Services", note: "Workshop partners along popular touring routes." },
];

export const formatINR = (value: number) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(value);
