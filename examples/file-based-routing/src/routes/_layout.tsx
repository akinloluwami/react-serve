import {
  Response,
  useRoute,
  useSetContext,
} from "../../../../packages/react-serve-js/src";

// Layout middleware that runs before all routes
export function layoutMiddleware(req: any, next: any) {
  // Add layout context
  useSetContext("layout", {
    title: "ReactServe File-Based Routing",
    version: "1.0.0",
    timestamp: new Date().toISOString(),
  });

  return next();
}

// Default layout handler (optional)
export default async function LayoutHandler() {
  const { params, query, body } = useRoute();

  // This will only run if someone directly accesses /_layout
  return (
    <Response
      status={404}
      json={{
        error: "Layout file cannot be accessed directly",
        message: "This is a layout file for shared functionality",
      }}
    />
  );
}
