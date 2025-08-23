import { Response } from "../../../../packages/react-serve-js/src";

export default async function HomeHandler() {
  return (
    <Response 
      json={{ 
        message: "Welcome to ReactServe File-Based Routing!",
        endpoints: [
          "GET / - This page",
          "GET /users - List all users",
          "GET /users/[id] - Get user by ID",
          "POST /users - Create new user",
          "GET /posts - List all posts",
          "GET /posts/[id] - Get post by ID",
          "GET /api/health - Health check"
        ]
      }} 
    />
  );
}
