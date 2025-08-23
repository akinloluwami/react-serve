import { Response } from "react-serve-js";

export async function GET() {
  return <Response json={{ totalUsers: 2, active: 2 }} />;
}

