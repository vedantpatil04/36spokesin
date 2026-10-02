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

These talk to the 36 Spokes API (`backend/`) through `getApiClient()` from
`@/lib/api` and need `VITE_API_URL`. The client unwraps `{ data }`, throws
`ApiError` (branch on `error.code`) and refreshes the access token once on 401.

| Service            | Auth      | Notes                                                    |
| ------------------ | --------- | -------------------------------------------------------- |
| `auth.ts`          | –         | Register, login, session restore.                        |
| `media-uploads.ts` | signed in | Direct-to-R2 upload; optional `onProgress` and `signal`. |
| `catalog.ts`       | public    | Products, categories, bikes. Safe in SSR loaders.        |
| `garage.ts`        | rider     | The rider's own bikes. Browser only.                     |
| `commerce.ts`      | rider     | Cart, wishlist, orders. Browser only.                    |
| `community.ts`     | public    | Founders, stories, rider spotlights, groups. SSR-safe.   |
| `admin/*`          | ADMIN     | CMS operations. Return API shapes, not `src/types`.      |

Storefront services map API responses onto `src/types` in
`catalog-mappers.ts`: money arrives in paise and becomes rupees, image
records become `MediaAsset`s (with a placeholder when a product has no photo).
`request-helpers.ts` has `orNull()` (404 → `null`) and `describeError()`.

Site and member services, home-page events and Memory Lane still return sample
content from `src/data`. When one moves to the API, keep its signature: call the
client, then map the response onto the `src/types` shape it already returns.
