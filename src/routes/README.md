# Routes

TanStack Start uses **file-based routing**. Every `.tsx` file in this directory
defines a route. Do **not** create `src/pages/`, `src/routes/_app/index.tsx`, or
`app/layout.tsx` — those are Next.js / Remix conventions. The only root layout
is `src/routes/__root.tsx`.

## Conventions

| File | URL |
| --- | --- |
| `index.tsx` | `/` |
| `about.tsx` | `/about` |
| `users/index.tsx` | `/users` |
| `users/$id.tsx` | `/users/:id` (dynamic — bare `$`, no curly braces) |
| `posts/{-$category}.tsx` | `/posts/:category?` (optional segment) |
| `files/$.tsx` | `/files/*` (splat — read via `_splat` param, never `*`) |
| `_layout.tsx` | layout route (renders children via `<Outlet />`) |
| `shop/route.tsx` | layout for `/shop` and everything under it (renders `<Outlet />`) |
| `__root.tsx` | app shell — wraps every page; preserve `<Outlet />` |

`routeTree.gen.ts` is auto-generated. Don't edit it by hand.

## Project conventions

- Every data-driven route has a `loader` that calls `src/services`, never
  `src/data` directly, and reads results with `Route.useLoaderData()`.
- Detail routes throw `notFound()` when a service returns `null` and provide a
  `notFoundComponent` (usually `EntityNotFound`).
- `head` uses `seo()` from `src/lib/seo.ts`. Only leaf routes pass `path`, so
  layout routes never emit a second canonical link.
- Loading and error UI fall back to the router defaults in `src/router.tsx`;
  override with `pendingComponent` where the page shape differs.

