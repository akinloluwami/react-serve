# ReactServe

> React-style backend framework for building APIs with JSX

ReactServe lets you build backend APIs using React-style JSX syntax. Define routes, handle requests, and send responses all within familiar JSX components.

## Quick Start

Create a new ReactServe app:

```bash
npx create-react-serve my-api
cd my-api
npm install
npm run dev
```

## Example

```tsx
import { App, Route, Response, useRoute, serve } from "react-serve-js";

function Backend() {
  return (
    <App port={6969}>
      <Route path="/" method="GET">
        {async () => {
          return <Response json={{ message: "Hello World!" }} />;
        }}
      </Route>

      <Route path="/users/:id" method="GET">
        {async () => {
          const { params } = useRoute();
          const user = await getUserById(params.id);
          return user ? (
            <Response json={user} />
          ) : (
            <Response status={404} json={{ error: "User not found" }} />
          );
        }}
      </Route>

        <Route path="*" method="ALL">
        {async () => {
          return <Response json={{ message: "Route Not Found" }} status={404} />;
        }}
      </Route>
      
    </App>
  );
}

serve(Backend());
```

## Features

- 🔥 **Hot Reload** - Automatic server restart on file changes
- 🎯 **Type Safe** - Full TypeScript support
- ⚡ **Fast** - Built on Express.js
- 🧩 **Composable** - Use React patterns for API logic
- 📦 **Zero Config** - Works out of the box
- 🛠️ **CLI Tool** - Bootstrap new projects instantly

## Packages

This repository is a monorepo containing:

### Core Packages

- [`react-serve-js`](./packages/react-serve-js) - The core framework
- [`create-react-serve`](./packages/create-react-serve) - CLI tool for bootstrapping apps

### Examples

- [`basic`](./examples/basic) - Basic API example with CRUD operations

## Documentation

### Components

**`<App>`** - Root component that configures your server

- `port?: number` - Server port (default: 9000)

**`<Route>`** - Defines an API endpoint

- `path: string` - URL path pattern
- `method: string` - HTTP method (GET, POST, PUT, DELETE, etc.)
- `children: () => Promise<ReactElement>` - Request handler

**`<Response>`** - Sends response to client

- `json?: any` - JSON response data
- `status?: number` - HTTP status code (default: 200)

### Hooks

**`useRoute()`** - Access request data

- Returns: `{ params, query, body, req, res }`
