import { Response, useRoute } from "../../../../../packages/react-serve-js/src";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
];

export default async function UserByIdHandler() {
  const { params } = useRoute();
  const user = mockUsers.find((u) => u.id === Number(params.id));

  if (!user) {
    return <Response status={404} json={{ error: "User not found" }} />;
  }

  return <Response json={user} />;
}
