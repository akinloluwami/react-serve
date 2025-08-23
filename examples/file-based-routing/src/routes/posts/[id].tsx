import { Response, useRoute } from "../../../../../packages/react-serve-js/src";

const mockPosts = [
  { id: 1, title: "Getting Started with ReactServe", author: "John Doe", content: "ReactServe is amazing..." },
  { id: 2, title: "File-Based Routing Guide", author: "Jane Smith", content: "Learn how to use file-based routing..." },
  { id: 3, title: "Advanced Middleware Patterns", author: "Bob Johnson", content: "Master middleware patterns..." },
];

export default async function PostByIdHandler() {
  const { params } = useRoute();
  const post = mockPosts.find(p => p.id === Number(params.id));
  
  if (!post) {
    return (
      <Response 
        status={404} 
        json={{ error: "Post not found" }} 
      />
    );
  }
  
  return (
    <Response json={post} />
  );
}
