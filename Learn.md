# Learn ReactServe

This guide explains core concepts, runtime behavior, and practical tips for working on the codebase without introducing breaking changes.

Overview

- ReactServe is a small monorepo containing the core runtime (`packages/react-serve-js`), a project scaffolder (`packages/create-react-serve`), and several example apps in `examples/`.
- The core idea: authors write backend logic using a JSX-like tree (components such as `<App>`, `<Route>`, `<RouteGroup>`, `<Middleware>`, and `<Response>`). The runtime converts that tree into Express routes at startup.

Design and Principles

- Keep public API stable: avoid renaming or removing exported symbols (`serve`, `useRoute`, `useSetContext`, `useContext`, `Middleware` type, etc.).
- Prefer small, atomic changes so users can update incrementally.
- Favor safety in typing: prefer `unknown` (or specific interfaces) instead of `any`, then narrow/cast locally where necessary.
- Centralize cross-cutting concerns (logging, error handling) so behavior is consistent and easy to change.

Runtime model (high level)

- At startup, `serve(element)` walks the JSX tree and collects routes, middleware and global config.
- Route handlers are stored as functions (typically an async function returning a `Response` element or primitive). A `createExpressHandler` wrapper sets up a `routeContext`, runs middlewares in sequence, awaits the final output and normalizes it into an HTTP response.
- Middlewares are executed sequentially and can call `next()` to advance. The middleware can return a `Response` to short-circuit.

Key API summary

- `serve(element: ReactNode): Server` — boot the server from an `App` root element.
- `App({ children, port?, cors? })` — root component for configuration.
- `Route({ path, method, middleware?, children })` — defines an endpoint. `children` is typically an async handler returning a `Response` element or primitive.
- `Response({ json?, status?, text?, html?, headers?, redirect? })` — helper element for sending replies.
- `Middleware({ use })` — wrapper to include middleware functions inside `RouteGroup` or at top-level.
- Hooks available inside handlers/middleware:
  - `useRoute()` — returns the runtime route context (request, response, params, query, body). (Note: the runtime uses a typed `RouteContext` internally; prefer to treat fields as `unknown` and narrow them.)
  - `useSetContext(key, value)` / `useContext(key)` — per-request middleware context and global context.

Runtime types and safety

- The runtime manipulates dynamic JS shapes (JSX runtime objects). To avoid unsafe usage of `any`, the code uses `unknown` or `Record<string, unknown>` in public internals and narrows/casts locally only when necessary. This reduces accidental runtime errors while keeping the code compatible with consumer usage.

Logging

- A minimal `logger` utility lives in `packages/react-serve-js/src/logger.ts` and is used by the core runtime. It provides `info`, `warn`, `error`, and `debug` methods and can be disabled via the `REACT_SERVE_LOG` environment variable.
- Rationale: centralizing logging makes it easy to switch implementations (for example to `pino` or `winston`) and to control verbosity in production.

Error handling and best practices

- The runtime catches handler errors and returns a 500 JSON error when possible. Consider extracting a shared error-handler utility for improved observability and consistent error shapes.
- Validate external inputs (request body, params) inside handlers using a validator library (Zod/ajv/Joi) when building real endpoints.

Development workflow

- Install dependencies at the repo root: `npm install`.
- Build the core package: `npm run build --workspace=packages/react-serve-js`.
- Run the basic example in dev mode: `npm run dev --workspace=examples/basic`.
- To silence runtime logging for the session:
  - PowerShell (session only): `$env:REACT_SERVE_LOG = 'false'` then run the dev script.

Testing suggestions

- Add unit tests for the route parser (`processElement`) to ensure routes and middleware are discovered correctly.
- Add tests for middleware ordering and short-circuit behavior.
