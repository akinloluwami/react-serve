import { App, Route, Response, useRoute, serve } from "react-serve-js";

const users = [
  { id: 1, name: "John Doe", email: "john@example.com" },
  { id: 2, name: "Jane Smith", email: "jane@example.com" },
];

function Backend() {
  return (
    <App port={6969}>
      <Route path="/" method="GET">
        {async () => {
          return <Response json={{ message: "Welcome to ReactServe!" }} />;
        }}
      </Route>

      <Route path="/users" method="GET">
        {async () => {
          return <Response json={{ users }} />;
        }}
      </Route>

      <Route path="/users/:id" method="GET">
        {async () => {
          const { params } = useRoute();
          const user = users.find((u) => u.id === Number(params.id));

          return user ? (
            <Response json={user} />
          ) : (
            <Response status={404} json={{ error: "User not found" }} />
          );
        }}
      </Route>
    </App>
  );
}

serve(<Backend />);
