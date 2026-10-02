# 36 Spokes frontend architecture

Phase 2 established this structure. The approved Phase 1 design is unchanged;
what changed is where things live and how data reaches the UI, so later phases
can connect accounts, Garage and Shop without rewriting components.

Phase 3 added the backend: a NestJS + PostgreSQL + Cloudflare R2 API in
`backend/`, which the web app reaches through `src/lib/api`. See
`backend/README.md`.

Phase 4 made the Shop, Garage, cart, wishlist and My Garage real: the catalogue
lives in PostgreSQL (images in R2) and is managed in the admin CMS at `/admin`.
There is no bundled product data any more.

## Data flow

```
route loader  →  src/services/*  ─┬─  src/lib/api/*   (36 Spokes API: auth, media, catalogue, bikes)
     │                             └─  src/data/*      (travel, rides, community sample content)
     └─ Route.useLoaderData()  →  components (typed by src/types)

sign-in  →  state/account-sync  →  cart, wishlist, my bikes  (server copies in src/state/*)
admin CMS (/admin)  →  services/admin/*  →  API  →  PostgreSQL + R2

browser  ──pre-signed PUT──►  Cloudflare R2        (image bytes never touch the API)
```

- **Components never import entity content from `src/data`.** They receive
  typed props from routes. The exceptions are static assets (`data/media.ts`)
  and the Journey Planner form, which reads sample routes and sample bikes
  (`data/bikes.ts`) directly.
- **Services are the backend seam.** Each is `async` and returns `src/types`
  shapes. Replacing a function body with an API call changes nothing above it.
- **One API client.** `src/lib/api` unwraps the `{ data }` / `{ data, meta }`
  envelope, throws `ApiError` carrying the API's stable `code`, keeps the access
  token in memory only, and refreshes it once on a 401 using the httpOnly
  refresh cookie. `services/auth.ts` and `services/media-uploads.ts` use it.
- **UI state is separate from data.** Stores in `src/state` are created per app
  instance, so server renders never share state between requests.

## Folders

| Folder | Holds |
| --- | --- |
| `types/` | Shared models: Rider, Bike, BikeVariant, Product, ProductCategory, Destination, Trip, Departure, Ride, RideRoute, CommunityEvent, Story, Group, Memory, Booking, Order, CartItem, TravelPlan, MediaAsset. Import from `@/types`. |
| `data/` | Remaining sample content (home events, Memory Lane, pillars, journey planner), plus `media.ts` (every static image as a `MediaAsset`, and the no-photo placeholders). |
| `services/` | Async data access: `catalog` (API), `garage` and `commerce` (API, signed in), `admin/*` (API, ADMIN), `travel`, `rides`, `community`, `site`, `member`, `journey-planner`. See `services/README.md`. |
| `state/` | Client stores and hooks: `garage` (selected bike, my bikes), `cart`, `wishlist`, `auth`, and `account-sync` which loads the account data on sign-in. |
| `routes/` | TanStack file routes. Loaders, metadata, pending and not-found UI. |
| `components/ui/` | Vendor shadcn components (Lovable template). Unused by the app today. |
| `components/ui-kit/` | 36 Spokes primitives: Button, ButtonLink, Badge, Section, Media, Rail, FilterChip, FormField, DetailList, Brand. |
| `components/cards/` | One card per entity. |
| `components/layout/` | Navbar, Footer, MobileTabBar, PageHeader, AuthLayout, SkipLink, `nav-config.ts`. |
| `components/states/` | Skeletons, EmptyState, ErrorState, NotFound pages. |
| `components/<domain>/` | Page sections for garage, shop, travel, rides, events, member, journey-planner, memory-lane. |
| `components/admin/` | The CMS: product form and media manager, admin layout pieces. |
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

## Backend bridge (Phase 3)

Ready now:

- `VITE_API_URL` (base URL including `/api/v1`) turns on `features.backend`.
- `src/lib/api`: client, in-memory access-token store, response types.
- `services/auth.ts`: register, login, logout, `restoreSession()`, current user
  and rider profile, plus `describeAuthError()` for form-facing messages.
- `services/media-uploads.ts`: `uploadImage(file, { category })` runs the
  three-step direct-to-R2 upload and returns the verified asset.
- `state/auth.ts`: `useAuthStatus()` / `useAuthUser()` / `useAuthActions()`
  read and drive the `auth` store in `state/app-stores.ts`. `AppStateProvider`
  calls `restoreSession()` once on mount (client-only — the refresh cookie
  isn't visible to the SSR loader) and resolves the user with `GET /users/me`.
  Login, Join and the Navbar consume these hooks; `/my-36-spokes` redirects to
  `/login` once `status` resolves to `unauthenticated`, and shows a skeleton
  while it's `loading`, since that resolution only happens after hydration.

## Garage, Shop and CMS (Phase 4)

- **Catalogue reads** (`services/catalog.ts`) call public endpoints with
  `auth: false`, so route loaders fetch them during SSR. Money arrives in paise
  and is converted to rupees in `services/catalog-mappers.ts`; products without
  photos get the spoked-wheel placeholder from `data/media.ts`.
- **Account data** (cart, wishlist, the rider's bikes) needs the access token,
  which only exists in the browser. `AppStateProvider` watches the auth store and
  calls `hydrateAccount()` on sign-in and `resetAccount()` on sign-out. Every
  action sends the change to the API and stores the API's response; a load that
  started earlier never overwrites a newer response (`revision` in the stores).
  Signed-out visitors who try an account action go to `/login?redirect=…` and
  come back afterwards.
- **Selected bike.** `selectedBikeId` starts empty ("Any motorcycle"); it is set
  from the rider's main bike when their garage loads, or by choosing a bike.
  "Fits your bike" only appears once a bike is chosen.
- **Admin CMS** (`/admin/*`): products (list, editor, gallery), categories and
  brands, bikes, and the media library. Screens load data client-side with
  React Query and call `services/admin/*`, which return API shapes directly
  because the CMS edits them field for field. After every change
  `useCatalogRefresh()` refetches admin queries and invalidates route loaders,
  so the storefront shows the change on the next navigation. The client-side
  guard is only a convenience; the API enforces the ADMIN role.
- **Gallery editing** saves each action immediately: files go to R2 through the
  signed-upload flow (with progress via XHR, cancellable), then are attached;
  reordering uses pointer events, so it works with mouse, pen and touch, and
  every card also has keyboard-accessible move buttons.

## Community (Phase 6)

- **Founders, stories, rider spotlights and groups** come from the API
  (`services/community.ts`, mapped in `services/community-mappers.ts`) and are managed at
  `/admin/community/{founders,stories,riders,groups}`. Only the name is guaranteed; components
  omit every empty field instead of labelling it. Missing photos fall back to the spoked-wheel
  placeholder (founders get the crest as its hub).
- **`/community`** runs Hero → Founders → Community intro → Stories → Rider spotlights → Groups →
  Events → Memory Lane → Join. Events are published rides (`listRides`); Memory Lane reuses the
  existing component. `/community/groups/$slug` is the group page; `/stories` and
  `/stories/$slug` keep their routes and now read the API.
- **Not yet CMS-driven:** Memory Lane and the home page's "Upcoming events" still read sample
  content from `src/data` (`memories.ts`, `events.ts`). The community intro copy lives in the route.

## Known gaps, deliberately deferred

- Navbar search is a reserved control with no behaviour yet.
- Checkout, payments, bookings and registrations are not built. The cart and
  order records exist; placing an order arrives with the payment phase.
- The Journey Planner still estimates range from the sample bikes in
  `data/bikes.ts`, not from the API's bike catalogue.
- Production photography, responsive `srcSet` variants and a sitemap are Phase 7.
- `bun.lock` and `package-lock.json` are both committed; pick one package
  manager before Phase 7 so installs stay reproducible.
