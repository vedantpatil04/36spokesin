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
| `admin:create` | Create or promote an administrator |

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
  media/      upload policy, storage abstraction (R2), image verification, processing hook
  health/     /health (database-checked) and /health/live
  cli/        create-admin
  generated/  Prisma client (git-ignored)
prisma/       schema.prisma, migrations/
test/e2e/     end-to-end suites and helpers
```

Adding a domain module (Garage, Shop, …): create `src/<domain>/` with module, controller,
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
(`RiderProfile.avatar` today). Upload permissions per category live in `src/media/media.policy.ts`.
`MediaProcessor` (`src/media/processing`) is the hook for thumbnails and format variants later.

### R2 setup

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

## Deployment

- Build the image from `backend/` (`Dockerfile`), or run `npm ci && npm run build && npm run start:prod`.
- Release step: `npx prisma migrate deploy`. Then start `node dist/main.js`.
- Health checks: liveness `GET /api/v1/health/live`, readiness `GET /api/v1/health` (503 if the database is down).
- Set `NODE_ENV=production`, both JWT secrets, `DATABASE_URL`, `CORS_ORIGINS`, `API_URL`, `WEB_URL`,
  the `R2_*` variables and `TRUST_PROXY=1` behind a load balancer. Swagger is off in production
  unless `SWAGGER_ENABLED=true`.
- Serve the API from a subdomain of the web app's site (e.g. `api.36spokes.in`) so the refresh
  cookie stays same-site with `AUTH_COOKIE_SAMESITE=lax`.
