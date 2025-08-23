import { Response } from "react-serve-js";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

export async function GET() {
  return <Response json={{ users }} />;
}

export async function POST() {
  // In a real app, you would read from useRoute().body
  return <Response status={201} json={{ id: 3, name: "New User" }} />;
}

