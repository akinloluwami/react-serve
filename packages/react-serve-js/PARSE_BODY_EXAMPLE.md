# parseBody Prop Usage Examples

The `parseBody` prop controls JSON body parsing at different levels of your application.

## Example 1: Global Body Parsing (All Routes)

```tsx
import { App, Route, Response, serve } from "react-serve";

serve(
  <App port={3000} parseBody={true}>
    <Route method="POST" path="/users">
      {() => {
        const { req } = useRoute();
        // req.body is automatically parsed for all routes
        return <Response json={{ received: req.body }} />;
      }}
    </Route>
    <Route method="POST" path="/products">
      {() => {
        const { req } = useRoute();
        // req.body is also parsed here
        return <Response json={{ data: req.body }} />;
      }}
    </Route>
  </App>,
);
```

## Example 2: RouteGroup-Level Body Parsing

```tsx
import { App, RouteGroup, Route, Response, serve } from "react-serve";

serve(
  <App port={3000}>
    {/* These routes won't parse body */}
    <Route method="GET" path="/public">
      {() => <Response json={{ message: "No body parsing" }} />}
    </Route>

    {/* Only these routes will parse body */}
    <RouteGroup prefix="/api" parseBody={true}>
      <Route method="POST" path="/users">
        {() => {
          const { req } = useRoute();
          // req.body is parsed for routes in this group
          return <Response json={{ user: req.body }} />;
        }}
      </Route>
      <Route method="PUT" path="/users/:id">
        {() => {
          const { req } = useRoute();
          // req.body is also parsed here
          return <Response json={{ updated: req.body }} />;
        }}
      </Route>
    </RouteGroup>
  </App>,
);
```

## Example 3: Route-Level Body Parsing (Most Granular)

```tsx
import { App, Route, Response, serve } from "react-serve";

serve(
  <App port={3000}>
    {/* No body parsing */}
    <Route method="GET" path="/users">
      {() => <Response json={{ message: "GET request" }} />}
    </Route>

    {/* Body parsing enabled only for this route */}
    <Route method="POST" path="/users" parseBody={true}>
      {() => {
        const { req } = useRoute();
        // req.body is parsed only for this specific route
        return <Response json={{ created: req.body }} status={201} />;
      }}
    </Route>

    {/* No body parsing */}
    <Route method="DELETE" path="/users/:id">
      {() => <Response json={{ message: "Deleted" }} />}
    </Route>
  </App>,
);
```

## Example 4: Mixed Levels (Priority Order)

```tsx
import { App, RouteGroup, Route, Response, serve } from "react-serve";

serve(
  // Global: parseBody not set (defaults to false)
  <App port={3000}>
    <RouteGroup prefix="/api" parseBody={true}>
      {/* This route inherits parseBody=true from RouteGroup */}
      <Route method="POST" path="/users">
        {() => {
          const { req } = useRoute();
          return <Response json={{ body: req.body }} />;
        }}
      </Route>

      {/* This route overrides the RouteGroup setting */}
      <Route method="POST" path="/special" parseBody={false}>
        {() => {
          const { req } = useRoute();
          // req.body will be undefined
          return <Response json={{ message: "No parsing" }} />;
        }}
      </Route>
    </RouteGroup>
  </App>,
);
```

## Priority Order

1. **Route-level** `parseBody` prop (highest priority)
2. **RouteGroup-level** `parseBody` prop
3. **App-level** `parseBody` prop (lowest priority, defaults to `false`)

## Notes

- By default, **no body parsing** is applied unless explicitly enabled
- Setting `parseBody={true}` at the App level enables it globally
- Setting it at RouteGroup level applies to all routes in that group
- Setting it at Route level applies only to that specific route
- Route-level settings always override RouteGroup and App-level settings
