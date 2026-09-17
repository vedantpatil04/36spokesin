import { media } from "@/data/media";
import type { Product, ProductCategory } from "@/types";

export const productCategories: ProductCategory[] = [
  {
    slug: "protect",
    name: "Protect",
    purpose: "Helmets, armour, guards",
    image: media.products.protect,
  },
  {
    slug: "carry",
    name: "Carry",
    purpose: "Panniers, tail bags, racks",
    image: media.products.luggage,
  },
  {
    slug: "navigate",
    name: "Navigate",
    purpose: "Mounts, GPS, comms",
    image: media.products.luggage,
  },
  {
    slug: "light",
    name: "Light",
    purpose: "Auxiliary lights, wiring",
    image: media.products.luggage,
  },
  { slug: "ride", name: "Ride", purpose: "Seats, bars, footpegs", image: media.products.protect },
  {
    slug: "prepare",
    name: "Prepare",
    purpose: "Tools, spares, recovery",
    image: media.products.luggage,
  },
];

export const products: Product[] = [
  {
    id: "p-alu-pannier-38",
    slug: "expedition-aluminium-pannier-set-38l",
    name: "Expedition Aluminium Pannier Set 38L",
    summary:
      "A pair of lockable aluminium cases on bike-specific frames. Quick release, dust sealed.",
    category: { slug: "carry", name: "Carry" },
    price: 34900,
    rating: 4.7,
    reviews: 128,
    fitment: {
      kind: "bikes",
      bikeIds: [
        "re-himalayan-450",
        "ktm-390-adv",
        "bmw-g310gs",
        "triumph-scrambler-400x",
        "honda-nx500",
      ],
    },
    inStock: true,
    image: media.products.luggage,
  },
  {
    id: "p-adv-helmet",
    slug: "ridgeline-adv-helmet-with-peak",
    name: "Ridgeline ADV Helmet with Peak",
    summary:
      "Dual-sport helmet with a removable peak, drop-down sun visor and pinlock-ready shield.",
    category: { slug: "protect", name: "Protect" },
    price: 18900,
    rating: 4.6,
    reviews: 214,
    fitment: { kind: "universal" },
    inStock: true,
    image: media.products.protect,
  },
  {
    id: "p-crash-guard",
    slug: "upper-and-lower-crash-guard",
    name: "Upper & Lower Crash Guard",
    summary: "Powder-coated steel guards that protect the tank and engine cases in a tip-over.",
    category: { slug: "protect", name: "Protect" },
    price: 8450,
    rating: 4.8,
    reviews: 96,
    fitment: {
      kind: "bikes",
      bikeIds: ["re-himalayan-450", "ktm-390-adv", "triumph-scrambler-400x"],
    },
    inStock: true,
    image: media.products.luggage,
  },
  {
    id: "p-aux-lights",
    slug: "trailbeam-auxiliary-light-pair",
    name: "Trailbeam Auxiliary Light Pair",
    summary: "A pair of LED fog lights with a switched wiring harness for night and cloud riding.",
    category: { slug: "light", name: "Light" },
    price: 6200,
    rating: 4.4,
    reviews: 61,
    fitment: { kind: "bikes", bikeIds: ["ktm-390-adv", "bmw-g310gs", "honda-nx500"] },
    inStock: true,
    image: media.products.luggage,
  },
  {
    id: "p-phone-mount",
    slug: "vibration-damped-phone-mount",
    name: "Vibration-Damped Phone Mount",
    summary:
      "Handlebar mount with a damper that keeps single-cylinder vibration off your phone camera.",
    category: { slug: "navigate", name: "Navigate" },
    price: 3450,
    rating: 4.5,
    reviews: 187,
    fitment: { kind: "universal" },
    inStock: true,
    image: media.products.protect,
  },
  {
    id: "p-tool-roll",
    slug: "roadside-tool-roll-and-tyre-kit",
    name: "Roadside Tool Roll & Tyre Kit",
    summary:
      "Tubeless plug kit, CO2 inflator and the spanners you actually need on the side of the road.",
    category: { slug: "prepare", name: "Prepare" },
    price: 4290,
    rating: 4.6,
    reviews: 54,
    fitment: { kind: "universal" },
    inStock: false,
    image: media.products.luggage,
  },
];
