# Services

The data access layer. Route loaders call these functions; components never
import from `src/data` for entity content.

Every function is `async` and returns the shapes in `src/types`, so Phase 3 can
replace the mock bodies with Supabase queries (or TanStack Start server
functions) without changing a single route or component.

Conventions:

- `list*` returns an array (possibly empty, never `null`).
- `get*` returns the entity or `null` when it does not exist. Routes turn
  `null` into `notFound()`; services stay free of router concerns.
- Return copies of arrays before sorting or filtering, never mutate mock data.
