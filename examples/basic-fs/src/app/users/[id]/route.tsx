import { Response, useRoute } from "react-serve-js";

export async function GET() {
  const { params } = useRoute();
  const id = Number(params.id);
  return <Response json={{ id, name: id === 1 ? "John Doe" : "Jane Smith" }} />;
}

