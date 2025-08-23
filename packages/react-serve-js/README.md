# ReactServe

> React-style backend framework for building APIs with JSX

ReactServe lets you build backend APIs using React-style JSX syntax. Define routes, handle requests, and send responses all within familiar JSX components.

## Installation

```bash
npm install react-serve-js
```

## Quick Start

```bash
npx create-react-serve my-api
cd my-api
npm install
npm run dev
```

## Components

### `<App>`

The root component that configures your server.

**Props:**

- `port?: number` - Port to run the server on (default: 9000)
- `cors?: boolean | CorsOptions` - Enable CORS middleware. Pass `true` to enable with default options, or pass a CORS options object for custom configuration.

### `<Route>`

Defines an API endpoint.

**Props:**

- `path: string` - URL path pattern (supports Express.js route parameters)
- `method: string` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `middleware?: MiddlewareFunction | MiddlewareFunction[]` - Route-level middleware(s) to run before the handler
- `children: () => Promise<ReactElement>` - Async function that handles the request

### `<Middleware>`

Executes middleware functions for request processing, authentication, logging, etc.

**Props:**

- `use: MiddlewareFunction | MiddlewareFunction[]` - The middleware function or array of middleware functions to execute

**Example:**

```tsx
import { type MiddlewareFunction } from "react-serve-js";

const authMiddleware: MiddlewareFunction = (req, next) => {
  const token = req.headers.authorization?.split(" ")[1];
  if (!token) {
    return <Response status={401} json={{ error: "Unauthorized" }} />;
  }

  // Attach user data to request context
  useSetContext("user", { id: 1, name: "John" });

  return next(); // Continue to next middleware or route handler
};

<RouteGroup prefix="/api">
  {/* Single middleware */}
  <Middleware use={authMiddleware} />

  {/* Or multiple middleware as an array */}
  <RouteGroup prefix="/v2">
    <Middleware
      use={[loggingMiddleware, rateLimitMiddleware, authMiddleware]}
    />
    <Route path="/users" method="GET">
      {() => {
        const user = useContext("user");
        return <Response json={user} />;
      }}
    </Route>
  </RouteGroup>
</RouteGroup>;
```

### `<RouteGroup>`

Groups routes together with a shared path prefix.

**Props:**

- `prefix?: string` - Path prefix to apply to all child routes
- `children: ReactNode` - Child routes and route groups

**Example:**

```tsx
<RouteGroup prefix="/api">
  <Route path="/users" method="GET">
    {async () => <Response json={users} />}
  </Route>
  {/* This becomes /api/users */}

  <RouteGroup prefix="/v1">
    <Route path="/posts" method="GET">
      {async () => <Response json={posts} />}
    </Route>
    {/* This becomes /api/v1/posts */}
  </RouteGroup>
</RouteGroup>
```

### `<Response>`

Sends a response back to the client.

**Props:**

- `json?: any` - JSON data to send
- `text?: string` - Plain text response
- `html?: string` - HTML response
- `headers?: Record<string, string>` - Headers to set on the response
- `redirect?: string` - Redirect location (uses provided `status`)
- `status?: number` - HTTP status code (default: 200)

### File-based Routing (automatic)

ReactServe automatically discovers routes from `<sourceRoot>/app/**`. By default it scans `src/app` for files named `route.(ts|tsx|js|jsx)` and registers them based on the folder structure.

Filesystem to URL mapping:

- Static names map 1:1
- `[id]` -> `:id`
- `[...slug]` -> `:slug` (single segment)
- `[[...slug]]` -> `:slug` (single segment; base path does not match)
- `(group)` directories are ignored in the URL but traversed; their `middleware.*` applies to children

To change the source directory, entry, or base route filename, create `react-serve.config.ts` in your project root:

```ts
import type { ReactServeConfig } from "react-serve-js";

const config: ReactServeConfig = {
  // default is "src"
  sourceRoot: "src",
  // default is "index"; resolved as <sourceRoot>/<entry>.(tsx|ts|jsx|js)
  entry: "index",
  // default is "route"; per-directory route filename base
  routeFileBase: "route",
};

export default config;
```

Global middleware can be declared once at `src/middleware.(ts|tsx|js|jsx)` as a default export of a single middleware or an array of middlewares. Directory-level middleware is supported via `middleware.(ts|tsx|js|jsx)` in each folder under `app/**`.

Use the `<App>` component as your layout and, optionally, set a `globalPrefix` to mount all routes under a base path:

```tsx
import { App } from "react-serve-js";

export default function Backend() {
  return <App port={6969} cors={true} globalPrefix="/api" />;
}
```

## Hooks

### `useRoute()`

Access request data within route handlers.

```tsx
const { params, query, body, req, res } = useRoute();
```

Returns:

- `params` - URL parameters
- `query` - Query string parameters
- `body` - Request body
- `req` - Express request object
- `res` - Express response object

### `useSetContext(key, value)`

Store data in the request context (available in middleware).

```tsx
const authMiddleware: MiddlewareFunction = (req, next) => {
  useSetContext("user", { id: 1, name: "John" });
  return next();
};
```

### `useContext(key)`

Retrieve data from the request context (available in route handlers and middleware).

```tsx
<Route path="/me" method="GET">
  {() => {
    const user = useContext("user");
    return <Response json={user} />;
  }}
</Route>
```

## Features

- 🔥 **Hot Reload** - Automatic server restart on file changes (development)
- 🎯 **Type Safe** - Full TypeScript support
- ⚡ **Fast** - Built on Express.js
- 🧩 **Composable** - Use React patterns for API logic
- 🛡️ **Middleware Support** - Authentication, logging, and custom middleware
- 🗂️ **Route Grouping** - Organize routes with shared prefixes
- 📦 **Zero Config** - Works out of the box
