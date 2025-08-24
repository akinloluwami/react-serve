import { Response } from "../../../../../packages/react-serve-js/src";

const mockPosts = [
  { id: 1, title: "Getting Started with ReactServe", author: "John Doe" },
  { id: 2, title: "File-Based Routing Guide", author: "Jane Smith" },
  { id: 3, title: "Advanced Middleware Patterns", author: "Bob Johnson" },
];

export default async function PostsHandler() {
  return (
    <Response 
      json={{ 
        posts: mockPosts,
        count: mockPosts.length
      }} 
    />
  );
}
