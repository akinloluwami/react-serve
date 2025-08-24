# ReactServe File-Based Routing Example

This example demonstrates how to use file-based routing with ReactServe.

## Features

- **File-based routing**: Routes are automatically created based on file structure
- **Dynamic routes**: Support for `[param]` syntax
- **HTTP method suffixes**: Use `.get.tsx`, `.post.tsx`, etc. for different methods
- **Nested routing**: Directory structure creates nested routes
- **Middleware support**: Apply middleware to all file-based routes

## File Structure

```
src/routes/
├── index.tsx              → GET /
├── users/
│   ├── index.tsx          → GET /users
│   ├── [id].tsx           → GET /users/:id
│   └── users.post.tsx     → POST /users
├── posts/
│   ├── index.tsx          → GET /posts
│   └── [id].tsx           → GET /posts/:id
└── api/
    └── health.tsx         → GET /api/health
```

## Usage

```tsx
import { App, FileRouter, serve } from "react-serve-js";

export default function Backend() {
  return (
    <App port={6969} cors={true}>
      <FileRouter routesDir="./src/routes" />
    </App>
  );
}

serve(Backend());
```

## Route Patterns

### Basic Routes
- `index.tsx` → `/`
- `users.tsx` → `/users`
- `about.tsx` → `/about`

### Dynamic Routes
- `[id].tsx` → `/:id`
- `users/[id].tsx` → `/users/:id`
- `posts/[slug].tsx` → `/posts/:slug`

### HTTP Methods
- `users.get.tsx` → `GET /users`
- `users.post.tsx` → `POST /users`
- `users.put.tsx` → `PUT /users`
- `users.delete.tsx` → `DELETE /users`

### Nested Routes
- `users/index.tsx` → `/users`
- `users/[id]/profile.tsx` → `/users/:id/profile`

## Running the Example

```bash
npm install
npm run dev
```

Then visit:
- http://localhost:6969/ - Home page
- http://localhost:6969/users - List users
- http://localhost:6969/users/1 - Get user by ID
- http://localhost:6969/posts - List posts
- http://localhost:6969/posts/1 - Get post by ID
- http://localhost:6969/api/health - Health check

## Testing POST Endpoint

```bash
curl -X POST http://localhost:6969/users \
  -H "Content-Type: application/json" \
  -d '{"name": "New User", "email": "new@example.com"}'
```
