import { media } from "@/data/media";
import type { Bike } from "@/types";

/**
 * Sample motorcycles for the journey planner's fuel-range estimates only.
 * The Garage and Shop read the real bike catalogue from the API
 * (`@/services/catalog`); admins manage it in the CMS.
 */
export type SampleBike = Bike & { fuelEfficiencyKmpl: number; tankLitres: number };

export const bikes: SampleBike[] = [
  {
    id: "re-himalayan-450",
    slug: "royal-enfield-himalayan-450",
    brand: "Royal Enfield",
    model: "Himalayan 450",
    variant: "Kaza Brown",
    variants: [{ id: "re-himalayan-450-kaza-brown", name: "Kaza Brown" }],
    segment: "Adventure",
    image: media.products.luggage,
    fuelEfficiencyKmpl: 30,
    tankLitres: 17,
  },
  {
    id: "ktm-390-adv",
    slug: "ktm-390-adventure",
    brand: "KTM",
    model: "390 Adventure",
    variant: "X",
    variants: [{ id: "ktm-390-adv-x", name: "X" }],
    segment: "Adventure",
    image: media.products.luggage,
    fuelEfficiencyKmpl: 30,
    tankLitres: 14.5,
  },
  {
    id: "bmw-g310gs",
    slug: "bmw-g-310-gs",
    brand: "BMW",
    model: "G 310 GS",
    variant: "Rallye",
    variants: [{ id: "bmw-g310gs-rallye", name: "Rallye" }],
    segment: "Adventure",
    image: media.products.luggage,
    fuelEfficiencyKmpl: 30,
    tankLitres: 11,
  },
  {
    id: "triumph-scrambler-400x",
    slug: "triumph-scrambler-400-x",
    brand: "Triumph",
    model: "Scrambler 400 X",
    variant: "Standard",
    variants: [{ id: "triumph-scrambler-400x-standard", name: "Standard" }],
    segment: "Scrambler",
    image: media.products.luggage,
    fuelEfficiencyKmpl: 28,
    tankLitres: 13,
  },
  {
    id: "honda-nx500",
    slug: "honda-nx500",
    brand: "Honda",
    model: "NX500",
    variant: "Standard",
    variants: [{ id: "honda-nx500-standard", name: "Standard" }],
    segment: "Touring",
    image: media.products.luggage,
    fuelEfficiencyKmpl: 27,
    tankLitres: 17.5,
  },
  {
    id: "yamaha-mt15",
    slug: "yamaha-mt-15-v2",
    brand: "Yamaha",
    model: "MT-15 V2",
    variant: "Standard",
    variants: [{ id: "yamaha-mt15-standard", name: "Standard" }],
    segment: "Street",
    image: media.products.luggage,
    fuelEfficiencyKmpl: 45,
    tankLitres: 10,
  },
];
