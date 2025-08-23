import { Response, useRoute } from "react-serve-js";

export async function GET() {
  const { params } = useRoute();
  return <Response json={{ slug: params.slug }} />;
}

