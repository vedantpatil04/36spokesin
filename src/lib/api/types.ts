/**
 * Response shapes of the 36 Spokes API (backend/). These mirror the API's DTOs;
 * UI components should keep consuming `@/types` models, mapped inside services.
 */

import type { ISODateTime } from "@/types";

export type ApiUserRole = "RIDER" | "ADMIN";

export type ApiMediaCategory =
  | "RIDER"
  | "BIKE"
  | "PRODUCT"
  | "DESTINATION"
  | "TRIP"
  | "EVENT"
  | "STORY"
  | "GROUP"
  | "GARAGE_SERVICE"
  | "SITE"
  | "RIDE"
  | "COMMUNITY"
  | "PAYMENT_PROOF";

export type ApiMediaStatus = "PENDING" | "READY";

export type ApiMediaMimeType =
  | "image/jpeg"
  | "image/png"
  | "image/webp"
  | "image/avif"
  | "video/mp4"
  | "video/webm"
  | "video/quicktime";

export type ApiUser = {
  id: string;
  email: string;
  firstName: string;
  lastName: string | null;
  phone: string | null;
  role: ApiUserRole;
  isActive: boolean;
  emailVerified: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

/** Returned by register, login and refresh. Web clients never see the refresh token. */
export type ApiAuthSession = {
  user: ApiUser;
  accessToken: string;
  tokenType: "Bearer";
  /** Access token lifetime in seconds. */
  expiresIn: number;
};

export type ApiRiderProfile = {
  id: string;
  userId: string;
  displayName: string | null;
  bio: string | null;
  city: string | null;
  avatar: {
    id: string;
    url: string | null;
    width: number | null;
    height: number | null;
    altText: string | null;
  } | null;
  memberSince: ISODateTime;
  updatedAt: ISODateTime;
};

export type ApiMediaAsset = {
  id: string;
  /** Null until the upload has been completed. */
  url: string | null;
  category: ApiMediaCategory;
  status: ApiMediaStatus;
  originalFileName: string;
  mimeType: string;
  fileSize: number;
  width: number | null;
  height: number | null;
  altText: string | null;
  uploadedAt: ISODateTime | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type ApiUploadSession = {
  asset: ApiMediaAsset;
  upload: {
    url: string;
    method: "PUT";
    headers: Record<string, string>;
    expiresAt: ISODateTime;
  };
};

export type ApiErrorDetail = { field: string; messages: string[] };

export type ApiPageMeta = { nextCursor: string | null; limit: number };

export type ApiPage<T> = { items: T[]; meta: ApiPageMeta };

// ─── Phase 4: catalogue, garage, commerce ──────────────────────────────────
// Money is always an integer in minor units (paise). Services convert to rupees.

export type ApiProductStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ApiStockStatus = "IN_STOCK" | "LOW_STOCK" | "OUT_OF_STOCK" | "BACKORDER";
export type ApiBikeSegment = "ADVENTURE" | "SCRAMBLER" | "TOURING" | "STREET" | "CRUISER" | "SPORT";
export type ApiOrderStatus =
  "PENDING_PAYMENT" | "PLACED" | "PACKED" | "SHIPPED" | "DELIVERED" | "CANCELLED";

export type ApiImage = {
  id: string;
  url: string | null;
  width: number | null;
  height: number | null;
  altText: string | null;
};

export type ApiProductImage = ApiImage & {
  mediaAssetId: string;
  caption: string | null;
  sortOrder: number;
  isPrimary: boolean;
};

export type ApiCatalogRef = { id: string; slug: string; name: string };

export type ApiProductSummary = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  shortDescription: string | null;
  brand: ApiCatalogRef | null;
  category: ApiCatalogRef;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockStatus: ApiStockStatus;
  stockQuantity: number;
  maxOrderQuantity: number;
  featured: boolean;
  universalFit: boolean;
  fits: { bikeModelId: string; bikeVariantId: string | null }[];
  primaryImage: ApiProductImage | null;
  publishedAt: ISODateTime | null;
};

export type ApiProductSpecification = {
  id: string;
  groupName: string | null;
  label: string;
  value: string;
  sortOrder: number;
};

export type ApiCompatibleBike = {
  bikeModelId: string;
  bikeModelSlug: string;
  bikeModelName: string;
  brandName: string;
  bikeVariantId: string | null;
  bikeVariantName: string | null;
  note: string | null;
  archived: boolean;
};

export type ApiProductDetail = ApiProductSummary & {
  description: string | null;
  weightGrams: number | null;
  images: ApiProductImage[];
  specifications: ApiProductSpecification[];
  compatibility: ApiCompatibleBike[];
};

export type ApiAdminProduct = ApiProductDetail & {
  status: ApiProductStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  createdById: string | null;
  updatedById: string | null;
};

export type ApiAdminProductListItem = {
  id: string;
  slug: string;
  sku: string;
  name: string;
  status: ApiProductStatus;
  category: ApiCatalogRef;
  brand: ApiCatalogRef | null;
  price: number;
  compareAtPrice: number | null;
  currency: string;
  stockQuantity: number;
  stockStatus: ApiStockStatus;
  featured: boolean;
  primaryImage: ApiProductImage | null;
  imageCount: number;
  publishedAt: ISODateTime | null;
  updatedAt: ISODateTime;
};

export type ApiProductImageList = { productId: string; images: ApiProductImage[] };

export type ApiCategory = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  sortOrder: number;
  image: ApiImage | null;
  productCount: number;
};

export type ApiBrand = { id: string; slug: string; name: string; productCount: number };

export type ApiBikeVariant = {
  id: string;
  name: string;
  sortOrder: number;
  archivedAt: ISODateTime | null;
};

export type ApiBikeModel = {
  id: string;
  slug: string;
  name: string;
  brand: ApiCatalogRef;
  segment: ApiBikeSegment;
  description: string | null;
  displacementCc: number | null;
  fuelEfficiencyKmpl: number | null;
  tankLitres: number | null;
  image: ApiImage | null;
  variants: ApiBikeVariant[];
};

export type ApiAdminBikeModel = ApiBikeModel & {
  archivedAt: ISODateTime | null;
  riderCount: number;
  productCount: number;
  updatedAt: ISODateTime;
};

export type ApiBikeBrand = ApiCatalogRef & { archivedAt: ISODateTime | null; modelCount: number };

export type ApiRiderBike = {
  id: string;
  bike: ApiBikeModel;
  bikeVariantId: string | null;
  bikeVariantName: string | null;
  nickname: string | null;
  year: number | null;
  odometerKm: number | null;
  isPrimary: boolean;
  archived: boolean;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type ApiCartLine = {
  id: string;
  product: ApiProductSummary;
  quantity: number;
  unitPrice: number;
  lineTotal: number;
  issue: "NOT_AVAILABLE" | "OUT_OF_STOCK" | "INSUFFICIENT_STOCK" | null;
};

export type ApiCart = {
  items: ApiCartLine[];
  itemCount: number;
  subtotal: number;
  currency: string;
  readyForCheckout: boolean;
};

export type ApiWishlistItem = {
  id: string;
  product: ApiProductSummary;
  available: boolean;
  addedAt: ISODateTime;
};

export type ApiOrder = {
  id: string;
  number: number;
  status: ApiOrderStatus;
  currency: string;
  subtotal: number;
  total: number;
  items: {
    id: string;
    productId: string | null;
    productName: string;
    sku: string;
    unitPrice: number;
    quantity: number;
    total: number;
  }[];
  placedAt: ISODateTime | null;
  createdAt: ISODateTime;
};

export type ApiMediaUsage = { total: number; summary: string; counts: Record<string, number> };

export type ApiAdminMediaAsset = ApiMediaAsset & { usage: ApiMediaUsage };

// ─── Phase 5: travel and rides ─────────────────────────────────────────────

export type ApiContentStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";
export type ApiDifficulty = "EASY" | "MODERATE" | "CHALLENGING" | "EXPERT";
export type ApiDepartureStatus = "OPEN" | "FULL" | "CLOSED" | "CANCELLED";
export type ApiRideType = "WEEKEND" | "DAY_RIDE" | "GROUP_RIDE" | "EVENT";
export type ApiRideStatus = "DRAFT" | "UPCOMING" | "FULL" | "COMPLETED" | "CANCELLED" | "ARCHIVED";

export type ApiRideRef = { id: string; slug: string; title: string; startsAt: ISODateTime };

export type ApiDestinationSummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  region: string;
  country: string;
  difficulty: ApiDifficulty;
  bestSeason: string | null;
  durationRecommendation: string | null;
  featured: boolean;
  primaryImage: ApiProductImage | null;
  startingPrice: number | null;
  tripCount: number;
};

export type ApiDestinationDetail = ApiDestinationSummary & {
  description: string | null;
  usefulInfo: string | null;
  images: ApiProductImage[];
  rides: ApiRideRef[];
};

export type ApiAdminDestination = ApiDestinationDetail & {
  status: ApiContentStatus;
  publishedAt: ISODateTime | null;
  updatedAt: ISODateTime;
};

export type ApiTripDeparture = {
  id: string;
  startDate: string;
  endDate: string;
  price: number | null;
  capacity: number;
  status: ApiDepartureStatus;
};

export type ApiItineraryDay = {
  id: string;
  dayNumber: number;
  title: string;
  description: string | null;
  routeSummary: string | null;
  distanceKm: number | null;
  accommodation: string | null;
  notes: string | null;
};

export type ApiTripSummary = {
  id: string;
  slug: string;
  name: string;
  shortDescription: string | null;
  destination: ApiCatalogRef;
  durationDays: number;
  distanceKm: number | null;
  difficulty: ApiDifficulty;
  startingLocation: string;
  endingLocation: string | null;
  featured: boolean;
  primaryImage: ApiProductImage | null;
  departures: ApiTripDeparture[];
};

export type ApiTripDetail = ApiTripSummary & {
  description: string | null;
  itinerary: ApiItineraryDay[];
  images: ApiProductImage[];
  rides: ApiRideRef[];
};

export type ApiAdminTrip = ApiTripDetail & {
  status: ApiContentStatus;
  publishedAt: ISODateTime | null;
  updatedAt: ISODateTime;
};

export type ApiRideSummary = {
  id: string;
  slug: string;
  title: string;
  shortDescription: string | null;
  type: ApiRideType;
  location: string;
  meetingPoint: string;
  startsAt: ISODateTime;
  durationLabel: string | null;
  routeStart: string | null;
  routeFinish: string | null;
  waypoints: string[];
  routeSummary: string | null;
  distanceKm: number | null;
  difficulty: ApiDifficulty;
  rideLeader: string | null;
  capacity: number;
  /** Paise per rider; null when the ride is free. */
  price: number | null;
  registeredCount: number;
  spotsLeft: number;
  registrationOpen: boolean;
  status: ApiRideStatus;
  featured: boolean;
  primaryImage: ApiProductImage | null;
  destination: ApiCatalogRef | null;
  trip: ApiCatalogRef | null;
};

export type ApiRideDetail = ApiRideSummary & {
  description: string | null;
  images: ApiProductImage[];
};

export type ApiAdminRide = ApiRideDetail & {
  publishedAt: ISODateTime | null;
  updatedAt: ISODateTime;
};

/** REGISTERED is confirmed; PENDING_PAYMENT holds a seat until the payment is verified. */
export type ApiRideBookingStatus = "PENDING_PAYMENT" | "REGISTERED" | "CANCELLED";

export type ApiRidePaymentStatus =
  "NOT_REQUIRED" | "UNPAID" | "PROOF_SUBMITTED" | "PAID" | "REJECTED" | "CANCELLED";

/** Where to pay for a paid ride. Set by an admin; nothing here is a credential. */
export type ApiPaymentInfo = {
  configured: boolean;
  upiId: string | null;
  payeeName: string | null;
  instructions: string | null;
  qr: ApiImage | null;
  holdMinutes: number;
};

export type ApiAdminPaymentSettings = ApiPaymentInfo & { updatedAt: ISODateTime | null };

/** One payment proof and the booking it pays for, for the crew to review. */
export type ApiAdminPayment = {
  id: string;
  provider: "MANUAL_UPI" | "RAZORPAY";
  status: "PROOF_SUBMITTED" | "PAID" | "REJECTED" | "CANCELLED";
  amount: number;
  currency: string;
  reference: string;
  bookingStatus: ApiRideBookingStatus;
  rider: { name: string; email: string; phone: string | null };
  ride: { id: string; slug: string; title: string; startsAt: ISODateTime };
  proofUrl: string | null;
  submittedAt: ISODateTime;
  reviewedAt: ISODateTime | null;
  rejectionReason: string | null;
};

export type ApiRideRegistration = {
  rideId: string;
  registered: boolean;
  /** Booking number; null until the rider has booked. */
  number: number | null;
  /** Booking ID shown to riders, e.g. "36S-000042". */
  reference: string | null;
  contactPhone: string | null;
  bikeLabel: string | null;
  note: string | null;
  /** Paise per rider quoted when booking; null for a free ride. Not a payment. */
  amount: number | null;
  currency: string | null;
  status: ApiRideBookingStatus | null;
  /** Derived by the API from the booking and its latest payment. */
  paymentStatus: ApiRidePaymentStatus | null;
  /** While payment is due and no proof is in: when the held seat is released. */
  holdExpiresAt: ISODateTime | null;
  /** Cancelled because the seat hold ran out, not by the rider. */
  holdExpired: boolean;
  paymentSubmittedAt: ISODateTime | null;
  paymentRejectionReason: string | null;
  registeredAt: ISODateTime | null;
  cancelledAt: ISODateTime | null;
};

export type ApiMyRide = {
  ride: ApiRideSummary;
  bookingNumber: number;
  reference: string;
  status: ApiRideBookingStatus;
  paymentStatus: ApiRidePaymentStatus;
  registeredAt: ISODateTime;
  cancelledAt: ISODateTime | null;
};

/** One booking on a ride, for the crew. */
export type ApiAdminRideBooking = {
  id: string;
  reference: string;
  status: ApiRideBookingStatus;
  paymentStatus: ApiRidePaymentStatus;
  /** 1 while the booking holds a seat (confirmed or held for payment), else 0. */
  seats: number;
  riderName: string;
  riderEmail: string;
  contactPhone: string | null;
  bikeLabel: string | null;
  note: string | null;
  amount: number | null;
  createdAt: ISODateTime;
  cancelledAt: ISODateTime | null;
};

export type ApiGalleryList = { ownerId: string; images: ApiProductImage[] };

// ─── Social feed ─────────────────────────────────────────────────────────────

export type ApiSocialPlatform = "INSTAGRAM";

export type ApiSocialPostStatus = "DRAFT" | "PUBLISHED" | "ARCHIVED";

export type ApiSocialMediaType = "IMAGE" | "VIDEO";

export type ApiSocialPost = {
  id: string;
  postUrl: string;
  mediaType: ApiSocialMediaType;
  imageUrl: string | null;
  videoUrl: string | null;
  caption: string | null;
  username: string | null;
  platform: ApiSocialPlatform;
  sortOrder: number;
  isFeatured: boolean;
  createdAt: ISODateTime;
};

export type ApiAdminSocialPost = ApiSocialPost & {
  status: ApiSocialPostStatus;
  mediaAssetId: string | null;
  updatedAt: ISODateTime;
  createdById: string | null;
  updatedById: string | null;
};

// ─── Phase 6: community ─────────────────────────────────────────────────────
// Founders, rider stories, rider spotlights and groups. Every optional field is
// null until an admin fills it in; nothing is invented on the way.

export type ApiFounder = {
  id: string;
  name: string;
  role: string | null;
  shortBio: string | null;
  story: string | null;
  quote: string | null;
  instagramUrl: string | null;
  linkedinUrl: string | null;
  image: ApiImage | null;
  sortOrder: number;
};

export type ApiAdminFounder = ApiFounder & {
  status: ApiContentStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
  createdById: string | null;
  updatedById: string | null;
};

export type ApiStorySummary = {
  id: string;
  slug: string;
  title: string;
  excerpt: string | null;
  authorName: string | null;
  cover: ApiImage | null;
  /** Only while the destination is published. */
  destination: { id: string; slug: string; name: string } | null;
  featured: boolean;
  sortOrder: number;
  publishedAt: ISODateTime | null;
  readMinutes: number;
};

export type ApiStoryDetail = ApiStorySummary & { content: string | null };

export type ApiAdminStory = ApiStoryDetail & {
  status: ApiContentStatus;
  destinationId: string | null;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type ApiRiderSpotlight = {
  id: string;
  name: string;
  bike: string | null;
  location: string | null;
  favouriteRide: string | null;
  shortStory: string | null;
  image: ApiImage | null;
  sortOrder: number;
};

export type ApiAdminRiderSpotlight = ApiRiderSpotlight & {
  status: ApiContentStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};

export type ApiGroup = {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  region: string | null;
  rideCadence: string | null;
  /** Null when the number isn't known. */
  memberCount: number | null;
  cover: ApiImage | null;
  sortOrder: number;
};

export type ApiAdminGroup = ApiGroup & {
  status: ApiContentStatus;
  createdAt: ISODateTime;
  updatedAt: ISODateTime;
};
