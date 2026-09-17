# Services

The data access layer. Route loaders call these functions; components never
import from `src/data` for entity content.

Every function is `async` and returns the shapes in `src/types`, so a mock body
can be replaced with a call to the 36 Spokes API (or a TanStack Start server
function) without changing a single route or component.

Conventions:

- `list*` returns an array (possibly empty, never `null`).
- `get*` returns the entity or `null` when it does not exist. Routes turn
  `null` into `notFound()`; services stay free of router concerns.
- Return copies of arrays before sorting or filtering, never mutate mock data.

## API-backed services

`auth.ts` and `media-uploads.ts` talk to the 36 Spokes API (`backend/`) through
`getApiClient()` from `@/lib/api`. They need `VITE_API_URL`; gate UI on
`features.backend` from `@/lib/env`. The client unwraps `{ data }`, throws
`ApiError` (branch on `error.code`) and refreshes the access token once on 401.

When a mock service moves to the API, keep its signature: call the client, then
map the response onto the `src/types` shape it already returns.
