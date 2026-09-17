# 36 Spokes — Deployment Guide

**Architecture:** Vercel (frontend) → Render NestJS API → Render PostgreSQL

> **R2 media storage is optional.** The API boots and serves all non-media endpoints without it.

---

## 1. Render PostgreSQL

Create the database **first** — you need its URL before configuring the API service.

1. Open the Render dashboard → **New → PostgreSQL**
2. Name: `36spokes-db` (or any name)
3. Region: match the region you'll use for the API (e.g. Singapore)
4. Plan: Free for testing; upgrade before production
5. After creation, copy the **Internal Database URL** — you'll paste it as `DATABASE_URL`

---

## 2. Render Web Service (NestJS API)

### Connect via Blueprint (recommended)

1. Render dashboard → **New → Blueprint**
2. Connect the repository and point Render at `render.yaml` (repo root)
3. Render reads `rootDir: backend` from the blueprint automatically
4. Fill in all `sync: false` env vars in the dashboard (see §4 below)

### Or configure manually

| Setting | Value |
|---|---|
| **Runtime** | Node |
| **Root Directory** | `backend` |
| **Build Command** | `npm ci && npm run build` |
| **Pre-Deploy Command** | `npm run db:deploy` |
| **Start Command** | `npm run start:prod` |
| **Health Check Path** | `/api/v1/health/live` |

> Render injects `PORT` automatically — do **not** add it as an env var.

---

## 3. Vercel Frontend

1. Import the repository into Vercel
2. Vercel detects the framework as **TanStack Start** via `vercel.json` (`"framework": "tanstack-start"`)
3. Build command and output directory are handled by Vercel's TanStack Start/Nitro integration automatically
4. Add environment variables (see §4 below)
5. Deploy

---

## 4. Environment Variables

### Vercel (frontend)

| Variable | Value |
|---|---|
| `VITE_API_URL` | `https://<your-render-service>.onrender.com/api/v1` (no trailing slash) |
| `VITE_SITE_URL` | `https://<your-vercel-app>.vercel.app` (or custom domain) |

> `VITE_MAPBOX_TOKEN` and `VITE_RAZORPAY_KEY_ID` are optional Phase 4 variables — leave them empty.

### Render (backend)

All variables are set in the Render dashboard under **Environment → Secret Files / Env Vars**.

#### Required

| Variable | Production value |
|---|---|
| `NODE_ENV` | `production` |
| `API_URL` | `https://<your-render-service>.onrender.com` |
| `WEB_URL` | `https://<your-vercel-app>.vercel.app` |
| `CORS_ORIGINS` | `https://<your-vercel-app>.vercel.app` (comma-separate multiple) |
| `TRUST_PROXY` | `1` |
| `DATABASE_URL` | Internal Database URL from Render PostgreSQL |
| `JWT_SECRET` | Random ≥ 32 chars — generate with command below |
| `JWT_REFRESH_SECRET` | Random ≥ 32 chars, **different from JWT_SECRET** |

Generate secrets:
```sh
node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"
```

#### Cookie configuration

| Scenario | `AUTH_COOKIE_SAMESITE` | `AUTH_COOKIE_SECURE` | `AUTH_COOKIE_DOMAIN` |
|---|---|---|---|
| `*.vercel.app` + `*.onrender.com` (different domains) | `none` | `true` | *(leave unset)* |
| Custom shared domain (e.g. `36spokes.in` + `api.36spokes.in`) | `lax` | `true` | `.36spokes.in` |

> **Why `SameSite=none`?** Browsers block `SameSite=lax` cookies on cross-site requests. Vercel and Render use different top-level domains, so the refresh cookie requires `none` + `Secure`. Once you add custom domains under a shared parent, switch to `lax`.

#### Optional / defaults (can be omitted unless you want to override)

| Variable | Default | Notes |
|---|---|---|
| `JWT_ACCESS_TTL_SECONDS` | `900` | Access token lifetime (15 min) |
| `REFRESH_TOKEN_TTL_DAYS` | `30` | Refresh token lifetime |
| `RATE_LIMIT_ENABLED` | `true` | |
| `RATE_LIMIT_TTL_SECONDS` | `60` | |
| `RATE_LIMIT_MAX` | `120` | Requests per IP per window |
| `RATE_LIMIT_AUTH_MAX` | `10` | Auth endpoints limit |
| `LOG_LEVEL` | `info` (in production) | |
| `SWAGGER_ENABLED` | `false` (in production) | Set `true` temporarily to debug |

---

## 5. Prisma Migrations

Migrations are applied automatically at each deploy via the **Pre-Deploy Command**:

```sh
npm run db:deploy
# equivalent to: prisma migrate deploy
```

This command:
- Reads `DATABASE_URL` from the environment
- Applies any pending migrations from `prisma/migrations/`
- Never creates or drops tables outside of the migration history
- Safe to run on every deploy (idempotent for already-applied migrations)

To check migration status locally:
```sh
cd backend && npm run db:status
```

---

## 6. Health Check URLs

| Endpoint | Purpose | Expected response |
|---|---|---|
| `GET /api/v1/health/live` | **Liveness** — process is serving | `200 {"data":{"status":"ok"}}` |
| `GET /api/v1/health` | **Readiness** — API + database | `200` when DB is up, `503` when down |

Render uses `/api/v1/health/live` (configured in `render.yaml` / service settings).

---

## 7. CORS Setup

`CORS_ORIGINS` is a comma-separated list of allowed browser origins (no trailing slash):

```
# Single Vercel deployment
CORS_ORIGINS=https://36spokes.vercel.app

# Multiple origins (main + preview + custom domain)
CORS_ORIGINS=https://36spokes.vercel.app,https://preview.36spokes.vercel.app,https://www.36spokes.in
```

The API validates this at startup. Wildcard (`*`) is rejected in production by the env validator.

---

## 8. Cloudflare R2 (Optional — Media Uploads)

Leave all R2 variables unset to run without media. The backend logs:

> `R2 variables are not set: media endpoints will return 503`

To enable R2 later, set **all** of the following in Render:

| Variable | Where to find it |
|---|---|
| `R2_ACCOUNT_ID` | Cloudflare dashboard → R2 → Overview |
| `R2_ACCESS_KEY_ID` | R2 → Manage API Tokens |
| `R2_SECRET_ACCESS_KEY` | Same token creation screen |
| `R2_BUCKET_NAME` | Your R2 bucket name |
| `R2_PUBLIC_BASE_URL` | Custom domain serving the bucket (e.g. `https://media.36spokes.in`) |

`R2_ENDPOINT` is optional — it's derived from `R2_ACCOUNT_ID` automatically.

Also set in Render:

| Variable | Recommended value |
|---|---|
| `MEDIA_MAX_UPLOAD_BYTES` | `10485760` (10 MB) |
| `MEDIA_UPLOAD_URL_TTL_SECONDS` | `600` |

---

## 9. First Deployment Checklist

- [ ] Render PostgreSQL created; Internal Database URL copied
- [ ] `DATABASE_URL` set in Render service
- [ ] `JWT_SECRET` and `JWT_REFRESH_SECRET` generated (different values, ≥ 32 chars each)
- [ ] `CORS_ORIGINS` set to the Vercel deployment URL
- [ ] `WEB_URL` set to the Vercel deployment URL
- [ ] `API_URL` set to the Render service URL
- [ ] `TRUST_PROXY=1` set
- [ ] `AUTH_COOKIE_SAMESITE=none` and `AUTH_COOKIE_SECURE=true` set (cross-domain setup)
- [ ] `NODE_ENV=production` set
- [ ] `VITE_API_URL` set in Vercel (pointing to Render, ending in `/api/v1`)
- [ ] First Render deploy completes; Pre-Deploy command runs `prisma migrate deploy`
- [ ] `GET /api/v1/health/live` returns 200
- [ ] `GET /api/v1/health` returns 200 with `"database":"up"`
- [ ] Register a test account via the Vercel frontend
- [ ] Login, refresh, and logout work end-to-end

---

## 10. Vercel + Render Domain Summary

```
Browser
  │  HTTPS
  ▼
Vercel  (TanStack Start SSR)
  https://<app>.vercel.app
  VITE_API_URL → https://<api>.onrender.com/api/v1
  │
  │  HTTPS + credentials: "include"
  ▼
Render  (NestJS API)
  https://<api>.onrender.com
  CORS_ORIGINS → https://<app>.vercel.app
  AUTH_COOKIE_SAMESITE=none, AUTH_COOKIE_SECURE=true
  │
  │  Internal Database URL
  ▼
Render PostgreSQL
```
