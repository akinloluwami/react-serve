import { Response, useRoute } from "../../../../packages/react-serve-js/src";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
];

export default async function CreateUserHandler() {
  const { body } = useRoute();

  if (!body || !body.name || !body.email) {
    return (
      <Response status={400} json={{ error: "Name and email are required" }} />
    );
  }

  const newUser = {
    id: mockUsers.length + 1,
    name: body.name,
    email: body.email,
  };

  mockUsers.push(newUser);

  return <Response status={201} json={newUser} />;
}
