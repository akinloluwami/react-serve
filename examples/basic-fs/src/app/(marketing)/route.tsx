import { Response } from "react-serve-js";

export async function GET() {
  return <Response json={{ message: "Marketing home (route group not in URL)" }} />;
}

