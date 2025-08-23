import { Response, useContext } from "react-serve-js";

export async function GET() {
  const user = useContext("user");
  return <Response json={{ message: "Admin dashboard", user }} />;
}

