# 36 Spokes frontend architecture

Phase 2 established this structure. The approved Phase 1 design is unchanged;
what changed is where things live and how data reaches the UI, so Phase 3 can
connect Supabase, auth, Garage and Shop without rewriting components.

## Data flow

```
route loader  →  src/services/*  →  src/data/* (mock today, Supabase in Phase 3)
     │
     └─ Route.useLoaderData()  →  components (typed by src/types)

client UI state (selected bike, cart, wishlist)  →  src/state/*
```

- **Components never import entity content from `src/data`.** They receive
  typed props from routes. The exceptions are static assets (`data/media.ts`)
  and the Journey Planner form, which reads sample routes directly.
- **Services are the backend seam.** Each is `async` and returns `src/types`
  shapes. Replacing a function body with a Supabase query changes nothing above it.
- **UI state is separate from data.** Stores in `src/state` are created per app
  instance, so server renders never share state between requests.

## Folders

| Folder | Holds |
| --- | --- |
| `types/` | Shared models: Rider, Bike, BikeVariant, Product, ProductCategory, Destination, Trip, Departure, Ride, RideRoute, CommunityEvent, Story, Group, Memory, Booking, Order, CartItem, TravelPlan, MediaAsset. Import from `@/types`. |
| `data/` | Mock content, one module per domain, plus `media.ts` (every image as a `MediaAsset`). |
| `services/` | Async data access: `catalog`, `travel`, `rides`, `community`, `site`, `member`, `journey-planner`. See `services/README.md`. |
| `state/` | Client stores and hooks: `garage` (selected bike), `cart`, `wishlist`. |
| `routes/` | TanStack file routes. Loaders, metadata, pending and not-found UI. |
| `components/ui/` | Vendor shadcn components (Lovable template). Unused by the app today. |
| `components/ui-kit/` | 36 Spokes primitives: Button, ButtonLink, Badge, Section, Media, Rail, FilterChip, FormField, DetailList, Brand. |
| `components/cards/` | One card per entity. |
| `components/layout/` | Navbar, Footer, MobileTabBar, PageHeader, AuthLayout, SkipLink, `nav-config.ts`. |
| `components/states/` | Skeletons, EmptyState, ErrorState, NotFound pages. |
| `components/<domain>/` | Page sections for garage, shop, travel, rides, events, member, journey-planner, memory-lane. |
| `lib/` | Pure helpers: `format`, `dates`, `seo`, `env`, `media`, `fitment`, `travel`, `site`. |
| `hooks/` | Generic hooks: `use-disclosure`, `use-mobile`. |

## Conventions

- **Naming.** App components are `PascalCase.tsx`; everything else is
  `kebab-case.ts`. shadcn files in `components/ui` keep their vendor names.
- **Links.** `ButtonLink` and `FilterChipLink` are built with `createLink`, so
  `to`, `params` and `search` are type-checked against the route tree.
- **Filters live in the URL.** Shop categories are routes (`/shop/$category`);
  ride types are search params (`/rides?type=weekend`), validated in the route.
- **Loading, error, empty.** Router defaults (`src/router.tsx`) supply a page
  skeleton and an in-shell error with retry. Lists render `EmptyState` with a
  next step. Missing entities return HTTP 404 with a link back to the listing.
- **Media.** Pass a `MediaAsset` to `Media`; override `alt` only when the
  context needs different wording. Assets carry intrinsic width/height and can
  add `srcSet` and `focalPoint` without component changes.
- **SEO.** `seo()` builds title, description, Open Graph and Twitter tags.
  Canonical and `og:url` appear once `VITE_SITE_URL` is set. Account and member
  pages are `noindex`.
- **Environment.** Public config is read only through `src/lib/env.ts`. See
  `.env.example`. Secrets never use the `VITE_` prefix.

## Phase 3 checklist

1. Add a Supabase client using `env.supabaseUrl` / `env.supabaseAnonKey`.
2. Reimplement `services/catalog.ts` and `services/member.ts` against tables
   that map to `types/bike.ts`, `types/product.ts` and `types/member.ts`.
3. Resolve the session in `services/member.ts`; redirect signed-out visitors
   from `/my-36-spokes` with `beforeLoad`.
4. Hydrate `state/cart` and `state/wishlist` from the rider's account and write
   changes back through new service functions.
5. Wire the Login and Join forms (marked with comments) to Supabase Auth.

## Known gaps, deliberately deferred

- Navbar search is a reserved control with no behaviour yet.
- Checkout, bookings and registrations are UI previews only.
- Production photography, responsive `srcSet` variants and a sitemap are Phase 7.
- `bun.lock` and `package-lock.json` are both committed; pick one package
  manager before Phase 7 so installs stay reproducible.
