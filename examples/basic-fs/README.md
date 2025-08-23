# ReactServe File-based Routing Example

This example demonstrates file-system routing using ReactServe.

## Prerequisites

- Node.js 18+
- From the repo root, install dependencies once:

```bash
npm install
```

## Run

From the repo root (recommended):

```bash
npm run dev --workspace=examples/basic-fs
```

Or from this folder directly:

```bash
cd examples/basic-fs
npm install
npm run dev
```

Server starts at http://localhost:7070

## Quick verification

With the server running, you can hit endpoints manually or run the helper script:

```bash
cd examples/basic-fs
bash test-endpoints.sh
```

## Structure

```
examples/basic-fs/
  README.md
  package.json
  test-endpoints.sh
  tsconfig.json
  src/
    index.tsx                 # Entry: exports <App port cors globalPrefix="/api" />
    middleware.ts             # Global middleware applied to all routes
    app/                      # File-based routes live here
      route.tsx               # "/api" root GET/POST
      users/
        route.tsx             # "/api/users" GET/POST
        [id]/route.tsx        # "/api/users/:id" GET
      blog/
        [...slug]/route.tsx   # "/api/blog/:slug+" catch-all GET
      docs/
        [[...slug]]/route.tsx # optional catch-all: "/api/docs/:slug*" (base and deeper)
      (marketing)/route.tsx   # route group not in URL
      admin/
        middleware.ts         # dir-level middleware (auth)
        route.tsx             # "/api/admin" GET
        stats/route.tsx       # "/api/admin/stats" GET
```

## Notes

- Files named `route.tsx` (or .ts/.js/.jsx) map to paths derived from folder names. You can override the base filename via `react-serve.config.ts` with `routeFileBase: "server"`.
- Export functions named after HTTP methods: `GET`, `POST`, `PUT`, `PATCH`, `DELETE`, `OPTIONS`, `HEAD`. A `default` export acts as `GET`.
- Dynamic segments: `[id]` -> `:id`
- Catch-all segments: `[...slug]` -> `:slug+`
- Optional catch-all: `[[...slug]]` -> `:slug*` (also matches base path)
- Route groups: `(marketing)` are omitted from URL paths.
- Directory-level middleware: `middleware.(ts|tsx|js|jsx)` exports a default middleware or array of middlewares and applies to nested routes. In this example, admin routes require `Authorization: Bearer valid-token`.
- Global middleware: `src/middleware.(ts|tsx|js|jsx)` exports a default middleware or array applied to all routes.
