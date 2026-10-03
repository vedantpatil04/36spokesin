# 36 Spokes API

NestJS · PostgreSQL (Prisma) · Cloudflare R2. Lives beside the web app, which stays at the
repository root; the two share nothing at build time.

```
web (TanStack Start, repo root) / future Expo app
        │  HTTPS, JSON, Bearer access token + httpOnly refresh cookie
        ▼
NestJS API (this folder)  ──►  PostgreSQL        (metadata, accounts, sessions)
        │
        └── pre-signed URL ──►  Cloudflare R2   ◄── browser uploads bytes directly
                                   ▲
                         Cloudflare CDN (media domain) serves images
```

## Requirements

- Node.js 22.12+ and npm 10+
- PostgreSQL 14+ (16 recommended). `docker compose -f backend/docker-compose.yml up -d` starts one.

## Local setup

```bash
cd backend
npm install                 # also generates the Prisma client
cp .env.example .env        # then set JWT_SECRET and JWT_REFRESH_SECRET (two different values)
npm run db:deploy           # apply migrations to DATABASE_URL
npm run start:dev           # http://localhost:3000/api/v1 · docs at http://localhost:3000/api/docs
```

The web app runs separately from the repository root: `npm install && npm run dev`
(http://localhost:8080). Set `VITE_API_URL=http://localhost:3000/api/v1` in the root `.env.local`.

Without a local Postgres, the compose file creates `spokes_dev` and `spokes_test` with user
and password `spokes`, matching `.env.example`.

### Development catalogue (optional)

```bash
npm run db:seed
```

Creates six product categories, six motorcycles with variants, and six sample products,
without images. It only creates rows whose slug is missing, so it never overwrites anything
edited in the admin CMS, and it refuses to run with `NODE_ENV=production` unless given
`--allow-production`. Nothing runs it automatically; server start and deploys never seed.

### First administrator

```bash
ADMIN_PASSWORD='a-long-password' npm run admin:create -- --email you@36spokes.in --first-name Ved
```

Promotes the account if it already exists (its password is left unchanged). In a production
image: `ADMIN_PASSWORD=… node dist/cli/create-admin.js --email …`. No users are seeded.

### Try authentication

```bash
API=http://localhost:3000/api/v1
curl -s -c jar -X POST $API/auth/register -H 'content-type: application/json' \
  -d '{"email":"rider@example.com","password":"correct-horse","firstName":"Aarav"}'
TOKEN=$(curl -s -X POST $API/auth/login -H 'content-type: application/json' \
  -d '{"email":"rider@example.com","password":"correct-horse"}' | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.accessToken')
curl -s $API/users/me -H "authorization: Bearer $TOKEN"
curl -s -b jar -c jar -X POST $API/auth/refresh     # rotates the cookie, returns a new access token
curl -s -b jar -X POST $API/auth/logout -o /dev/null -w '%{http_code}\n'   # 204
```

### Try a media upload

Needs the R2 variables (see below). Then:

```bash
FILE=photo.jpg; SIZE=$(wc -c < $FILE)
INIT=$(curl -s -X POST $API/media/uploads -H "authorization: Bearer $TOKEN" -H 'content-type: application/json' \
  -d "{\"fileName\":\"$FILE\",\"mimeType\":\"image/jpeg\",\"fileSize\":$SIZE,\"category\":\"RIDER\"}")
ID=$(echo "$INIT" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.asset.id')
URL=$(echo "$INIT" | node -pe 'JSON.parse(require("fs").readFileSync(0)).data.upload.url')
curl -s -X PUT "$URL" -H 'Content-Type: image/jpeg' --data-binary @$FILE -o /dev/null -w '%{http_code}\n'
curl -s -X POST $API/media/$ID/complete -H "authorization: Bearer $TOKEN"   # status READY, width, height, url
```

## Scripts

| Script | Does |
| --- | --- |
| `start:dev` | Watch mode |
| `build` / `start:prod` | Compile to `dist/` / run it |
| `typecheck`, `lint`, `format` | Static checks |
| `test` | Unit tests (no database) |
| `test:e2e` | Full app against `TEST_DATABASE_URL` (migrates it first; name must contain `test`) |
| `db:migrate -- --name <change>` | Create and apply a migration after editing `prisma/schema.prisma` |
| `db:deploy` / `db:status` | Apply pending migrations / show migration state |
| `db:generate` | Regenerate the Prisma client |
| `db:seed` | Create the development catalogue if missing (never overwrites; see above) |
| `admin:create` | Create or promote an administrator |

After a migration or `db:generate`, stop `start:dev`, delete `dist/` and
`tsconfig.build.tsbuildinfo`, and start it again. The watcher's incremental build can keep part
of the old compiled Prisma client in `dist/generated`, and the API then silently drops the new
columns from its responses (and rejects writes to them) even though the source typechecks.

## Structure

```
src/
  main.ts, app.module.ts, app.setup.ts   bootstrap; HTTP config shared with e2e tests
  config/     env validation (fails fast) and typed AppConfigService
  database/   PrismaService (node-postgres adapter)
  common/     error codes, exception filter, response envelope, pagination, validation, Swagger helpers
  logging/    pino options: request ids, redaction
  auth/       register/login/refresh/logout, JWT + rotating refresh sessions, @Public/@Roles/@CurrentUser, guards
  users/      /users/me, admin listing
  riders/     /riders/me profile and avatar
  media/      upload policy, storage abstraction (R2), image verification, processing hook,
              reference registry (media-references.ts) and the admin media library
  catalog/    products, images, specifications, compatibility, categories, brands (public + admin)
  bikes/      bike brands, models and variants (public + admin)
  garage/     /my-bikes: the rider's own motorcycles
  commerce/   /cart, /wishlist, /orders (order foundation; no payments)
  health/     /health (database-checked) and /health/live
  cli/        create-admin
  generated/  Prisma client (git-ignored)
prisma/       schema.prisma, migrations/, seed.ts
test/e2e/     end-to-end suites and helpers
```

Adding a domain module (Travel, Rides, …): create `src/<domain>/` with module, controller,
service and DTOs, import it in `AppModule`, add models to `schema.prisma`, run `db:migrate`.
Routes are authenticated by default; add `@Public()` or `@Roles(...)` as needed.

## API conventions

- Base path `/api/v1`. Routes require a Bearer token unless marked public.
- Success: `{ "data": … }`; lists: `{ "data": [...], "meta": { "nextCursor", "limit" } }`.
  Pass `?cursor=<nextCursor>&limit=<1-100>` for the next page.
- Errors: `{ "error": { statusCode, code, message, details?, requestId, path, timestamp } }`.
  Branch on `code` (see `src/common/errors/error-codes.ts`). Every response carries `X-Request-Id`.

| Method | Path | Access |
| --- | --- | --- |
| GET | `/health`, `/health/live` | Public |
| POST | `/auth/register`, `/auth/login`, `/auth/refresh`, `/auth/logout` | Public (rate limited) |
| GET, PATCH | `/users/me` | Authenticated |
| GET | `/users`, `/users/:id` | Admin |
| GET, PATCH | `/riders/me` | Authenticated |
| POST | `/media/uploads`, `/media/:id/complete` | Authenticated (category policy applies) |
| GET | `/media`, `/media/:id` | Owner or admin |
| PATCH, DELETE | `/media/:id` | Owner or admin |

## Authentication model

- **Access token:** HS256 JWT, 15 minutes, `Authorization: Bearer`. Verified without a database hit.
  Keep it in memory on the web; never in localStorage.
- **Refresh token:** 256-bit random value. Web: httpOnly cookie `spokes_rt` scoped to
  `/api/v1/auth`. Native apps: send `X-Client-Platform: native` and receive it in the body.
  The database stores only an HMAC digest (keyed by `JWT_REFRESH_SECRET`).
- **Rotation:** every refresh replaces the token. Replaying the previous token within 30 seconds
  is treated as a multi-tab race (rejected, session kept); later, as theft (session revoked).
  Sessions slide: each refresh extends expiry by `REFRESH_TOKEN_TTL_DAYS`.
- **Passwords:** argon2id (19 MiB, t=2), rehashed on login if parameters change. Unknown-email
  logins spend the same time as real ones.
- **Roles:** `RIDER`, `ADMIN` (Postgres enum). `@Roles(...)` on a route; ADMIN passes every check.
  Add a role by extending `UserRole` in the schema and migrating.

## Catalogue, garage and commerce (Phase 4)

PostgreSQL is the source of truth for the whole catalogue; R2 holds only image bytes. Admins
change everything through the API (and the web CMS at `/admin`); nothing is read from files.

| Area | Public | Signed-in rider | ADMIN |
| --- | --- | --- | --- |
| Products | `GET /products`, `/products/:slug`, `/products/:slug/related` | | `GET/POST /admin/products`, `GET/PATCH/DELETE /admin/products/:id`, `POST /admin/products/:id/duplicate` |
| Product images | | | `GET/POST /admin/products/:id/images`, `PATCH/DELETE …/images/:imageId`, `POST …/images/reorder`, `POST …/images/:imageId/primary`, `POST …/images/:imageId/replace` |
| Categories, brands | `GET /categories`, `/categories/:slug` | | `GET/POST /admin/categories`, `PATCH/DELETE /admin/categories/:id`, same for `/admin/brands` |
| Bikes | `GET /bikes`, `/bikes/:idOrSlug` | | `GET/POST /admin/bike-brands`, `PATCH /admin/bike-brands/:id`, `GET/POST /admin/bikes`, `GET/PATCH/DELETE /admin/bikes/:id`, `POST /admin/bikes/:id/variants`, `PATCH …/variants/:variantId` |
| My Garage | | `GET/POST /my-bikes`, `GET/PATCH/DELETE /my-bikes/:id`, `POST /my-bikes/:id/primary` | |
| Cart, wishlist | | `GET/DELETE /cart`, `POST /cart/items`, `PATCH/DELETE /cart/items/:id`, `GET /wishlist`, `POST /wishlist/items`, `DELETE /wishlist/items/:id` | |
| Orders | | `GET /orders`, `/orders/:id` | |
| Media library | | | `GET /admin/media`, `DELETE /admin/media/:id` |

Rules worth knowing:

- **Money** is an integer in minor units (paise). `₹8,499` is `849900`.
- **Status.** Products are `DRAFT`, `PUBLISHED` or `ARCHIVED`; only published ones are public.
  `DELETE /admin/products/:id` archives. Bikes, bike brands and variants are archived too
  (`archivedAt`), never deleted, so garages and fitment keep pointing at them. Categories and
  brands can be deleted only while no product uses them (409 `RESOURCE_IN_USE`).
- **Purchasable** means published, not `OUT_OF_STOCK`, and either `BACKORDER` or quantity on
  hand ≥ 1. A cart line is capped at 10 and at the stock on hand (`src/catalog/product-rules.ts`).
  Cart prices are read live on every request; lines that became unbuyable carry an `issue`.
- **Orders** snapshot name, SKU and unit price. `OrdersService.createFromCart` exists and is
  tested, but no route places orders until payments land.
- **Compatibility** rows name a bike model and optionally one variant (none = all variants).
  `universalFit` marks rider gear that fits any bike.
- **Transactions.** Gallery edits lock the product row, so ordering stays 0..n-1 and exactly one
  image is primary (also a partial unique index). Primary-bike changes lock the rider's row the
  same way. Product saves write scalars, specifications and compatibility in one transaction.
- **Admin actions** are logged with the admin's id.

## Travel and rides (Phase 5)

| Area | Public | Signed-in rider | ADMIN |
| --- | --- | --- | --- |
| Destinations | `GET /destinations`, `/destinations/:slug` | | `GET/POST /admin/destinations`, `GET/PATCH/DELETE /admin/destinations/:id` |
| Trips | `GET /trips`, `/trips/:slug` | | `GET/POST /admin/trips`, `GET/PATCH/DELETE /admin/trips/:id` (itinerary and departures in the same body) |
| Rides | `GET /rides?when=upcoming\|past`, `/rides/:slug` | `POST/DELETE /rides/:id/join`, `GET /rides/:id/registration`, `GET /my-rides` | `GET/POST /admin/rides`, `GET/PATCH/DELETE /admin/rides/:id`, `GET /admin/rides/:id/bookings` |
| Galleries | | | `/admin/{destinations,trips,rides}/:id/images` with the same routes as product images |

- Destinations and trips are `DRAFT`, `PUBLISHED` or `ARCHIVED`; a trip is public only when its
  destination is published too. `DELETE` archives.
- Rides are public as `UPCOMING`, `FULL`, `COMPLETED` or `CANCELLED`. Joining needs `UPCOMING`, a
  start time in the future and a free spot; the ride row is locked while checking, so capacity
  holds under concurrent joins. Capacity can't be set below the number of registered riders.
- A ride's `price` is paise per rider, or `null` for a free ride. Free rides confirm on booking;
  paid rides are paid by manual UPI (see "Ride payments" below).
- `POST /rides/:id/join` is the booking: the body carries `contactPhone` (required), and optionally
  `riderBikeId` (one of the rider's own bikes) and `note`. The booking is the rider's
  `ride_registrations` row, with a booking `number` and the price quoted (`amount`, `currency`).
  One row per rider per ride: an active booking can't be duplicated (409), and booking again after
  leaving reuses the row.
- Seats are always counted from those rows: `REGISTERED` bookings hold a seat, and so do
  `PENDING_PAYMENT` ones while their hold runs. `DELETE /rides/:id/join` cancels the rider's own
  booking before the ride starts; the row stays as `CANCELLED` (history) and its seat is free
  again. Cancelling twice is refused (409).
- Riders quote the booking `reference` (`36S-000042`, derived from `number`). `GET /my-rides` lists
  the rider's bookings, active and cancelled; `GET /admin/rides/:id/bookings` lists a ride's
  bookings for the crew.
- Gallery photos use the `DESTINATION`, `TRIP` and `RIDE` media categories (admin-only uploads)
  and follow the product-image rules: ordered, one primary, files deleted from R2 only when unused.
- Departures keep their ids across edits (bookings will reference them later). No payments.

### Ride payments (manual UPI)

No gateway: the rider pays by UPI outside the app, uploads a screenshot, and an admin verifies it.

| | Signed-in rider | ADMIN |
| --- | --- | --- |
| UPI details | `GET /payment-info` | `GET/PATCH /admin/payment-settings` (UPI ID, payee name, instructions, QR image) |
| Proof | `POST /rides/:id/payment-proof` with a `PAYMENT_PROOF` image uploaded through `/media/uploads` | `GET /admin/payments?status=pending\|reviewed\|all`, `POST /admin/payments/:id/approve`, `POST /admin/payments/:id/reject` |

- Booking a paid ride creates the booking as `PENDING_PAYMENT` and holds the seat for
  `PAYMENT_HOLD_MINUTES` (30). It is refused while no UPI ID is configured
  (422 `PAYMENT_NOT_CONFIGURED`).
- Submitting a proof creates a `payments` row (`MANUAL_UPI`, `PROOF_SUBMITTED`) with the amount
  taken from the booking; the seat then stays held until the review. One proof can be under
  review at a time, and it must be the rider's own unused image.
- Only approval marks the payment `PAID` and the booking `REGISTERED`. Rejection marks it
  `REJECTED` with an optional reason, keeps it as history and restarts the hold so the rider can
  send another proof.
- A hold that runs out with no proof becomes a `CANCELLED` booking the next time bookings are
  read or written (there is no scheduler); seat counts never include it.
- `paymentStatus` on a booking (`NOT_REQUIRED`, `UNPAID`, `PROOF_SUBMITTED`, `PAID`, `REJECTED`,
  `CANCELLED`) is derived on the server from the booking and its latest payment.

## Community (Phase 6)

| Area | Public | ADMIN (`/admin/community/…`) |
| --- | --- | --- |
| Founders | `GET /community/founders` | `founders`: `GET`, `POST`, `GET/PATCH /:id`, `POST /:id/archive`, `POST /reorder` |
| Stories | `GET /community/stories?featured=&limit=`, `/community/stories/:slug` | `stories`: same routes |
| Rider spotlights | `GET /community/riders` | `riders`: same routes |
| Groups | `GET /community/groups`, `/community/groups/:slug` | `groups`: same routes |

- Everything is `DRAFT`, `PUBLISHED` or `ARCHIVED` (`ContentStatus`); only published rows are public
  and nothing is hard-deleted. `POST /reorder` takes `{ ids }` in the new order; unlisted rows keep
  their relative order after them, unknown ids are refused (422).
- Only the name (title for stories) is required. Every other field stays `null` until an admin
  fills it in, and the web app leaves empty fields off the page. Group `memberCount` is `null`
  unless actually known.
- The Phase 6 migration inserts the two confirmed founders (Abhishek Sharma, Simran Kathuria; names
  only, published) once, into an empty table. `npm run db:seed` does the same for development
  databases emptied later. Nothing runs at start-up, so CMS edits are never overwritten.
- Images: founders and rider spotlights use the `COMMUNITY` media category, story covers `STORY`
  and group covers `GROUP` (`SITE` assets are accepted too). Admin-only uploads, `ON DELETE
  RESTRICT`, and a replaced or removed image is deleted from R2 once nothing uses it. Alt text lives
  on the asset (`PATCH /media/:id`). The admin media library lists these categories.
- Community events are rides (Phase 5); there is no separate event model.

## Media

1. `POST /media/uploads` — checks category permission, MIME allow-list (JPEG, PNG, WebP, AVIF)
   and size; records a `PENDING` asset with a server-generated key
   (`<category>/<yyyy>/<mm>/<uuid>.<ext>`); returns a 10-minute pre-signed PUT URL that locks
   Content-Type and Content-Length.
2. The client PUTs the file straight to R2. The API never handles the bytes.
3. `POST /media/:id/complete` — confirms the object exists with the authorised size and type,
   reads its first 128 KB to verify the real format and dimensions (EXIF rotation applied), and
   marks it `READY`. Anything that fails is deleted from storage and the database.

Postgres stores metadata only. Domain models reference `MediaAsset` by foreign key
(rider avatars, product images, category images, bike model images). Upload permissions per
category live in `src/media/media.policy.ts`; `PRODUCT` and `BIKE` uploads are admin-only.

**Deleting safely.** Every relation to `MediaAsset` is listed in `src/media/media-references.ts`;
the list is checked against the Prisma schema at compile time, so a new relation can't be
forgotten. Catalogue relations are `ON DELETE RESTRICT`.

- `DELETE /media/:id` and `DELETE /admin/media/:id` refuse with 409 `MEDIA_IN_USE` while anything
  uses the asset. (An owner deleting their own profile photo still clears it from their profile.)
- Removing or replacing a product, category or bike image calls `releaseIfUnreferenced()`: the
  asset and its R2 object are deleted only when nothing else — for example a duplicated product
  sharing the photo — still references it.
- Uploads that were never attached (abandoned edits) show as unused in `GET /admin/media?unused=true`
  and can be deleted there.
`MediaProcessor` (`src/media/processing`) is the hook for thumbnails and format variants later.

### R2 setup (Production)

1. Create a bucket and an R2 API token with Object Read & Write on it. Fill the `R2_*` variables.
2. Connect a custom domain (e.g. `media.36spokes.in`) to the bucket; use it as `R2_PUBLIC_BASE_URL`.
   Add a Cloudflare Cache Rule for that host (keys are immutable, so a long edge TTL is safe).
3. Bucket CORS so browsers can upload:

```json
[
  {
    "AllowedOrigins": ["http://localhost:8080", "https://36spokes.in"],
    "AllowedMethods": ["PUT"],
    "AllowedHeaders": ["Content-Type"],
    "MaxAgeSeconds": 3600
  }
]
```

### Local Development Provider (Cloudinary)

For local development and testing only, `MEDIA_PROVIDER=cloudinary` can be set along with `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, and `CLOUDINARY_API_SECRET`. In this mode, signed upload URLs point to a local streaming endpoint (`PUT /api/v1/media/uploads/content`) that pipes raw bytes directly to Cloudinary without writing to the local filesystem.

In production (`MEDIA_PROVIDER=r2`), the direct browser-to-R2 upload flow remains the default and intact.

## Deployment

- Build the image from `backend/` (`Dockerfile`), or run `npm ci && npm run build && npm run start:prod`.
- Release step: `npx prisma migrate deploy`. Then start `node dist/main.js`. Never seed in the
  release step: seeding is a manual, development-only command.
- Health checks: liveness `GET /api/v1/health/live`, readiness `GET /api/v1/health` (503 if the database is down).
- Set `NODE_ENV=production`, both JWT secrets, `DATABASE_URL`, `CORS_ORIGINS`, `API_URL`, `WEB_URL`,
  the `R2_*` variables and `TRUST_PROXY=1` behind a load balancer. Swagger is off in production
  unless `SWAGGER_ENABLED=true`.
- Serve the API from a subdomain of the web app's site (e.g. `api.36spokes.in`) so the refresh
  cookie stays same-site with `AUTH_COOKIE_SAMESITE=lax`.
