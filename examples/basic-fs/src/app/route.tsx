import { Response } from "react-serve-js";

// Default export acts as GET handler
export default async function Home() {
  return <Response json={{ message: "Welcome to file-based routing!" }} />;
}

// Support other methods in the same file
export async function POST() {
  return <Response status={201} json={{ ok: true }} />;
}

