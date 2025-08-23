import { Response, useRoute } from "react-serve-js";

// Optional catch-all: matches "/api/docs", "/api/docs/a", "/api/docs/a/b", ...
export async function GET() {
  const { params } = useRoute();
  // slug may be undefined (when no additional segments)
  return <Response json={{ slug: params.slug }} />;
}

