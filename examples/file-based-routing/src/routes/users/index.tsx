import { Response } from "../../../../../packages/react-serve-js/src";

const mockUsers = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
  { id: 3, name: "Bob Johnson", email: "bob@example.com" },
];

export default async function UsersHandler() {
  return (
    <Response 
      json={{ 
        users: mockUsers,
        count: mockUsers.length
      }} 
    />
  );
}
